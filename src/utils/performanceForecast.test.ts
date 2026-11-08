import { describe, expect, it } from 'vitest'
import { computeProgramResult } from './performance.ts'
import { computeForecast, payDateInRange } from './performanceForecast.ts'
import type { CardProgram, FixedExpense, Transaction } from '../lib/types.ts'

const program: CardProgram = { id: 'p', account_id: 'a', name: '카드 샘플', target_amount: 500000, measure_basis: 'current_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: [], exclusion_modes: {}, is_active: true, sort_order: 0, created_at: '2026-01-01' }
const expense = (overrides: Partial<FixedExpense> = {}): FixedExpense => ({ id: 'f', merchant: '구독 샘플', account_id: 'a', amount: 100000, pay_day: 20, fixed_type: '구독', created_at: '2026-01-01', ...overrides })
const tx = (overrides: Partial<Transaction> = {}): Transaction => ({ id: 't', account_id: 'a', used_at: '2026-10-20', merchant: '구독 샘플', amount: 100000, discount: 0, installment_months: 1, is_fixed: false, fixed_type: null, source: 'sms', import_hash: null, memo: null, is_cancel: false, interest_free: false, performance_override: null, created_at: '2026-10-20', currency: 'KRW', original_amount: null, exchange_rate: null, rate_at: null, krw_confirmed: true, ...overrides })
const result = (options: { periodKey?: string; today?: string; spent?: number; card?: CardProgram } = {}) => {
  const card = options.card ?? program
  return { ...computeProgramResult({ program: card, benefits: [], transactions: options.spent ? [tx({ id: 'spent', merchant: '기타 샘플', amount: options.spent, used_at: '2026-10-05' })] : [], periodKey: options.periodKey ?? '2026-10', today: options.today ?? '2026-10-10' }), program: card }
}

describe('고정지출 예상', () => {
  it('등록 금액을 실적 예상에 더한다', () => {
    expect(computeForecast(result({ spent: 250000 }), [], [expense()], '2026-10-10')).toMatchObject({ pendingTotal: 100000, expectedTotal: 350000, expectedRemaining: 150000, expectedPercent: 70 })
  })
  it('이번 기간의 같은 결제명은 금액이 같거나 이름 등록이 하나면 제외한다', () => {
    expect(computeForecast(result(), [tx({ merchant: ' 구독샘플 ' })], [expense()], '2026-10-10')).toBeNull()
    expect(computeForecast(result(), [tx({ amount: 90000 })], [expense()], '2026-10-10')).toBeNull()
  })
  it('같은 이름 등록이 여러 개면 금액이 맞는 항목만 제외한다', () => {
    const items = [expense({ id: 'f1', amount: 30000 }), expense({ id: 'f2', amount: 50000 })]
    expect(computeForecast(result(), [tx({ amount: 30000 })], items, '2026-10-10')?.pending.map((item) => item.amount)).toEqual([50000])
  })
  it('오늘 이전은 제외하고 오늘은 포함하며 다른 카드와 취소 결제는 무시한다', () => {
    expect(computeForecast(result(), [], [expense({ pay_day: 5 })], '2026-10-10')).toBeNull()
    expect(computeForecast(result(), [], [expense({ pay_day: 10 })], '2026-10-10')).not.toBeNull()
    expect(computeForecast(result(), [tx({ is_cancel: true })], [expense()], '2026-10-10')).not.toBeNull()
    expect(computeForecast(result(), [], [expense({ account_id: 'b' })], '2026-10-10')).toBeNull()
  })
  it('제외 키워드와 지난 기간을 예상하지 않으며 목표 초과 막대는 100이다', () => {
    expect(computeForecast(result({ card: { ...program, exclude_keywords: ['구독'] } }), [], [expense()], '2026-10-10')).toBeNull()
    expect(computeForecast(result({ periodKey: '2026-09' }), [], [expense()], '2026-10-10')).toBeNull()
    expect(computeForecast(result({ spent: 450000 }), [], [expense()], '2026-10-10')).toMatchObject({ expectedBarPercent: 100, expectedRemaining: 0 })
  })
  it('결제일은 기간 시작일 기준 두 달에서 찾고 월말과 윤년을 보정한다', () => {
    expect(payDateInRange(20, { start: '2026-11-15', end: '2026-12-14' })).toBe('2026-11-20')
    expect(payDateInRange(10, { start: '2026-11-15', end: '2026-12-14' })).toBe('2026-12-10')
    expect(payDateInRange(31, { start: '2026-11-01', end: '2026-11-30' })).toBe('2026-11-30')
    expect(payDateInRange(30, { start: '2026-02-15', end: '2026-03-14' })).toBe('2026-02-28')
    expect(payDateInRange(30, { start: '2028-02-15', end: '2028-03-14' })).toBe('2028-02-29')
  })
})
