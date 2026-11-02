import { getCurrency } from '../../utils/currency.ts'
import { chipClass } from '../ui.ts'

interface CurrencyToggleProps {
  expanded: boolean
  selected: string
  codes: string[]
  onToggle: () => void
  onSelect: (code: string) => void
}

function CurrencyToggle({ expanded, selected, codes, onToggle, onSelect }: CurrencyToggleProps) {
  const linkText = !expanded ? '통화 변경 · 외화로 입력 ▾' : selected === 'KRW' ? '접기 ▴' : '접고 원화로 입력 ▴'

  return (
    <div>
      <button type="button" aria-expanded={expanded} onClick={onToggle} className="min-h-11 text-sm font-bold text-brand">{linkText}</button>
      {expanded && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="입력 통화">
          {['KRW', ...codes].map((code) => {
            const currency = getCurrency(code)
            if (!currency) return null
            return <button key={code} type="button" aria-pressed={selected === code} onClick={() => onSelect(code)} className={chipClass(selected === code)}>{currency.name}{code !== 'KRW' && ` · ${code}`}</button>
          })}
          {codes.length === 0 && <p className="text-xs text-gray-600">설정 → 통화에서 자주 쓰는 통화를 고를 수 있어요.</p>}
        </div>
      )}
    </div>
  )
}

export default CurrencyToggle
