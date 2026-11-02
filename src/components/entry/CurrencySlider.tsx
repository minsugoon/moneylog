import { useEffect, useRef } from 'react'
import { getCurrency } from '../../utils/currency.ts'

interface CurrencySliderProps {
  selected: string
  codes: string[]
  onSelect: (code: string) => void
}

function CurrencySlider({ selected, codes, onSelect }: CurrencySliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef(new Map<string, HTMLButtonElement>())
  const currencies = ['KRW', ...codes].map((code) => getCurrency(code)).filter((currency) => currency !== undefined)

  useEffect(() => {
    const container = containerRef.current
    const card = cardRefs.current.get(selected)
    if (!container || !card || typeof container.scrollTo !== 'function') return
    container.scrollTo({ left: card.offsetLeft - container.offsetLeft, behavior: 'smooth' })
  }, [selected])

  const scroll = (direction: number) => {
    const container = containerRef.current
    if (!container || typeof container.scrollBy !== 'function') return
    container.scrollBy({ left: container.clientWidth * 0.8 * direction, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="이전 통화 보기" onClick={() => scroll(-1)} className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-xl text-gray-700 md:flex">‹</button>
        <div className="relative min-w-0 flex-1">
          <div ref={containerRef} role="group" aria-label="입력 통화" className="flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-px-3 pb-1 -mx-3 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain md:mx-0 md:px-0">
            {currencies.map((currency) => (
              <button key={currency.code} ref={(element) => { if (element) cardRefs.current.set(currency.code, element); else cardRefs.current.delete(currency.code) }} type="button" aria-pressed={selected === currency.code} onClick={() => onSelect(currency.code)} className={`min-h-14 w-[84px] shrink-0 snap-center rounded-xl border text-center ${selected === currency.code ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
                <span className="block text-sm font-bold">{currency.label}</span>
                <span className="block text-xs">{currency.code}</span>
              </button>
            ))}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-gray-50 to-transparent" />
        </div>
        <button type="button" aria-label="다음 통화 보기" onClick={() => scroll(1)} className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-xl text-gray-700 md:flex">›</button>
      </div>
      {codes.length === 0 && <p className="mt-2 text-xs text-gray-600">설정 → 통화에서 자주 쓰는 통화를 고를 수 있어요.</p>}
    </div>
  )
}

export default CurrencySlider
