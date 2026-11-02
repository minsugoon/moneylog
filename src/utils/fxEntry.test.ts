import { describe, expect, it } from 'vitest'
import { computeFxEntry, buildFxSaveFields, buildFxEditFields } from './fxEntry.ts'
import type { RateChoice } from './fxRates.ts'
import { tx } from '../testing/ledgerFixtures.tsx'

const now = new Date('2026-10-31T12:00:00.000Z')
const at = '2026-10-31T10:00:00.000Z'

function choice(status: RateChoice['status'], rate: number | null, time: string | null = at): RateChoice {
  return { status, rate, at: time }
}

describe('computeFxEntry', () => {
  it('외화 청구액을 바꾸면 확정 환율을 만든다', () => {
    expect(buildFxEditFields(tx({ currency: 'VND', original_amount: 20000, amount: 1042 }), 1100)).toEqual({ krw_confirmed: true, exchange_rate: 0.055 })
    expect(buildFxEditFields(tx({ currency: 'VND', original_amount: 20000, amount: 1042 }), 1042)).toEqual({})
    expect(buildFxEditFields(tx({ currency: 'KRW' }), 1100)).toEqual({})
    expect(buildFxEditFields(tx({ currency: 'VND', original_amount: null }), 1100)).toBeNull()
  })

  it('환율로 계산한 금액과 시각을 만든다', () => {
    const state = computeFxEntry({ code: 'VND', text: '20000', choice: choice('live', 0.0521), manualOpen: false, manualKrw: null }, now)
    expect(state).toMatchObject({ krw: 1042, confirmed: false, rateAt: at, canSave: true })
  })

  it('VND 금액을 반올림해 계산한다', () => {
    expect(computeFxEntry({ code: 'VND', text: '85000', choice: choice('live', 0.0521), manualOpen: false, manualKrw: null }, now).krw).toBe(4429)
  })

  it('소수 외화 금액을 계산한다', () => {
    expect(computeFxEntry({ code: 'USD', text: '9.99', choice: choice('live', 1385.2), manualOpen: false, manualKrw: null }, now).krw).toBe(13838)
  })

  it('1원 미만 환산을 막는다', () => {
    const state = computeFxEntry({ code: 'VND', text: '1', choice: choice('live', 0.0001), manualOpen: false, manualKrw: null }, now)
    expect(state.convertError).toContain('1원보다')
    expect(state.canSave).toBe(false)
  })

  it('청구액 확정 시 환율을 다시 계산한다', () => {
    const state = computeFxEntry({ code: 'VND', text: '20000', choice: choice('none', null, null), manualOpen: true, manualKrw: 1050 }, now)
    expect(state).toMatchObject({ krw: 1050, confirmed: true, rate: 0.0525, rateAt: now.toISOString(), canSave: true })
  })

  it('환율과 청구액이 없으면 안내를 돌려준다', () => {
    const state = computeFxEntry({ code: 'VND', text: '20000', choice: choice('none', null, null), manualOpen: false, manualKrw: null }, now)
    expect(state).toMatchObject({ canSave: false, noRate: true, blockMessage: '환율을 불러오지 못했어요. 카드 청구액으로 직접 입력해 주세요.' })
  })

  it('환율이 없어도 청구액이 있으면 저장할 수 있다', () => {
    const state = computeFxEntry({ code: 'VND', text: '20000', choice: choice('none', null, null), manualOpen: true, manualKrw: 1050 }, now)
    expect(state.canSave).toBe(true)
  })

  it('오래된 환율 안내와 저장 시각을 유지한다', () => {
    const state = computeFxEntry({ code: 'VND', text: '20000', choice: choice('stale', 0.0521), manualOpen: false, manualKrw: null }, now)
    expect(state.rateNote).toContain('마지막으로 받은 환율')
    expect(state.canSave).toBe(true)
    expect(state.rateAt).toBe(at)
  })

  it('금액이 비어 있으면 입력 안내를 돌려준다', () => {
    expect(computeFxEntry({ code: 'VND', text: '', choice: choice('live', 0.0521), manualOpen: false, manualKrw: null }, now)).toMatchObject({ canSave: false, blockMessage: '금액을 입력해 주세요.' })
  })

  it('저장 필드를 만들고 저장할 수 없는 상태는 거른다', () => {
    const state = computeFxEntry({ code: 'USD', text: '9.99', choice: choice('live', 1385.2), manualOpen: false, manualKrw: null }, now)
    expect(buildFxSaveFields('USD', state)).toEqual({ amount: 13838, discount: 0, installment_months: 1, interest_free: false, currency: 'USD', original_amount: 9.99, exchange_rate: 1385.2, rate_at: at, krw_confirmed: false })
    expect(buildFxSaveFields('USD', { ...state, canSave: false })).toBeNull()
  })
})
