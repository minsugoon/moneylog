import { describe, expect, it } from 'vitest'
import {
  addMonths,
  formatAccountLabel,
  formatAmountInput,
  formatDateLabel,
  formatMonthLabel,
  formatWon,
  monthDiff,
  parseAmount,
  shiftDate,
  todayString,
} from './format.ts'

// 샘플은 모두 임의로 만든 값이다 (실제 카드·계좌 정보 아님)
describe('formatAccountLabel (결제수단 표시 형식)', () => {
  it('통장: 은행 · 별칭 (끝 4자리)', () => {
    expect(formatAccountLabel({ kind: 'account', issuer: '카카오뱅크', name: '월급통장', last4: '1234' })).toBe(
      '카카오뱅크 · 월급통장 (1234)',
    )
  })

  it('카드: 카드사 · 별칭 (끝 4자리)', () => {
    expect(formatAccountLabel({ kind: 'card', issuer: '신한카드', name: '생활카드', last4: '5678' })).toBe(
      '신한카드 · 생활카드 (5678)',
    )
  })

  it('끝 4자리가 없으면 괄호를 생략한다', () => {
    expect(formatAccountLabel({ kind: 'card', issuer: '신한카드', name: '생활카드', last4: null })).toBe(
      '신한카드 · 생활카드',
    )
  })

  it('은행·카드사를 안 고르면 별칭만 보여준다', () => {
    expect(formatAccountLabel({ kind: 'account', issuer: null, name: '비상금', last4: '0001' })).toBe('비상금 (0001)')
  })

  it('현금은 "현금"', () => {
    expect(formatAccountLabel({ kind: 'cash', issuer: null, name: '현금', last4: null })).toBe('현금')
  })

  it('이름을 바꾼 현금은 "현금 · 이름"', () => {
    expect(formatAccountLabel({ kind: 'cash', issuer: null, name: '지갑', last4: null })).toBe('현금 · 지갑')
  })

  it('결제수단이 없으면 안내 문구', () => {
    expect(formatAccountLabel(null)).toBe('결제수단 없음')
  })
})

describe('금액 표시·입력', () => {
  it('천 단위 콤마와 원', () => {
    expect(formatWon(12000)).toBe('12,000원')
    expect(formatWon(-3000)).toBe('-3,000원')
    expect(formatWon(0)).toBe('0원')
  })

  it('숫자가 아닌 글자는 빼고 정수로 바꾼다', () => {
    expect(parseAmount('12,000원')).toBe(12000)
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('')).toBeNull()
  })

  it('입력창에는 콤마를 넣어 보여준다', () => {
    expect(formatAmountInput(1234567)).toBe('1,234,567')
    expect(formatAmountInput(null)).toBe('')
  })
})

describe('날짜 계산', () => {
  it('오늘 날짜는 이 기기 기준 YYYY-MM-DD', () => {
    expect(todayString(new Date(2026, 9, 5))).toBe('2026-10-05')
  })

  it('날짜를 며칠 옮겨도 달·해가 맞게 넘어간다', () => {
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDate('2026-10-05', 0)).toBe('2026-10-05')
  })

  it('달 더하기·빼기는 해를 넘겨도 맞다', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-10', 0)).toBe('2026-10')
  })

  it('달 차이', () => {
    expect(monthDiff('2026-10', '2026-12')).toBe(2)
    expect(monthDiff('2026-10', '2027-01')).toBe(3)
    expect(monthDiff('2026-10', '2026-09')).toBe(-1)
  })

  it('날짜 표시', () => {
    expect(formatMonthLabel('2026-10')).toBe('2026년 10월')
    expect(formatDateLabel('2026-10-23')).toBe('10월 23일 (금)')
  })
})
