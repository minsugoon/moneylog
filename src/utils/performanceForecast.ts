import type { CardProgram, Transaction } from '../lib/types.ts'
import { addMonths } from './format.ts'
import { netAmount } from './installment.ts'
import { classifyTransaction, type ProgramResult } from './performance.ts'
import { periodKeyOf } from './performancePeriod.ts'
import { normalizeForMatch } from './fixedRules.ts'

// 현재 기간의 미결제 고정지출만 결제 예정으로 계산한다.
// 지난 기간의 같은 결제명 기록을 기준으로 다음 결제일을 예상한다.
// 실제 실적이나 상태 판정은 변경하지 않는다.

export interface PendingFixed { tx: Transaction; amount: number; expectedDate: string }
export interface Forecast {
  pending: PendingFixed[]
  pendingTotal: number
  expectedTotal: number
  expectedRemaining: number
  expectedPercent: number
  expectedBarPercent: number
}

// 날짜의 월만 하나 늘리고 해당 월의 마지막 날을 넘지 않게 한다.
export function oneMonthLater(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const nextMonth = addMonths(`${year}-${String(month).padStart(2, '0')}`, 1)
  const [nextYear, nextMonthNumber] = nextMonth.split('-').map(Number)
  const lastDay = new Date(Date.UTC(nextYear, nextMonthNumber, 0)).getUTCDate()
  return `${nextMonth}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}

// 현재 기간의 예정 고정지출과 예상 실적을 계산한다.
export function computeForecast(
  result: ProgramResult & { program: CardProgram },
  transactions: Transaction[],
  today: string,
): Forecast | null {
  if (result.phase !== 'current') return null
  const { program } = result
  const currentKey = result.periodKey
  const previousKey = addMonths(currentKey, -1)
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    if (tx.account_id !== program.account_id || !tx.is_fixed || tx.is_cancel || tx.installment_months >= 2) continue
    const key = normalizeForMatch(tx.merchant)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), tx])
  }
  const pending: PendingFixed[] = []
  for (const rows of groups.values()) {
    if (rows.some((tx) => periodKeyOf(tx.used_at, program.period_start_day) === currentKey)) continue
    const previous = rows.filter((tx) => periodKeyOf(tx.used_at, program.period_start_day) === previousKey)
    if (!previous.length) continue
    previous.sort((a, b) => b.used_at.localeCompare(a.used_at) || b.created_at.localeCompare(a.created_at))
    const tx = previous[0]
    if (classifyTransaction(tx, program).status === 'excluded') continue
    const expectedDate = oneMonthLater(tx.used_at)
    if (expectedDate < result.range.start || expectedDate > result.range.end || expectedDate < today) continue
    pending.push({ tx, amount: netAmount(tx.amount, tx.discount), expectedDate })
  }
  pending.sort((a, b) => a.expectedDate.localeCompare(b.expectedDate))
  if (!pending.length) return null
  const pendingTotal = pending.reduce((sum, item) => sum + item.amount, 0)
  const expectedTotal = result.total + pendingTotal
  const expectedPercent = program.target_amount > 0 ? Math.max(0, Math.floor(expectedTotal * 100 / program.target_amount)) : 0
  return {
    pending,
    pendingTotal,
    expectedTotal,
    expectedRemaining: Math.max(0, program.target_amount - expectedTotal),
    expectedPercent,
    expectedBarPercent: Math.min(100, expectedPercent),
  }
}
