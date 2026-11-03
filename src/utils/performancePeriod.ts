import { addMonths } from './format.ts'

// 날짜 문자열을 UTC 날짜로 바꾼다.
function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

// UTC 날짜를 YYYY-MM-DD로 돌려준다.
function dateString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

// 날짜가 속한 측정 기간의 시작 월을 구한다.
export function periodKeyOf(date: string, startDay: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  return day >= startDay ? monthKey : addMonths(monthKey, -1)
}

// 기간 키와 시작일에서 포함 구간을 계산한다.
export function periodRange(periodKey: string, startDay: number): { start: string; end: string } {
  const start = `${periodKey}-${String(startDay).padStart(2, '0')}`
  const nextMonth = addMonths(periodKey, 1)
  const end = dateString(new Date(Date.UTC(Number(nextMonth.slice(0, 4)), Number(nextMonth.slice(5, 7)) - 1, startDay) - 86400000))
  return { start, end }
}

// 오늘과 끝 날짜를 포함해 남은 일수를 계산한다.
export function daysLeft(today: string, end: string): number {
  const difference = (parseDate(end).getTime() - parseDate(today).getTime()) / 86400000
  return Math.max(0, difference + 1)
}

// 오늘이 기간의 과거·현재·미래 중 어디인지 구한다.
export function periodPhase(today: string, range: { start: string; end: string }): 'past' | 'current' | 'future' {
  if (today > range.end) return 'past'
  if (today < range.start) return 'future'
  return 'current'
}

// 기간을 화면에 표시할 짧은 문구로 바꾼다.
export function formatPeriodLabel(range: { start: string; end: string }): string {
  const [startYear, startMonth, startDay] = range.start.split('-').map(Number)
  const [endYear, endMonth, endDay] = range.end.split('-').map(Number)
  const startLabel = `${startMonth}월 ${startDay}일`
  const endLabel = `${endMonth}월 ${endDay}일`
  return startYear === endYear
    ? `${startLabel} ~ ${endLabel}`
    : `${startYear}년 ${startLabel} ~ ${endYear}년 ${endLabel}`
}
