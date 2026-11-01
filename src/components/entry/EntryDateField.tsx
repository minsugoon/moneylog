import { shiftDate, todayString } from '../../utils/format.ts'
import { chipClass, inputClass, labelClass } from '../ui.ts'

interface EntryDateFieldProps {
  idPrefix: string
  date: string
  onDateChange: (date: string) => void
}

function EntryDateField({ idPrefix, date, onDateChange }: EntryDateFieldProps) {
  const today = todayString()
  const yesterday = shiftDate(today, -1)

  return (
    <div>
      <label htmlFor={`${idPrefix}-date`} className={labelClass}>
        사용일
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={`${idPrefix}-date`}
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={`${inputClass} w-auto min-w-0 flex-1`}
        />
        <button type="button" onClick={() => onDateChange(today)} className={chipClass(date === today)}>
          오늘
        </button>
        <button type="button" onClick={() => onDateChange(yesterday)} className={chipClass(date === yesterday)}>
          어제
        </button>
      </div>
    </div>
  )
}

export default EntryDateField
