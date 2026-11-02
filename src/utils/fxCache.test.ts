import { describe, expect, it } from 'vitest'
import { parseCachedSnapshot, serializeSnapshot } from './fxCache.ts'
import type { RateSnapshot } from './fxRates.ts'

describe('환율 캐시', () => {
  const snapshot: RateSnapshot = { rates: { USD: 1300, EUR: 1400 }, fetchedAt: '2026-10-31T00:00:00.000Z', sourceUpdatedAt: null }

  it('직렬화한 환율을 다시 읽는다', () => {
    expect(parseCachedSnapshot(serializeSnapshot(snapshot))).toEqual(snapshot)
  })

  it.each([null, '', '{', '{"rates":{"USD":"1300"},"fetchedAt":"2026-10-31","sourceUpdatedAt":null}', '{"rates":{"USD":-1},"fetchedAt":"2026-10-31","sourceUpdatedAt":null}', '{"rates":{"USD":1},"sourceUpdatedAt":null}'])('잘못된 캐시 %s를 버린다', (text) => {
    expect(parseCachedSnapshot(text)).toBeNull()
  })
})
