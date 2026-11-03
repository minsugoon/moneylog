import { useLedger } from '../../hooks/useLedger.ts'
import { currentPeriodKey, computeAllPrograms } from '../../utils/performance.ts'
import { statusLabel } from '../../utils/performanceLabels.ts'
import { pickStripItems, stripLine } from '../../utils/performanceLinks.ts'
import { todayString } from '../../utils/format.ts'
import { useNav } from '../layout/navContext.ts'

// 내역 화면 위: 주의·임박한 카드 실적 1~2개 (누르면 보기 → 카드 실적)
function PerformanceStrip() {
  const { cardPrograms, transactions } = useLedger()
  const nav = useNav()
  // 내역을 다 불러오기 전에는 실적이 0원으로 잡혀 "주의"가 잠깐 보일 수 있어 그리지 않는다
  if (cardPrograms.loading || transactions.loading) return null
  const today = todayString()
  const results = pickStripItems(computeAllPrograms(
    cardPrograms.programs,
    cardPrograms.benefits,
    transactions.items,
    (program) => currentPeriodKey(program, today),
    today,
  ))
  if (results.length === 0) return null

  return (
    <button
      type="button"
      className="min-h-11 w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm"
      aria-label="카드 실적 자세히 보기"
      onClick={() => nav.goToView('performance')}
    >
      <span className="flex justify-between">
        <span className="text-sm font-bold text-gray-800"><span aria-hidden="true">💳 </span>카드 실적</span>
        <span className="text-sm font-bold text-brand">자세히 ›</span>
      </span>
      {results.map((result) => {
        const status = statusLabel(result.status)
        return (
          <span key={result.program.id} className="mt-2 flex items-center gap-2 text-sm text-gray-700">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${status.className}`}>{status.text}</span>
            <span>{stripLine(result)}</span>
          </span>
        )
      })}
    </button>
  )
}

export default PerformanceStrip
