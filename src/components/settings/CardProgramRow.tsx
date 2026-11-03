import type { Account, CardProgram } from '../../lib/types.ts'
import { formatAccountLabel, formatWon } from '../../utils/format.ts'
import { secondaryButtonClass } from '../ui.ts'

interface CardProgramRowProps {
  program: CardProgram
  account?: Account
  benefitCount: number
  onEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
  busy: boolean
}

// 카드 실적의 요약과 관리 버튼을 보여 줍니다.
function CardProgramRow({ program, account, benefitCount, onEdit, onToggleActive, onDelete, busy }: CardProgramRowProps) {
  return (
    <li className={`p-4 ${program.is_active ? '' : 'opacity-60'}`}>
      <p className="text-xs text-gray-600">{formatAccountLabel(account)}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-base font-bold text-gray-800">{program.name}</p>
        {!program.is_active && <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">사용 중지</span>}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        월 {formatWon(program.target_amount)} · {program.measure_basis === 'previous_month' ? '전월 실적' : '당월 실적'} ·
        {' '}매월 {program.period_start_day}일부터 · 혜택 {benefitCount}개
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} aria-label={`${program.name} 수정`} onClick={onEdit} className={secondaryButtonClass}>수정</button>
        <button type="button" disabled={busy} aria-label={`${program.name} ${program.is_active ? '사용 중지' : '다시 사용'}`} onClick={onToggleActive} className={secondaryButtonClass}>{program.is_active ? '사용 중지' : '다시 사용'}</button>
        <button type="button" disabled={busy} aria-label={`${program.name} 지우기`} onClick={onDelete} className="min-h-11 px-3 text-base text-red-700 disabled:opacity-50">지우기</button>
      </div>
    </li>
  )
}

export default CardProgramRow
