import { describe, expect, it } from 'vitest'
import { daysLeft, formatPeriodLabel, periodKeyOf, periodPhase, periodRange } from './performancePeriod.ts'

describe('카드 실적 측정 기간', () => {
  it('시작일 경계와 연초 기간 키를 계산한다', () => {
    expect(periodKeyOf('2026-03-14', 15)).toBe('2026-02')
    expect(periodKeyOf('2026-03-15', 15)).toBe('2026-03')
    expect(periodKeyOf('2027-01-10', 15)).toBe('2026-12')
    expect(periodKeyOf('2026-03-01', 1)).toBe('2026-03')
  })

  it('달력 월, 윤년, 연말과 28일 시작 기간을 계산한다', () => {
    expect(periodRange('2026-02', 1)).toEqual({ start: '2026-02-01', end: '2026-02-28' })
    expect(periodRange('2028-02', 1)).toEqual({ start: '2028-02-01', end: '2028-02-29' })
    expect(periodRange('2026-02', 15)).toEqual({ start: '2026-02-15', end: '2026-03-14' })
    expect(periodRange('2026-12', 15)).toEqual({ start: '2026-12-15', end: '2027-01-14' })
    expect(periodRange('2026-01', 28)).toEqual({ start: '2026-01-28', end: '2026-02-27' })
  })

  it('오늘부터 끝 날짜까지 포함해 남은 날짜를 센다', () => {
    expect(daysLeft('2026-03-14', '2026-03-14')).toBe(1)
    expect(daysLeft('2026-03-01', '2026-03-11')).toBe(11)
    expect(daysLeft('2026-03-15', '2026-03-14')).toBe(0)
    expect(daysLeft('2026-03-30', '2026-04-02')).toBe(4)
  })

  it('기간의 과거, 현재, 미래 여부를 판정한다', () => {
    const range = { start: '2026-03-15', end: '2026-04-14' }
    expect(periodPhase('2026-04-15', range)).toBe('past')
    expect(periodPhase('2026-03-14', range)).toBe('future')
    expect(periodPhase('2026-03-15', range)).toBe('current')
  })

  it('기간 연도에 맞춰 표시 문구를 만든다', () => {
    expect(formatPeriodLabel({ start: '2026-02-15', end: '2026-03-14' })).toBe('2월 15일 ~ 3월 14일')
    expect(formatPeriodLabel({ start: '2026-12-15', end: '2027-01-14' })).toBe('2026년 12월 15일 ~ 2027년 1월 14일')
  })
})
