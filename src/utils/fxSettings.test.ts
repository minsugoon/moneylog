import { describe, expect, it } from 'vitest'
import { DEFAULT_FX_CODES } from './currency.ts'
import { parseFxCurrencySetting, serializeFxCurrencySetting } from './fxSettings.ts'

describe('자주 쓰는 통화 설정', () => {
  it('저장된 값이 없으면 기본 통화를 돌려준다', () => {
    expect(parseFxCurrencySetting(null)).toEqual(DEFAULT_FX_CODES)
  })

  it('빈 값은 모든 통화를 끈 상태로 읽는다', () => {
    expect(parseFxCurrencySetting('')).toEqual([])
  })

  it('대문자 통화만 중복 없이 통화 순서대로 정리한다', () => {
    expect(parseFxCurrencySetting('THB,usd,BOGUS,USD,VND, USD')).toEqual(['VND', 'USD', 'THB'])
  })

  it('직렬화한 값은 다시 같은 통화 목록으로 읽힌다', () => {
    const codes = ['THB', 'USD', 'VND']
    expect(parseFxCurrencySetting(serializeFxCurrencySetting(codes))).toEqual(['VND', 'USD', 'THB'])
  })
})
