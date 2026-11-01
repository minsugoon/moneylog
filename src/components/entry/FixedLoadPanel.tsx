import { useId, useState } from 'react'
import type { FixedLoadOption } from '../../utils/fixedLoadOptions.ts'
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

  if (options.length === 0) {
    return <p className="text-xs text-gray-500">아직 고정지출로 저장한 내역이 없어요. 고정지출로 저장하면 여기서 불러올 수 있어요.</p>
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={`w-full ${secondaryButtonClass}`}
      >
        고정지출 불러오기 <span className="ml-1 text-xs">{options.length}개</span>
      </button>
      <div id={panelId} className={open ? 'mt-2' : 'hidden'}>
        {open && <>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {visibleOptions.map((option) => (
              <li key={option.key}>
                <button
                  type="button"
                  aria-label={`${option.merchant}, ${formatWon(option.amount)}, ${option.usedAt}`}
                  onClick={() => { onPick(option); setOpen(false) }}
                  className="min-h-14 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left"
                >
                  <span className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-bold">{option.merchant}</span>
                    <span className="shrink-0 text-right tabular-nums">{formatWon(option.amount)}</span>
                  </span>
                  <span className="text-xs text-gray-500">{option.usedAt} · {option.fixedType}</span>
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
    </div>
  )
}

export default FixedLoadPanel
