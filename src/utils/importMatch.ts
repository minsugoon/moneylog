import type { Transaction } from '../lib/types.ts'
import { makeImportHash, makeImportKey, normalizeMerchant, type ImportKeyInput } from './importHash.ts'

export type ExistingTransaction = Pick<Transaction, 'account_id' | 'used_at' | 'merchant' | 'amount' | 'is_cancel' | 'import_hash'>
export type MatchInput = ImportKeyInput & { accountId: string }
export type MatchStatus = 'new' | 'duplicate' | 'possible'
export type MatchResult = { status: MatchStatus; hash: string }

export function isSimilarMerchant(a: string, b: string): boolean {
  const first = normalizeMerchant(a)
  const second = normalizeMerchant(b)
  if (!first || !second) return false
  return first.includes(second) || second.includes(first) || commonPrefixLength(first, second) >= 4
}

function commonPrefixLength(a: string, b: string): number {
  let index = 0
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1
  return index
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86400000
}

function sameCore(input: MatchInput, existing: ExistingTransaction): boolean {
  return existing.account_id === input.accountId &&
    existing.amount === input.amount &&
    existing.is_cancel === input.isCancel
}

export function classifyImports(inputs: MatchInput[], existing: ExistingTransaction[]): MatchResult[] {
  const occurrences = new Map<string, number>()
  const keys = inputs.map((input) => makeImportKey(input, input.accountId))
  const hashes = keys.map((key) => {
    const ordinal = (occurrences.get(key) ?? 0) + 1
    occurrences.set(key, ordinal)
    return makeImportHash(key, ordinal)
  })
  const used = new Set<number>()
  const statuses: MatchStatus[] = inputs.map(() => 'new')

  inputs.forEach((input, inputIndex) => {
    const matchIndex = existing.findIndex((row, rowIndex) =>
      !used.has(rowIndex) && sameCore(input, row) && row.import_hash === hashes[inputIndex])
    if (matchIndex >= 0) {
      used.add(matchIndex)
      statuses[inputIndex] = 'duplicate'
    }
  })

  inputs.forEach((input, inputIndex) => {
    if (statuses[inputIndex] !== 'new') return
    const normalized = normalizeMerchant(input.merchant)
    // 이미 가져온 내역(지문 있음)은 시각이 지문에 들어 있어서, 시각이 있는 새 문자와 지문만 다르면
    // 몇 분 간격의 별개 결제일 수 있다. 그런 경우는 확정 중복이 아니라 아래에서 "중복 가능"으로 둔다.
    const matchIndex = existing.findIndex((row, rowIndex) =>
      !used.has(rowIndex) && sameCore(input, row) && row.used_at === input.date &&
      normalizeMerchant(row.merchant) === normalized && (row.import_hash === null || input.time === null))
    if (matchIndex >= 0) {
      used.add(matchIndex)
      statuses[inputIndex] = 'duplicate'
    }
  })

  inputs.forEach((input, inputIndex) => {
    if (statuses[inputIndex] !== 'new') return
    const matchIndex = existing.findIndex((row, rowIndex) => {
      if (used.has(rowIndex) || !sameCore(input, row)) return false
      return Math.abs(dayNumber(input.date) - dayNumber(row.used_at)) <= 1 &&
        isSimilarMerchant(input.merchant, row.merchant)
    })
    if (matchIndex >= 0) {
      used.add(matchIndex)
      statuses[inputIndex] = 'possible'
    }
  })

  return statuses.map((status, index) => ({ status, hash: hashes[index] }))
}
