import { useId, type ReactNode } from 'react'
import CurrencySlider from './CurrencySlider.tsx'

interface CurrencyToggleProps {
  expanded: boolean
  selected: string
  codes: string[]
  onToggle: () => void
  onSelect: (code: string) => void
  children: ReactNode
}

function CurrencyToggle({ expanded, selected, codes, onToggle, onSelect, children }: CurrencyToggleProps) {
  const id = useId()

  return (
    <section aria-label="통화 변경" className="rounded-lg border border-gray-200 bg-gray-50">
      <button type="button" aria-expanded={expanded} aria-controls={id} onClick={onToggle} className="flex min-h-12 w-full items-center justify-between px-3 text-left">
        <span className="text-sm font-bold text-brand">통화 변경 · 외화로 입력</span>
        <span aria-hidden="true">{expanded ? '🔼' : '🔽'}</span>
      </button>
      {expanded && (
        <div id={id} className="space-y-3 border-t border-gray-200 px-3 pb-3 pt-3">
          <CurrencySlider selected={selected} codes={codes} onSelect={onSelect} />
          <div className="min-h-[13rem]">{children}</div>
        </div>
      )}
    </section>
  )
}

export default CurrencyToggle
