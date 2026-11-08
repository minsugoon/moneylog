import { secondaryButtonClass } from '../ui.ts'

type Props = { hiddenCount: number; expanded: boolean; onToggle: () => void }

function ExpandListButton({ hiddenCount, expanded, onToggle }: Props) {
  if (hiddenCount === 0) return null
  return (
    <button type="button" aria-expanded={expanded} onClick={onToggle} className={`mt-3 w-full ${secondaryButtonClass}`}>
      {expanded ? <><span aria-hidden="true">🔼</span> 접기</> : <><span aria-hidden="true">🔽</span> 펼치기 ({hiddenCount}개 더)</>}
    </button>
  )
}

export default ExpandListButton
