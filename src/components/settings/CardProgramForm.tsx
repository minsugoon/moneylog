import { useId, useState, type FormEvent } from 'react'
import type { Account, ExclusionMode, InstallmentMode, MeasureBasis } from '../../lib/types.ts'
import type { ActionResult } from '../../lib/errors.ts'
import type { ProgramDraft } from '../../utils/cardProgramInput.ts'
import { parseKeywords } from '../../utils/cardProgramInput.ts'
import { formatAccountLabel } from '../../utils/format.ts'
import AmountInput from '../AmountInput.tsx'
import { chipClass, errorBoxClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'

interface CardProgramFormProps {
  initial: ProgramDraft
  cards: Account[]
  submitLabel: string
  onSubmit: (draft: ProgramDraft) => Promise<ActionResult>
  onCancel: () => void
}

// 카드 실적 조건에 필요한 값을 입력합니다.
function CardProgramForm({ initial, cards, submitLabel, onSubmit, onCancel }: CardProgramFormProps) {
  const id = useId()
  const [draft, setDraft] = useState(initial)
  const [keywords, setKeywords] = useState(initial.exclude_keywords.join(', '))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await onSubmit({ ...draft, exclude_keywords: parseKeywords(keywords) })
    if (!result.ok) {
      setError(result.message)
      setBusy(false)
    }
  }

  function set<K extends keyof ProgramDraft>(key: K, value: ProgramDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function choice<T extends string>(title: string, value: T, options: { value: T; label: string; help: string }[], change: (value: T) => void) {
    return (
      <fieldset>
        <legend className={labelClass}>{title}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => change(option.value)}
              className={chipClass(value === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-600">
          {options.find((option) => option.value === value)?.help}
        </p>
      </fieldset>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div><label htmlFor={`${id}-account`} className={labelClass}>대상 카드</label><select id={`${id}-account`} value={draft.account_id} onChange={(event) => set('account_id', event.target.value)} className={inputClass}>{cards.map((card) => <option key={card.id} value={card.id}>{formatAccountLabel(card)}</option>)}</select></div>
      <div><label htmlFor={`${id}-name`} className={labelClass}>이름</label><input id={`${id}-name`} lang="ko" maxLength={40} value={draft.name} onChange={(event) => set('name', event.target.value)} placeholder="예: 생활카드 기본 실적" className={inputClass} /></div>
      <div><label htmlFor={`${id}-amount`} className={labelClass}>월 목표 금액</label><AmountInput id={`${id}-amount`} value={draft.target_amount} onChange={(value) => set('target_amount', value)} placeholder="예: 300,000" /><p className="mt-1 text-xs text-gray-600">카드사 앱에 나오는 "전월 실적" 기준 금액을 적어 주세요.</p></div>
      {choice<MeasureBasis>('측정 방식', draft.measure_basis, [
        { value: 'previous_month', label: '전월 실적', help: '이번 기간에 쓴 금액으로 다음 달 혜택이 정해져요.' },
        { value: 'current_month', label: '당월 실적', help: '이번 기간에 쓴 금액으로 이번 달 혜택이 정해져요.' },
      ], (value) => set('measure_basis', value))}
      <div><label htmlFor={`${id}-day`} className={labelClass}>측정 시작일</label><select id={`${id}-day`} value={draft.period_start_day} onChange={(event) => set('period_start_day', Number(event.target.value))} className={inputClass}>{Array.from({ length: 28 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day === 1 ? '1일 (달력 기준)' : `${day}일`}</option>)}</select><p className="mt-1 text-xs text-gray-600">카드사가 15일~다음 달 14일처럼 집계하면 15일을 고르세요.</p></div>
      {choice<InstallmentMode>('할부 인정', draft.installment_mode, [
        { value: 'full', label: '전액', help: '할부도 쓴 달에 전체 금액을 실적으로 쳐요.' },
        { value: 'monthly', label: '월 납부액', help: '할부는 매달 나눠 낸 금액만 실적으로 쳐요.' },
      ], (value) => set('installment_mode', value))}
      {choice<ExclusionMode>('무이자 할부', draft.interest_free_mode, [
        { value: 'flag', label: '표시만', help: '실적에 넣되 "제외될 수 있음"으로 따로 알려 줘요.' },
        { value: 'exclude', label: '실적 제외', help: '무이자 할부는 실적에서 빼요.' },
        { value: 'ignore', label: '신경 안 씀', help: '일반 결제처럼 실적에 넣어요.' },
      ], (value) => set('interest_free_mode', value))}
      <div><label htmlFor={`${id}-keywords`} className={labelClass}>이 카드만 빼는 결제명 (선택)</label><input id={`${id}-keywords`} lang="ko" value={keywords} onChange={(event) => setKeywords(event.target.value)} className={inputClass} /><p className="mt-1 text-xs text-gray-600">쉼표로 여러 개 적을 수 있어요. 예: 상품권, 충전</p></div>
      {error && <p className={errorBoxClass} role="alert">{error}</p>}
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>취소</button><button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? '저장하는 중…' : submitLabel}</button></div>
      <p className="text-xs text-gray-600">이 앱의 실적은 내가 입력한 내역 기준 참고용이에요. 첫 달에는 카드사 앱과 비교해 맞춰 주세요.</p>
    </form>
  )
}

export default CardProgramForm
