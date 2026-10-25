import type { Transaction } from '../lib/types.ts'
import { toMonthKey } from './format.ts'
import { signedNet } from './installment.ts'

// 선택한 달에 잡히는 내역 한 건과, 그 달에 계산할 금액(취소는 마이너스)
export interface MonthEntry {
  tx: Transaction
  charge: number
}

// 그 달에 사용한 내역을 모은다. 입력된 내역의 순서(최근 순)를 그대로 유지한다.
export function entriesForMonth(txs: Transaction[], monthKey: string): MonthEntry[] {
  return txs.filter((tx) => toMonthKey(tx.used_at) === monthKey).map((tx) => ({ tx, charge: signedNet(tx) }))
}

export function sumCharges(entries: MonthEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.charge, 0)
}

export interface DayGroup {
  date: string
  entries: MonthEntry[]
}

// 날짜별로 묶어 최근 날짜부터 보여준다. 지출이 없어도 하루 정리가 있는 날은 목록에 넣는다.
export function buildDayList(entries: MonthEntry[], noteDates: string[]): DayGroup[] {
  const byDate = new Map<string, MonthEntry[]>()
  for (const entry of entries) {
    const list = byDate.get(entry.tx.used_at) ?? []
    list.push(entry)
    byDate.set(entry.tx.used_at, list)
  }
  for (const date of noteDates) {
    if (!byDate.has(date)) byDate.set(date, [])
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({ date, entries: list }))
}

// 하루 정리 카드에 보여줄 "그날 지출 건수·합계"
export function summarizeDay(txs: Transaction[], date: string): { count: number; total: number } {
  const dayTxs = txs.filter((tx) => tx.used_at === date)
  return { count: dayTxs.length, total: dayTxs.reduce((sum, tx) => sum + signedNet(tx), 0) }
}
