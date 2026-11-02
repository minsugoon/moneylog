import { currencyDecimals, formatFxInput, getCurrency } from '../../utils/currency.ts'
import { inputLargeClass } from '../ui.ts'

interface FxAmountInputProps {
  id: string
  code: string
  value: string
  onChange: (text: string) => void
  placeholder?: string
}

function FxAmountInput({ id, code, value, onChange, placeholder }: FxAmountInputProps) {
  const currency = getCurrency(code)

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode={currencyDecimals(code) > 0 ? 'decimal' : 'numeric'}
        autoComplete="off"
        aria-label={`${currency?.name ?? code} 금액`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(formatFxInput(event.target.value, code))}
        className={`${inputLargeClass} pr-16`}
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-gray-600">{code}</span>
    </div>
  )
}

export default FxAmountInput
