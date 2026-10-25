import { describe, expect, it } from 'vitest'
import type { Transaction } from '../lib/types.ts'
import { buildDayList, entriesForMonth, sumCharges, summarizeDay } from './summary.ts'

// 테스트용 내역을 만든다. 값은 모두 임의로 만든 것이다.
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

describe('entriesForMonth / sumCharges', () => {
  const txs = [
    makeTx({ id: 'a', used_at: '2026-10-20', amount: 30000, discount: 5000 }),
    makeTx({ id: 'b', used_at: '2026-10-05', amount: 10000 }),
    makeTx({ id: 'c', used_at: '2026-09-30', amount: 99999 }),
    makeTx({ id: 'd', used_at: '2026-10-06', amount: 4000, is_cancel: true }),
  ]

  it('선택한 달의 내역만 모은다', () => {
    expect(entriesForMonth(txs, '2026-10').map((e) => e.tx.id)).toEqual(['a', 'b', 'd'])
  })

  it('실결제액(이용금액-할인)을 쓰고 취소 건은 마이너스로 합한다', () => {
    // 25,000 + 10,000 - 4,000
    expect(sumCharges(entriesForMonth(txs, '2026-10'))).toBe(31000)
  })

  it('내역이 없는 달은 0원', () => {
    expect(sumCharges(entriesForMonth(txs, '2026-08'))).toBe(0)
  })
})

describe('buildDayList', () => {
  const entries = entriesForMonth(
    [
      makeTx({ id: 'a', used_at: '2026-10-20' }),
      makeTx({ id: 'b', used_at: '2026-10-20' }),
      makeTx({ id: 'c', used_at: '2026-10-05' }),
    ],
    '2026-10',
  )

  it('날짜별로 묶고 최근 날짜부터 보여준다', () => {
    const days = buildDayList(entries, [])
    expect(days.map((d) => d.date)).toEqual(['2026-10-20', '2026-10-05'])
    expect(days[0].entries).toHaveLength(2)
  })

  it('지출이 없어도 하루 정리가 있는 날은 목록에 넣는다', () => {
    const days = buildDayList(entries, ['2026-10-12'])
    expect(days.map((d) => d.date)).toEqual(['2026-10-20', '2026-10-12', '2026-10-05'])
    expect(days[1].entries).toHaveLength(0)
  })
})

describe('summarizeDay', () => {
  it('그날 지출 건수와 합계', () => {
    const txs = [
      makeTx({ used_at: '2026-10-05', amount: 12000 }),
      makeTx({ used_at: '2026-10-05', amount: 3000, is_cancel: true }),
      makeTx({ used_at: '2026-10-06', amount: 500 }),
    ]
    expect(summarizeDay(txs, '2026-10-05')).toEqual({ count: 2, total: 9000 })
  })
})
