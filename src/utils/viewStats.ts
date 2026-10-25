import { FIXED_TYPES, type Account, type AccountKind, type FixedType, type Transaction } from '../lib/types.ts'
import { ACCOUNT_KIND_LABEL, addMonths, currentMonthKey, formatAccountLabel } from './format.ts'
import type { ViewBasis } from './installment.ts'
import { entriesForMonth, sumCharges, type MonthEntry } from './summary.ts'

// "보기" 화면(고정지출 / 기간별 / 결제수단별)에 필요한 집계 함수들

// ---- 고정지출 보기: 종류별 소계 ----

export interface FixedGroup {
  key: string
  label: string
  total: number
  entries: MonthEntry[]
}

// 고정지출로 표시한 내역만 종류별로 묶는다. 종류가 없는 것은 맨 끝에 "종류 미지정".
export function fixedGroups(entries: MonthEntry[]): FixedGroup[] {
  const fixed = entries.filter((entry) => entry.tx.is_fixed)
  const order: (FixedType | null)[] = [...FIXED_TYPES, null]
  return order
    .map((type) => {
      const list = fixed.filter((entry) => entry.tx.fixed_type === type)
      return { key: type ?? 'none', label: type ?? '종류 미지정', total: sumCharges(list), entries: list }
    })
    .filter((group) => group.entries.length > 0)
}

// ---- 기간별 보기: 월별 합계 ----

export type PeriodPreset = 'this' | 'last' | 'three' | 'year'

// 이번 달 / 지난 달 / 최근 3개월 / 올해(1월부터 이번 달까지)
export function presetMonths(preset: PeriodPreset, now: Date = new Date()): string[] {
  const current = currentMonthKey(now)
  switch (preset) {
    case 'this':
      return [current]
    case 'last':
      return [addMonths(current, -1)]
    case 'three':
      return [addMonths(current, -2), addMonths(current, -1), current]
    case 'year': {
      const year = current.slice(0, 4)
      const count = Number(current.slice(5))
      return Array.from({ length: count }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
    }
  }
}

// 시작 달부터 끝 달까지(둘 다 포함). 순서가 거꾸로여도 바로잡고, 너무 길어지지 않게 최대 개월 수에서 멈춘다.
export function monthRange(start: string, end: string, maxMonths = 36): string[] {
  const [from, to] = start <= end ? [start, end] : [end, start]
  const months: string[] = []
  for (let month = from; month <= to && months.length < maxMonths; month = addMonths(month, 1)) {
    months.push(month)
  }
  return months
}

export interface MonthTotal {
  month: string
  total: number
}

export function monthlyTotals(txs: Transaction[], months: string[], basis: ViewBasis): MonthTotal[] {
  return months.map((month) => ({ month, total: sumCharges(entriesForMonth(txs, month, basis)) }))
}

// ---- 결제수단별 보기: 종류별 소계와 비중 ----

export interface AccountItem {
  key: string
  label: string
  total: number
  share: number // 0~1, 전체 합계에서 차지하는 비중
}

export interface AccountGroup {
  key: string
  label: string
  total: number
  share: number
  items: AccountItem[]
}

const KIND_ORDER: AccountKind[] = ['card', 'account', 'cash']

// 카드 / 통장 / 현금 순서로 묶고, 안에서는 많이 쓴 결제수단부터 보여준다.
// 결제수단이 지워졌거나 없는 내역은 "결제수단 없음"으로 모은다.
export function accountGroups(entries: MonthEntry[], accounts: Account[]): AccountGroup[] {
  const grand = sumCharges(entries)
  const share = (value: number) => (grand > 0 ? Math.min(1, Math.max(0, value / grand)) : 0)
  const byId = new Map(accounts.map((account) => [account.id, account]))

  const buckets = new Map<string, { kind: AccountKind | 'none'; label: string; total: number }>()
  for (const entry of entries) {
    const account = entry.tx.account_id ? byId.get(entry.tx.account_id) : undefined
    const key = account?.id ?? 'none'
    const bucket = buckets.get(key) ?? {
      kind: account?.kind ?? 'none',
      label: formatAccountLabel(account),
      total: 0,
    }
    bucket.total += entry.charge
    buckets.set(key, bucket)
  }

  const kinds: (AccountKind | 'none')[] = [...KIND_ORDER, 'none']
  return kinds
    .map((kind) => {
      const items = [...buckets.entries()]
        .filter(([, bucket]) => bucket.kind === kind)
        .map(([key, bucket]) => ({ key, label: bucket.label, total: bucket.total, share: share(bucket.total) }))
        .sort((a, b) => b.total - a.total)
      const total = items.reduce((sum, item) => sum + item.total, 0)
      return {
        key: kind,
        label: kind === 'none' ? '결제수단 없음' : ACCOUNT_KIND_LABEL[kind],
        total,
        share: share(total),
        items,
      }
    })
    .filter((group) => group.items.length > 0)
}
