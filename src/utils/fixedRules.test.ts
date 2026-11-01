import { describe, expect, it } from 'vitest'
import type { FixedRule } from '../lib/types.ts'
import { findFixedRule, isValidRuleKeyword, normalizeForMatch } from './fixedRules.ts'

const rule = (merchant_keyword: string, created_at = '2026-01-01T00:00:00Z'): FixedRule => ({
  id: merchant_keyword,
  merchant_keyword,
  fixed_type: '구독',
  created_at,
})

describe('고정지출 규칙 판정', () => {
  it('대소문자와 공백을 무시해 포함 여부를 판정한다', () => {
    expect(findFixedRule('KT 통신요금 10월', [rule('kt')])).toEqual(rule('kt'))
    expect(normalizeForMatch('넷 플릭스')).toBe('넷플릭스')
    expect(findFixedRule('넷플릭스 정기결제', [rule('넷 플릭스')])).toEqual(rule('넷 플릭스'))
  })

  it('맞는 규칙이 없거나 목록이 비어 있으면 null을 돌려준다', () => {
    expect(findFixedRule('샘플 결제', [rule('다른 항목')])).toBeNull()
    expect(findFixedRule('샘플 결제', [])).toBeNull()
  })

  it('가장 긴 키워드를 고르고 길이가 같으면 먼저 만든 규칙을 고른다', () => {
    const older = rule('샘플', '2026-01-01T00:00:00Z')
    const newer = rule('샘플', '2026-02-01T00:00:00Z')
    expect(findFixedRule('샘플 항목 결제', [older, rule('항목'), rule('샘플 항목')])).toEqual(rule('샘플 항목'))
    expect(findFixedRule('샘플 결제', [newer, older])).toEqual(older)
  })

  it('키워드 길이가 유효한지 확인한다', () => {
    expect(isValidRuleKeyword('KT')).toBe(true)
    expect(isValidRuleKeyword('a')).toBe(false)
    expect(isValidRuleKeyword(' ')).toBe(false)
    expect(isValidRuleKeyword('')).toBe(false)
    expect(isValidRuleKeyword('가'.repeat(51))).toBe(false)
  })
})
