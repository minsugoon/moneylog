import type { ViewBasis } from '../utils/installment.ts'
import { chipClass } from './ui.ts'

interface BasisToggleProps {
  basis: ViewBasis
  onChange: (basis: ViewBasis) => void
}

// 할부를 어떻게 셀지 고른다. 일시불 내역은 어느 쪽이든 똑같다.
function BasisToggle({ basis, onChange }: BasisToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2" role="group" aria-label="보기 기준">
        <button type="button" aria-pressed={basis === 'usage'} onClick={() => onChange('usage')} className={chipClass(basis === 'usage')}>
          사용일 기준
        </button>
        <button type="button" aria-pressed={basis === 'payment'} onClick={() => onChange('payment')} className={chipClass(basis === 'payment')}>
          월 납부액 기준
        </button>
      </div>
      <p className="text-xs text-gray-500">
        {basis === 'usage'
          ? '쓴 달에 결제 금액 전체를 계산해요.'
          : '할부는 매달 낼 금액으로 나눠서 계산해요. 이전 달에 시작한 할부도 들어와요.'}
      </p>
    </div>
  )
}

export default BasisToggle
