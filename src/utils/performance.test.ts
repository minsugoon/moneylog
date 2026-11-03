import { describe, expect, it } from 'vitest'
import type { CardBenefit, CardProgram, Transaction } from '../lib/types.ts'
import { classifyTransaction, computeAllPrograms, computeProgramResult, creditsInPeriod, linkedBenefitFor } from './performance.ts'

const program = (overrides: Partial<CardProgram> = {}): CardProgram => ({
  id: 'p', account_id: 'a', name: '카드', target_amount: 300000, measure_basis: 'current_month',
  installment_mode: 'full', period_start_day: 1, exclude_keywords: [], exclusion_modes: {},
  is_active: true, sort_order: 1, created_at: '2026-01-01', ...overrides,
})
const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 't', account_id: 'a', used_at: '2026-10-05', merchant: '가게A', amount: 100000,
  discount: 0, installment_months: 1, is_fixed: false, fixed_type: null, source: 'manual',
  import_hash: null, memo: null, is_cancel: false, interest_free: false,
  performance_override: null, created_at: '2026-10-05', currency: 'KRW', original_amount: null,
  exchange_rate: null, rate_at: null, krw_confirmed: true, ...overrides,
})
const benefit = (overrides: Partial<CardBenefit> = {}): CardBenefit => ({
  id: 'b', program_id: 'p', name: '혜택', required_amount: null, benefit_amount: 10000,
  benefit_kind: '기타', linked_keyword: null, memo: null, created_at: '2026-01-01', ...overrides,
})
const result = (transactions: Transaction[], overrides: Partial<CardProgram> = {}, periodKey = '2026-10', today = '2026-10-20', benefits: CardBenefit[] = []) => computeProgramResult({ program: program(overrides), benefits, transactions, periodKey, today })

describe('카드 실적 판정과 계산', () => {
  it('확정 판정이 무이자와 키워드 판정보다 우선한다', () => {
    const p = program({ exclusion_modes: { interest_free: 'exclude' }, exclude_keywords: ['GIFT'] })
    expect(classifyTransaction(tx({ interest_free: true, performance_override: 'include' }), p).status).toBe('included')
    expect(classifyTransaction(tx({ performance_override: 'exclude' }), p).reason).toBe('override_exclude')
  })
  it('무이자 ignore, flag, exclude와 개별 키워드를 처리한다', () => {
    expect(classifyTransaction(tx({ interest_free: true }), program({ exclusion_modes: { interest_free: 'ignore' } })).status).toBe('included')
    expect(classifyTransaction(tx({ interest_free: true }), program({ exclusion_modes: { interest_free: 'flag' } })).status).toBe('flagged')
    expect(classifyTransaction(tx({ interest_free: true }), program({ exclusion_modes: { interest_free: 'exclude' } })).status).toBe('excluded')
    expect(classifyTransaction(tx({ merchant: '가게A 상품권' }), program({ exclude_keywords: ['상품권'] }))).toMatchObject({ status: 'excluded', keyword: '상품권' })
    expect(classifyTransaction(tx({ merchant: 'gift card' }), program({ exclude_keywords: ['GIFT'] })).status).toBe('excluded')
  })
  it('프로그램 합계에서 취소 금액을 차감한다', () => {
    const r = result([
      tx({ id: '사용', amount: 100000 }),
      tx({ id: '취소', amount: 30000, is_cancel: true }),
    ])
    expect(r.total).toBe(70000)
  })
  it('취소를 날짜 기간에 차감하고 0을 음의 0으로 만들지 않는다', () => {
    expect(creditsInPeriod(tx({ is_cancel: true, amount: 5000 }), program(), '2026-10')).toBe(-5000)
    expect(Object.is(creditsInPeriod(tx({ is_cancel: true, amount: 0 }), program(), '2026-10'), -0)).toBe(false)
  })
  it('기간 시작일과 할인 및 할부 방식을 적용한다', () => {
    const p = program({ period_start_day: 15 })
    expect(creditsInPeriod(tx({ used_at: '2026-10-14' }), p, '2026-09')).toBe(100000)
    expect(creditsInPeriod(tx({ used_at: '2026-10-15' }), p, '2026-10')).toBe(100000)
    expect(creditsInPeriod(tx({ amount: 50000, discount: 5000 }), program(), '2026-10')).toBe(45000)
    const installment = tx({ amount: 120000, installment_months: 3 })
    expect(creditsInPeriod(installment, program({ installment_mode: 'full' }), '2026-10')).toBe(120000)
    expect(creditsInPeriod(installment, program({ installment_mode: 'monthly' }), '2026-10')).toBe(40000)
    expect(creditsInPeriod(installment, program({ installment_mode: 'monthly' }), '2026-11')).toBe(40000)
    expect(creditsInPeriod(installment, program({ installment_mode: 'monthly' }), '2027-01')).toBeNull()
  })
  it('다른 카드 내역은 빼고 지표와 flagged 합계를 계산한다', () => {
    const r = result([tx({ amount: 310000 }), tx({ account_id: 'other', amount: 500000 })])
    expect(r).toMatchObject({ total: 310000, percent: 103, barPercent: 100, remaining: 0, status: 'achieved' })
    const flagged = result([tx({ interest_free: true, amount: 20000 })], { exclusion_modes: { interest_free: 'flag' } })
    expect(flagged).toMatchObject({ total: 20000, flaggedCount: 1, flaggedTotal: 20000 })
  })
  it('하루 필요액, 경고, 지난 기간과 미래 기간 상태를 계산한다', () => {
    expect(result([tx({ amount: 100000 })], {}, '2026-10', '2026-10-22').dailyNeeded).toBe(20000)
    expect(result([tx({ amount: 150000 })], {}, '2026-10', '2026-10-27').status).toBe('warning')
    expect(result([tx({ used_at: '2026-09-05', amount: 300000 })], {}, '2026-09', '2026-10-20')).toMatchObject({ status: 'achieved', daysLeft: null, dailyNeeded: null })
    expect(result([], {}, '2026-09', '2026-10-20').status).toBe('missed')
    expect(result([], {}, '2026-11', '2026-10-20').status).toBe('upcoming')
  })
  it('혜택 단계와 기본 required 금액을 계산한다', () => {
    const benefits = [benefit({ id: 'low', required_amount: 300000, benefit_amount: 10000 }), benefit({ id: 'high', required_amount: 500000, benefit_amount: 20000 }), benefit({ id: 'default', required_amount: null, benefit_amount: 5000 })]
    expect(result([tx({ amount: 420000 })], {}, '2026-10', '2026-10-20', benefits)).toMatchObject({ earnedTotal: 15000, next: { required: 500000, remaining: 80000, extra: 20000 } })
  })
  it('비활성 프로그램을 빼고 정렬하며 연결 혜택을 찾는다', () => {
    const first = program({ id: 'first', sort_order: 2 })
    const second = program({ id: 'second', sort_order: 1 })
    const inactive = program({ id: 'off', is_active: false })
    expect(computeAllPrograms([first, inactive, second], [], [], () => '2026-10', '2026-10-20').map((item) => item.program.id)).toEqual(['second', 'first'])
    expect(linkedBenefitFor('가게A 정기결제', [benefit({ linked_keyword: '가게A' }), benefit({ id: 'x', linked_keyword: '  ' })])).toHaveLength(1)
  })
})
