import { useState, type ReactNode } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import type { Account, CardProgram } from '../../lib/types.ts'
import { draftFromProgram, emptyProgramDraft } from '../../utils/cardProgramInput.ts'
import { cardClass, errorBoxClass, secondaryButtonClass } from '../ui.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import Dialog from '../Dialog.tsx'
import CardProgramForm from './CardProgramForm.tsx'
import CardProgramRow from './CardProgramRow.tsx'

// 카드 실적 조건의 목록과 추가·수정·삭제를 관리합니다.
function CardProgramSection() {
  const { accounts, cardPrograms: store } = useLedger()
  const [editing, setEditing] = useState<CardProgram | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<CardProgram | null>(null)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const activeCards = accounts.accounts.filter((account) => account.kind === 'card' && account.is_active)
  const cards: Account[] = editing && !activeCards.some((card) => card.id === editing.account_id)
    ? [...activeCards, ...accounts.accounts.filter((account) => account.id === editing.account_id)]
    : activeCards

  async function submit(draft: ReturnType<typeof emptyProgramDraft>) {
    const result = editing ? await store.updateProgram(editing.id, draft) : await store.addProgram(draft)
    if (result.ok) setEditing(undefined)
    return result
  }

  async function toggle(program: CardProgram) {
    setBusyId(program.id)
    setError('')
    const result = await store.setProgramActive(program.id, !program.is_active)
    if (!result.ok) setError(result.message)
    setBusyId('')
  }

  async function remove() {
    if (!deleting) return
    setBusyId(deleting.id)
    setDeleteError('')
    const result = await store.removeProgram(deleting.id)
    setBusyId('')
    if (result.ok) setDeleting(null)
    else setDeleteError(result.message)
  }

  let body: ReactNode
  if (store.loading) {
    body = <p className="text-sm text-gray-600">카드 실적을 불러오는 중…</p>
  } else if (store.error) {
    body = <p className={errorBoxClass} role="alert">{store.error}</p>
  } else if (store.programs.length === 0 && activeCards.length === 0) {
    body = (
      <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">
        <p className="text-sm text-gray-600">먼저 결제수단에 카드를 등록해 주세요.</p>
        <button
          type="button"
          onClick={() => document.getElementById('accounts-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`mt-2 ${secondaryButtonClass}`}
        >
          카드 등록하러 가기 ↑
        </button>
      </div>
    )
  } else if (store.programs.length === 0) {
    body = <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">아직 등록한 실적 조건이 없어요.</p>
  } else {
    body = (
      <ul className="divide-y divide-gray-100">
        {store.programs.map((program) => (
          <CardProgramRow
            key={program.id}
            program={program}
            account={accounts.accounts.find((item) => item.id === program.account_id)}
            benefitCount={store.benefits.filter((benefit) => benefit.program_id === program.id).length}
            busy={busyId !== ''}
            onEdit={() => setEditing(program)}
            onToggleActive={() => void toggle(program)}
            onDelete={() => {
              setDeleteError('')
              setDeleting(program)
            }}
          />
        ))}
      </ul>
    )
  }

  return (
    <section className={cardClass} aria-labelledby="card-programs-title">
      <h3 id="card-programs-title" className="text-sm font-bold text-gray-600">카드 실적</h3>
      <p className="mt-1 text-sm text-gray-600">카드사에서 정한 "한 달에 얼마 이상 쓰기" 조건을 등록하면 보기 탭에서 달성 정도를 볼 수 있어요.</p>
      {error && <p className={`mt-3 ${errorBoxClass}`} role="alert">{error}</p>}
      <div className="mt-4">{body}</div>
      {(!store.loading && activeCards.length > 0) && <button type="button" onClick={() => setEditing(null)} className={`mt-4 w-full ${secondaryButtonClass}`}>+ 실적 조건 추가</button>}
      {editing !== undefined && <Dialog title={editing ? '실적 조건 수정' : '실적 조건 추가'} onClose={() => setEditing(undefined)}><CardProgramForm initial={editing ? draftFromProgram(editing) : emptyProgramDraft(cards[0]?.id ?? '')} cards={cards} submitLabel={editing ? '수정' : '추가'} onSubmit={submit} onCancel={() => setEditing(undefined)} /></Dialog>}
      {deleting && <ConfirmDialog title="실적 조건을 지울까요?" message={`‘${deleting.name}’과 이 조건의 혜택도 함께 지워져요. 내역은 지워지지 않아요.`} confirmLabel="지우기" danger busy={busyId === deleting.id} error={deleteError} onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />}
    </section>
  )
}

export default CardProgramSection
