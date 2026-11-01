import type { FixedRule, FixedType, Transaction } from '../lib/types.ts'
import { findFixedRule, normalizeForMatch } from './fixedRules.ts'

export interface FixedRuleCandidate {
  merchant: string
  fixedType: FixedType
  count: number
}

interface CandidateGroup extends FixedRuleCandidate {
  usedAt: string
}

export function listFixedRuleCandidates(transactions: Transaction[], rules: FixedRule[]): FixedRuleCandidate[] {
  const groups = new Map<string, CandidateGroup>()

  for (const transaction of transactions) {
    const merchant = transaction.merchant.trim()
    if (!transaction.is_fixed || !transaction.fixed_type || transaction.is_cancel || merchant.length === 0) continue
    if (findFixedRule(merchant, rules)) continue

    const key = normalizeForMatch(merchant)
    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, { merchant, fixedType: transaction.fixed_type, count: 1, usedAt: transaction.used_at })
      continue
    }

    existing.count += 1
    if (transaction.used_at > existing.usedAt) {
      existing.merchant = merchant
      existing.fixedType = transaction.fixed_type
      existing.usedAt = transaction.used_at
    }
  }

  return [...groups.values()]
    .sort((a, b) => b.count - a.count || b.usedAt.localeCompare(a.usedAt) || a.merchant.localeCompare(b.merchant, 'ko'))
    .slice(0, 30)
}
