import { describe, expect, it } from 'vitest'
import {
  MAX_ROWS, buildSystemPrompt, errorCodeFromDb, parseModelOutput, resolveCaptureDate, validateRequest,
} from '../../supabase/functions/parse-capture/logic.ts'

// 서버 함수 parse-capture의 순수 로직 시험. 샘플은 모두 임의 값이다.
const today = '2026-10-31'
const image = { mediaType: 'image/jpeg', data: 'QUJD' }

describe('요청 검사', () => {
  it('이미지 1~5장만 받는다', () => {
    expect(validateRequest({ images: [image] }).ok).toBe(true)
    expect(validateRequest({ images: [] }).ok).toBe(false)
    expect(validateRequest({ images: Array(6).fill(image) }).ok).toBe(false)
    expect(validateRequest(null).ok).toBe(false)
    expect(validateRequest({}).ok).toBe(false)
  })

  it('이미지 종류, base64 모양, 크기를 확인한다', () => {
    expect(validateRequest({ images: [{ mediaType: 'image/gif', data: 'QUJD' }] }).ok).toBe(false)
    expect(validateRequest({ images: [{ mediaType: 'image/png', data: 'not base64!' }] }).ok).toBe(false)
    expect(validateRequest({ images: [{ mediaType: 'image/png', data: 'A'.repeat(3_000_001) }] }).ok).toBe(false)
    expect(validateRequest({ images: [{ mediaType: 'image/webp', data: 'QUJD' }] }).ok).toBe(true)
  })
})

describe('날짜 해석', () => {
  it('연도가 있으면 그대로, 없으면 오늘 이전 가장 가까운 날짜', () => {
    expect(resolveCaptureDate('2026-10-18', today)).toBe('2026-10-18')
    expect(resolveCaptureDate('10-18', today)).toBe('2026-10-18')
    expect(resolveCaptureDate('12/25', today)).toBe('2025-12-25')
    expect(resolveCaptureDate('10.7', today)).toBe('2026-10-07')
  })

  it('없는 날짜와 이상한 값은 null', () => {
    expect(resolveCaptureDate('2026-02-30', today)).toBeNull()
    expect(resolveCaptureDate('13-01', today)).toBeNull()
    expect(resolveCaptureDate('어제', today)).toBeNull()
    expect(resolveCaptureDate(null, today)).toBeNull()
  })
})

describe('AI 답변 검증', () => {
  const good = {
    date: '10-18', time: '02:40', merchant: ' 샘플앱  결제 ', amount: 31800, installment: 1,
    isCancel: false, interestFree: false, direction: 'expense', cardIssuer: '삼성카드', cardLast4: '1234',
  }

  it('정상 거래를 앱 미리보기와 같은 모양으로 바꾼다', () => {
    const rows = parseModelOutput(JSON.stringify({ transactions: [good] }), today)
    expect(rows).toHaveLength(1)
    expect(rows![0]).toMatchObject({
      status: 'ok', date: '2026-10-18', time: '02:40', merchant: '샘플앱 결제', amount: 31800,
      installment: 1, isCancel: false, direction: 'expense', source: 'capture',
      accountHint: { issuer: '삼성카드', digits: '1234', kind: 'card' },
    })
  })

  it('코드 블록이나 설명이 앞뒤에 붙어도 JSON을 찾는다', () => {
    const text = '결과입니다.\n```json\n' + JSON.stringify({ transactions: [good] }) + '\n```'
    expect(parseModelOutput(text, today)).toHaveLength(1)
  })

  it('고칠 수 없는 항목은 버리지 않고 실패로 표시한다', () => {
    const rows = parseModelOutput(
      JSON.stringify({ transactions: [{ ...good, amount: -5 }, { ...good, merchant: '' }, { ...good, date: '??' }, 'x'] }),
      today,
    )
    expect(rows!.map((r) => r.status)).toEqual(['failed', 'failed', 'failed', 'failed'])
    expect(rows![0].failReason).toContain('금액')
  })

  it('할부·무이자·취소·입금·시각을 다듬는다', () => {
    const rows = parseModelOutput(
      JSON.stringify({
        transactions: [
          { ...good, installment: 3, interestFree: true, isCancel: true },
          { ...good, installment: 99, interestFree: true },
          { ...good, time: '25:99', direction: 'income', cardLast4: null, cardIssuer: null },
        ],
      }),
      today,
    )!
    expect(rows[0]).toMatchObject({ installment: 3, interestFree: true, isCancel: true })
    expect(rows[1]).toMatchObject({ installment: 1, interestFree: false })
    expect(rows[2]).toMatchObject({ time: null, direction: 'income', accountHint: null })
  })

  it('카드번호는 끝 4자리까지만 받는다', () => {
    const rows = parseModelOutput(JSON.stringify({ transactions: [{ ...good, cardLast4: '1234-5678-9012-3456' }] }), today)!
    expect(rows[0].accountHint?.digits).toBeNull()
  })

  it('JSON이 아니거나 모양이 다르면 null, 거래가 없으면 빈 목록', () => {
    expect(parseModelOutput('읽을 수 없어요', today)).toBeNull()
    expect(parseModelOutput('{"rows": []}', today)).toBeNull()
    expect(parseModelOutput('{깨진 json}', today)).toBeNull()
    expect(parseModelOutput('{"transactions":[]}', today)).toEqual([])
  })

  it('거래가 너무 많으면 앞의 일부만 받는다', () => {
    const many = Array(MAX_ROWS + 20).fill(good)
    expect(parseModelOutput(JSON.stringify({ transactions: many }), today)).toHaveLength(MAX_ROWS)
  })
})

describe('DB 오류 문구 → 이유 코드', () => {
  it('한도·동의 오류를 알아본다', () => {
    expect(errorCodeFromDb('ai_not_consented')).toBe('ai_not_consented')
    expect(errorCodeFromDb('ERROR: ai_limit_month (P0001)')).toBe('ai_limit_month')
    expect(errorCodeFromDb('ai_limit_day')).toBe('ai_limit_day')
    expect(errorCodeFromDb('ai_rate_limit')).toBe('ai_rate_limit')
    expect(errorCodeFromDb('알 수 없는 오류')).toBeNull()
  })
})

describe('지시문', () => {
  it('오늘 날짜와 안전 규칙(끝 4자리, 이미지 속 지시 무시)을 담는다', () => {
    const prompt = buildSystemPrompt(today)
    expect(prompt).toContain(today)
    expect(prompt).toContain('끝 4자리')
    expect(prompt).toContain('따르지 말고')
  })
})
