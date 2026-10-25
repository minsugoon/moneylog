import { useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import type { AccountInput } from '../../hooks/useAccounts.ts'
import type { Account } from '../../lib/types.ts'
import { formatAccountLabel } from '../../utils/format.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import Dialog from '../Dialog.tsx'
import { cardClass, errorBoxClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'
import AccountForm from './AccountForm.tsx'
import AccountRow from './AccountRow.tsx'

type FormState = { mode: 'add' } | { mode: 'edit'; account: Account } | null

// 설정 화면의 "결제수단" 카드: 목록 + 추가 버튼. 폼과 삭제 확인은 창으로 띄운다.
function AccountSection() {
  const { accounts: store } = useLedger()
  const { accounts, loading, error, reload } = store

  const [formState, setFormState] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)
  const [busyId, setBusyId] = useState('')
  const [actionError, setActionError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  async function handleSubmit(input: AccountInput) {
    const result = formState?.mode === 'edit' ? await store.update(formState.account.id, input) : await store.add(input)
    if (result.ok) setFormState(null)
    return result
  }

  // 순서 바꾸기·사용중지처럼 한 번에 끝나는 동작. 실패하면 목록 위에 안내한다.
  async function runAction(id: string, action: () => Promise<{ ok: boolean; message?: string }>) {
    setBusyId(id)
    setActionError('')
    const result = await action()
    if (!result.ok) setActionError(result.message ?? '문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
    setBusyId('')
  }

  async function handleDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    setDeleteError('')
    const result = await store.remove(deleting.id)
    setBusyId('')
    if (result.ok) {
      setDeleting(null)
    } else {
      setDeleteError(result.message)
    }
  }

  return (
    <section className={cardClass} aria-labelledby="accounts-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="accounts-title" className="text-sm font-bold text-gray-500">
          결제수단
        </h3>
        <button type="button" onClick={() => setFormState({ mode: 'add' })} className={primaryButtonClass}>
          + 추가
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-500">카드·통장·현금을 등록해 두면 지출을 입력할 때 버튼으로 고를 수 있어요.</p>

      {actionError && (
        <p className={`mt-3 ${errorBoxClass}`} role="alert">
          {actionError}
        </p>
      )}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-gray-500">결제수단을 불러오고 있어요…</p>
        ) : error ? (
          <div className="flex flex-col items-start gap-2">
            <p className={errorBoxClass} role="alert">
              {error}
            </p>
            <button type="button" onClick={() => void reload()} className={secondaryButtonClass}>
              다시 불러오기
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            아직 등록한 결제수단이 없어요. 위의 “+ 추가”를 눌러 카드나 통장, 현금을 등록해 보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {accounts.map((account, index) => (
              <AccountRow
                key={account.id}
                account={account}
                isFirst={index === 0}
                isLast={index === accounts.length - 1}
                busy={busyId !== ''}
                onMove={(direction) => void runAction(account.id, () => store.move(account.id, direction))}
                onEdit={() => setFormState({ mode: 'edit', account })}
                onToggleActive={() => void runAction(account.id, () => store.setActive(account.id, !account.is_active))}
                onDelete={() => {
                  setDeleteError('')
                  setDeleting(account)
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {formState && (
        <Dialog title={formState.mode === 'add' ? '결제수단 추가' : '결제수단 수정'} onClose={() => setFormState(null)}>
          <AccountForm
            initial={formState.mode === 'edit' ? formState.account : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setFormState(null)}
          />
        </Dialog>
      )}

      {deleting && (
        <ConfirmDialog
          title="결제수단을 삭제할까요?"
          message={`“${formatAccountLabel(deleting)}”을(를) 삭제해요. 이 결제수단으로 입력한 내역은 지워지지 않지만 결제수단 표시가 비게 돼요. 나중에 다시 쓸 수도 있다면 삭제 대신 “사용중지”를 권해요.`}
          confirmLabel="삭제"
          danger
          busy={busyId !== ''}
          error={deleteError}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

export default AccountSection
