import { describe, expect, it } from 'vitest'
import type { Transaction } from '../lib/types.ts'
import { listFixedLoadOptions } from './fixedLoadOptions.ts'

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1', account_id: null, used_at: '2026-10-01', merchant: '샘플기부', amount: 20000, discount: 0,
    installment_months: 1, is_fixed: true, fixed_type: '기타고정', source: 'manual', import_hash: null,
    memo: null, is_cancel: false, interest_free: false, performance_override: null,
    created_at: '2026-10-01T00:00:00Z', ...overrides,
  }
}

describe('고정지출 불러오기 목록', () => {
  it('고정지출이며 취소되지 않고 결제명이 있는 내역만 포함한다', () => {
    const rows = [
      transaction(),
      transaction({ id: 't2', merchant: '일반내역', is_fixed: false }),
      transaction({ id: 't3', merchant: '취소내역', is_cancel: true }),
      transaction({ id: 't4', merchant: '종류없음', fixed_type: null }),
      transaction({ id: 't5', merchant: '   ' }),
    ]
    expect(listFixedLoadOptions(rows).map(({ merchant }) => merchant)).toEqual(['샘플기부'])
  })

  it('금액이 다르면 같은 결제명도 별도 줄로 만든다', () => {
    const result = listFixedLoadOptions([
      transaction(),
      transaction({ id: 't2', amount: 31000 }),
    ])
    expect(result.map(({ amount }) => amount)).toEqual([20000, 31000])
  })

  it('대소문자와 공백이 다른 같은 결제명을 합치고 가장 최근 값을 사용한다', () => {
    const result = listFixedLoadOptions([
      transaction({ merchant: ' Sample Gift ', used_at: '2026-10-01' }),
      transaction({ id: 't2', merchant: 'samplegift', used_at: '2026-10-03', discount: 500, account_id: 'account-2', fixed_type: '구독' }),
    ])
    expect(result).toEqual([{
      key: 'samplegift:20000', merchant: 'samplegift', amount: 20000, discount: 500,
      accountId: 'account-2', fixedType: '구독', usedAt: '2026-10-03', count: 2,
    }])
  })

  it('정렬은 최근 날짜, 건수, 결제명, 금액 순서로 적용한다', () => {
    const result = listFixedLoadOptions([
      transaction({ id: 'a', merchant: '가나다', amount: 30000, used_at: '2026-10-01' }),
      transaction({ id: 'b', merchant: '가나다', amount: 20000, used_at: '2026-10-01' }),
      transaction({ id: 'c', merchant: '나라마', used_at: '2026-10-01' }),
      transaction({ id: 'd', merchant: '다라마', used_at: '2026-10-02' }),
      transaction({ id: 'e', merchant: '라다마', used_at: '2026-10-01' }),
      transaction({ id: 'f', merchant: '라다마', used_at: '2026-10-01' }),
    ])
    expect(result.map(({ merchant, amount }) => `${merchant}:${amount}`)).toEqual([
      '다라마:20000', '라다마:20000', '가나다:20000', '가나다:30000', '나라마:20000',
    ])
  })

  it('기본 10개를 반환하고 limit이 1 미만이면 빈 목록을 반환한다', () => {
    const rows = Array.from({ length: 12 }, (_, index) => transaction({ id: `t${index}`, merchant: `샘플${index}` }))
    expect(listFixedLoadOptions(rows)).toHaveLength(10)
    expect(listFixedLoadOptions(rows, 0)).toEqual([])
  })

  it('내역이 없으면 빈 목록을 반환한다', () => {
    expect(listFixedLoadOptions([])).toEqual([])
  })
})
