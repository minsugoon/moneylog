import type { Account } from '../../lib/types.ts'
import { ACCOUNT_KIND_LABEL, formatAccountLabel } from '../../utils/format.ts'

interface AccountRowProps {
  account: Account
  isFirst: boolean
  isLast: boolean
  busy: boolean
  onMove: (direction: -1 | 1) => void
  onEdit: () => void
}

const smallButton =
  'min-h-11 min-w-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40'

// 등록된 결제수단 한 줄. 순서 바꾸기와 수정 버튼을 표시한다.
function AccountRow({ account, isFirst, isLast, busy, onMove, onEdit }: AccountRowProps) {
  const label = formatAccountLabel(account)

  return (
    <li className="flex min-h-14 items-center gap-2 rounded-xl bg-gray-50 p-3">
      <div className="min-w-0 flex-1">
        <p className="break-words text-base font-bold text-gray-800">{label}</p>
        <p className="text-xs text-gray-600">{ACCOUNT_KIND_LABEL[account.kind]} · {account.is_active ? '사용 중' : '사용중지'}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={busy || isFirst}
          aria-label={`${label} 위로 옮기기`}
          className={`${smallButton} px-2`}
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={busy || isLast}
          aria-label={`${label} 아래로 옮기기`}
          className={`${smallButton} px-2`}
        >
          ▼
        </button>
        <button type="button" onClick={onEdit} disabled={busy} className={smallButton}>
          수정
        </button>
      </div>
    </li>
  )
}

export default AccountRow
