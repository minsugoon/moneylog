import { useState } from 'react'
import type { Account } from '../../lib/types.ts'
import { formatAccountLabel } from '../../utils/format.ts'
import { readSetting, writeSetting } from '../../utils/storage.ts'
import { inputClass, secondaryButtonClass } from '../ui.ts'
import AccountChips from './AccountChips.tsx'

const ACCOUNT_EXPANDED_KEY = 'moneylog.accountExpanded'

interface AccountPickerProps {
  idPrefix: string
  accounts: Account[]
  selectedId: string
  onSelect: (id: string) => void
}

function AccountPicker({ idPrefix, accounts, selectedId, onSelect }: AccountPickerProps) {
  const [expanded, setExpanded] = useState(() => readSetting(ACCOUNT_EXPANDED_KEY) === '1')
  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    writeSetting(ACCOUNT_EXPANDED_KEY, next ? '1' : '0')
  }

  return (
    <div>
      <div className="flex min-w-0 gap-2">
        <select
          id={`${idPrefix}-account`}
          aria-label="결제수단"
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
          className={`flex-1 min-w-0 ${inputClass}`}
        >
          <option value="">선택 안 함</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>{formatAccountLabel(account)}</option>
          ))}
        </select>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${idPrefix}-account-chips`}
          onClick={toggleExpanded}
          className={`shrink-0 ${secondaryButtonClass}`}
        >
          {expanded ? '🔼 접기' : '🔽 펼치기'}
        </button>
      </div>
      <div id={`${idPrefix}-account-chips`} className={expanded ? 'mt-2' : 'hidden'}>
        {expanded && <AccountChips accounts={accounts} selectedId={selectedId} onSelect={onSelect} />}
      </div>
    </div>
  )
}

export default AccountPicker
