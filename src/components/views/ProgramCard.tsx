import { useState } from 'react'
import type { Account, CardProgram } from '../../lib/types.ts'
import type { ProgramResult } from '../../utils/performance.ts'
import type { Forecast } from '../../utils/performanceForecast.ts'
import { formatAccountLabel, formatWon } from '../../utils/format.ts'
import { formatPeriodLabel } from '../../utils/performancePeriod.ts'
import { basisHint, statusLabel } from '../../utils/performanceLabels.ts'
import ProgramBenefits from './ProgramBenefits.tsx'
import ProgramDetail from './ProgramDetail.tsx'

interface ProgramCardProps {
  result: ProgramResult & { program: CardProgram }
  account: Account | undefined
  forecast?: Forecast | null
}

// 카드 실적 기간과 달성 정도를 카드 한 장으로 보여준다.
function ProgramCard({ result, account, forecast }: ProgramCardProps) {
  const [open, setOpen] = useState(false)
  const { program, range, total, target, phase } = result
  const status = statusLabel(result.status)
  const shortfall = Math.max(0, target - total)
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm" aria-label={program.name}>
      <p className="text-xs text-gray-600">{formatAccountLabel(account)}</p>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-gray-800">{program.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${status.className}`}>
          {status.text}
        </span>
      </div>
      <p className="text-xs text-gray-600">{formatPeriodLabel(range)} · {basisHint(program.measure_basis)}</p>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p>
          <span className="text-2xl font-bold tabular-nums">{formatWon(total)}</span>
          <span className="text-sm text-gray-600"> / {formatWon(target)}</span>
        </p>
        <span className="text-sm font-bold">{result.percent}%</span>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          role="progressbar"
          aria-valuenow={result.barPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="실적 진행률"
          className={`h-2 ${forecast ? 'rounded-l-full' : 'rounded-full'} ${result.status === 'achieved' ? 'bg-green-600' : 'bg-brand'}`}
          style={{ width: `${result.barPercent}%` }}
        />
        {forecast && <div
          aria-hidden="true"
          className="h-2 bg-orange-400"
          style={{ width: `${Math.max(0, forecast.expectedBarPercent - result.barPercent)}%` }}
        />}
      </div>
      {forecast && <>
        <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-gray-600">
          <span>
            <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${result.status === 'achieved' ? 'bg-green-600' : 'bg-brand'}`} />
            {' '}사용 {formatWon(total)}
          </span>
          <span>
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-orange-400" />
            {' '}결제 예정 고정지출 +{formatWon(forecast.pendingTotal)}
          </span>
        </div>
        <p className="text-sm font-bold text-orange-700">
          고정지출 포함 예상 {formatWon(forecast.expectedTotal)} · {forecast.expectedRemaining > 0 ? `예상 잔여 ${formatWon(forecast.expectedRemaining)}` : '고정지출 포함 시 목표 달성 예상'}
        </p>
      </>}
      {phase === 'current' && (result.remaining > 0 ? <p className="mt-2 text-sm text-gray-700">남은 금액 {formatWon(result.remaining)} · {result.daysLeft}일 남음 · 하루 {formatWon(result.dailyNeeded ?? 0)}씩</p> : <p className="mt-2 text-sm font-bold text-green-800">목표를 채웠어요!</p>)}
      {phase === 'past' && <p className="mt-2 text-sm text-gray-700">{result.status === 'achieved' ? '이 기간 목표를 채웠어요.' : `이 기간 목표에 ${formatWon(shortfall)} 모자랐어요.`}</p>}
      {phase === 'future' && <p className="mt-2 text-sm text-gray-700">아직 시작 전이에요.</p>}
      {result.flaggedCount > 0 && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">⚠ 제외될 수 있는 내역 {result.flaggedCount}건 · {formatWon(result.flaggedTotal)} 포함됨</p>}
      <div className="mt-3"><ProgramBenefits result={result} /></div>
      <button type="button" className="mt-3 min-h-11 w-full text-sm font-bold text-brand" aria-expanded={open} aria-controls={`details-${program.id}`} onClick={() => setOpen(!open)}>내역 보기 (포함 {result.included.length}건 · 제외 {result.excluded.length}건) {open ? '🔼' : '🔽'}</button>
      {open && <div id={`details-${program.id}`}><ProgramDetail result={result} forecast={forecast} /></div>}
    </article>
  )
}

export default ProgramCard

