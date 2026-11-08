import type { CardProgram, FixedExpense, Transaction } from '../lib/types.ts'
import { KRW_DEFAULTS } from '../lib/types.ts'
import { netAmount } from './installment.ts'
import { classifyTransaction, type ProgramResult } from './performance.ts'
import { periodKeyOf } from './performancePeriod.ts'
import { normalizeForMatch } from './fixedExpenses.ts'

// 현재 기간의 등록 고정지출을 결제일과 입력 내역 기준으로 예상한다.

export interface PendingFixed { expense: FixedExpense; amount: number; expectedDate: string }
export interface Forecast {
  pending: PendingFixed[]
  pendingTotal: number
  expectedTotal: number
  expectedRemaining: number
  expectedPercent: number
  expectedBarPercent: number
}

// 범위의 시작 달과 끝 달에서 결제일을 찾아 범위에 맞는 첫 날짜를 반환한다.
export function payDateInRange(payDay: number, range: { start: string; end: string }): string | null {
  const months = [range.start.slice(0, 7), range.end.slice(0, 7)]
  for (const month of [...new Set(months)]) {
    const [year, monthNumber] = month.split('-').map(Number)
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
    const date = `${month}-${String(Math.min(payDay, lastDay)).padStart(2, '0')}`
    if (date >= range.start && date <= range.end) return date
  }
  return null
}

// 현재 기간에 등록 고정지출의 예상 실적을 계산한다.
export function computeForecast(
  result: ProgramResult & { program: CardProgram },
  transactions: Transaction[],
  fixedExpenses: FixedExpense[],
  today: string,
): Forecast | null {
  if (result.phase !== 'current') return null
  const { program } = result
  const expenses = fixedExpenses.filter((expense) => expense.account_id === program.account_id)
  const pending: PendingFixed[] = []
  for (const expense of expenses) {
    const merchantKey = normalizeForMatch(expense.merchant)
    const namedExpenses = expenses.filter((item) => normalizeForMatch(item.merchant) === merchantKey)
    const paid = transactions.some((tx) => {
      if (tx.account_id !== program.account_id || tx.is_cancel || periodKeyOf(tx.used_at, program.period_start_day) !== result.periodKey || normalizeForMatch(tx.merchant) !== merchantKey) return false
      return netAmount(tx.amount, tx.discount) === expense.amount || namedExpenses.length === 1
    })
    if (paid) continue
    const expectedDate = payDateInRange(expense.pay_day, result.range)
    if (!expectedDate || expectedDate < today) continue
    const synthetic = {
      ...KRW_DEFAULTS,
      id: expense.id,
      account_id: expense.account_id,
      used_at: expectedDate,
      merchant: expense.merchant,
      amount: expense.amount,
      discount: 0,
      installment_months: 1,
      is_fixed: false,
      fixed_type: null,
      source: 'manual' as const,
      import_hash: null,
      memo: null,
      is_cancel: false,
      interest_free: false,
      performance_override: null,
      created_at: expense.created_at,
    } satisfies Transaction
    if (classifyTransaction(synthetic, program).status === 'excluded') continue
    pending.push({ expense, amount: expense.amount, expectedDate })
  }
  pending.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate))
  if (!pending.length) return null
  const pendingTotal = pending.reduce((sum, item) => sum + item.amount, 0)
  const expectedTotal = result.total + pendingTotal
  const expectedPercent = program.target_amount > 0 ? Math.max(0, Math.floor(expectedTotal * 100 / program.target_amount)) : 0
  return { pending, pendingTotal, expectedTotal, expectedRemaining: Math.max(0, program.target_amount - expectedTotal), expectedPercent, expectedBarPercent: Math.min(100, expectedPercent) }
}
