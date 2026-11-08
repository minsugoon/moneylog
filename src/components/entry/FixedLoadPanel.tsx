import { useId, useState } from 'react'
import { payDayLabel, type FixedLoadOption } from '../../utils/fixedExpenses.ts'
import { formatWon } from '../../utils/format.ts'
import { secondaryButtonClass } from '../ui.ts'

interface FixedLoadPanelProps {
  options: FixedLoadOption[]
  onPick: (option: FixedLoadOption) => void
  defaultOpen?: boolean
}

function FixedLoadPanel({ options, onPick, defaultOpen = false }: FixedLoadPanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [showAll, setShowAll] = useState(false)
  const visibleOptions = showAll ? options : options.slice(0, 5)
  const panelId = `${useId()}-fixed-load`

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-1">
      <div className="flex min-h-12 items-center justify-between px-3">
        {options.length > 0 ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-12 flex-1 items-center text-left text-base font-bold text-gray-800"
          >
            📌 고정지출 불러오기 <span className="ml-1 text-xs font-normal">{options.length}개</span>
          </button>
        ) : (
          <span className="text-base font-bold text-gray-800">📌 고정지출 불러오기 <span className="ml-1 text-xs font-normal">0개</span></span>
        )}
        {options.length > 0 && <span aria-hidden="true" className="text-sm text-gray-600">{open ? '▲' : '▼'}</span>}
      </div>
      {options.length === 0 ? (
        <p className="px-3 pb-3 text-xs text-gray-600">아직 등록한 고정지출이 없어요. 고정지출로 저장하거나 설정 탭에서 등록하면 여기서 불러올 수 있어요.</p>
      ) : (
      <div id={panelId} className={open ? 'px-2 pb-2' : 'hidden'}>
        {open && <>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {visibleOptions.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  aria-label={`${option.merchant}, ${formatWon(option.amount)}, ${payDayLabel(option.payDay)}`}
                  onClick={() => { onPick(option); setOpen(false) }}
                  className="min-h-14 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left"
                >
                  <span className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-bold">{option.merchant}</span>
                    <span className="shrink-0 text-right tabular-nums">{formatWon(option.amount)}</span>
                  </span>
                  <span className="text-xs text-gray-600">{payDayLabel(option.payDay)} · {option.fixedType}</span>
                </button>
              </li>
            ))}
          </ul>
          {!showAll && options.length > 5 && (
            <button type="button" onClick={() => setShowAll(true)} className={`mt-2 w-full ${secondaryButtonClass}`}>
              더 보기 ({options.length - 5}개 더)
            </button>
          )}
        </>}
      </div>
      )}
    </div>
  )
}

export default FixedLoadPanel
