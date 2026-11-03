import type { CardBenefit, CardProgram } from '../lib/types.ts'
import { formatWon } from './format.ts'
import type { ProgramResult } from './performance.ts'
import { linkedBenefitFor } from './performance.ts'

// 주의 또는 달성이 가까운 이번 기간 실적만 최대 두 개 고른다.
export function pickStripItems(results: (ProgramResult & { program: CardProgram })[]): (ProgramResult & { program: CardProgram })[] {
  return results
    .filter((result) => result.phase === 'current' && (
      result.status === 'warning' ||
      (result.status === 'in_progress' && (result.percent >= 80 || (result.daysLeft !== null && result.daysLeft <= 7)))
    ))
    .sort((a, b) => Number(b.status === 'warning') - Number(a.status === 'warning') || b.percent - a.percent)
    .slice(0, 2)
}

// 실적 진행률과 남은 금액을 한 줄로 보여 준다.
export function stripLine(result: ProgramResult & { program: CardProgram }): string {
  return `${result.program.name} ${result.percent}% · ${formatWon(result.remaining)} 남음${result.daysLeft === null ? '' : ` · ${result.daysLeft}일 남음`}`
}

// 사용 중인 프로그램에서 결제명과 연결된 혜택 금액을 합산한다.
export function fixedDiscountFor(merchant: string, programs: CardProgram[], benefits: CardBenefit[]): number {
  const activeIds = new Set(programs.filter((program) => program.is_active).map((program) => program.id))
  return linkedBenefitFor(merchant, benefits.filter((benefit) => activeIds.has(benefit.program_id)))
    .reduce((sum, benefit) => sum + benefit.benefit_amount, 0)
}
