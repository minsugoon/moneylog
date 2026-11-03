import type { ProgramResult } from '../../utils/performance.ts'
import { formatWon } from '../../utils/format.ts'
import { nextStepText } from '../../utils/performanceLabels.ts'

interface ProgramBenefitsProps {
  result: ProgramResult
}

// 카드별 혜택 달성 여부와 받을 혜택을 표시한다.
function ProgramBenefits({ result }: ProgramBenefitsProps) {
  if (result.benefits.length === 0) return null
  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
      <ul className="flex flex-col gap-2">
        {result.benefits.map((item) => (
          <li key={item.benefit.id} className="flex justify-between gap-3 text-sm">
            <span className={item.achieved ? 'text-gray-800' : 'text-gray-600'}>{item.achieved ? '✓' : '○'} {item.benefit.name}</span>
            <span className={item.achieved ? 'font-bold text-green-800' : 'text-gray-600'}>{item.achieved ? `-${formatWon(item.benefit.benefit_amount)}` : result.phase === 'past' ? '미달성' : `${formatWon(item.remaining)} 남음`}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm font-bold text-gray-800">받을 혜택 합계 {formatWon(result.earnedTotal)}</p>
      {result.phase === 'current' && result.next && <p className="text-xs text-gray-600">{nextStepText(result.next)}</p>}
    </div>
  )
}

export default ProgramBenefits

