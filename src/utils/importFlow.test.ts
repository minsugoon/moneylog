import { describe, expect, it } from 'vitest'
import type { Account } from '../lib/types.ts'
import type { ExistingTransaction } from './importMatch.ts'
import { buildPreviewItems, summarizeItems, toImportRecords } from './importRows.ts'
import { parseMessages } from './parsers/index.ts'

// 문자 붙여넣기 전체 흐름(읽기 → 미리보기 → 저장 모양 → 다시 붙여넣기)을 이어서 확인하는 통합 시험.
// 샘플은 docs/PARSER_SPEC.md 7장의 임의 값이다. 오늘은 2026-10-31.
const now = new Date(2026, 9, 31)

const account = (id: string, kind: Account['kind'], issuer: string, last4: string): Account => ({
  id, name: id, kind, issuer, last4, sort_order: 0, is_active: true, created_at: '2026-01-01T00:00:00Z',
})
const accounts = [
  account('삼성카드', 'card', '삼성카드', '1234'),
  account('하나체크', 'card', '하나카드', '1256'),
  account('우리카드', 'card', '우리카드', '5678'),
  account('하나통장', 'account', '하나은행', '5678'),
]

const pasted = [
  '[Web발신]\n삼성1234승인 홍*동\n31,800원 일시불\n10/18 02:40 SampleApp\n누적184,350원',
  '오전 10:52',
  '[Web발신]\n하나56취소 홍*동 23,500원 일시불 10/14\n19:27 (주)샘플배달_네 누적760,561\n원',
  '[Web발신]\n하나56취소 홍*동 23,500원 일시불 10/14\n19:23 (주)샘플배달_네 누적784,061\n원',
  '[Web발신]\n우리(5678)승인\n홍*동님\n46,900원 일시불\n10/12 10:52\n샘플전자 구독료',
  '[Web발신]\n하나,10/26 15:01\n123******45678\n출금21,900원\n샘플페이',
  '[Web발신]\n하나,10/27 10:17\n123******45678\n입금11,003원\n샘플보험환급',
  '[Web발신]\n[샘플은행] 인증번호를 입력해 주세요',
].join('\n\n')

describe('문자 붙여넣기 전체 흐름', () => {
  const items = buildPreviewItems(parseMessages(pasted, { now }), accounts, [])

  it('여러 건이 나뉘어 결제수단이 자동으로 골라지고, 입금·실패는 해제된다', () => {
    expect(items).toHaveLength(7)
    expect(items.map((item) => item.accountId)).toEqual(['삼성카드', '하나체크', '하나체크', '우리카드', '하나통장', '하나통장', ''])
    expect(items.map((item) => item.status)).toEqual(['new', 'new', 'new', 'new', 'new', 'income', 'failed'])
    expect(summarizeItems(items)).toEqual({ save: 5, excluded: 1, failed: 1 })
  })

  it('저장 모양은 체크된 5건이고, 시각이 다른 취소 2건은 지문이 서로 다르다', () => {
    const records = toImportRecords(items, 'sms')
    expect(records).toHaveLength(5)
    expect(new Set(records.map((record) => record.import_hash)).size).toBe(5)
    expect(records.filter((record) => record.is_cancel)).toHaveLength(2)
    expect(records.every((record) => record.import_hash?.startsWith('v1:') && record.source === 'sms')).toBe(true)
    expect(records.some((record) => record.amount === 11003)).toBe(false) // 입금은 저장 대상이 아니다
  })

  it('저장한 뒤 같은 문자를 다시 붙여넣으면 5건이 모두 중복으로 해제된다', () => {
    const saved: ExistingTransaction[] = toImportRecords(items, 'sms').map((record) => ({
      account_id: record.account_id,
      used_at: record.used_at,
      merchant: record.merchant,
      amount: record.amount,
      is_cancel: record.is_cancel,
      import_hash: record.import_hash,
    }))
    const again = buildPreviewItems(parseMessages(pasted, { now }), accounts, saved)
    expect(again.map((item) => item.status)).toEqual(['duplicate', 'duplicate', 'duplicate', 'duplicate', 'duplicate', 'income', 'failed'])
    expect(summarizeItems(again)).toEqual({ save: 0, excluded: 6, failed: 1 })
    expect(toImportRecords(again)).toHaveLength(0)
  })
})
