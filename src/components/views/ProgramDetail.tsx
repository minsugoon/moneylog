import type { ProgramResult } from '../../utils/performance.ts'
import type { Forecast } from '../../utils/performanceForecast.ts'
import { formatDateLabel, formatWon } from '../../utils/format.ts'
import { reasonLabel } from '../../utils/performanceLabels.ts'

interface ProgramDetailProps {
  result: ProgramResult
  forecast?: Forecast | null
}

// 실적에 포함되거나 제외된 결제 내역을 나누어 표시한다.
function ProgramDetail({ result, forecast }: ProgramDetailProps) {
  const groups = [{ title: '실적에 포함', rows: result.included }, { title: '실적에서 제외', rows: result.excluded }]
  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 pt-3">
      {forecast && <section><h4 className="text-sm font-bold">결제 예정 고정지출 ({forecast.pending.length}건)</h4><ul className="divide-y divide-gray-100">{forecast.pending.map((item) => <li key={item.tx.id} className="flex items-start justify-between gap-3 py-2"><span className="min-w-0"><span className="block text-xs text-orange-700">{formatDateLabel(item.expectedDate)} 예정</span><span className="block break-words text-sm text-gray-800">{item.tx.merchant}</span></span><span className="shrink-0 text-sm tabular-nums">{formatWon(item.amount)}</span></li>)}</ul><p className="text-xs text-gray-600">지난 기간에 결제된 고정지출을 같은 날짜로 예상했어요. 실제 결제되면 위 목록으로 옮겨져요.</p></section>}
      {groups.map((group) => (
        <section key={group.title}>
          <h4 className="text-sm font-bold">{group.title} ({group.rows.length}건)</h4>
          {group.rows.length === 0 ? <p className="text-sm text-gray-600">없어요.</p> : (
            <ul className="divide-y divide-gray-100">
              {group.rows.map((row) => {
                const reason = reasonLabel(row)
                return <li key={row.tx.id} className="flex items-start justify-between gap-3 py-2">
                  <span className="min-w-0"><span className="block text-xs text-gray-600">{formatDateLabel(row.tx.used_at)}</span><span className="block break-words text-sm text-gray-800">{row.tx.merchant}</span>{reason && <span className={`block text-xs ${row.status === 'flagged' ? 'text-amber-800' : 'text-gray-600'}`}>{reason}</span>}</span>
                  <span className="shrink-0 text-sm tabular-nums">{formatWon(row.amount)}</span>
                </li>
              })}
            </ul>
          )}
        </section>
      ))}
      <p className="text-xs text-gray-600">입력하지 않은 결제는 실적에 잡히지 않아요.</p>
    </div>
  )
}

export default ProgramDetail
