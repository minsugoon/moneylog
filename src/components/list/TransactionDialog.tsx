import { useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import type { Transaction } from '../../lib/types.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import Dialog from '../Dialog.tsx'
import EntryForm from '../entry/EntryForm.tsx'
import { dangerButtonClass } from '../ui.ts'

interface TransactionDialogProps {
  tx: Transaction
  onClose: () => void
}

// 내역을 누르면 뜨는 창: 같은 입력 폼으로 고치거나, 확인을 거쳐 삭제한다
function TransactionDialog({ tx, onClose }: TransactionDialogProps) {
  const { transactions } = useLedger()
  const [date, setDate] = useState(tx.used_at)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    const result = await transactions.remove(tx.id)
    if (result.ok) {
      onClose()
    } else {
      setError(result.message)
      setDeleting(false)
    }
  }

  if (confirming) {
    return (
      <ConfirmDialog
        title="이 내역을 삭제할까요?"
        message={`“${tx.merchant}” 내역이 지워져요. 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        danger
        busy={deleting}
        error={error}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirming(false)}
      />
    )
  }

  return (
    <Dialog title="내역 수정" onClose={onClose}>
      <EntryForm date={date} onDateChange={setDate} initial={tx} onDone={onClose} onCancel={onClose} />
      <button type="button" onClick={() => setConfirming(true)} className={`mt-4 w-full ${dangerButtonClass}`}>
        이 내역 삭제
      </button>
    </Dialog>
  )
}

export default TransactionDialog
