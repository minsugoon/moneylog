import { describe, expect, it } from 'vitest'
import { friendlyAiError, kstMonthStart, sumUsage, type ErrorCode } from './aiUsage.ts'

describe('kstMonthStart', () => {
  it('한국 시간 월초 직전에는 이전 달을 반환한다', () => {
    expect(kstMonthStart(new Date('2026-10-31T14:59:59.999Z')).toISOString()).toBe('2026-09-30T15:00:00.000Z')
  })

  it('한국 시간 월초 직후에는 새 달을 반환한다', () => {
    expect(kstMonthStart(new Date('2026-10-31T15:00:00.000Z')).toISOString()).toBe('2026-10-31T15:00:00.000Z')
  })
})

describe('sumUsage', () => {
  it('환불된 행은 사용량에서 제외한다', () => {
    expect(sumUsage([{ image_count: 2, refunded: false }, { image_count: 4, refunded: true }])).toBe(2)
  })
})

describe('friendlyAiError', () => {
  it('알려진 오류 코드를 모두 문구로 바꾼다', () => {
    const codes: ErrorCode[] = ['ai_disabled', 'not_authenticated', 'bad_request', 'ai_not_consented', 'ai_limit_month', 'ai_limit_day', 'ai_rate_limit', 'ai_failed', 'ai_bad_output']
    for (const code of codes) expect(friendlyAiError(code)).not.toBe('')
  })

  it('모르는 코드는 대체 문구를 쓴다', () => {
    expect(friendlyAiError('unknown')).toBe('잠시 뒤에 다시 시도해 주세요.')
    expect(friendlyAiError('unknown', '다시 시도해 주세요.')).toBe('다시 시도해 주세요.')
  })
})
