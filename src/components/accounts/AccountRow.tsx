import type { Account } from '../../lib/types.ts'
import { ACCOUNT_KIND_LABEL, formatAccountLabel } from '../../utils/format.ts'

interface AccountRowProps {
  account: Account
  isFirst: boolean
  isLast: boolean
  busy: boolean
  onMove: (direction: -1 | 1) => void
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
}

const smallButton =
  'min-h-11 min-w-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40'

// 등록된 결제수단 한 줄. 순서 바꾸기·수정·사용중지·삭제 버튼이 붙어 있다.
function AccountRow({ account, isFirst, isLast, busy, onMove, onEdit, onToggleActive, onDelete }: AccountRowProps) {
  const label = formatAccountLabel(account)

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 break-words text-base font-bold text-gray-800">{label}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {ACCOUNT_KIND_LABEL[account.kind]}
        </span>
        {!account.is_active && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">사용중지</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={busy || isFirst}
          aria-label={`${label} 위로 옮기기`}
          className={smallButton}
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={busy || isLast}
          aria-label={`${label} 아래로 옮기기`}
          className={smallButton}
        >
          ▼
        </button>
        <button type="button" onClick={onEdit} disabled={busy} className={smallButton}>
          수정
        </button>
        <button type="button" onClick={onToggleActive} disabled={busy} className={smallButton}>
          {account.is_active ? '사용중지' : '다시 사용'}
        </button>
        <button type="button" onClick={onDelete} disabled={busy} className={`${smallButton} text-red-700`}>
          삭제
        </button>
      </div>
    </li>
  )
}

export default AccountRow
