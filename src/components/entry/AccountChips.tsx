import type { Account } from '../../lib/types.ts'
import { formatAccountLabel } from '../../utils/format.ts'
import { chipClass } from '../ui.ts'

interface AccountChipsProps {
  accounts: Account[]
  // 선택한 결제수단의 id. 비어 있으면 "선택 안 함"
  selectedId: string
  onSelect: (id: string) => void
}

// 결제수단을 버튼(칩)으로 고른다
function AccountChips({ accounts, selectedId, onSelect }: AccountChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="결제수단">
      {accounts.map((account) => (
        <button
          key={account.id}
          type="button"
          aria-pressed={selectedId === account.id}
          onClick={() => onSelect(account.id)}
          className={chipClass(selectedId === account.id)}
        >
          {formatAccountLabel(account)}
        </button>
      ))}
      <button type="button" aria-pressed={selectedId === ''} onClick={() => onSelect('')} className={chipClass(selectedId === '')}>
        선택 안 함
      </button>
    </div>
  )
}

export default AccountChips
