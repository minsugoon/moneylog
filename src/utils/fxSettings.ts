import { CURRENCIES, DEFAULT_FX_CODES, FX_CURRENCIES } from './currency.ts'

export const FX_CURRENCIES_KEY = 'moneylog.fxCurrencies'

export function parseFxCurrencySetting(text: string | null): string[] {
  if (text === null) return [...DEFAULT_FX_CODES]
  const selected = new Set(text.split(','))
  return CURRENCIES.filter((currency) => FX_CURRENCIES.some((item) => item.code === currency.code) && selected.has(currency.code)).map((currency) => currency.code)
}

export function serializeFxCurrencySetting(codes: string[]): string {
  const selected = new Set(codes)
  return CURRENCIES.filter((currency) => FX_CURRENCIES.some((item) => item.code === currency.code) && selected.has(currency.code)).map((currency) => currency.code).join(',')
}
