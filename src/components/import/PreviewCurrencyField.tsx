import { FX_CURRENCIES } from '../../utils/currency.ts'
import { inputClass, labelClass } from '../ui.ts'

interface PreviewCurrencyFieldProps {
  id: string
  code: string
  onChange: (code: string) => void
}

// 미리보기에서 통화를 고른다.
function PreviewCurrencyField({ id, code, onChange }: PreviewCurrencyFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        통화
      </label>
      <select
        id={id}
        value={code}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        <option value="KRW">원 · KRW</option>
        {FX_CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.label} · {currency.code}
          </option>
        ))}
        {!FX_CURRENCIES.some((currency) => currency.code === code) && code !== 'KRW' && (
          <option value={code}>
            {code}
          </option>
        )}
      </select>
    </div>
  )
}

export default PreviewCurrencyField
