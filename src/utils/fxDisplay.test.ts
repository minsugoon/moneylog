import { describe, expect, it } from 'vitest'
import { dayTotalAfterSave, formatApprox, formatFxAmount, formatRateLabel, formatRateTime, fxMonthNote, isEstimated, noRateNote, staleRateNote, summarizeFx } from './fxDisplay.ts'

describe('외화 표시 글자', () => {
  it('최소 단위 금액을 통화별 자릿수로 표시한다', () => {
    expect(formatFxAmount(85000, 'VND')).toBe('85,000')
    expect(formatFxAmount(999, 'USD')).toBe('9.99')
    expect(formatFxAmount(1000, 'USD')).toBe('10.00')
  })

  it('환율 단위와 시각을 표시한다', () => {
    expect(formatRateLabel('VND', 0.0517)).toBe('1동 = 0.0517원')
    expect(formatRateLabel('USD', 1332.76)).toBe('1달러 = 1,332.8원')
    expect(formatRateLabel('JPY', 8.46)).toBe('1엔 = 8.46원')
    expect(formatRateTime('2026-10-08T14:02:00')).toBe('10/08 14:02')
    expect(formatRateTime('오류')).toBe('')
    expect(formatApprox(1042)).toBe('≈ 1,042원')
  })

  it('외화 추정 여부와 하루 합계를 계산한다', () => {
    expect(isEstimated({ currency: 'USD', krw_confirmed: false })).toBe(true)
    expect(isEstimated({ currency: 'KRW', krw_confirmed: false })).toBe(false)
    expect(dayTotalAfterSave(35340, 1042, false)).toBe(36382)
    expect(dayTotalAfterSave(35340, 1042, true)).toBe(34298)
  })

  it('월 외화 요약과 안내 문구를 만든다', () => {
    const summary = summarizeFx([
      { currency: 'USD', krw_confirmed: false },
      { currency: 'VND', krw_confirmed: true },
      { currency: 'KRW', krw_confirmed: true },
      { currency: 'EUR', krw_confirmed: false },
    ])
    expect(summary).toEqual({ total: 3, estimated: 2 })
    expect(fxMonthNote({ total: 0, estimated: 0 })).toBeNull()
    expect(fxMonthNote({ total: 4, estimated: 3 })).toBe('외화 결제 4건 포함 · 3건은 환율로 계산한 추정 금액(≈)이에요')
    expect(fxMonthNote({ total: 2, estimated: 0 })).toBe('외화 결제 2건 포함 · 모두 청구액으로 확정했어요')
    expect(staleRateNote('2026-10-08T14:02:00')).toBe('환율 서버 오류 · 마지막으로 받은 환율로 계산했어요 (10/08 14:02 기준)')
    expect(noRateNote).toBe('환율을 불러오지 못했어요. 카드 청구액으로 직접 입력해 주세요.')
  })
})
