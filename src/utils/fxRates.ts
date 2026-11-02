export interface RateSnapshot {
  rates: Record<string, number>
  fetchedAt: string
  sourceUpdatedAt: string | null
}

export const RATE_REUSE_MS = 3_600_000
export const RATE_REFRESH_MIN_MS = 600_000
export const RATE_URL = 'https://open.er-api.com/v6/latest/USD'
export const RATE_CREDIT = { text: 'Rates By Exchange Rate API', url: 'https://www.exchangerate-api.com' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function roundRate(value: number): number {
  return Math.round(value * 100_000_000) / 100_000_000
}

export function parseRateResponse(json: unknown, codes: readonly string[], now: Date): RateSnapshot | null {
  if (!isRecord(json) || json.result !== 'success' || !isRecord(json.rates)) return null
  const krw = json.rates.KRW
  if (typeof krw !== 'number' || !Number.isFinite(krw) || krw <= 0) return null
  const rates: Record<string, number> = {}
  for (const code of codes) {
    if (code === 'KRW') {
      rates.KRW = 1
      continue
    }
    const value = json.rates[code]
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue
    rates[code] = roundRate(krw / value)
  }
  if (Object.keys(rates).length === 0) return null
  const updated = json.time_last_update_unix
  const sourceUpdatedAt = typeof updated === 'number' && Number.isFinite(updated)
    ? new Date(updated * 1000).toISOString()
    : null
  return { rates, fetchedAt: now.toISOString(), sourceUpdatedAt }
}

export function krwPerUnitFromPerKrw(perKrw: number): number | null {
  if (!Number.isFinite(perKrw) || perKrw <= 0) return null
  return roundRate(1 / perKrw)
}

export type RateChoice = { status: 'live' | 'stale' | 'none'; rate: number | null; at: string | null }

export function chooseRate(code: string, live: RateSnapshot | null, cached: RateSnapshot | null): RateChoice {
  if (live && Number.isFinite(live.rates[code])) return { status: 'live', rate: live.rates[code], at: live.fetchedAt }
  if (cached && Number.isFinite(cached.rates[code])) return { status: 'stale', rate: cached.rates[code], at: cached.fetchedAt }
  return { status: 'none', rate: null, at: null }
}

export function checkFxSave(choice: RateChoice, manualKrw: number | null): { canSave: boolean; message: string | null } {
  if (choice.status === 'none' && (manualKrw === null || !Number.isFinite(manualKrw) || manualKrw <= 0)) {
    return { canSave: false, message: '환율을 불러오지 못했어요. 카드 청구액으로 직접 입력해 주세요.' }
  }
  return { canSave: true, message: null }
}

export function isRateFresh(snapshot: RateSnapshot | null, now: Date, maxAgeMs: number): boolean {
  if (!snapshot) return false
  const fetched = Date.parse(snapshot.fetchedAt)
  const age = now.getTime() - fetched
  return Number.isFinite(fetched) && age >= 0 && age <= maxAgeMs
}
