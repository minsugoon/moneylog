import { FALLBACK_FIXED_TYPE, type FixedExpense, type FixedType } from '../lib/types.ts'

export interface FixedExpenseDraft {
  merchant: string
  account_id: string
  amount: number | null
  pay_day: number
  fixed_type: FixedType
}

export interface FixedExpenseRow {
  merchant: string
  account_id: string | null
  amount: number
  pay_day: number
  fixed_type: FixedType
}

export type Checked<T> = { ok: true; value: T } | { ok: false; message: string }

export interface FixedLoadOption {
  key: string
  merchant: string
  amount: number
  accountId: string | null
  fixedType: FixedType
  payDay: number
}

// 비교할 때 앞뒤 공백과 모든 공백 문자를 없애고 소문자로 바꾼다.
export function normalizeForMatch(text: string): string {
  return text.trim().replace(/\s/g, '').toLowerCase()
}

// 고정지출 입력창의 기본값을 만든다.
export function emptyFixedExpenseDraft(accountId: string, fixedType: FixedType = FALLBACK_FIXED_TYPE): FixedExpenseDraft {
  return { merchant: '', account_id: accountId, amount: null, pay_day: 1, fixed_type: fixedType }
}

// 저장된 항목을 수정 가능한 입력값으로 바꾼다.
export function draftFromFixedExpense(item: FixedExpense): FixedExpenseDraft {
  return { merchant: item.merchant, account_id: item.account_id ?? '', amount: item.amount, pay_day: item.pay_day, fixed_type: item.fixed_type }
}

// 고정지출 입력값을 검사하고 저장 형태로 정리한다.
export function checkFixedExpense(draft: FixedExpenseDraft): Checked<FixedExpenseRow> {
  const merchant = draft.merchant.trim()
  if (merchant.length < 1 || merchant.length > 100) return { ok: false, message: '결제명을 입력해 주세요.' }
  if (!draft.account_id) return { ok: false, message: '결제수단을 골라 주세요.' }
  if (draft.amount === null || !Number.isInteger(draft.amount) || draft.amount <= 0 || draft.amount > 2000000000) return { ok: false, message: '금액을 1원 이상 입력해 주세요.' }
  if (!Number.isInteger(draft.pay_day) || draft.pay_day < 1 || draft.pay_day > 31) return { ok: false, message: '결제일을 1일부터 31일 사이로 골라 주세요.' }
  if (!draft.fixed_type.trim()) return { ok: false, message: '분류를 골라 주세요.' }
  return { ok: true, value: { merchant, account_id: draft.account_id, amount: draft.amount, pay_day: draft.pay_day, fixed_type: draft.fixed_type } }
}

// 분류 이름의 길이와 중복 여부를 검사한다.
export function checkFixedTypeName(name: string, existingNames: string[], currentName?: string): Checked<string> {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 20) return { ok: false, message: '분류 이름을 1~20자로 입력해 주세요.' }
  if (existingNames.some((existing) => existing !== currentName && normalizeForMatch(existing) === normalizeForMatch(trimmed))) {
    return { ok: false, message: '이미 있는 분류예요.' }
  }
  return { ok: true, value: trimmed }
}

// 거래가 새 고정지출 등록 대상이면 실결제 금액과 결제일을 추출한다.
export function registrationFromTransaction(input: { is_fixed: boolean; is_cancel?: boolean; fixed_type: FixedType | null; merchant: string; account_id: string | null; amount: number; discount?: number; installment_months?: number; used_at: string }): FixedExpenseRow | null {
  const merchant = input.merchant.trim()
  const amount = input.amount - (input.discount ?? 0)
  if (!input.is_fixed || input.is_cancel || (input.installment_months ?? 1) >= 2 || !input.fixed_type || !merchant || amount < 1) return null
  return { merchant, account_id: input.account_id, amount, pay_day: Number(input.used_at.slice(8, 10)), fixed_type: input.fixed_type }
}

// 항목의 중복 판정에 사용할 키를 만든다.
export function fixedExpenseKey(row: FixedExpenseRow): string {
  return `${normalizeForMatch(row.merchant)}|${row.account_id ?? ''}|${row.amount}`
}

// 이미 등록된 항목과 후보 내부의 중복을 건너뛴다.
export function newRegistrations(existing: FixedExpenseRow[], candidates: FixedExpenseRow[]): FixedExpenseRow[] {
  const keys = new Set(existing.map(fixedExpenseKey))
  return candidates.filter((candidate) => {
    const key = fixedExpenseKey(candidate)
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
}

// 고정지출을 결제일과 결제명 순으로 정렬한다.
export function sortFixedExpenses<T extends Pick<FixedExpense, 'pay_day' | 'merchant'>>(items: T[]): T[] {
  return [...items].sort((a, b) => a.pay_day - b.pay_day || a.merchant.localeCompare(b.merchant, 'ko'))
}

// 저장된 고정지출을 화면의 불러오기 선택지로 바꾼다.
export function toLoadOptions(items: FixedExpense[]): FixedLoadOption[] {
  return sortFixedExpenses(items).map((item) => ({ key: item.id, merchant: item.merchant, amount: item.amount, accountId: item.account_id, fixedType: item.fixed_type, payDay: item.pay_day }))
}

// 고정지출 금액의 합계를 계산한다.
export function monthlyFixedTotal(items: Array<Pick<FixedExpense, 'amount'>>): number {
  return items.reduce((total, item) => total + item.amount, 0)
}

// 결제일을 매월 표시 문구로 바꾼다.
export function payDayLabel(day: number): string {
  return `매월 ${day}일`
}
