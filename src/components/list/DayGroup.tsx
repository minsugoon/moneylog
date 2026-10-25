import { useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import type { Transaction } from '../../lib/types.ts'
import { formatAccountLabel, formatDateLabel, formatWon } from '../../utils/format.ts'
import { sumCharges, type MonthEntry } from '../../utils/summary.ts'
import DailyNoteEditor from '../entry/DailyNoteEditor.tsx'
import { cardClass, secondaryButtonClass } from '../ui.ts'
import TransactionRow from './TransactionRow.tsx'

interface DayGroupProps {
  date: string
  entries: MonthEntry[]
  onSelect: (tx: Transaction) => void
}

// 날짜 하나: 날짜·그날 합계, 하루 정리, 그날의 내역들
function DayGroup({ date, entries, onSelect }: DayGroupProps) {
  const { accounts, notes } = useLedger()
  const [editing, setEditing] = useState(false)
  const note = notes.byDate.get(date)

  function labelOf(accountId: string | null): string {
    return formatAccountLabel(accounts.accounts.find((a) => a.id === accountId))
  }

  return (
    <section className={cardClass} aria-label={formatDateLabel(date)}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-bold text-gray-800">{formatDateLabel(date)}</h3>
        {entries.length > 0 && (
          <span className="text-sm font-bold tabular-nums text-gray-600">{formatWon(sumCharges(entries))}</span>
        )}
      </div>

      {/* 하루 정리: 있으면 글을 보여주고, 눌러서 고친다. 없으면 "+ 하루 정리"로 바로 쓴다. */}
      <div className="mt-2">
        {editing ? (
          <div className="flex flex-col gap-2">
            <DailyNoteEditor date={date} autoFocus />
            <button type="button" onClick={() => setEditing(false)} className={secondaryButtonClass}>
              닫기
            </button>
          </div>
        ) : note ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="하루 정리 고치기"
            className="min-h-11 w-full whitespace-pre-wrap break-words rounded-lg bg-amber-50 px-3 py-2 text-left text-sm text-gray-700 hover:bg-amber-100"
          >
            {note.body}
          </button>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 text-sm font-bold text-brand">
            + 하루 정리
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <ul className="mt-2 divide-y divide-gray-100">
          {entries.map((entry) => (
            <TransactionRow
              key={entry.tx.id}
              entry={entry}
              accountLabel={labelOf(entry.tx.account_id)}
              onSelect={() => onSelect(entry.tx)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default DayGroup
