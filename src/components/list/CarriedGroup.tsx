import { useLedger } from '../../hooks/useLedger.ts'
import type { Transaction } from '../../lib/types.ts'
import { formatAccountLabel, formatWon } from '../../utils/format.ts'
import { sumCharges, type MonthEntry } from '../../utils/summary.ts'
import { cardClass } from '../ui.ts'
import TransactionRow from './TransactionRow.tsx'

interface CarriedGroupProps {
  entries: MonthEntry[]
  onSelect: (tx: Transaction) => void
}

// "월 납부액 기준"에서만 나타난다: 이전 달에 시작해서 이번 달에도 내는 할부
function CarriedGroup({ entries, onSelect }: CarriedGroupProps) {
  const { accounts } = useLedger()

  return (
    <section className={cardClass} aria-label="이전 달에서 이어진 할부">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-bold text-gray-800">이전 달에서 이어진 할부</h3>
        <span className="text-sm font-bold tabular-nums text-gray-600">{formatWon(sumCharges(entries))}</span>
      </div>
      <ul className="mt-2 divide-y divide-gray-100">
        {entries.map((entry) => (
          <TransactionRow
            key={entry.tx.id}
            entry={entry}
            accountLabel={formatAccountLabel(accounts.accounts.find((a) => a.id === entry.tx.account_id))}
            onSelect={() => onSelect(entry.tx)}
          />
        ))}
      </ul>
    </section>
  )
}

export default CarriedGroup
