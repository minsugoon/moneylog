import { describe, expect, it } from 'vitest'
import type { FixedRule, Transaction } from '../lib/types.ts'
import { listFixedRuleCandidates } from './fixedRuleCandidates.ts'

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1', account_id: null, used_at: '2026-10-01', merchant: '통신비샘플', amount: 1000, discount: 0,
    installment_months: 1, is_fixed: true, fixed_type: '통신', source: 'manual', import_hash: null,
    memo: null, is_cancel: false, interest_free: false, performance_override: null,
    created_at: '2026-10-01T00:00:00Z', ...overrides,
  }
}

const noRules: FixedRule[] = []

describe('고정지출 규칙 후보', () => {
  it('고정지출이며 취소되지 않은 내역만 포함한다', () => {
    const result = listFixedRuleCandidates([
      transaction(),
      transaction({ id: 't2', merchant: '일반샘플', is_fixed: false }),
      transaction({ id: 't3', merchant: '취소샘플', is_cancel: true }),
      transaction({ id: 't4', merchant: '종류없음', fixed_type: null }),
      transaction({ id: 't5', merchant: '   ' }),
    ], noRules)
    expect(result.map(({ merchant }) => merchant)).toEqual(['통신비샘플'])
  })

  it('이미 규칙에 걸리는 결제명은 제외한다', () => {
    const rules: FixedRule[] = [{ id: 'r1', merchant_keyword: '샘플', fixed_type: '통신', created_at: '2026-01-01' }]
    expect(listFixedRuleCandidates([transaction()], rules)).toEqual([])
  })

  it('대소문자와 공백이 다른 결제명을 묶고 최신 내역의 값을 사용한다', () => {
    const result = listFixedRuleCandidates([
      transaction({ merchant: '  NET FLIX ', fixed_type: '구독', used_at: '2026-10-01' }),
      transaction({ id: 't2', merchant: 'netflix', fixed_type: '통신', used_at: '2026-10-03' }),
    ], noRules)
    expect(result).toEqual([{ merchant: 'netflix', fixedType: '통신', count: 2, usedAt: '2026-10-03' }])
  })

  it('건수와 최근 사용일, 결제명 순으로 정렬하고 30개까지만 반환한다', () => {
    const rows = [
      transaction({ id: 'a', merchant: '가나다', used_at: '2026-10-01' }),
      transaction({ id: 'b', merchant: '나나다', used_at: '2026-10-03' }),
      transaction({ id: 'c', merchant: '나다다', used_at: '2026-10-02' }),
      transaction({ id: 'd', merchant: '가나다', used_at: '2026-10-04' }),
    ]
    const result = listFixedRuleCandidates(rows, noRules)
    expect(result.slice(0, 3).map(({ merchant }) => merchant)).toEqual(['가나다', '나나다', '나다다'])
    const many = Array.from({ length: 31 }, (_, index) => transaction({ id: `x${index}`, merchant: `후보${index}` }))
    expect(listFixedRuleCandidates(many, noRules)).toHaveLength(30)
  })

  it('내역이 없으면 빈 목록을 반환한다', () => {
    expect(listFixedRuleCandidates([], noRules)).toEqual([])
  })
})
