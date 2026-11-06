import type { FixedType, Transaction } from '../lib/types.ts'
import { normalizeForMatch } from './fixedRules.ts'

export interface FixedLoadOption {
  key: string
  merchant: string
  amount: number
  discount: number
  accountId: string | null
  fixedType: FixedType
  usedAt: string
  count: number
}

interface FixedLoadGroup extends FixedLoadOption {
  createdAt: string
}

// 고정지출로 저장한 내역을 결제명·금액별로 묶어 최근 순으로 돌려준다. limit을 주지 않으면 모두 돌려준다.
export function listFixedLoadOptions(transactions: Transaction[], limit?: number): FixedLoadOption[] {
  if (limit !== undefined && limit < 1) return []

  const groups = new Map<string, FixedLoadGroup>()

  for (const transaction of transactions) {
    const merchant = transaction.merchant.trim()
    if (!transaction.is_fixed || !transaction.fixed_type || transaction.is_cancel || merchant.length === 0) continue

    const normalizedMerchant = normalizeForMatch(merchant)
    const key = `${normalizedMerchant}:${transaction.amount}`
    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, {
        key,
        merchant,
        amount: transaction.amount,
        discount: transaction.discount,
        accountId: transaction.account_id,
        fixedType: transaction.fixed_type,
        usedAt: transaction.used_at,
        count: 1,
        createdAt: transaction.created_at,
      })
      continue
    }

    existing.count += 1
    if (transaction.used_at > existing.usedAt ||
      (transaction.used_at === existing.usedAt && transaction.created_at > existing.createdAt)) {
      existing.merchant = merchant
      existing.discount = transaction.discount
      existing.accountId = transaction.account_id
      existing.fixedType = transaction.fixed_type
      existing.usedAt = transaction.used_at
      existing.createdAt = transaction.created_at
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.usedAt.localeCompare(a.usedAt) || b.count - a.count ||
      a.merchant.localeCompare(b.merchant, 'ko') || a.amount - b.amount)
    .slice(0, limit ?? groups.size)
    .map(({ createdAt: _createdAt, ...option }) => option)
}
