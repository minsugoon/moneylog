interface BarRowProps {
  label: string
  // 막대 길이 계산용: 이 값이 max 대비 몇 %인지로 그린다
  value: number
  max: number
  valueLabel: string
  sub?: string
}

// 가로 막대 한 줄. 값은 글자로도 항상 보여줘서 색이나 길이만으로 읽지 않아도 된다.
function BarRow({ label, value, max, valueLabel, sub }: BarRowProps) {
  const percent = max > 0 && value > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0

  return (
    <li className="py-2" title={`${label} ${valueLabel}${sub ? ` (${sub})` : ''}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 break-words text-sm text-gray-700">{label}</span>
        <span className="shrink-0 text-sm font-bold tabular-nums text-gray-800">
          {valueLabel}
          {sub && <span className="ml-2 text-xs font-normal text-gray-500">{sub}</span>}
        </span>
      </div>
      {/* 막대: 바닥에서 시작하고 끝만 둥글게. 배경 줄은 아주 옅게 둔다 */}
      <div className="mt-1 h-2 w-full rounded-full bg-gray-100" aria-hidden="true">
        <div className="h-2 rounded-r-full rounded-l-sm bg-brand" style={{ width: `${percent}%` }} />
      </div>
    </li>
  )
}

export default BarRow
