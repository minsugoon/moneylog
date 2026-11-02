import { describe, expect, it } from 'vitest'
import { convertToKrw, formatFxInput, minorToAmount, parseFxMinor, rateFromKrw } from './currency.ts'

describe('외화 입력 정리와 최소 단위 변환', () => {
  it('숫자만 남기고 첫 소수점과 자릿수 제한을 적용한다', () => {
    expect(formatFxInput('12a3', 'USD')).toBe('123')
    expect(formatFxInput('1.2.3', 'USD')).toBe('1.23')
    expect(formatFxInput('1234.567', 'USD')).toBe('1,234.56')
    expect(formatFxInput('85000.5', 'VND')).toBe('85,000')
    expect(formatFxInput('1234.', 'USD')).toBe('1,234.')
    expect(formatFxInput('.5', 'USD')).toBe('0.5')
    expect(formatFxInput('007', 'USD')).toBe('7')
    expect(formatFxInput('', 'USD')).toBe('')
  })

  it('소수점 없는 통화는 소수부를 버린다', () => {
    expect(formatFxInput('12.34', 'JPY')).toBe('12')
    expect(formatFxInput('12.34', 'VND')).toBe('12')
  })

  it('문자열 자릿수로 최소 단위를 정확히 만든다', () => {
    expect(parseFxMinor('9.99', 'USD')).toBe(999)
    expect(parseFxMinor('20,000', 'VND')).toBe(20000)
    expect(parseFxMinor('10', 'USD')).toBe(1000)
    expect(parseFxMinor('1.15', 'USD')).toBe(115)
    expect(parseFxMinor('0.07', 'USD')).toBe(7)
    expect(parseFxMinor('19.99', 'USD')).toBe(1999)
    expect(parseFxMinor('', 'USD')).toBeNull()
    expect(parseFxMinor('abc', 'USD')).toBeNull()
    expect(parseFxMinor('99,999,999,999.01', 'USD')).toBeNull()
  })

  it('외화 금액을 DB 저장용 숫자로 바꾼다', () => {
    expect(minorToAmount(999, 'USD')).toBe(9.99)
    expect(minorToAmount(20000, 'VND')).toBe(20000)
  })
})

describe('원화 환산', () => {
  it('BigInt 기반 환산과 반올림을 적용한다', () => {
    expect(convertToKrw(20000, 'VND', 0.0521)).toEqual({ ok: true, krw: 1042 })
    expect(convertToKrw(85000, 'VND', 0.0521)).toEqual({ ok: true, krw: 4429 })
    expect(convertToKrw(999, 'USD', 1385.2)).toEqual({ ok: true, krw: 13838 })
    expect(convertToKrw(100, 'USD', 0.5)).toEqual({ ok: true, krw: 1 })
    expect(convertToKrw(1000, 'USD', 0.1 + 0.2)).toEqual({ ok: true, krw: 3 })
  })

  it('잘못된 값과 범위를 벗어난 금액을 구분한다', () => {
    expect(convertToKrw(1, 'USD', 0.004)).toEqual({ ok: false, reason: 'too_small' })
    expect(convertToKrw(1, 'USD', 300_000_000_000)).toEqual({ ok: false, reason: 'too_large' })
    expect(convertToKrw(0, 'USD', 1)).toEqual({ ok: false, reason: 'invalid' })
    expect(convertToKrw(1, 'USD', 0)).toEqual({ ok: false, reason: 'invalid' })
    expect(convertToKrw(1, 'USD', Number.POSITIVE_INFINITY)).toEqual({ ok: false, reason: 'invalid' })
  })

  it('청구액 기준 환율로 환산하면 청구액 근처가 된다', () => {
    const rate = rateFromKrw(1050, 20000, 'VND')
    expect(rate).toBe(0.0525)
    const converted = convertToKrw(20000, 'VND', rate ?? 0)
    expect(converted.ok && Math.abs(converted.krw - 1050)).toBeLessThanOrEqual(1)
    expect(rateFromKrw(0, 20000, 'VND')).toBeNull()
  })
})
