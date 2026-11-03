import { useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import type { CardBenefit, CardProgram } from '../../lib/types.ts'
import type { ActionResult } from '../../lib/errors.ts'
import type { BenefitDraft } from '../../utils/cardProgramInput.ts'
import { formatWon } from '../../utils/format.ts'
import { errorBoxClass, secondaryButtonClass } from '../ui.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import Dialog from '../Dialog.tsx'
import BenefitForm from './BenefitForm.tsx'

interface BenefitListProps { program: CardProgram }
const emptyDraft = (): BenefitDraft => ({ name: '', required_amount: null, benefit_amount: null, benefit_kind: '기타', linked_keyword: '', memo: '' })
const draftFromBenefit = (benefit: CardBenefit): BenefitDraft => ({ name: benefit.name, required_amount: benefit.required_amount, benefit_amount: benefit.benefit_amount, benefit_kind: benefit.benefit_kind, linked_keyword: benefit.linked_keyword ?? '', memo: benefit.memo ?? '' })

// 프로그램에 등록된 혜택을 조건 순서로 보여 주고 관리합니다.
function BenefitList({ program }: BenefitListProps) {
  const { cardPrograms: store } = useLedger()
  const [editing, setEditing] = useState<CardBenefit | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<CardBenefit | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const items = store.benefits.filter((item) => item.program_id === program.id).sort((a, b) => (a.required_amount ?? program.target_amount) - (b.required_amount ?? program.target_amount) || a.created_at.localeCompare(b.created_at))
  async function submit(draft: BenefitDraft): Promise<ActionResult> {
    const result = editing ? await store.updateBenefit(editing.id, draft) : await store.addBenefit(program.id, draft)
    if (result.ok) setEditing(undefined)
    return result
  }
  async function remove() {
    if (!deleting) return
    setBusy(true)
    setError('')
    const result = await store.removeBenefit(deleting.id)
    setBusy(false)
    if (result.ok) setDeleting(null)
    else setError(result.message)
  }
  return (
    <div className="mt-2">
      {items.length === 0 ? <p className="text-sm text-gray-600">아직 등록한 혜택이 없어요. 실적을 채우면 받는 할인을 적어 두면 보기 탭에서 함께 계산해요.</p> : (
        <ul className="space-y-2">
          {items.map((benefit) => (
            <li key={benefit.id} className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-2"><p className="text-base font-bold text-gray-800">{benefit.name}</p><p className="shrink-0 text-base font-bold tabular-nums text-brand">-{formatWon(benefit.benefit_amount)}</p></div>
              <p className="text-sm text-gray-600">{formatWon(benefit.required_amount ?? program.target_amount)} 이상{benefit.required_amount === null ? '(목표 금액)' : ''} · {benefit.benefit_kind}{benefit.linked_keyword ? ` · 연결: ${benefit.linked_keyword}` : ''}</p>
              {benefit.memo && <p className="text-xs text-gray-600">{benefit.memo}</p>}
              <div className="mt-2 flex gap-2"><button type="button" aria-label={`${benefit.name} 수정`} onClick={() => setEditing(benefit)} className={secondaryButtonClass}>수정</button><button type="button" aria-label={`${benefit.name} 지우기`} onClick={() => { setError(''); setDeleting(benefit) }} className="min-h-11 px-3 text-base text-red-700">지우기</button></div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className={`mt-2 ${errorBoxClass}`} role="alert">{error}</p>}
      <button type="button" onClick={() => setEditing(null)} className={`mt-3 w-full ${secondaryButtonClass}`}>+ 혜택 추가</button>
      {editing !== undefined && <Dialog title={editing ? '혜택 수정' : '혜택 추가'} onClose={() => setEditing(undefined)}><BenefitForm initial={editing ? draftFromBenefit(editing) : emptyDraft()} targetAmount={program.target_amount} submitLabel={editing ? '수정' : '추가'} onSubmit={submit} onCancel={() => setEditing(undefined)} /></Dialog>}
      {deleting && <ConfirmDialog title="혜택을 지울까요?" message={`‘${deleting.name}’ 혜택을 지워도 내역은 그대로예요.`} confirmLabel="지우기" danger busy={busy} error={error} onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />}
    </div>
  )
}

export default BenefitList
