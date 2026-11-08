import { useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import { FALLBACK_FIXED_TYPE, type FixedTypeRow } from '../../lib/types.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import Dialog from '../Dialog.tsx'
import { cardClass, errorBoxClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'

// 고정지출 분류를 추가하고 이름을 관리합니다.
function FixedTypeSection() {
  const { fixedTypes, fixedExpenses, transactions } = useLedger()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<FixedTypeRow | null>(null)
  const [deleting, setDeleting] = useState<FixedTypeRow | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  async function add() {
    setBusy(true); setError('')
    const result = await fixedTypes.add(name)
    if (result.ok) setName('')
    else setError(result.message)
    setBusy(false)
  }
  async function rename() {
    if (!editing) return
    setBusy(true); setError('')
    const result = await fixedTypes.rename(editing, editName)
    if (result.ok) {
      void transactions.reload()
      void fixedExpenses.reload()
      setEditing(null)
    } else setError(result.message)
    setBusy(false)
  }
  async function remove() {
    if (!deleting) return
    setBusy(true); setDeleteError('')
    const result = await fixedTypes.remove(deleting)
    if (result.ok) { void fixedExpenses.reload(); setDeleting(null) }
    else setDeleteError(result.message)
    setBusy(false)
  }
  return (
    <section className={cardClass} aria-labelledby="fixed-types-title">
      <h3 id="fixed-types-title" className="text-sm font-bold text-gray-600">고정지출 분류</h3>
      <p className="mt-1 text-xs text-gray-600">통신·보험처럼 고정지출을 묶는 이름이에요. 대출이자, 대출원금처럼 직접 추가할 수 있어요.</p>
      {error && !editing && <p className={`mt-3 ${errorBoxClass}`} role="alert">{error}</p>}
      <ul className="mt-4 divide-y divide-gray-100">{fixedTypes.items.map((row) => <li key={row.id} className="flex min-h-14 items-center gap-2 py-2"><span className="min-w-0 flex-1 break-words text-base text-gray-800">{row.name}</span>{row.name === FALLBACK_FIXED_TYPE ? <span className="text-sm text-gray-500">기본 분류</span> : <><button type="button" aria-label={`${row.name} 수정`} onClick={() => { setError(''); setEditName(row.name); setEditing(row) }} className={secondaryButtonClass}>수정</button><button type="button" aria-label={`${row.name} 지우기`} onClick={() => { setDeleteError(''); setDeleting(row) }} className="min-h-11 px-3 text-base text-red-700">지우기</button></>}</li>)}</ul>
      <div className="mt-4 flex gap-2"><input lang="ko" maxLength={20} aria-label="새 분류 이름" placeholder="예: 대출이자" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /><button type="button" disabled={busy} onClick={() => void add()} className={primaryButtonClass}>추가</button></div>
      {editing && <Dialog title="분류 이름 바꾸기" onClose={() => setEditing(null)}><div className="flex flex-col gap-3"><input lang="ko" maxLength={20} aria-label="분류 이름" value={editName} onChange={(event) => setEditName(event.target.value)} className={inputClass} /><p className="text-xs text-gray-600">이미 저장한 내역과 등록한 고정지출의 분류 이름도 함께 바뀌어요.</p>{error && <p className={errorBoxClass} role="alert">{error}</p>}<div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditing(null)} className={secondaryButtonClass}>취소</button><button type="button" disabled={busy} onClick={() => void rename()} className={primaryButtonClass}>{busy ? '저장하는 중…' : '저장'}</button></div></div></Dialog>}
      {deleting && <ConfirmDialog title="분류를 지울까요?" message={`‘${deleting.name}’ 분류로 등록한 고정지출은 ‘기타고정’으로 바뀌고, 이미 저장한 내역은 그대로예요.`} confirmLabel="지우기" danger busy={busy} error={deleteError} onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />}
    </section>
  )
}

export default FixedTypeSection
