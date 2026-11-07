import { describe, expect, it } from 'vitest'
import { computeProgramResult } from './performance.ts'
import { computeForecast, oneMonthLater } from './performanceForecast.ts'
import type { CardProgram, Transaction } from '../lib/types.ts'

const program: CardProgram = {
  id: 'p', account_id: 'a', name: '카드샘플', target_amount: 500000,
  measure_basis: 'current_month', installment_mode: 'full', period_start_day: 1,
  exclude_keywords: [], exclusion_modes: {}, is_active: true, sort_order: 0,
  created_at: '2026-01-01',
}

const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't', account_id: 'a', used_at: '2026-09-20', merchant: '가게A',
  amount: 100000, discount: 0, installment_months: 1, is_fixed: true,
  fixed_type: null, source: 'manual', import_hash: null, memo: null,
  is_cancel: false, interest_free: false, performance_override: null,
  created_at: '2026-09-20', currency: 'KRW', original_amount: null,
  exchange_rate: null, rate_at: null, krw_confirmed: true, ...overrides,
})

const resultFor = (options: { periodKey?: string; today?: string; spent?: number; card?: CardProgram } = {}) => {
  const card = options.card ?? program
  return {
    ...computeProgramResult({
      program: card,
      benefits: [],
      transactions: options.spent ? [tx({ id: 'spent', used_at: options.periodKey === '2026-10' && card.period_start_day === 15 ? '2026-10-20' : '2026-10-05', is_fixed: false, amount: options.spent })] : [],
      periodKey: options.periodKey ?? '2026-10',
      today: options.today ?? '2026-10-10',
    }),
    program: card,
  }
}

describe('고정지출 예상', () => {
  it('지난 기간의 미결제 고정지출을 예상 실적에 더한다', () => {
    const result = resultFor({ spent: 250000 })
    expect(computeForecast(result, [tx()], '2026-10-10')).toMatchObject({
      pendingTotal: 100000, expectedTotal: 350000, expectedRemaining: 150000,
      expectedPercent: 70, pending: [{ expectedDate: '2026-10-20' }],
    })
  })

  it('이번 기간에 같은 결제명이 결제되면 제외한다', () => {
    const paid = tx({ id: 'paid', merchant: ' 가게a ', used_at: '2026-10-20' })
    expect(computeForecast(resultFor(), [tx(), paid], '2026-10-10')).toBeNull()
  })

  it('두 기간 전 기록만 있으면 제외한다', () => {
    expect(computeForecast(resultFor(), [tx({ used_at: '2026-08-20' })], '2026-10-10')).toBeNull()
  })

  it('예정일이 오늘보다 지나 있으면 제외한다', () => {
    expect(computeForecast(resultFor(), [tx()], '2026-10-25')).toBeNull()
  })

  it('시작일 15인 기간은 기간 범위에 맞춰 판단한다', () => {
    const card = { ...program, period_start_day: 15 }
    const result = resultFor({ card, periodKey: '2026-10', today: '2026-10-20' })
    expect(computeForecast(result, [tx({ used_at: '2026-10-14' })], '2026-10-20')?.pending[0].expectedDate).toBe('2026-11-14')
    expect(computeForecast(result, [tx({ used_at: '2026-09-15' })], '2026-10-20')).toBeNull()
  })

  it('다른 카드, 취소, 할부, 고정지출 아님은 각각 제외한다', () => {
    for (const invalid of [
      tx({ account_id: 'other' }),
      tx({ is_cancel: true }),
      tx({ installment_months: 3 }),
      tx({ is_fixed: false }),
    ]) {
      expect(computeForecast(resultFor(), [invalid], '2026-10-10')).toBeNull()
    }
  })

  it('개별 제외 키워드에 걸리면 제외한다', () => {
    const card = { ...program, exclude_keywords: ['가게'] }
    expect(computeForecast(resultFor({ card }), [tx()], '2026-10-10')).toBeNull()
  })

  it('무이자 flag는 포함하고 exclude는 제외한다', () => {
    const interestFree = tx({ interest_free: true })
    const flagged = { ...program, exclusion_modes: { interest_free: 'flag' as const } }
    const excluded = { ...program, exclusion_modes: { interest_free: 'exclude' as const } }
    expect(computeForecast(resultFor({ card: flagged }), [interestFree], '2026-10-10')).not.toBeNull()
    expect(computeForecast(resultFor({ card: excluded }), [interestFree], '2026-10-10')).toBeNull()
  })

  it('지난 기간 결과에는 예상 금액을 만들지 않는다', () => {
    expect(computeForecast(resultFor({ periodKey: '2026-09', today: '2026-10-10' }), [tx({ used_at: '2026-08-20' })], '2026-10-10')).toBeNull()
  })

  it('목표를 넘으면 막대는 100이고 예상 잔여는 0이다', () => {
    expect(computeForecast(resultFor({ spent: 450000 }), [tx()], '2026-10-10')).toMatchObject({
      expectedPercent: 110, expectedBarPercent: 100, expectedRemaining: 0,
    })
  })

  it('할인을 반영한 금액으로 합산한다', () => {
    expect(computeForecast(resultFor(), [tx({ discount: 10000 })], '2026-10-10')?.pendingTotal).toBe(90000)
  })

  it('예정일 오름차순으로 정렬한다', () => {
    const later = tx({ id: 'later', merchant: '구독샘플', used_at: '2026-09-25' })
    const earlier = tx({ id: 'earlier', merchant: '가게A', used_at: '2026-09-12' })
    expect(computeForecast(resultFor(), [later, earlier], '2026-10-10')?.pending.map((item) => item.expectedDate)).toEqual(['2026-10-12', '2026-10-25'])
  })

  it('다음 달에 같은 날짜가 없으면 말일로 보정한다', () => {
    expect(oneMonthLater('2026-01-31')).toBe('2026-02-28')
    expect(oneMonthLater('2028-01-31')).toBe('2028-02-29')
    expect(oneMonthLater('2026-12-15')).toBe('2027-01-15')
  })
})
