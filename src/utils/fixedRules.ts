import type { FixedRule } from '../lib/types.ts'

export function normalizeForMatch(text: string): string {
  return text.trim().replace(/\s/g, '').toLowerCase()
}

export function isValidRuleKeyword(keyword: string): boolean {
  const trimmed = keyword.trim()
  const normalized = normalizeForMatch(trimmed)
  return normalized.length >= 2 && trimmed.length <= 50
}

export function findFixedRule(merchant: string, rules: FixedRule[]): FixedRule | null {
  const normalizedMerchant = normalizeForMatch(merchant)
  return rules
    .filter((rule) => {
      const keyword = normalizeForMatch(rule.merchant_keyword)
      return keyword.length > 0 && normalizedMerchant.includes(keyword)
    })
    .sort((a, b) => {
      const lengthDifference = normalizeForMatch(b.merchant_keyword).length - normalizeForMatch(a.merchant_keyword).length
      if (lengthDifference !== 0) return lengthDifference
      return a.created_at.localeCompare(b.created_at)
    })[0] ?? null
}
