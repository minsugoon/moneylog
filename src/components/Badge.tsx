import type { ReactNode } from 'react'

type BadgeKind = 'cancel' | 'free' | 'fixed' | 'dup' | 'maybe' | 'income' | 'fail' | 'perf'

interface BadgeProps {
  kind: BadgeKind
  children: ReactNode
}

const badgeClasses: Record<BadgeKind, string> = {
  cancel: 'px-2 py-0.5 text-xs bg-red-50 text-red-700',
  free: 'px-2 py-0.5 text-xs bg-green-50 text-green-800',
  fixed: 'px-2 py-0.5 text-xs bg-blue-50 text-blue-800',
  dup: 'px-3 py-1 text-sm font-bold bg-red-600 text-white',
  maybe: 'px-3 py-1 text-sm font-bold bg-amber-100 text-amber-800',
  income: 'px-3 py-1 text-sm font-bold bg-gray-100 text-gray-700',
  fail: 'px-3 py-1 text-sm font-bold bg-red-100 text-red-700',
  perf: 'px-2 py-0.5 text-xs bg-amber-100 text-amber-800',
}

function Badge({ kind, children }: BadgeProps) {
  return <span className={`rounded-full whitespace-nowrap ${badgeClasses[kind]}`}>{children}</span>
}

export default Badge
