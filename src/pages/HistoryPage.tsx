import { useState } from 'react'
import BasisToggle from '../components/BasisToggle.tsx'
import MonthSwitcher from '../components/MonthSwitcher.tsx'
import CarriedGroup from '../components/list/CarriedGroup.tsx'
import DayGroup from '../components/list/DayGroup.tsx'
import TransactionDialog from '../components/list/TransactionDialog.tsx'
import SummaryCard from '../components/SummaryCard.tsx'
import { errorBoxClass, secondaryButtonClass } from '../components/ui.ts'
import { useLedger } from '../hooks/useLedger.ts'
import { useViewBasis } from '../hooks/useViewBasis.ts'
import type { Transaction } from '../lib/types.ts'
import { currentMonthKey, formatMonthLabel, formatWon, toMonthKey } from '../utils/format.ts'
import { buildDayList, entriesForMonth, splitCarried, sumCharges } from '../utils/summary.ts'
import { fxMonthNote, summarizeFx } from '../utils/fxDisplay.ts'

// 내역 화면(홈): 달 이동, 월 합계, 날짜별 목록, 하루 정리
function HistoryPage() {
  const { transactions, notes } = useLedger()
  const [month, setMonth] = useState(currentMonthKey)
  const [basis, setBasis] = useViewBasis()
  const [selected, setSelected] = useState<Transaction | null>(null)

  const entries = entriesForMonth(transactions.items, month, basis)
  const { carried, current } = splitCarried(entries, month)
  const noteDates = notes.items.map((n) => n.note_date).filter((date) => toMonthKey(date) === month)
  const days = buildDayList(current, noteDates)
  const monthFxNote = fxMonthNote(summarizeFx(entries.map((e) => e.tx)))

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">내역</h2>
        <button type="button" onClick={() => setMonth(currentMonthKey())} disabled={month === currentMonthKey()} className={`min-h-11 px-2 text-sm font-bold ${month === currentMonthKey() ? 'text-gray-400' : 'text-brand'}`}>
          이번 달
        </button>
      </div>
      <MonthSwitcher month={month} onChange={setMonth} showThisMonth={false} />
      <BasisToggle basis={basis} onChange={setBasis} />

      <SummaryCard label={`${formatMonthLabel(month)} 합계`} amount={formatWon(sumCharges(entries))} sub={`지출 ${entries.length}건${carried.length > 0 ? ` (이어진 할부 ${carried.length}건 포함)` : ''}`} ariaLabel="월 합계" />
      {monthFxNote !== null && <p className="text-xs text-gray-600" role="note">{monthFxNote}</p>}

      {transactions.loading ? (
        <p className="py-8 text-center text-sm text-gray-600">내역을 불러오고 있어요…</p>
      ) : transactions.error ? (
        <div className="flex flex-col items-start gap-2">
          <p className={errorBoxClass} role="alert">
            {transactions.error}
          </p>
          <button type="button" onClick={() => void transactions.reload()} className={secondaryButtonClass}>
            다시 불러오기
          </button>
        </div>
      ) : (
        <>
          {carried.length > 0 && <CarriedGroup entries={carried} onSelect={setSelected} />}
          {days.length === 0 && carried.length === 0 ? (
            <p className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-600 shadow-sm">
              이 달에는 입력한 지출이 없어요. “입력” 탭에서 첫 지출을 추가해 보세요.
            </p>
          ) : (
            days.length > 0 && <div className="relative pl-6">
              <div aria-hidden="true" className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-gray-300" />
              <div className="flex flex-col gap-4">
                {days.map((day) => <div key={day.date} className="relative">
                  <span aria-hidden="true" className="absolute -left-6 top-5 h-3 w-3 rounded-full border-[3px] border-brand bg-app-bg" />
                  <DayGroup date={day.date} entries={day.entries} onSelect={setSelected} />
                </div>)}
              </div>
            </div>
          )}
        </>
      )}

      {selected && <TransactionDialog key={selected.id} tx={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default HistoryPage
