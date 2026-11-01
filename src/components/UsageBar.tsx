interface UsageBarProps {
  label: string
  used: number
  limit: number
}

function UsageBar({ label, used, limit }: UsageBarProps) {
  const percentage = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold tabular-nums text-gray-800">이번 달 {used}/{limit}장</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100" aria-hidden="true">
        <div className="h-2 rounded-full bg-brand" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default UsageBar
