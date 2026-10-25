import { formatAmountInput, parseAmount } from '../utils/format.ts'
import { inputClass } from './ui.ts'

// 금액 칸이 받을 수 있는 최대값. DB의 정수 한도(약 21억)보다 작게 둔다.
export const MAX_AMOUNT = 2_000_000_000

interface AmountInputProps {
  id: string
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
}

// 숫자 키패드가 뜨고 천 단위 콤마가 자동으로 들어가는 금액 입력칸
function AmountInput({ id, value, onChange, placeholder }: AmountInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatAmountInput(value)}
      placeholder={placeholder}
      onChange={(e) => {
        const parsed = parseAmount(e.target.value)
        onChange(parsed === null ? null : Math.min(parsed, MAX_AMOUNT))
      }}
      className={inputClass}
    />
  )
}

export default AmountInput
