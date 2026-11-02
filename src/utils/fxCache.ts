import type { RateSnapshot } from './fxRates.ts'

export const FX_CACHE_KEY = 'moneylog.fxRates'

export function serializeSnapshot(snapshot: RateSnapshot): string {
  return JSON.stringify(snapshot)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseCachedSnapshot(text: string | null): RateSnapshot | null {
  if (text === null || text === '') return null
  try {
    const value: unknown = JSON.parse(text)
    if (!isRecord(value) || !isRecord(value.rates)) return null
    if (typeof value.fetchedAt !== 'string' || !Number.isFinite(Date.parse(value.fetchedAt))) return null
    if (value.sourceUpdatedAt !== null && typeof value.sourceUpdatedAt !== 'string') return null
    const rates: Record<string, number> = {}
    for (const [code, rate] of Object.entries(value.rates)) {
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null
      rates[code] = rate
    }
    return { rates, fetchedAt: value.fetchedAt, sourceUpdatedAt: value.sourceUpdatedAt }
  } catch {
    return null
  }
}
