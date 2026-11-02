import { describePayments } from '../../utils/installment.ts'
import AmountInput from '../AmountInput.tsx'
import { inputClass, labelClass } from '../ui.ts'

interface InstallmentFieldsProps {
  idPrefix: string
  amount: number | null
  discount: number | null
  onDiscountChange: (value: number | null) => void
  months: number
  onMonthsChange: (next: number) => void
}

function InstallmentFields({ idPrefix, amount, discount, onDiscountChange, months, onMonthsChange }: InstallmentFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-discount`} className={labelClass}>할인 (선택)</label>
        <AmountInput id={`${idPrefix}-discount`} value={discount} onChange={onDiscountChange} placeholder="0" />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-months`} className={labelClass}>할부</label>
        <select id={`${idPrefix}-months`} value={months} onChange={(e) => onMonthsChange(Number(e.target.value))} className={inputClass}>
          {Array.from({ length: 36 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m === 1 ? '일시불' : `${m}개월`}</option>
          ))}
        </select>
        {months > 1 && amount !== null && amount > 0 && (
          <p className="mt-1 text-xs text-gray-600">{describePayments(amount, discount ?? 0, months)}</p>
        )}
      </div>
    </>
  )
}

export default InstallmentFields
