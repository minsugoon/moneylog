import { afterEach, describe, expect, it, vi } from 'vitest'
import { readSetting, writeSetting } from './storage.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('기기 설정 저장', () => {
  it('저장된 값을 읽는다', () => {
    const values = new Map<string, string>([['sample-key', 'sample-value']])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })

    expect(readSetting('sample-key')).toBe('sample-value')
  })

  it('저장된 값이 없으면 null을 돌려준다', () => {
    vi.stubGlobal('localStorage', { getItem: () => null })

    expect(readSetting('sample-key')).toBeNull()
  })

  it('localStorage가 없으면 null을 돌려준다', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(readSetting('sample-key')).toBeNull()
  })

  it('읽기가 막힌 환경에서도 null을 돌려준다', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('저장소 접근 불가')
      },
    })

    expect(readSetting('sample-key')).toBeNull()
  })

  it('저장한 값을 같은 키로 읽는다', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })

    writeSetting('sample-key', 'sample-value')

    expect(readSetting('sample-key')).toBe('sample-value')
  })

  it('저장이 막힌 환경에서도 오류를 던지지 않는다', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('저장소 접근 불가')
      },
    })

    expect(() => writeSetting('sample-key', 'sample-value')).not.toThrow()
  })
})
