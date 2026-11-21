import { FX_CONVERT_MESSAGES, convertToKrw, currencyDecimals } from './currency.ts'
import type { PreviewItem } from './importRows.ts'
import type { RateChoice } from './fxRates.ts'

// 외화 미리보기 금액을 환율로 원화 환산한다.
export function previewKrw(item: Pick<PreviewItem, 'currency' | 'amount'>, choice: RateChoice): { krw: number | null; message: string | null } {
  const currency = item.currency ?? 'KRW'
  if (currency === 'KRW') return { krw: item.amount, message: null }
  if (item.amount === null) return { krw: null, message: null }
  if (choice.status === 'none' || choice.rate === null) return { krw: null, message: '환율을 받지 못했어요. 잠시 뒤 다시 시도하거나 통화를 원으로 바꿔 주세요.' }
  const result = convertToKrw(Math.round(item.amount * 10 ** currencyDecimals(currency)), currency, choice.rate)
  return result.ok ? { krw: result.krw, message: null } : { krw: null, message: FX_CONVERT_MESSAGES[result.reason] }
}

// 저장 대상으로 선택된 외화 줄 중 원화를 계산할 수 없는 줄 수를 센다.
export function fxSaveProblems(items: PreviewItem[], rateFor: (code: string) => RateChoice): number {
  return items.filter((item) => {
    const currency = item.currency ?? 'KRW'
    if (!item.selected || item.status === 'failed' || item.error || currency === 'KRW') return false
    return previewKrw(item, rateFor(currency)).krw === null
  }).length
}
