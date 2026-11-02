export interface CurrencyInfo {
  code: string
  name: string
  decimals: number
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'KRW', name: '원', decimals: 0 },
  { code: 'VND', name: '동', decimals: 0 },
  { code: 'USD', name: '달러', decimals: 2 },
  { code: 'JPY', name: '엔', decimals: 0 },
  { code: 'EUR', name: '유로', decimals: 2 },
  { code: 'CNY', name: '위안', decimals: 2 },
  { code: 'THB', name: '바트', decimals: 2 },
]

export const FX_CURRENCIES = CURRENCIES.filter((currency) => currency.code !== 'KRW')
export const DEFAULT_FX_CODES = ['VND', 'USD', 'JPY', 'EUR']
export const MAX_FX_MINOR = 9_999_999_999_900
export const MAX_KRW = 2_000_000_000
const RATE_SCALE = 100_000_000n

export function getCurrency(code: string): CurrencyInfo | undefined {
  return CURRENCIES.find((currency) => currency.code === code)
}

export function currencyDecimals(code: string): number {
  return getCurrency(code)?.decimals ?? 2
}

export function formatFxInput(text: string, code: string): string {
  const decimals = currencyDecimals(code)
  const cleaned = text.replace(/[^0-9.]/g, '')
  const dotIndex = cleaned.indexOf('.')
  let integerPart = dotIndex < 0 ? cleaned : cleaned.slice(0, dotIndex)
  let fractionPart = dotIndex < 0 ? '' : cleaned.slice(dotIndex + 1).replace(/\./g, '')
  integerPart = integerPart.replace(/^0+(?=\d)/, '')
  if (integerPart === '' && dotIndex >= 0) integerPart = '0'
  if (decimals === 0) fractionPart = ''
  else fractionPart = fractionPart.slice(0, decimals)
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (dotIndex >= 0 && decimals > 0) return `${grouped}.${fractionPart}`
  return grouped
}

export function parseFxMinor(text: string, code: string): number | null {
  const decimals = currencyDecimals(code)
  const normalized = text.replace(/,/g, '').trim()
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null
  const [whole = '0', fraction = ''] = normalized.split('.')
  const minorText = `${whole || '0'}${fraction.padEnd(decimals, '0').slice(0, decimals)}`.replace(/^0+(?=\d)/, '')
  const minor = Number(minorText)
  if (!Number.isSafeInteger(minor) || minor > MAX_FX_MINOR) return null
  return minor
}

export function minorToAmount(minor: number, code: string): number {
  const decimals = currencyDecimals(code)
  return Number((minor / 10 ** decimals).toFixed(decimals))
}

function decimalToScaled(value: number): bigint | null {
  if (!Number.isFinite(value) || value < 0) return null
  const text = value.toString().toLowerCase()
  const [coefficient, exponentText] = text.split('e')
  const exponent = exponentText ? Number(exponentText) : 0
  const [whole, fraction = ''] = coefficient.split('.')
  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '') || '0'
  const places = 8 - fraction.length + exponent
  if (places >= 0) return BigInt(digits) * 10n ** BigInt(places)
  const divisor = 10n ** BigInt(-places)
  const numerator = BigInt(digits)
  return (numerator + divisor / 2n) / divisor
}

export type ConvertResult = { ok: true; krw: number } | { ok: false; reason: 'invalid' | 'too_small' | 'too_large' }

export function convertToKrw(minor: number, code: string, rate: number): ConvertResult {
  if (!Number.isFinite(minor) || !Number.isInteger(minor) || minor <= 0 || !Number.isFinite(rate) || rate <= 0) return { ok: false, reason: 'invalid' }
  const scaledRate = decimalToScaled(rate)
  if (scaledRate === null || scaledRate <= 0n) return { ok: false, reason: 'invalid' }
  const divisor = RATE_SCALE * 10n ** BigInt(currencyDecimals(code))
  const value = BigInt(minor) * scaledRate
  const rounded = (value + divisor / 2n) / divisor
  if (rounded === 0n) return { ok: false, reason: 'too_small' }
  if (rounded > BigInt(MAX_KRW)) return { ok: false, reason: 'too_large' }
  return { ok: true, krw: Number(rounded) }
}

export const FX_CONVERT_MESSAGES: Record<'too_small' | 'too_large' | 'invalid', string> = {
  too_small: '원화로 바꾼 금액이 1원보다 작아요. 금액을 확인해 주세요.',
  too_large: '원화로 바꾼 금액이 너무 커요. 금액을 확인해 주세요.',
  invalid: '금액을 확인해 주세요.',
}

export function rateFromKrw(krw: number, minor: number, code: string): number | null {
  if (!Number.isFinite(krw) || !Number.isInteger(krw) || krw <= 0 || !Number.isSafeInteger(minor) || minor <= 0) return null
  const decimals = currencyDecimals(code)
  const numerator = BigInt(krw) * 10n ** BigInt(decimals + 8)
  const denominator = BigInt(minor)
  const scaled = (numerator + denominator / 2n) / denominator
  return Number(scaled) / 100_000_000
}
