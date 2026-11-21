import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { placeTooltip, spotlightBox, type Box } from '../../utils/coachLayout.ts'
import type { TourStep } from '../../utils/helpTours.ts'
import { primaryButtonClass, secondaryButtonClass } from '../ui.ts'

interface CoachMarkProps { steps: TourStep[]; onClose: () => void }

// 코치 안내를 단계별로 보여 준다.
function CoachMark({ steps, onClose }: CoachMarkProps) {
  const [filtered] = useState<TourStep[]>(() => typeof document === 'undefined' ? steps : steps.filter((step) => step.target === null || findTarget(step.target) !== null))
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Box | null>(null)
  const [size, setSize] = useState({ width: 280, height: 180 })
  const bubbleRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()
  const step = filtered[index]
  const target = useMemo(() => step?.target && typeof document !== 'undefined' ? findTarget(step.target) : null, [step])

  useEffect(() => {
    if (!filtered.length) onClose()
  }, [filtered.length, onClose])

  useEffect(() => {
    if (!step) return
    if (target) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
    }
    const measure = () => {
      setRect(target ? toBox(target.getBoundingClientRect()) : null)
      if (bubbleRef.current) setSize({ width: bubbleRef.current.offsetWidth, height: bubbleRef.current.offsetHeight })
    }
    const frame = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    nextRef.current?.focus()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [step, target])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(value + 1, filtered.length - 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(value - 1, 0))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [filtered.length, onClose])

  if (!step) return null
  const position = placeTooltip(rect, { width: typeof window === 'undefined' ? 1024 : window.innerWidth, height: typeof window === 'undefined' ? 768 : window.innerHeight }, size)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const content = (
    <div className={`fixed inset-0 z-[60] ${rect ? '' : 'bg-slate-900/60'}`}>
      {rect && <div aria-hidden="true" className={`fixed rounded-xl ring-2 ring-white pointer-events-none ${reduced ? '' : 'transition-all'}`} style={{ ...spotlightBox(rect), boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)' }} />}
      <div ref={bubbleRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={bodyId} className="fixed w-[min(22rem,calc(100vw-32px))] rounded-2xl bg-white p-4 shadow-xl" style={{ top: position.top, left: position.left }}>
        <p className="text-xs text-gray-600">{index + 1}/{filtered.length}</p>
        <h2 id={titleId} className="text-base font-bold text-gray-800">{step.title}</h2>
        <p id={bodyId} className="mt-1 text-sm text-gray-700">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-sm text-gray-600">건너뛰기</button>
          <div className="flex items-center gap-2">
            {index > 0 && <button type="button" onClick={() => setIndex((value) => value - 1)} className={secondaryButtonClass}>이전</button>}
            <button ref={nextRef} type="button" onClick={() => index === filtered.length - 1 ? onClose() : setIndex((value) => value + 1)} className={primaryButtonClass}>{index === filtered.length - 1 ? '시작하기' : '다음'}</button>
          </div>
        </div>
      </div>
    </div>
  )
  return typeof document === 'undefined' ? content : createPortal(content, document.body)
}

// 이름표가 여러 개면 화면에 보이는 첫 대상을 찾는다.
function findTarget(name: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-coach="${name}"]`)).find((element) => {
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }) ?? null
}

// DOM 사각형을 순수 위치 계산 형식으로 바꾼다.
function toBox(rect: DOMRect): Box { return { top: rect.top, left: rect.left, width: rect.width, height: rect.height } }

export default CoachMark
