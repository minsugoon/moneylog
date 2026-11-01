import type { ViewBasis } from '../utils/installment.ts'
interface BasisToggleProps {
  basis: ViewBasis
  onChange: (basis: ViewBasis) => void
}

// 할부를 어떻게 셀지 고른다. 일시불 내역은 어느 쪽이든 똑같다.
function BasisToggle({ basis, onChange }: BasisToggleProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-2 border-b border-gray-200" role="tablist" aria-label="보기 기준">
        <button type="button" role="tab" aria-selected={basis === 'usage'} onClick={() => onChange('usage')} className={`min-h-11 border-b-2 text-[15px] hover:bg-gray-50 ${basis === 'usage' ? '-mb-px border-brand font-bold text-brand' : 'border-transparent text-gray-600'}`}>
          사용일 기준
        </button>
        <button type="button" role="tab" aria-selected={basis === 'payment'} onClick={() => onChange('payment')} className={`min-h-11 border-b-2 text-[15px] hover:bg-gray-50 ${basis === 'payment' ? '-mb-px border-brand font-bold text-brand' : 'border-transparent text-gray-600'}`}>
          월 납부액 기준
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-600">
        {basis === 'usage'
          ? '쓴 달에 결제 금액 전체를 계산해요.'
          : '할부는 매달 낼 금액으로 나눠서 계산해요. 이전 달에 시작한 할부도 들어와요.'}
      </p>
    </div>
  )
}

export default BasisToggle
