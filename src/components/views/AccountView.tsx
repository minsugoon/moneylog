import { useLedger } from '../../hooks/useLedger.ts'
import { formatMonthLabel, formatWon } from '../../utils/format.ts'
import type { ViewBasis } from '../../utils/installment.ts'
import { entriesForMonth, sumCharges } from '../../utils/summary.ts'
import { accountGroups } from '../../utils/viewStats.ts'
import { cardClass } from '../ui.ts'
import SummaryCard from '../SummaryCard.tsx'
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
      <SummaryCard ariaLabel="결제수단별 합계" label={`${formatMonthLabel(month)} 합계`} amount={formatWon(total)} />

      {groups.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">
          이 달에는 입력한 지출이 없어요.
        </p>
      ) : (
        <section className={cardClass} aria-label="결제수단별">
          <h3 className="text-sm font-bold text-gray-500">결제수단별</h3>
          <ul className="mt-1 divide-y divide-gray-100">
              {[...groups.flatMap((group) => group.items)].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label)).map((item) => (
                <BarRow
                  key={item.key}
                  label={item.label}
                  value={item.total}
                  max={Math.max(0, ...groups.flatMap((group) => group.items.map((i) => i.total)))}
                  valueLabel={formatWon(item.total)}
                  sub={percentLabel(item.share)}
                />
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default AccountView
