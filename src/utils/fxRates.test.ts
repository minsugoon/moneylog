import { describe, expect, it } from 'vitest'
import { checkFxSave, chooseRate, isRateFresh, krwPerUnitFromPerKrw, parseRateResponse, type RateSnapshot } from './fxRates.ts'

const now = new Date('2026-10-31T12:00:00.000Z')
const cached: RateSnapshot = { rates: { USD: 1300 }, fetchedAt: '2026-10-31T11:00:00.000Z', sourceUpdatedAt: null }

describe('환율 응답 해석', () => {
  it('달러 기준 응답에서 요청한 통화별 원화 환율을 만든다', () => {
    expect(parseRateResponse({ result: 'success', time_last_update_unix: 1793448000, rates: { KRW: 1332.76172, VND: 25786.746123, USD: 1 } }, ['VND', 'USD', 'EUR', 'KRW'], now)).toEqual({
      rates: { VND: 0.05168398, USD: 1332.76172, KRW: 1 },
      fetchedAt: now.toISOString(),
      sourceUpdatedAt: new Date(1793448000 * 1000).toISOString(),
    })
    expect(parseRateResponse({ result: 'success', rates: { KRW: 1000 } }, ['EUR'], now)).toBeNull()
  })

  it('잘못된 응답이나 사용할 코드가 없으면 null을 돌려준다', () => {
    expect(parseRateResponse(null, ['USD'], now)).toBeNull()
    expect(parseRateResponse({}, ['USD'], now)).toBeNull()
    expect(parseRateResponse({ result: 'error', rates: { KRW: 1000 } }, ['USD'], now)).toBeNull()
    expect(parseRateResponse({ result: 'success', rates: { USD: 1 } }, ['USD'], now)).toBeNull()
    expect(parseRateResponse({ result: 'success', rates: { KRW: 1000, USD: 0 } }, ['USD'], now)).toBeNull()
  })

  it('원화당 외화를 외화당 원화로 바꾼다', () => {
    expect(krwPerUnitFromPerKrw(0.019)).toBe(52.63157895)
    expect(krwPerUnitFromPerKrw(0)).toBeNull()
  })
})

describe('환율 선택과 저장 판단', () => {
  it('방금 받은 값, 보관 값, 없음 순서로 선택한다', () => {
    const live: RateSnapshot = { rates: { USD: 1400 }, fetchedAt: now.toISOString(), sourceUpdatedAt: null }
    expect(chooseRate('USD', live, cached)).toEqual({ status: 'live', rate: 1400, at: now.toISOString() })
    expect(chooseRate('USD', null, cached)).toEqual({ status: 'stale', rate: 1300, at: cached.fetchedAt })
    expect(chooseRate('EUR', null, cached)).toEqual({ status: 'none', rate: null, at: null })
  })

  it('환율이 없을 때 청구액을 요구한다', () => {
    const none = chooseRate('EUR', null, null)
    expect(checkFxSave(none, null)).toEqual({ canSave: false, message: '환율을 불러오지 못했어요. 카드 청구액으로 직접 입력해 주세요.' })
    expect(checkFxSave(none, 1200)).toEqual({ canSave: true, message: null })
    expect(checkFxSave({ status: 'live', rate: 1, at: now.toISOString() }, null)).toEqual({ canSave: true, message: null })
    expect(checkFxSave({ status: 'stale', rate: 1, at: now.toISOString() }, null)).toEqual({ canSave: true, message: null })
  })

  it('받아 둔 환율이 지정 시간 안에 있는지 판단한다', () => {
    expect(isRateFresh(cached, now, 3_600_000)).toBe(true)
    expect(isRateFresh(cached, now, 3_599_999)).toBe(false)
    expect(isRateFresh(null, now, 3_600_000)).toBe(false)
  })
})
