import { useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import type { Account, FixedExpense } from '../../lib/types.ts'
import { draftFromFixedExpense, emptyFixedExpenseDraft, monthlyFixedTotal, payDayLabel, sortFixedExpenses } from '../../utils/fixedExpenses.ts'
import { formatAccountLabel, formatWon } from '../../utils/format.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import Dialog from '../Dialog.tsx'
import { cardClass, errorBoxClass, secondaryButtonClass } from '../ui.ts'
import FixedExpenseForm from './FixedExpenseForm.tsx'
import ExpandListButton from './ExpandListButton.tsx'
import { useExpandableList } from './useExpandableList.ts'

// 등록한 고정지출을 확인하고 관리합니다.
function FixedExpenseSection() {
  const { accounts, fixedExpenses, fixedTypes } = useLedger()
  const [editing, setEditing] = useState<FixedExpense | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<FixedExpense | null>(null)
  const [busyId, setBusyId] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const activeAccounts = accounts.accounts.filter((account) => account.is_active)
  const formAccounts: Account[] = editing && !activeAccounts.some((account) => account.id === editing.account_id)
    ? [...activeAccounts, ...accounts.accounts.filter((account) => account.id === editing.account_id)]
    : activeAccounts
  const types = editing && !fixedTypes.names.includes(editing.fixed_type) ? [...fixedTypes.names, editing.fixed_type] : fixedTypes.names
  const sorted = sortFixedExpenses(fixedExpenses.items)
  const { visible, hiddenCount, expanded, toggle } = useExpandableList(sorted)
  async function submit(draft: ReturnType<typeof emptyFixedExpenseDraft>) {
    const result = editing ? await fixedExpenses.update(editing.id, draft) : await fixedExpenses.add(draft)
    if (result.ok) setEditing(undefined)
    return result
  }
  async function remove() {
    if (!deleting) return
    setBusyId(deleting.id)
    setDeleteError('')
    const result = await fixedExpenses.remove(deleting.id)
    setBusyId('')
    if (result.ok) setDeleting(null)
    else setDeleteError(result.message)
  }
  return (
    <section className={cardClass} aria-labelledby="fixed-expenses-title">
      <h3 id="fixed-expenses-title" className="text-sm font-bold text-gray-600">고정지출</h3>
      <p className="mt-1 text-xs text-gray-600">매달 나가는 돈을 등록해요. 지출을 입력할 때 "고정지출"을 켜면 여기에 자동으로 들어와요.</p>
      <div className="mt-4">
        {fixedExpenses.loading ? <p className="text-sm text-gray-600">고정지출을 불러오는 중…</p> : fixedExpenses.error ? <p className={errorBoxClass} role="alert">{fixedExpenses.error}</p> : sorted.length === 0 ? <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">아직 등록한 고정지출이 없어요.</p> : <>
          <p className="mb-3 text-sm text-gray-600">{sorted.length}개 · 매달 {formatWon(monthlyFixedTotal(sorted))}</p>
          <ul className="divide-y divide-gray-100">{visible.map((item) => <li key={item.id} className="py-3"><div className="flex justify-between gap-3"><span className="min-w-0 break-words text-base font-bold text-gray-800">{item.merchant}</span><span className="shrink-0 tabular-nums text-base font-bold">{formatWon(item.amount)}</span></div><p className="mt-1 text-sm text-gray-600">{formatAccountLabel(accounts.accounts.find((account) => account.id === item.account_id))} · {payDayLabel(item.pay_day)} · {item.fixed_type}</p><div className="mt-2 flex gap-2"><button type="button" aria-label={`${item.merchant} 수정`} onClick={() => setEditing(item)} className={secondaryButtonClass}>수정</button><button type="button" onClick={() => { setDeleteError(''); setDeleting(item) }} className="min-h-11 shrink-0 whitespace-nowrap px-3 text-base text-red-700">지우기</button></div></li>)}</ul>
          <ExpandListButton hiddenCount={hiddenCount} expanded={expanded} onToggle={toggle} />
        </>}
      </div>
      {!fixedExpenses.loading && (activeAccounts.length > 0 ? <button type="button" onClick={() => setEditing(null)} className={`mt-4 w-full ${secondaryButtonClass}`}>+ 고정지출 추가</button> : <p className="mt-4 text-sm text-gray-600">먼저 결제수단을 등록해 주세요.</p>)}
      {editing !== undefined && <Dialog title={editing ? '고정지출 수정' : '고정지출 추가'} onClose={() => setEditing(undefined)}><FixedExpenseForm initial={editing ? draftFromFixedExpense(editing) : emptyFixedExpenseDraft(formAccounts[0]?.id ?? '', fixedTypes.names[0])} accounts={formAccounts} typeOptions={types} submitLabel={editing ? '수정' : '추가'} onSubmit={submit} onCancel={() => setEditing(undefined)} /></Dialog>}
      {deleting && <ConfirmDialog title="목록에서 뺄까요?" message={`‘${deleting.merchant}’을 고정지출 목록에서 빼도 이미 저장한 내역은 그대로예요.`} confirmLabel="빼기" danger busy={busyId === deleting.id} error={deleteError} onConfirm={() => void remove()} onCancel={() => setDeleting(null)} />}
    </section>
  )
}

export default FixedExpenseSection
