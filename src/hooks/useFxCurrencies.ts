import { useState } from 'react'
import { CURRENCIES } from '../utils/currency.ts'
import { FX_CURRENCIES_KEY, parseFxCurrencySetting, serializeFxCurrencySetting } from '../utils/fxSettings.ts'
import { readSetting, writeSetting } from '../utils/storage.ts'

export function useFxCurrencies() {
  const [codes, setCodes] = useState(() => parseFxCurrencySetting(readSetting(FX_CURRENCIES_KEY)))

  const toggle = (code: string) => {
    const next = codes.includes(code) ? codes.filter((item) => item !== code) : [...codes, code]
    const ordered = CURRENCIES.filter((currency) => next.includes(currency.code) && currency.code !== 'KRW').map((currency) => currency.code)
    setCodes(ordered)
    writeSetting(FX_CURRENCIES_KEY, serializeFxCurrencySetting(ordered))
  }

  const reset = () => {
    const defaults = parseFxCurrencySetting(null)
    setCodes(defaults)
    writeSetting(FX_CURRENCIES_KEY, serializeFxCurrencySetting(defaults))
  }

  return { codes, toggle, reset }
}
