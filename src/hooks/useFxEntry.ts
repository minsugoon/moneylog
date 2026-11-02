import { useCallback, useMemo, useState } from 'react'
import { useExchangeRate } from './useExchangeRate.ts'
import { useFxCurrencies } from './useFxCurrencies.ts'
import { useLedger } from './useLedger.ts'
import { computeFxEntry, buildFxSaveFields, type FxEntryState, type FxSaveFields } from '../utils/fxEntry.ts'
import { formatRateLabel, formatRateTime, dayTotalAfterSave } from '../utils/fxDisplay.ts'
import { formatDateLabel, formatWon } from '../utils/format.ts'
import { summarizeDay } from '../utils/summary.ts'

let session = { expanded: false, code: 'KRW' }

interface UseFxEntryOptions {
  date: string
  isCancel: boolean
  enabled: boolean
}

export function useFxEntry({ date, isCancel, enabled }: UseFxEntryOptions) {
  const currencies = useFxCurrencies()
  const exchange = useExchangeRate()
  const ledger = useLedger()
  const [selection, setSelection] = useState(() => ({ ...session }))
  const [text, setText] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualKrw, setManualKrw] = useState<number | null>(null)

  const active = enabled ? selection : { expanded: false, code: 'KRW' }
  const code = active.code
  const isFx = enabled && code !== 'KRW'
  const choice = exchange.choose(code)
  const state: FxEntryState = useMemo(
    () => computeFxEntry({ code, text, choice, manualOpen, manualKrw }, new Date()),
    [code, text, choice, manualOpen, manualKrw],
  )
  const dayTotal = summarizeDay(ledger.transactions.items, date).total
  const dayLine = isFx && state.krw !== null
    ? `${formatDateLabel(date)} 합계 ${formatWon(dayTotal)} → ${formatWon(dayTotalAfterSave(dayTotal, state.krw, isCancel))}`
    : null
  const rateLabel = isFx && choice.rate !== null && (state.rate ?? choice.rate) !== null
    ? formatRateLabel(code, state.rate ?? choice.rate as number)
    : null
  const rateTime = isFx && choice.at ? formatRateTime(choice.at) : null

  const updateSelection = useCallback((next: { expanded: boolean; code: string }) => {
    session = next
    setSelection(next)
  }, [])

  const toggle = useCallback(() => {
    if (!enabled) return
    if (selection.code !== 'KRW') {
      updateSelection({ expanded: false, code: 'KRW' })
      setText('')
      setManualOpen(false)
      setManualKrw(null)
    } else updateSelection({ ...selection, expanded: !selection.expanded })
  }, [enabled, selection, updateSelection])

  const selectCode = useCallback((nextCode: string) => {
    if (!enabled) return
    updateSelection({ expanded: true, code: nextCode })
    setText('')
    setManualOpen(false)
    setManualKrw(null)
  }, [enabled, updateSelection])

  const resetToKrw = useCallback(() => {
    updateSelection({ expanded: false, code: 'KRW' })
    setText('')
    setManualOpen(false)
    setManualKrw(null)
  }, [updateSelection])

  const resetAfterSave = useCallback(() => {
    setText('')
    setManualKrw(null)
    setManualOpen(false)
  }, [])

  return {
    enabled,
    expanded: enabled && selection.expanded,
    code,
    isFx,
    favoriteCodes: currencies.codes,
    text,
    setText,
    toggle,
    selectCode,
    manualOpen: isFx && manualOpen,
    manualKrw: isFx ? manualKrw : null,
    openManual: () => setManualOpen(true),
    closeManual: () => { setManualOpen(false); setManualKrw(null) },
    setManualKrw,
    state,
    rateLabel,
    rateTime,
    dayLine,
    refresh: () => { void exchange.refresh() },
    refreshing: exchange.refreshing,
    refreshNotice: exchange.notice,
    resetAfterSave,
    resetToKrw,
    buildSaveFields: (): FxSaveFields | null => isFx ? buildFxSaveFields(code, state) : null,
  }
}
