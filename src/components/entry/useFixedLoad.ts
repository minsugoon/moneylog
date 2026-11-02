import type { FixedLoadOption } from '../../utils/fixedLoadOptions.ts'
import type { Account, FixedType } from '../../lib/types.ts'

interface FixedLoadSetters {
  choices: Account[]
  setMerchant: (value: string) => void
  setAmount: (value: number | null) => void
  setDiscount: (value: number | null) => void
  setMonths: (value: number) => void
  setInterestFree: (value: boolean) => void
  setIsCancel: (value: boolean) => void
  setIsFixed: (value: boolean) => void
  setFixedType: (value: FixedType) => void
  setFixedTouched: (value: boolean) => void
  setAccountChoice: (value: string | null) => void
  setSaveRule: (value: boolean) => void
  setRuleKeywordEdit: (value: string | null) => void
  setError: (value: string) => void
  setNotice: (value: string) => void
  resetFx?: () => void
}

export function useFixedLoad({ choices, setMerchant, setAmount, setDiscount, setMonths, setInterestFree, setIsCancel, setIsFixed, setFixedType, setFixedTouched, setAccountChoice, setSaveRule, setRuleKeywordEdit, setError, setNotice, resetFx }: FixedLoadSetters) {
  return (option: FixedLoadOption) => {
    resetFx?.()
    setMerchant(option.merchant)
    setAmount(option.amount)
    setDiscount(option.discount > 0 ? option.discount : null)
    setMonths(1)
    setInterestFree(false)
    setIsCancel(false)
    setIsFixed(true)
    setFixedType(option.fixedType)
    setFixedTouched(true)
    if (option.accountId && choices.some((account) => account.id === option.accountId)) setAccountChoice(option.accountId)
    setSaveRule(false)
    setRuleKeywordEdit(null)
    setError('')
    setNotice('')
  }
}
