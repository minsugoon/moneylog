import { useLedger } from '../../hooks/useLedger.ts'
import { formatAccountLabel, formatMonthLabel, formatWon } from '../../utils/format.ts'
import type { ViewBasis } from '../../utils/installment.ts'
import { entriesForMonth, sumCharges } from '../../utils/summary.ts'
import { fixedGroups } from '../../utils/viewStats.ts'
import { cardClass } from '../ui.ts'

interface FixedViewProps {
  month: string
  basis: ViewBasis
}

// 고정지출 보기: 종류별 소계와 총합
function FixedView({ month, basis }: FixedViewProps) {
  const { transactions, accounts } = useLedger()
  const entries = entriesForMonth(transactions.items, month, basis)
  const groups = fixedGroups(entries)
  const total = groups.reduce((sum, group) => sum + group.total, 0)

  return (
    <div className="flex flex-col gap-4">
      <section className={cardClass} aria-label="고정지출 총합">
        <p className="text-sm text-gray-500">{formatMonthLabel(month)} 고정지출 총합</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-gray-800">{formatWon(total)}</p>
        <p className="mt-1 text-sm text-gray-500">
          전체 지출 {formatWon(sumCharges(entries))} 중{' '}
          {sumCharges(entries) > 0 ? `${Math.round((total / sumCharges(entries)) * 100)}%` : '0%'}
        </p>
      </section>

      {groups.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">
          이 달에는 고정지출로 표시한 내역이 없어요. 입력할 때 “고정지출”을 켜면 여기에 모여요.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className={cardClass} aria-label={`${group.label} 소계`}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-bold text-gray-800">{group.label}</h3>
              <span className="text-base font-bold tabular-nums text-gray-800">{formatWon(group.total)}</span>
            </div>
            <ul className="mt-2 divide-y divide-gray-100">
              {group.entries.map((entry) => (
                <li key={entry.tx.id} className="flex items-start justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block break-words text-sm text-gray-800">{entry.tx.merchant}</span>
                    <span className="block text-xs text-gray-500">
                      {formatAccountLabel(accounts.accounts.find((a) => a.id === entry.tx.account_id))}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-gray-700">{formatWon(entry.charge)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

export default FixedView
