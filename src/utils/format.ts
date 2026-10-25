import type { Account, AccountKind } from '../lib/types.ts'

// ---- 금액 ----

export function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR')
}

// 예) 12000 → "12,000원", -3000 → "-3,000원"
export function formatWon(value: number): string {
  return `${formatNumber(value)}원`
}

// 입력창에서 숫자가 아닌 글자를 빼고 정수로 바꾼다. 비어 있으면 null.
export function parseAmount(text: string): number | null {
  const digits = text.replace(/\D/g, '')
  if (digits === '') return null
  return Number(digits)
}

// 입력창에 보여줄 글자. 천 단위 콤마를 넣는다.
export function formatAmountInput(value: number | null): string {
  return value === null ? '' : formatNumber(value)
}

// ---- 결제수단 표시 (앱 전체 공통) ----

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  card: '카드',
  account: '통장',
  cash: '현금',
}

// 통장: "카카오뱅크 · 월급통장 (1234)", 카드: "신한카드 · 생활카드 (5678)", 현금: "현금"
// 끝 4자리가 없으면 괄호를 생략한다. 결제수단이 없는 내역은 "결제수단 없음".
export function formatAccountLabel(
  account: Pick<Account, 'name' | 'kind' | 'issuer' | 'last4'> | null | undefined,
): string {
  if (!account) return '결제수단 없음'
  if (account.kind === 'cash') {
    return account.name === '현금' ? '현금' : `현금 · ${account.name}`
  }
  const head = account.issuer ? `${account.issuer} · ${account.name}` : account.name
  return account.last4 ? `${head} (${account.last4})` : head
}

// ---- 날짜 ('YYYY-MM-DD', 달은 'YYYY-MM') ----

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

// 이 기기의 오늘 날짜
export function todayString(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

// 날짜를 며칠 앞뒤로 옮긴다. 예) shiftDate('2026-03-01', -1) → '2026-02-28'
export function shiftDate(date: string, deltaDays: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return todayString(new Date(year, month - 1, day + deltaDays))
}

export function currentMonthKey(now: Date = new Date()): string {
  return todayString(now).slice(0, 7)
}

export function toMonthKey(date: string): string {
  return date.slice(0, 7)
}

// 달을 숫자 하나로 바꿔 계산하기 쉽게 한다 (2026-10 → 연×12 + 월-1)
function monthIndex(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number)
  return year * 12 + (month - 1)
}

// 달을 더하거나 뺀다. 예) addMonths('2026-11', 3) → '2027-02'
export function addMonths(monthKey: string, delta: number): string {
  const index = monthIndex(monthKey) + delta
  const year = Math.floor(index / 12)
  return `${year}-${pad2((index % 12) + 1)}`
}

// to가 from보다 몇 달 뒤인지. 같은 달이면 0, 앞선 달이면 마이너스.
export function monthDiff(fromKey: string, toKey: string): number {
  return monthIndex(toKey) - monthIndex(fromKey)
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return `${year}년 ${month}월`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 예) "2026-10-23" → "10월 23일 (금)"
export function formatDateLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()]
  return `${month}월 ${day}일 (${weekday})`
}
