import { convertToKrw, FX_CONVERT_MESSAGES, minorToAmount, parseFxMinor, rateFromKrw } from './currency.ts'
import { checkFxSave, type RateChoice } from './fxRates.ts'
import { noRateNote, staleRateNote } from './fxDisplay.ts'

export interface FxEntryInput {
  code: string
  text: string
  choice: RateChoice
  manualOpen: boolean
  manualKrw: number | null
}

export interface FxEntryState {
  minor: number | null
  hasAmount: boolean
  krw: number | null
  rate: number | null
  rateAt: string | null
  confirmed: boolean
  convertError: string | null
  noRate: boolean
  stale: boolean
  rateNote: string | null
  canSave: boolean
  blockMessage: string | null
}

export interface FxSaveFields {
  amount: number
  discount: 0
  installment_months: 1
  interest_free: false
  currency: string
  original_amount: number
  exchange_rate: number
  rate_at: string | null
  krw_confirmed: boolean
}

export function computeFxEntry(input: FxEntryInput, now: Date): FxEntryState {
  const minor = parseFxMinor(input.text, input.code)
  const hasAmount = minor !== null && minor >= 1
  const manualMode = input.manualOpen && input.manualKrw !== null && input.manualKrw >= 1 && hasAmount
  let krw: number | null = null
  let rate: number | null = null
  let rateAt: string | null = null
  let confirmed = false
  let convertError: string | null = null

  if (manualMode && minor !== null && input.manualKrw !== null) {
    krw = input.manualKrw
    rate = rateFromKrw(input.manualKrw, minor, input.code)
    confirmed = true
    rateAt = input.choice.at ?? now.toISOString()
  } else if (hasAmount && minor !== null && input.choice.rate !== null) {
    const converted = convertToKrw(minor, input.code, input.choice.rate)
    rate = input.choice.rate
    rateAt = input.choice.at
    if (converted.ok) krw = converted.krw
    else convertError = FX_CONVERT_MESSAGES[converted.reason]
  }

  const saveCheck = checkFxSave(input.choice, manualMode ? input.manualKrw : null)
  const noRate = input.choice.status === 'none'
  const stale = input.choice.status === 'stale'
  const canSave = hasAmount && krw !== null && convertError === null && saveCheck.canSave
  let blockMessage: string | null = null
  if (!hasAmount) blockMessage = '금액을 입력해 주세요.'
  else if (convertError) blockMessage = convertError
  else if (!saveCheck.canSave) blockMessage = saveCheck.message

  return {
    minor,
    hasAmount,
    krw,
    rate,
    rateAt,
    confirmed,
    convertError,
    noRate,
    stale,
    rateNote: stale && input.choice.at ? staleRateNote(input.choice.at) : noRate ? noRateNote : null,
    canSave,
    blockMessage,
  }
}

export function buildFxSaveFields(code: string, state: FxEntryState): FxSaveFields | null {
  if (!state.canSave || state.minor === null || state.krw === null || state.rate === null) return null
  return {
    amount: state.krw,
    discount: 0,
    installment_months: 1,
    interest_free: false,
    currency: code,
    original_amount: minorToAmount(state.minor, code),
    exchange_rate: state.rate,
    rate_at: state.rateAt,
    krw_confirmed: state.confirmed,
  }
}
