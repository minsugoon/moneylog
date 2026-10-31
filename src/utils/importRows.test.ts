import { describe, expect, it } from 'vitest'
import type { Account } from '../lib/types.ts'
import type { ParsedRow } from './parsers/types.ts'
import type { ExistingTransaction } from './importMatch.ts'
import { applyAccountToAll, buildPreviewItems, refreshItems, suggestAccountId, summarizeItems, toImportRecords, toggleItem } from './importRows.ts'

const accounts: Account[] = [
  { id: 'samsung', name: '생활카드', kind: 'card', issuer: '삼성카드', last4: '1234', sort_order: 0, is_active: true, created_at: '' },
  { id: 'hana', name: '월급통장', kind: 'account', issuer: '하나은행', last4: '1256', sort_order: 1, is_active: true, created_at: '' },
  { id: 'inactive', name: '예전카드', kind: 'card', issuer: '삼성카드', last4: '1234', sort_order: 2, is_active: false, created_at: '' },
]

function row(overrides: Partial<ParsedRow> = {}): ParsedRow {
  return {
    status: 'ok', date: '2026-10-18', time: '02:40', merchant: 'SampleApp', amount: 31800,
    installment: 1, isCancel: false, interestFree: false, direction: 'expense',
    accountHint: { issuer: '삼성', digits: '1234', kind: 'card' }, source: 'sms', raw: '임의 원문', failReason: null,
    ...overrides,
  }
}

const noExisting: ExistingTransaction[] = []
const existingRow: ExistingTransaction = {
  account_id: 'samsung', used_at: '2026-10-18', merchant: 'SampleApp', amount: 31800,
  is_cancel: false, import_hash: 'v1:placeholder',
}

describe('가져오기 미리보기 행', () => {
  it('힌트의 종류, 발급사, 끝자리로 하나만 자동 선택한다', () => {
    expect(suggestAccountId({ issuer: '삼성', digits: '1234', kind: 'card' }, accounts)).toBe('samsung')
    expect(suggestAccountId({ issuer: '삼성', digits: '9999', kind: 'card' }, accounts)).toBe('')
    expect(suggestAccountId({ issuer: '삼성', digits: '1234', kind: 'card' }, [...accounts, { ...accounts[0], id: 'second' }])).toBe('')
    expect(suggestAccountId({ issuer: '삼성', digits: '1234', kind: 'card' }, accounts.slice(2))).toBe('')
    expect(suggestAccountId({ issuer: '하나', digits: '56', kind: 'account' }, accounts)).toBe('hana')
  })

  it('입금은 해제하고 실패 행은 수정 후 새 항목으로 선택한다', () => {
    const income = buildPreviewItems([row({ direction: 'income', accountHint: { issuer: '하나', digits: '56', kind: 'account' } })], accounts, noExisting)[0]
    expect(income.status).toBe('income')
    expect(income.selected).toBe(false)

    const failed = buildPreviewItems([row({ date: null, merchant: '', amount: null, status: 'failed' })], accounts, noExisting)[0]
    expect(failed.status).toBe('failed')
    expect(failed.selected).toBe(false)
    const fixed = refreshItems([{ ...failed, date: '2026-10-18', merchant: 'SampleApp', amount: 31800 }], noExisting)[0]
    expect(fixed.status).toBe('new')
    expect(fixed.selected).toBe(true)
  })

  it('중복은 기본 해제하고 직접 켠 선택은 판정 갱신 후에도 유지한다', () => {
    const first = buildPreviewItems([row()], accounts, noExisting)
    const hash = first[0].hash
    const duplicate = buildPreviewItems([row()], accounts, [{ ...existingRow, import_hash: hash }])[0]
    expect(duplicate.status).toBe('duplicate')
    expect(duplicate.selected).toBe(false)
    expect(toggleItem([duplicate], duplicate.id)[0].selected).toBe(true)
  })

  it('결제수단 변경 시 중복 판정을 다시 계산한다', () => {
    const item = buildPreviewItems([row()], accounts, noExisting)
    const changedAccount = applyAccountToAll(item, 'another-account', noExisting)
    const changed = applyAccountToAll(item, 'another-account', [{ ...existingRow, account_id: 'another-account', import_hash: changedAccount[0].hash }])[0]
    expect(changed.status).toBe('duplicate')
    expect(changed.hash).not.toBe(item[0].hash)
  })

  it('시각이 다른 취소 두 건은 서로 다른 새 지문으로 저장한다', () => {
    const items = buildPreviewItems([
      row({ time: '19:27', merchant: '(주)샘플배달_네', amount: 23500, isCancel: true, accountHint: { issuer: '하나', digits: '56', kind: 'card' } }),
      row({ time: '19:23', merchant: '(주)샘플배달_네', amount: 23500, isCancel: true, accountHint: { issuer: '하나', digits: '56', kind: 'card' } }),
    ], [{ ...accounts[0], id: 'hana-card', issuer: '하나카드', last4: '1256' }], noExisting)
    expect(items.map((item) => item.status)).toEqual(['new', 'new'])
    const records = toImportRecords(items)
    expect(records).toHaveLength(2)
    expect(records[0].import_hash).not.toBe(records[1].import_hash)
  })

  it('선택된 항목만 DB 모양으로 만들고 요약 수를 계산한다', () => {
    const items = buildPreviewItems([row(), row({ date: null }), row({ direction: 'income' })], accounts, noExisting)
    expect(summarizeItems(items)).toEqual({ save: 1, excluded: 1, failed: 1 })
    const records = toImportRecords(items)
    expect(records).toHaveLength(1)
    expect(records[0].source).toBe('sms')
    expect(records[0]).not.toHaveProperty('raw')
    expect(records[0]).not.toHaveProperty('time')
  })
})
