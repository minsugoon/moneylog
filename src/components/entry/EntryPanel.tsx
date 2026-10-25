import { useState } from 'react'
import { todayString } from '../../utils/format.ts'
import { cardClass } from '../ui.ts'
import DailyNoteCard from './DailyNoteCard.tsx'
import EntryForm from './EntryForm.tsx'

// 입력 폼 + 하루 정리 카드. 입력 화면(모바일·태블릿)과 PC 오른쪽 "빠른 입력" 패널이 똑같이 쓴다.
function EntryPanel() {
  const [date, setDate] = useState(todayString)

  return (
    <div className="flex flex-col gap-4">
      <section className={cardClass} aria-label="지출 입력">
        <EntryForm date={date} onDateChange={setDate} />
      </section>
      <DailyNoteCard date={date} />
    </div>
  )
}

export default EntryPanel
