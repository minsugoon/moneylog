import { currencyDecimals, getCurrency } from './currency.ts'
import { formatNumber } from './format.ts'

export function formatFxAmount(minor: number, code: string): string {
  const decimals = currencyDecimals(code)
  const raw = String(minor).padStart(decimals + 1, '0')
  if (decimals === 0) return formatNumber(minor)
  const whole = raw.slice(0, -decimals)
  const fraction = raw.slice(-decimals)
  return `${formatNumber(Number(whole))}.${fraction}`
}

export function formatRateLabel(code: string, rate: number): string {
  const currency = getCurrency(code)
  const name = currency?.name ?? code
  const decimals = rate < 1 ? 4 : rate < 100 ? 2 : 1
  const formatted = rate.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return `1${name} = ${formatted}원`
}

export function formatRateTime(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatApprox(krw: number): string {
  return `≈ ${formatNumber(krw)}원`
}

export function isEstimated(tx: { currency: string; krw_confirmed: boolean }): boolean {
  return tx.currency !== 'KRW' && !tx.krw_confirmed
}

export function dayTotalAfterSave(current: number, krw: number, isCancel: boolean): number {
  return isCancel ? current - krw : current + krw
}

export function summarizeFx(list: { currency: string; krw_confirmed: boolean }[]): { total: number; estimated: number } {
  const foreign = list.filter((tx) => tx.currency !== 'KRW')
  return { total: foreign.length, estimated: foreign.filter((tx) => !tx.krw_confirmed).length }
}

export function fxMonthNote(summary: { total: number; estimated: number }): string | null {
  if (summary.total === 0) return null
  if (summary.estimated > 0) return `외화 결제 ${summary.total}건 포함 · ${summary.estimated}건은 환율로 계산한 추정 금액(≈)이에요`
  return `외화 결제 ${summary.total}건 포함 · 모두 청구액으로 확정했어요`
}

export function staleRateNote(at: string): string {
  return `환율 서버 오류 · 마지막으로 받은 환율로 계산했어요 (${formatRateTime(at)} 기준)`
}

export const noRateNote = '환율을 불러오지 못했어요. 카드 청구액으로 직접 입력해 주세요.'
