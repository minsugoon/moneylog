import type { ProgramStatus, CreditedTransaction } from './performance.ts'
import type { ProgramResult } from './performance.ts'
import { formatWon } from './format.ts'

// 실적 상태를 색과 문구로 함께 표시한다.
export function statusLabel(status: ProgramStatus): { text: string; className: string } {
  const labels: Record<ProgramStatus, { text: string; className: string }> = {
    achieved: { text: '달성 ✓', className: 'bg-green-50 text-green-800' },
    in_progress: { text: '진행 중', className: 'bg-blue-50 text-blue-800' },
    warning: { text: '⚠ 주의', className: 'bg-amber-100 text-amber-800' },
    missed: { text: '미달성', className: 'bg-gray-100 text-gray-700' },
    upcoming: { text: '시작 전', className: 'bg-gray-100 text-gray-700' },
  }
  return labels[status]
}

// 실적에서 제외되거나 확인이 필요한 이유를 표시한다.
export function reasonLabel(row: CreditedTransaction): string | null {
  if (row.reason === 'override_include') return '직접 포함'
  if (row.reason === 'override_exclude') return '직접 제외'
  if (row.reason === 'cancel') return '취소 차감'
  if (row.reason === 'interest_free') {
    if (row.status === 'flagged') return '무이자 할부 · 제외될 수 있음'
    if (row.status === 'excluded') return '무이자 할부 제외'
  }
  if (row.reason === 'keyword') return `제외 결제명: ${row.keyword ?? ''}`
  return null
}

// 선택한 기간의 위치를 짧은 문구로 표시한다.
export function periodOffsetLabel(offset: number): string {
  if (offset === 0) return '이번 기간'
  if (offset === -1) return '지난 기간'
  return `${Math.abs(offset)}기간 전`
}

// 다음 혜택까지 필요한 금액을 설명한다.
export function nextStepText(next: NonNullable<ProgramResult['next']>): string {
  return `${formatWon(next.required)}까지 ${formatWon(next.remaining)} 남음 · 추가 혜택 ${formatWon(next.extra)}`
}

// 실적 기준이 혜택 적용 시점에 미치는 영향을 안내한다.
export function basisHint(measureBasis: 'previous_month' | 'current_month'): string {
  return measureBasis === 'previous_month'
    ? '이 기간 실적으로 다음 달 혜택이 정해져요'
    : '이 기간 실적으로 이번 달 혜택이 정해져요'
}
