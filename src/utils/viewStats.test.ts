import { describe, expect, it } from 'vitest'
import type { Account, Transaction } from '../lib/types.ts'
import { entriesForMonth } from './summary.ts'
import { accountGroups, fixedGroups, monthRange, monthlyTotals, presetMonths } from './viewStats.ts'

// 샘플은 모두 임의로 만든 값이다
function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'id',
    account_id: null,
    used_at: '2026-10-05',
    merchant: '테스트 가게',
    amount: 10000,
    discount: 0,
    installment_months: 1,
    is_fixed: false,
    fixed_type: null,
    source: 'manual',
    import_hash: null,
    memo: null,
    is_cancel: false,
    interest_free: false,
    performance_override: null,
    created_at: '2026-10-05T01:00:00Z',
    ...overrides,
  }
}

function makeAccount(overrides: Partial<Account>): Account {
  return {
    id: 'acc',
    name: '별칭',
    kind: 'card',
    issuer: null,
    last4: null,
    sort_order: 0,
    is_active: true,
    created_at: '2026-10-01T00:00:00Z',
    ...overrides,
  }
}

describe('fixedGroups (고정지출 보기)', () => {
  const txs = [
    makeTx({ id: '1', is_fixed: true, fixed_type: '통신', amount: 55000 }),
    makeTx({ id: '2', is_fixed: true, fixed_type: '구독', amount: 9900 }),
    makeTx({ id: '3', is_fixed: true, fixed_type: '구독', amount: 5000 }),
    makeTx({ id: '4', is_fixed: true, fixed_type: null, amount: 1000 }),
    makeTx({ id: '5', is_fixed: false, amount: 99999 }),
  ]
  const groups = fixedGroups(entriesForMonth(txs, '2026-10'))

  it('고정지출만 종류별로 묶는다 (일반 지출은 빠진다)', () => {
    expect(groups.map((g) => g.label)).toEqual(['통신', '구독', '종류 미지정'])
  })

  it('종류별 소계', () => {
    expect(groups.map((g) => g.total)).toEqual([55000, 14900, 1000])
  })
})

describe('기간 계산', () => {
  const now = new Date(2026, 9, 23) // 2026-10-23

  it('이번 달, 지난 달, 최근 3개월', () => {
    expect(presetMonths('this', now)).toEqual(['2026-10'])
    expect(presetMonths('last', now)).toEqual(['2026-09'])
    expect(presetMonths('three', now)).toEqual(['2026-08', '2026-09', '2026-10'])
  })

  it('올해는 1월부터 이번 달까지', () => {
    const months = presetMonths('year', now)
    expect(months).toHaveLength(10)
    expect(months[0]).toBe('2026-01')
    expect(months[9]).toBe('2026-10')
  })

  it('직접 선택한 기간은 해를 넘겨도 맞고, 거꾸로 골라도 바로잡는다', () => {
    expect(monthRange('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
    expect(monthRange('2027-02', '2026-11')).toHaveLength(4)
  })

  it('너무 긴 기간은 36개월에서 멈춘다', () => {
    expect(monthRange('2020-01', '2026-12')).toHaveLength(36)
  })

  it('월별 합계 (내역 없는 달은 0원)', () => {
    const txs = [makeTx({ used_at: '2026-09-10', amount: 7000 }), makeTx({ used_at: '2026-10-02', amount: 3000 })]
    expect(monthlyTotals(txs, ['2026-08', '2026-09', '2026-10'], 'usage')).toEqual([
      { month: '2026-08', total: 0 },
      { month: '2026-09', total: 7000 },
      { month: '2026-10', total: 3000 },
    ])
  })
})

describe('accountGroups (결제수단별 보기)', () => {
  const accounts = [
    makeAccount({ id: 'c1', kind: 'card', issuer: '신한카드', name: '생활카드', last4: '5678' }),
    makeAccount({ id: 'c2', kind: 'card', issuer: '삼성카드', name: '서브카드' }),
    makeAccount({ id: 'b1', kind: 'account', issuer: '카카오뱅크', name: '월급통장', last4: '1234' }),
    makeAccount({ id: 'cash', kind: 'cash', name: '현금' }),
  ]
  const txs = [
    makeTx({ id: '1', account_id: 'c1', amount: 60000 }),
    makeTx({ id: '2', account_id: 'c2', amount: 20000 }),
    makeTx({ id: '3', account_id: 'b1', amount: 10000 }),
    makeTx({ id: '4', account_id: 'cash', amount: 10000 }),
    makeTx({ id: '5', account_id: null, amount: 0 + 0 }),
  ]
  const groups = accountGroups(entriesForMonth(txs, '2026-10'), accounts)

  it('카드 → 통장 → 현금 순서로 묶는다', () => {
    expect(groups.map((g) => g.label)).toEqual(['카드', '통장', '현금', '결제수단 없음'])
  })

  it('종류별 소계와 비중', () => {
    expect(groups[0].total).toBe(80000)
    expect(groups[0].share).toBeCloseTo(0.8)
    expect(groups[1].share).toBeCloseTo(0.1)
  })

  it('종류 안에서는 많이 쓴 결제수단부터', () => {
    expect(groups[0].items.map((i) => i.label)).toEqual(['신한카드 · 생활카드 (5678)', '삼성카드 · 서브카드'])
  })

  it('합계가 0이면 비중도 0 (0으로 나누지 않는다)', () => {
    expect(accountGroups([], accounts)).toEqual([])
    const zero = accountGroups(entriesForMonth([makeTx({ account_id: 'c1', amount: 0 })], '2026-10'), accounts)
    expect(zero[0].share).toBe(0)
  })
})
