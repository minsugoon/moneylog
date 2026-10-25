import { useLedger } from '../../hooks/useLedger.ts'
import { formatMonthLabel, formatWon } from '../../utils/format.ts'
import type { ViewBasis } from '../../utils/installment.ts'
import { entriesForMonth, sumCharges } from '../../utils/summary.ts'
import { accountGroups } from '../../utils/viewStats.ts'
import { cardClass } from '../ui.ts'
import BarRow from './BarRow.tsx'

interface AccountViewProps {
  month: string
  basis: ViewBasis
}

function percentLabel(share: number): string {
  return `${Math.round(share * 100)}%`
}

// 결제수단별 보기: 카드·통장·현금 종류별 소계와 비중, 그 안의 결제수단별 금액
function AccountView({ month, basis }: AccountViewProps) {
  const { transactions, accounts } = useLedger()
  const entries = entriesForMonth(transactions.items, month, basis)
  const groups = accountGroups(entries, accounts.accounts)
  const total = sumCharges(entries)

  return (
    <div className="flex flex-col gap-4">
      <section className={cardClass} aria-label="결제수단별 합계">
        <p className="text-sm text-gray-500">{formatMonthLabel(month)} 전체 지출</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-gray-800">{formatWon(total)}</p>
      </section>

      {groups.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">
          이 달에는 입력한 지출이 없어요.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className={cardClass} aria-label={`${group.label} 소계`}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-base font-bold text-gray-800">{group.label}</h3>
              <span className="text-base font-bold tabular-nums text-gray-800">
                {formatWon(group.total)}
                <span className="ml-2 text-sm font-normal text-gray-500">{percentLabel(group.share)}</span>
              </span>
            </div>
            <ul className="mt-1 divide-y divide-gray-100">
              {group.items.map((item) => (
                <BarRow
                  key={item.key}
                  label={item.label}
                  value={item.total}
                  max={Math.max(0, ...group.items.map((i) => i.total))}
                  valueLabel={formatWon(item.total)}
                  sub={percentLabel(item.share)}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}

export default AccountView
