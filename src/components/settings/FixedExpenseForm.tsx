import { useId, useState, type FormEvent } from 'react'
import type { Account, FixedType } from '../../lib/types.ts'
import type { ActionResult } from '../../lib/errors.ts'
import type { FixedExpenseDraft } from '../../utils/fixedExpenses.ts'
import { formatAccountLabel } from '../../utils/format.ts'
import AmountInput from '../AmountInput.tsx'
import { errorBoxClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'

interface FixedExpenseFormProps {
  initial: FixedExpenseDraft
  accounts: Account[]
  typeOptions: string[]
  submitLabel: string
  onSubmit: (draft: FixedExpenseDraft) => Promise<ActionResult>
  onCancel: () => void
}

// 고정지출의 결제 정보를 입력합니다.
function FixedExpenseForm({ initial, accounts, typeOptions, submitLabel, onSubmit, onCancel }: FixedExpenseFormProps) {
  const id = useId()
  const [draft, setDraft] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function set<K extends keyof FixedExpenseDraft>(key: K, value: FixedExpenseDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await onSubmit(draft)
    if (!result.ok) {
      setError(result.message)
      setBusy(false)
    }
  }
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div><label htmlFor={`${id}-merchant`} className={labelClass}>결제명</label><input id={`${id}-merchant`} lang="ko" maxLength={100} value={draft.merchant} onChange={(event) => set('merchant', event.target.value)} placeholder="예: 인터넷 요금" className={inputClass} /></div>
      <div><label htmlFor={`${id}-account`} className={labelClass}>결제수단</label><select id={`${id}-account`} value={draft.account_id} onChange={(event) => set('account_id', event.target.value)} className={inputClass}>{accounts.map((account) => <option key={account.id} value={account.id}>{formatAccountLabel(account)}</option>)}</select></div>
      <div><label htmlFor={`${id}-amount`} className={labelClass}>금액</label><AmountInput id={`${id}-amount`} value={draft.amount} onChange={(value) => set('amount', value)} placeholder="예: 55,000" /></div>
      <div><label htmlFor={`${id}-day`} className={labelClass}>결제일</label><select id={`${id}-day`} value={draft.pay_day} onChange={(event) => set('pay_day', Number(event.target.value))} className={inputClass}>{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>매월 {day}일</option>)}</select><p className="mt-1 text-xs text-gray-600">그 달에 없는 날짜는 말일로 계산해요.</p></div>
      <div><label htmlFor={`${id}-type`} className={labelClass}>분류</label><select id={`${id}-type`} value={draft.fixed_type} onChange={(event) => set('fixed_type', event.target.value as FixedType)} className={inputClass}>{typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
      {error && <p className={errorBoxClass} role="alert">{error}</p>}
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>취소</button><button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? '저장하는 중…' : submitLabel}</button></div>
    </form>
  )
}

export default FixedExpenseForm
