import { useId, useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import { formatAccountLabel, formatWon } from '../../utils/format.ts'
import { monthlyFixedTotal, normalizeForMatch, payDayLabel, sortFixedExpenses } from '../../utils/fixedExpenses.ts'

interface RegisteredFixedPanelProps {
  month: string
}

// 등록한 고정지출과 해당 달의 입력 여부를 접이식으로 보여준다.
function RegisteredFixedPanel({ month }: RegisteredFixedPanelProps) {
  const { fixedExpenses, transactions, accounts } = useLedger()
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const items = sortFixedExpenses(fixedExpenses.items)
  if (items.length === 0) return null
  return (
    <section className="rounded-2xl bg-white shadow-sm">
      <button type="button" className="flex min-h-12 w-full items-center justify-between px-4 text-left" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded(!expanded)}>
        <span className="font-bold">등록한 고정지출 ({items.length}개 · 매달 {formatWon(monthlyFixedTotal(items))})</span>
        <span aria-hidden="true">{expanded ? '🔼' : '🔽'}</span>
      </button>
      {expanded && (
        <div id={panelId} className="px-4 pb-4">
          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const entered = transactions.items.some((tx) => tx.account_id === item.account_id && !tx.is_cancel && tx.used_at.slice(0, 7) === month && normalizeForMatch(tx.merchant) === normalizeForMatch(item.merchant))
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block break-words text-sm text-gray-800">{item.merchant}</span>
                    <span className="block text-xs text-gray-600">{formatAccountLabel(accounts.accounts.find((account) => account.id === item.account_id))} · {payDayLabel(item.pay_day)} · {item.fixed_type}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm tabular-nums">{formatWon(item.amount)}</span>
                    <span className={`block text-xs ${entered ? 'text-green-800' : 'text-gray-600'}`}>{entered ? '입력됨' : '아직 없음'}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-gray-600">고치거나 빼려면 설정 → 고정지출에서 할 수 있어요.</p>
        </div>
      )}
    </section>
  )
}

export default RegisteredFixedPanel
