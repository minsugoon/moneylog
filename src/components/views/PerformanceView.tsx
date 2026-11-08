import { useMemo, useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import { addMonths, todayString } from '../../utils/format.ts'
import { computeAllPrograms, currentPeriodKey } from '../../utils/performance.ts'
import { computeForecast } from '../../utils/performanceForecast.ts'
import { periodOffsetLabel } from '../../utils/performanceLabels.ts'
import { errorBoxClass, secondaryButtonClass } from '../ui.ts'
import ProgramCard from './ProgramCard.tsx'

// 등록한 카드 실적 조건과 기간별 진행 상황을 보여준다.
function PerformanceView() {
  const { accounts, transactions, cardPrograms, fixedExpenses } = useLedger()
  const [offset, setOffset] = useState(0)
  const today = todayString()
  const results = useMemo(
    () => computeAllPrograms(
      cardPrograms.programs,
      cardPrograms.benefits,
      transactions.items,
      (program) => addMonths(currentPeriodKey(program, today), offset),
      today,
    ),
    [cardPrograms.programs, cardPrograms.benefits, transactions.items, offset, today],
  )
  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-gray-600">내 입력 기준 참고용이에요. 카드사 실적과 다를 수 있어요.</p>
      <div className="flex items-center justify-between">
        <button type="button" aria-label="이전 기간" className={secondaryButtonClass} onClick={() => setOffset(offset - 1)}>‹</button>
        <span className="text-base font-bold">{periodOffsetLabel(offset)}</span>
        <button type="button" aria-label="다음 기간" className={secondaryButtonClass} disabled={offset === 0} onClick={() => setOffset(offset + 1)}>›</button>
      </div>
      {cardPrograms.loading ? (
        <p className="py-8 text-center text-sm text-gray-600">카드 실적을 불러오는 중…</p>
      ) : cardPrograms.error ? (
        <div className="flex flex-col items-start gap-2">
          <p className={errorBoxClass} role="alert">
            {cardPrograms.error}
          </p>
          <button type="button" onClick={() => void cardPrograms.reload()} className={secondaryButtonClass}>
            다시 불러오기
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl bg-white p-5 text-center">
          <p className="text-sm font-bold text-gray-800">아직 등록한 실적 조건이 없어요.</p>
          <p className="mt-2 text-sm text-gray-600">
            설정 → 카드 실적에서 카드사 실적 조건을 추가하면 여기에서 달성 정도를 볼 수 있어요.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 pc:grid-cols-2">
          {results.map((result) => (
            <li key={result.program.id}>
              <ProgramCard
                result={result}
                account={accounts.accounts.find((account) => account.id === result.program.account_id)}
                forecast={computeForecast(result, transactions.items, fixedExpenses.items, today)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default PerformanceView
