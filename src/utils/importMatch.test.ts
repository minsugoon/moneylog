import { describe, expect, it } from 'vitest'
import { makeImportHash, makeImportKey } from './importHash.ts'
import { classifyImports, type ExistingTransaction, type MatchInput } from './importMatch.ts'

const input = (overrides: Partial<MatchInput> = {}): MatchInput => ({
  accountId: 'account-a', date: '2026-10-20', time: '10:15', merchant: '샘플식당', amount: 46900, isCancel: false,
  ...overrides,
})

const existing = (overrides: Partial<ExistingTransaction> = {}): ExistingTransaction => ({
  account_id: 'account-a', used_at: '2026-10-20', merchant: '샘플식당', amount: 46900, is_cancel: false, import_hash: null,
  ...overrides,
})

function importedRow(value: MatchInput, hash = makeImportHash(makeImportKey(value, value.accountId))): ExistingTransaction {
  return existing({ account_id: value.accountId, used_at: value.date, merchant: value.merchant, amount: value.amount, is_cancel: value.isCancel, import_hash: hash })
}

describe('가져오기 중복 판정', () => {
  it('새 내역을 새 항목으로 판정한다', () => {
    expect(classifyImports([input()], [])[0].status).toBe('new')
  })

  it('저장된 지문과 같으면 중복으로 판정한다', () => {
    const rows = [input(), input({ merchant: '다른가게', amount: 29900 })]
    const results = classifyImports(rows, rows.map((row) => importedRow(row)))
    expect(results.map((result) => result.status)).toEqual(['duplicate', 'duplicate'])
  })

  it('같은 키 두 건은 기존 한 건만 중복으로 센다', () => {
    const value = input()
    expect(classifyImports([value, value], [importedRow(value)]).map((result) => result.status)).toEqual(['duplicate', 'new'])
  })

  it('시각이 다른 취소 두 건은 새 항목이며 지문도 다르다', () => {
    const first = input({ date: '2026-10-14', time: '19:27', merchant: '(주)샘플배달_네', amount: 23500, isCancel: true })
    const second = { ...first, time: '19:23' }
    const results = classifyImports([first, second], [])
    expect(results.map((result) => result.status)).toEqual(['new', 'new'])
    expect(results[0].hash).not.toBe(results[1].hash)
  })

  it('지문 없는 직접 입력 내역과도 중복을 찾는다', () => {
    expect(classifyImports([input()], [existing({ import_hash: null })])[0].status).toBe('duplicate')
  })

  it('하루 차이의 비슷한 가맹점은 중복 가능으로 표시한다', () => {
    const value = input({ merchant: '샘플통신 유선상품 자동(7777)' })
    const row = existing({ used_at: '2026-10-19', merchant: '샘플통신 유선상품 자동납부 09월 - 7777' })
    expect(classifyImports([value], [row])[0].status).toBe('possible')
  })

  it('이미 가져온 취소 한 건이 있을 때 시각이 다른 같은 취소는 확정 중복이 아니라 중복 가능이다', () => {
    const saved = input({ date: '2026-10-14', time: '19:27', merchant: '(주)샘플배달_네', amount: 23500, isCancel: true })
    const later = { ...saved, time: '19:23' }
    expect(classifyImports([later], [importedRow(saved)])[0].status).toBe('possible')
    // 시각이 없는 문자(자동결제 접수)는 같은 날 같은 결제로 보고 중복으로 판정한다
    expect(classifyImports([{ ...saved, time: null }], [importedRow(saved)])[0].status).toBe('duplicate')
  })

  it('금액이 다르면 중복으로 짝짓지 않는다', () => {
    expect(classifyImports([input({ amount: 29900 })], [existing()])[0].status).toBe('new')
  })

  it('결제수단이 다르면 짝짓지 않는다', () => {
    expect(classifyImports([input({ accountId: 'account-b' })], [existing()])[0].status).toBe('new')
  })

  it('포함되는 결제명은 중복 가능으로 표시한다', () => {
    const value = input({ merchant: 'Adobe' })
    const row = existing({ merchant: 'Adobe Adobe' })
    expect(classifyImports([value], [row])[0].status).toBe('possible')
  })
})
