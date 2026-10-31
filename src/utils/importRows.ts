import type { Account } from '../lib/types.ts'
import type { TransactionInput } from '../hooks/useTransactions.ts'
import type { AccountHint, ParsedRow } from './parsers/types.ts'
import { classifyImports, type ExistingTransaction } from './importMatch.ts'

export type PreviewStatus = 'new' | 'duplicate' | 'possible' | 'income' | 'failed'

export type PreviewItem = {
  id: string
  row: ParsedRow
  accountId: string
  date: string
  time: string | null
  merchant: string
  amount: number | null
  installment: number
  isCancel: boolean
  interestFree: boolean
  direction: 'expense' | 'income'
  status: PreviewStatus
  hash: string | null
  error: string | null
  selected: boolean
  userToggled: boolean
}

export type ImportRecord = TransactionInput & { import_hash: string | null; source: 'sms' | 'paste' | 'csv' }

export function suggestAccountId(hint: AccountHint | null, accounts: Account[]): string {
  if (!hint) return ''
  const matches = accounts.filter((account) => {
    if (!account.is_active) return false
    if (hint.kind && account.kind !== hint.kind) return false
    if (hint.issuer && !(account.issuer ?? '').includes(hint.issuer)) return false
    if (hint.digits && (!account.last4 || !account.last4.endsWith(hint.digits))) return false
    return true
  })
  return matches.length === 1 ? matches[0].id : ''
}

export function buildPreviewItems(rows: ParsedRow[], accounts: Account[], existing: ExistingTransaction[]): PreviewItem[] {
  return refreshItems(rows.map((row, index) => ({
    id: `row-${index}`,
    row,
    accountId: suggestAccountId(row.accountHint, accounts),
    date: row.date ?? '',
    time: row.time,
    merchant: row.merchant,
    amount: row.amount,
    installment: row.installment,
    isCancel: row.isCancel,
    interestFree: row.interestFree,
    direction: row.direction,
    status: 'new',
    hash: null,
    error: null,
    selected: false,
    userToggled: false,
  })), existing)
}

export function refreshItems(items: PreviewItem[], existing: ExistingTransaction[]): PreviewItem[] {
  const errors = items.map((item) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return '날짜를 확인해 주세요'
    if (!item.merchant.trim()) return '결제명을 입력해 주세요'
    if (item.amount === null || item.amount <= 0) return '금액을 입력해 주세요'
    return null
  })
  const eligible = items.flatMap((item, index) =>
    !errors[index] && item.direction === 'expense' && item.accountId
      ? [{ index, input: { date: item.date, time: item.time, merchant: item.merchant, amount: item.amount as number, isCancel: item.isCancel, accountId: item.accountId } }]
      : [],
  )
  const matches = classifyImports(eligible.map(({ input }) => input), existing)
  const matchByIndex = new Map(eligible.map(({ index }, matchIndex) => [index, matches[matchIndex]]))

  return items.map((item, index) => {
    const error = errors[index]
    const match = matchByIndex.get(index)
    const status: PreviewStatus = error
      ? 'failed'
      : item.direction === 'income'
        ? 'income'
        : match?.status ?? 'new'
    return {
      ...item,
      error,
      status,
      hash: match?.hash ?? null,
      selected: status === 'failed' ? false : item.userToggled ? item.selected : status === 'new',
    }
  })
}

export function applyAccountToAll(items: PreviewItem[], accountId: string, existing: ExistingTransaction[]): PreviewItem[] {
  return refreshItems(items.map((item) => ({ ...item, accountId })), existing)
}

export function toggleItem(items: PreviewItem[], id: string): PreviewItem[] {
  return items.map((item) => item.id !== id || item.status === 'failed'
    ? item
    : { ...item, selected: !item.selected, userToggled: true })
}

export function toImportRecords(items: PreviewItem[], source: ImportRecord['source'] = 'sms'): ImportRecord[] {
  return items.flatMap((item) => {
    if (!item.selected || item.status === 'failed' || item.error || item.amount === null) return []
    return [{
      account_id: item.accountId || null,
      used_at: item.date,
      merchant: item.merchant,
      amount: item.amount,
      discount: 0,
      installment_months: item.installment,
      is_fixed: false,
      fixed_type: null,
      memo: null,
      is_cancel: item.isCancel,
      interest_free: item.interestFree,
      import_hash: item.hash,
      source,
    }]
  })
}

export function summarizeItems(items: PreviewItem[]): { save: number; excluded: number; failed: number } {
  return items.reduce((summary, item) => {
    if (item.status === 'failed') summary.failed += 1
    else if (item.selected) summary.save += 1
    else summary.excluded += 1
    return summary
  }, { save: 0, excluded: 0, failed: 0 })
}
