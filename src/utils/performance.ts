import type { CardBenefit, CardProgram, Transaction } from '../lib/types.ts'
import { monthDiff } from './format.ts'
import { installmentPayments, netAmount } from './installment.ts'
import { daysLeft as countDaysLeft, periodKeyOf, periodPhase, periodRange } from './performancePeriod.ts'

export type CreditStatus = 'included' | 'flagged' | 'excluded'
export type CreditReason = 'override_include' | 'override_exclude' | 'cancel' | 'interest_free' | 'keyword' | null

export interface Classification {
  status: CreditStatus
  reason: CreditReason
  keyword: string | null
}

// 판정 순서: 확정 포함, 확정 제외, 취소, 무이자, 키워드, 기본 포함. 기본 제외 키워드 사전은 단계 10에서 5번 자리에 끼운다.
export function classifyTransaction(tx: Transaction, program: CardProgram): Classification {
  if (tx.performance_override === 'include') {
    return { status: 'included', reason: 'override_include', keyword: null }
  }
  if (tx.performance_override === 'exclude') {
    return { status: 'excluded', reason: 'override_exclude', keyword: null }
  }
  if (tx.is_cancel) return { status: 'included', reason: 'cancel', keyword: null }
  if (tx.interest_free) {
    const mode = program.exclusion_modes.interest_free
    if (mode === 'exclude') return { status: 'excluded', reason: 'interest_free', keyword: null }
    if (mode === 'flag') return { status: 'flagged', reason: 'interest_free', keyword: null }
  }
  const merchant = tx.merchant.trim().toLocaleLowerCase()
  const keyword = program.exclude_keywords.find((item) =>
    item.trim() !== '' && merchant.includes(item.trim().toLocaleLowerCase()),
  )
  if (keyword !== undefined) return { status: 'excluded', reason: 'keyword', keyword }
  return { status: 'included', reason: null, keyword: null }
}

// 내역이 해당 기간 실적에 더하는 금액을 계산한다.
export function creditsInPeriod(tx: Transaction, program: CardProgram, periodKey: string): number | null {
  const txPeriod = periodKeyOf(tx.used_at, program.period_start_day)
  const amount = netAmount(tx.amount, tx.discount)
  if (tx.is_cancel) {
    if (txPeriod !== periodKey) return null
    return 0 - amount
  }
  if (program.installment_mode === 'full' || tx.installment_months < 2) {
    return txPeriod === periodKey ? amount : null
  }
  const index = monthDiff(txPeriod, periodKey)
  const payments = installmentPayments(amount, tx.installment_months)
  return index >= 0 && index < payments.length ? payments[index] : null
}

export interface ProgramInput {
  program: CardProgram
  benefits: CardBenefit[]
  transactions: Transaction[]
  periodKey: string
  today: string
}

export interface CreditedTransaction {
  tx: Transaction
  amount: number
  status: CreditStatus
  reason: CreditReason
  keyword: string | null
}

export type ProgramStatus = 'achieved' | 'in_progress' | 'warning' | 'missed' | 'upcoming'

export interface BenefitProgress {
  benefit: CardBenefit
  required: number
  achieved: boolean
  remaining: number
}

export interface ProgramResult {
  periodKey: string
  range: { start: string; end: string }
  phase: 'past' | 'current' | 'future'
  total: number
  target: number
  percent: number
  barPercent: number
  remaining: number
  daysLeft: number | null
  dailyNeeded: number | null
  status: ProgramStatus
  included: CreditedTransaction[]
  excluded: CreditedTransaction[]
  flaggedCount: number
  flaggedTotal: number
  benefits: BenefitProgress[]
  earnedTotal: number
  next: { required: number; remaining: number; extra: number } | null
}

// 프로그램의 기간 실적, 진행 상태와 혜택을 계산한다.
export function computeProgramResult(input: ProgramInput): ProgramResult {
  const { program, periodKey, today } = input
  const range = periodRange(periodKey, program.period_start_day)
  const phase = periodPhase(today, range)
  const rows = input.transactions
    .filter((tx) => tx.account_id === program.account_id)
    .flatMap((tx) => {
      const amount = creditsInPeriod(tx, program, periodKey)
      if (amount === null) return []
      return [{ tx, amount, ...classifyTransaction(tx, program) }]
    })
    .sort((a, b) => b.tx.used_at.localeCompare(a.tx.used_at))
  const included = rows.filter((row) => row.status !== 'excluded')
  const excluded = rows.filter((row) => row.status === 'excluded')
  const total = included.reduce((sum, row) => sum + row.amount, 0)
  const target = program.target_amount
  const percent = target > 0 ? Math.max(0, Math.floor(total * 100 / target)) : 0
  const remaining = Math.max(0, target - total)
  const left = phase === 'current' ? countDaysLeft(today, range.end) : null
  const benefits = input.benefits
    .map((benefit) => {
      const required = benefit.required_amount ?? target
      return { benefit, required, achieved: total >= required, remaining: Math.max(0, required - total) }
    })
    .sort((a, b) => a.required - b.required)
  const earnedTotal = benefits
    .filter((benefit) => benefit.achieved)
    .reduce((sum, benefit) => sum + benefit.benefit.benefit_amount, 0)
  const nextBenefit = benefits.find((benefit) => !benefit.achieved)
  let status: ProgramStatus
  if (phase === 'past') status = total >= target ? 'achieved' : 'missed'
  else if (phase === 'future') status = 'upcoming'
  else if (total >= target) status = 'achieved'
  else if (left !== null && left <= 7 && percent < 70) status = 'warning'
  else status = 'in_progress'
  let next: ProgramResult['next'] = null
  if (nextBenefit) {
    const extra = benefits
      .filter((benefit) => benefit.required === nextBenefit.required)
      .reduce((sum, benefit) => sum + benefit.benefit.benefit_amount, 0)
    next = { required: nextBenefit.required, remaining: nextBenefit.remaining, extra }
  }
  return {
    periodKey,
    range,
    phase,
    total,
    target,
    percent,
    barPercent: Math.min(100, percent),
    remaining,
    daysLeft: left,
    dailyNeeded: left === null ? null : remaining > 0 ? Math.ceil(remaining / left) : 0,
    status,
    included,
    excluded,
    flaggedCount: included.filter((row) => row.status === 'flagged').length,
    flaggedTotal: included
      .filter((row) => row.status === 'flagged')
      .reduce((sum, row) => sum + row.amount, 0),
    benefits,
    earnedTotal,
    next,
  }
}

// 활성 프로그램을 정렬하고 각각의 결과를 계산한다.
export function computeAllPrograms(
  programs: CardProgram[],
  benefits: CardBenefit[],
  transactions: Transaction[],
  periodKeyFor: (program: CardProgram) => string,
  today: string,
): (ProgramResult & { program: CardProgram })[] {
  return programs
    .filter((program) => program.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
    .map((program) => ({
      ...computeProgramResult({
        program,
        benefits: benefits.filter((benefit) => benefit.program_id === program.id),
        transactions,
        periodKey: periodKeyFor(program),
        today,
      }),
      program,
    }))
}

// 오늘 날짜가 속한 프로그램 기간 키를 반환한다.
export function currentPeriodKey(program: CardProgram, today: string): string {
  return periodKeyOf(today, program.period_start_day)
}

// 결제명에 연결 키워드가 포함된 혜택을 반환한다.
export function linkedBenefitFor(merchant: string, benefits: CardBenefit[]): CardBenefit[] {
  const value = merchant.toLocaleLowerCase()
  return benefits.filter((benefit) =>
    benefit.linked_keyword !== null && benefit.linked_keyword.trim() !== '' &&
    value.includes(benefit.linked_keyword.trim().toLocaleLowerCase()),
  )
}
