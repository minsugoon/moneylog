import { useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import { addMonths, currentMonthKey, formatMonthLabel, formatWon } from '../../utils/format.ts'
import type { ViewBasis } from '../../utils/installment.ts'
import { monthRange, monthlyTotals, presetMonths, type PeriodPreset } from '../../utils/viewStats.ts'
import MonthSwitcher from '../MonthSwitcher.tsx'
import { cardClass, chipClass } from '../ui.ts'
import BarRow from './BarRow.tsx'

type Choice = PeriodPreset | 'custom'

const PRESETS: { key: Choice; label: string }[] = [
  { key: 'this', label: '이번 달' },
  { key: 'last', label: '지난 달' },
  { key: 'three', label: '최근 3개월' },
  { key: 'year', label: '올해' },
  { key: 'custom', label: '직접 선택' },
]

// 기간별 보기: 기간을 고르면 월별 합계를 막대로 보여준다
function PeriodView({ basis }: { basis: ViewBasis }) {
  const { transactions } = useLedger()
  const [choice, setChoice] = useState<Choice>('three')
  const [customStart, setCustomStart] = useState(() => addMonths(currentMonthKey(), -5))
  const [customEnd, setCustomEnd] = useState(currentMonthKey)

  const months = choice === 'custom' ? monthRange(customStart, customEnd) : presetMonths(choice)
  const totals = monthlyTotals(transactions.items, months, basis)
  const grandTotal = totals.reduce((sum, row) => sum + row.total, 0)
  const max = Math.max(0, ...totals.map((row) => row.total))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="기간">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            aria-pressed={choice === preset.key}
            onClick={() => setChoice(preset.key)}
            className={chipClass(choice === preset.key)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {choice === 'custom' && (
        <section className={`${cardClass} flex flex-col gap-3`} aria-label="직접 선택한 기간">
          <div>
            <p className="mb-1 text-sm font-bold text-gray-600">시작 달</p>
            <MonthSwitcher month={customStart} onChange={setCustomStart} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-gray-600">끝 달</p>
            <MonthSwitcher month={customEnd} onChange={setCustomEnd} />
          </div>
          <p className="text-xs text-gray-500">최대 36개월까지 보여요.</p>
        </section>
      )}

      <section className={cardClass} aria-label="기간 합계">
        <p className="text-sm text-gray-500">
          {months.length === 1
            ? `${formatMonthLabel(months[0])} 합계`
            : `${formatMonthLabel(months[0])} ~ ${formatMonthLabel(months[months.length - 1])} 합계`}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-gray-800">{formatWon(grandTotal)}</p>
        {months.length > 1 && (
          <p className="mt-1 text-sm text-gray-500">월 평균 {formatWon(Math.round(grandTotal / months.length))}</p>
        )}
      </section>

      <section className={cardClass} aria-label="월별 합계">
        <h3 className="text-sm font-bold text-gray-500">월별 합계</h3>
        <ul className="mt-1 divide-y divide-gray-100">
          {totals.map((row) => (
            <BarRow key={row.month} label={formatMonthLabel(row.month)} value={row.total} max={max} valueLabel={formatWon(row.total)} />
          ))}
        </ul>
      </section>
    </div>
  )
}

export default PeriodView
