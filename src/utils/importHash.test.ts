import { describe, expect, it } from 'vitest'
import { makeImportHash, makeImportKey, normalizeMerchant } from './importHash.ts'

describe('가져오기 지문', () => {
  const input = { date: '2026-10-14', time: '19:27', merchant: '(주)샘플배달_네', amount: 23500, isCancel: true }

  it('같은 키는 같은 지문을 만든다', () => {
    const key = makeImportKey(input, 'account-a')
    expect(makeImportHash(key)).toBe(makeImportHash(key))
  })

  it('시각이 다르면 지문도 다르다', () => {
    const first = makeImportKey(input, 'account-a')
    const second = makeImportKey({ ...input, time: '19:23' }, 'account-a')
    expect(makeImportHash(first)).not.toBe(makeImportHash(second))
  })

  it('중복 순번을 지문에 표시한다', () => {
    const key = makeImportKey(input, 'account-a')
    expect(makeImportHash(key)).toMatch(/^v1:[0-9a-f]{14}$/)
    expect(makeImportHash(key, 1)).toBe(makeImportHash(key))
    expect(makeImportHash(key, 2)).toBe(`${makeImportHash(key)}#2`)
    expect(makeImportHash(key, 3)).toMatch(/^v1:[0-9a-f]{14}#3$/)
  })

  it('가맹점 이름을 정규화한다', () => {
    expect(normalizeMerchant('Adobe Adobe')).toBe('adobeadobe')
    expect(normalizeMerchant('(주)샘플배달_네')).toBe('주샘플배달네')
  })
})
