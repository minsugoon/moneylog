import { useLedger } from '../../hooks/useLedger.ts'
import { formatDateLabel, formatWon, todayString } from '../../utils/format.ts'
import { summarizeDay } from '../../utils/summary.ts'
import { cardClass } from '../ui.ts'
import DailyNoteEditor from './DailyNoteEditor.tsx'

// 입력 화면 아래의 "하루 정리" 카드: 그날 지출 건수·합계 + 글쓰기
function DailyNoteCard({ date }: { date: string }) {
  const { transactions } = useLedger()
  const { count, total } = summarizeDay(transactions.items, date)
  const isToday = date === todayString()

  return (
    <section className={cardClass} aria-labelledby="daily-note-title">
      <h3 id="daily-note-title" className="text-base font-bold text-gray-800">
        {isToday ? '오늘 하루 정리' : '하루 정리'} · {formatDateLabel(date)}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {count === 0 ? '이 날 입력한 지출이 아직 없어요.' : `지출 ${count}건 · 합계 ${formatWon(total)}`}
      </p>
      <div className="mt-3">
        {/* 날짜가 바뀌면 그 날짜의 글을 새로 열기 위해 key를 날짜로 둔다 */}
        <DailyNoteEditor key={date} date={date} />
      </div>
    </section>
  )
}

export default DailyNoteCard
