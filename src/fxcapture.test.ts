import { describe, expect, it } from 'vitest'
import type { ParsedRow } from './utils/parsers/types.ts'
import { convertToKrw } from './utils/currency.ts'
import { fxSaveProblems, previewKrw } from './utils/fxImport.ts'
import { makeImportKey } from './utils/importHash.ts'
import { classifyImports, type ExistingTransaction } from './utils/importMatch.ts'
import { buildPreviewItems, toImportRecords } from './utils/importRows.ts'
import { parseRateResponse, rateCodesFrom, type RateChoice } from './utils/fxRates.ts'

const row = (overrides: Partial<ParsedRow> = {}): ParsedRow => ({
  status: 'ok', date: '2026-10-18', time: '10:20', merchant: 'Sample Shop', amount: 208000, currency: 'VND',
  installment: 6, isCancel: false, interestFree: true, direction: 'expense', accountHint: null,
  source: 'capture', raw: 'sample', failReason: null, ...overrides,
})
const choice: RateChoice = { status: 'live', rate: 0.054, at: '2026-10-18T00:00:00.000Z' }
const existing = (overrides: Partial<ExistingTransaction> = {}): ExistingTransaction => ({
  account_id: 'account-a', used_at: '2026-10-18', merchant: 'Sample Shop', amount: 11232,
  is_cancel: false, import_hash: null, currency: 'KRW', original_amount: null, ...overrides,
})

describe('사진 입력 외화 환산', () => {
  it('모든 3글자 통화 코드를 환율 응답에서 찾는다', () => {
    expect(rateCodesFrom({ rates: { VND: 1, USD: 2, bad: 3, vnd: 4 } })).toEqual(['VND', 'USD'])
    expect(parseRateResponse({ result: 'success', rates: { VND: 1, KRW: 2 } }, rateCodesFrom({ rates: { VND: 1, KRW: 2 } }), new Date('2026-10-18T00:00:00Z'))?.rates.VND).toBe(2)
  })

  it('사진 통화를 보관하고 외화 할부를 한 번 결제로 바꾼다', () => {
    const items = buildPreviewItems([row(), row({ currency: 'KRW', amount: 12000 }), row({ currency: 'usd' })], [], [])
    expect(items.map((item) => item.currency)).toEqual(['VND', 'KRW', 'KRW'])
    expect(items[0]).toMatchObject({ installment: 1, interestFree: false })
  })

  it('외화 저장 시 원화와 입력 당시 환율 정보를 함께 기록한다', () => {
    const item = { ...buildPreviewItems([row()], [], [])[0], selected: true }
    const record = toImportRecords([item], 'sms', () => choice)[0]
    expect(record).toMatchObject({ amount: 11232, currency: 'VND', original_amount: 208000, exchange_rate: 0.054, rate_at: choice.at, krw_confirmed: false, installment_months: 1 })
    const usd = toImportRecords([{ ...item, currency: 'USD', amount: 9.99 }], 'sms', () => ({ ...choice, rate: 1380.5 }))[0]
    expect(usd.amount).toBe(convertToKrw(999, 'USD', 1380.5).ok ? (convertToKrw(999, 'USD', 1380.5) as { ok: true; krw: number }).krw : null)
    const mixed = toImportRecords([{ ...item, currency: 'KRW' }, item])
    expect(mixed).toHaveLength(1)
    expect(mixed[0]).not.toHaveProperty('currency')
  })

  it('원화 지문 형식은 유지하고 외화 통화는 지문에 포함한다', () => {
    expect(makeImportKey({ date: '2026-10-18', time: '10:20', merchant: 'Sample Shop', amount: 11232, isCancel: false }, 'account-a')).toBe('account-a|2026-10-18|10:20|sampleshop|11232|P')
    expect(makeImportKey({ date: '2026-10-18', time: '10:20', merchant: 'Sample Shop', amount: 208000, currency: 'VND', isCancel: false }, 'account-a')).toContain('VND:208000')
  })

  it('외화 원금만 비교해 같은 결제를 찾고 원화 금액만 같은 결제는 제외한다', () => {
    const input = { accountId: 'account-a', date: '2026-10-18', time: '10:20', merchant: 'Sample Shop', amount: 208000, currency: 'VND', isCancel: false }
    expect(classifyImports([input], [existing({ currency: 'VND', original_amount: 208000 })])[0].status).not.toBe('new')
    expect(classifyImports([input], [existing()])[0].status).toBe('new')
  })

  it('미리보기 환산과 저장 차단 수를 계산한다', () => {
    expect(previewKrw({ currency: 'KRW', amount: 100 }, choice)).toEqual({ krw: 100, message: null })
    expect(previewKrw({ currency: 'VND', amount: null }, choice)).toEqual({ krw: null, message: null })
    expect(previewKrw({ currency: 'VND', amount: 208000 }, { status: 'none', rate: null, at: null }).krw).toBeNull()
    const selected = { ...buildPreviewItems([row()], [], [])[0], selected: true }
    expect(fxSaveProblems([selected], () => ({ status: 'none', rate: null, at: null }))).toBe(1)
    expect(fxSaveProblems([selected], () => choice)).toBe(0)
  })
})
