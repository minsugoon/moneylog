import { describe, expect, it } from 'vitest'
import { FALLBACK_FIXED_TYPE } from './lib/types.ts'
import { registrationFromTransaction } from './utils/fixedExpenses.ts'
import { buildPreviewItems, toImportRecords } from './utils/importRows.ts'
import type { ParsedRow } from './utils/parsers/types.ts'

const row: ParsedRow = {
  status: 'ok',
  date: '2026-10-18',
  time: null,
  merchant: '임의 상점',
  amount: 31800,
  installment: 1,
  isCancel: false,
  interestFree: false,
  direction: 'expense',
  accountHint: null,
  source: 'sms',
  raw: '임의 원문',
  failReason: null,
}

describe('가져오기 고정지출 등록', () => {
  it('세 인자로 만든 미리보기는 고정지출을 자동 선택하지 않는다', () => {
    const [item] = buildPreviewItems([row], [], [])
    expect(item).toMatchObject({ isFixed: false, fixedType: FALLBACK_FIXED_TYPE })
  })

  it('직접 켠 일시불 고정지출은 등록 행으로 바꾸고 취소와 할부는 제외한다', () => {
    const item = buildPreviewItems([row], [], [])[0]
    const [record] = toImportRecords([{ ...item, isFixed: true }])
    expect(registrationFromTransaction(record)).toEqual({
      merchant: '임의 상점',
      account_id: null,
      amount: 31800,
      pay_day: 18,
      fixed_type: FALLBACK_FIXED_TYPE,
    })
    expect(registrationFromTransaction({ ...record, is_cancel: true })).toBeNull()
    expect(registrationFromTransaction({ ...record, installment_months: 2 })).toBeNull()
  })
})
