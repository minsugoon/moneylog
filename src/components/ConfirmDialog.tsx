import Dialog from './Dialog.tsx'
import { dangerButtonClass, errorBoxClass, primaryButtonClass, secondaryButtonClass } from './ui.ts'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  // 삭제처럼 되돌릴 수 없는 동작이면 빨간 버튼으로 보여준다
  danger?: boolean
  busy?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

// "정말 할까요?" 확인 창. 삭제는 반드시 이 단계를 거친다.
function ConfirmDialog({ title, message, confirmLabel, danger, busy, error, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <p className="text-base text-gray-700">{message}</p>
      {error && (
        <p className={`mt-3 ${errorBoxClass}`} role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={`flex-1 ${secondaryButtonClass}`}>
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 ${danger ? dangerButtonClass : primaryButtonClass}`}
        >
          {busy ? '처리하는 중…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

export default ConfirmDialog
