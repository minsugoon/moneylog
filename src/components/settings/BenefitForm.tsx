import { useId, useState, type FormEvent } from 'react'
import { BENEFIT_KINDS, type BenefitKind } from '../../lib/types.ts'
import type { ActionResult } from '../../lib/errors.ts'
import type { BenefitDraft } from '../../utils/cardProgramInput.ts'
import { formatWon } from '../../utils/format.ts'
import AmountInput from '../AmountInput.tsx'
import { chipClass, errorBoxClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'

interface BenefitFormProps {
  initial: BenefitDraft
  targetAmount: number
  submitLabel: string
  onSubmit: (draft: BenefitDraft) => Promise<ActionResult>
  onCancel: () => void
}

// 카드 혜택의 조건과 안내 정보를 입력합니다.
function BenefitForm({ initial, targetAmount, submitLabel, onSubmit, onCancel }: BenefitFormProps) {
  const id = useId()
  const [draft, setDraft] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function set<K extends keyof BenefitDraft>(key: K, value: BenefitDraft[K]) {
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
      <div><label htmlFor={`${id}-name`} className={labelClass}>혜택 이름</label><input id={`${id}-name`} lang="ko" maxLength={40} value={draft.name} onChange={(event) => set('name', event.target.value)} placeholder="예: 정수기 렌탈비 할인" className={inputClass} /></div>
      <div><label htmlFor={`${id}-amount`} className={labelClass}>혜택 금액</label><AmountInput id={`${id}-amount`} value={draft.benefit_amount} onChange={(value) => set('benefit_amount', value)} placeholder="예: 10,000" /></div>
      <div><label htmlFor={`${id}-required`} className={labelClass}>필요 실적 (선택)</label><AmountInput id={`${id}-required`} value={draft.required_amount} onChange={(value) => set('required_amount', value)} placeholder={`비우면 ${formatWon(targetAmount)}`} /><p className="mt-1 text-xs text-gray-600">30만원·50만원처럼 단계가 있으면 단계마다 혜택을 따로 추가하세요.</p></div>
      <fieldset>
        <legend className={labelClass}>혜택 종류</legend>
        <div className="grid grid-cols-5 gap-1">
          {BENEFIT_KINDS.map((kind) => <button key={kind} type="button" aria-pressed={draft.benefit_kind === kind} onClick={() => set('benefit_kind', kind as BenefitKind)} className={chipClass(draft.benefit_kind === kind, true)}>{kind}</button>)}
        </div>
      </fieldset>
      <div><label htmlFor={`${id}-linked`} className={labelClass}>연결 결제명 (선택)</label><input id={`${id}-linked`} lang="ko" maxLength={30} value={draft.linked_keyword} onChange={(event) => set('linked_keyword', event.target.value)} placeholder="예: 코웨이" className={inputClass} /><p className="mt-1 text-xs text-gray-600">고정지출 보기에서 이 이름이 들어간 지출 옆에 "실적 달성 시 할인"을 보여 줘요.</p></div>
      <div><label htmlFor={`${id}-memo`} className={labelClass}>메모 (선택)</label><input id={`${id}-memo`} lang="ko" maxLength={200} value={draft.memo} onChange={(event) => set('memo', event.target.value)} placeholder="예: 전월 실적 충족 시 다음 달 청구서에서 차감" className={inputClass} /></div>
      {error && <p className={errorBoxClass} role="alert">{error}</p>}
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>취소</button><button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? '저장하는 중…' : submitLabel}</button></div>
    </form>
  )
}

export default BenefitForm
