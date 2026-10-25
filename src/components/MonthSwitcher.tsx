import { addMonths, currentMonthKey, formatMonthLabel } from '../utils/format.ts'
import { secondaryButtonClass } from './ui.ts'

interface MonthSwitcherProps {
  month: string
  onChange: (month: string) => void
}

// 달 이동: 이전 달 / 다음 달 / 이번 달로 돌아가기
function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const thisMonth = currentMonthKey()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="이전 달"
        className={`${secondaryButtonClass} min-w-11 px-3`}
      >
        ‹
      </button>
      <span className="min-w-0 flex-1 text-center text-lg font-bold text-gray-800" aria-live="polite">
        {formatMonthLabel(month)}
      </span>
      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="다음 달"
        className={`${secondaryButtonClass} min-w-11 px-3`}
      >
        ›
      </button>
      {month !== thisMonth && (
        <button type="button" onClick={() => onChange(thisMonth)} className={`${secondaryButtonClass} px-3 text-sm`}>
          이번 달
        </button>
      )}
    </div>
  )
}

export default MonthSwitcher
