// DB 표(docs/DATA_MODEL.md)와 같은 모양의 타입. 열 이름을 DB와 똑같이 써서 따로 변환하지 않는다.

export type AccountKind = 'card' | 'cash' | 'account'

export interface Account {
  id: string
  name: string
  kind: AccountKind
  issuer: string | null
  last4: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export const DEFAULT_FIXED_TYPES = ['통신', '구독', '렌탈', '적금', '기부', '보험', '기타고정'] as const
export const FIXED_TYPES = DEFAULT_FIXED_TYPES
export type FixedType = string
export const FALLBACK_FIXED_TYPE = '기타고정'

export interface FixedExpense {
  id: string
  merchant: string
  account_id: string | null
  amount: number
  pay_day: number
  fixed_type: FixedType
  created_at: string
}

export interface FixedTypeRow {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string | null
  // 'YYYY-MM-DD' 글자 그대로 다룬다 (시간대 때문에 날짜가 밀리는 일을 막기 위해)
  used_at: string
  merchant: string
  // DB의 금액은 항상 0 이상. 취소 건은 is_cancel로 구분해 계산할 때 마이너스로 본다.
  amount: number
  discount: number
  installment_months: number
  is_fixed: boolean
  fixed_type: FixedType | null
  source: 'manual' | 'csv' | 'paste' | 'sms'
  import_hash: string | null
  memo: string | null
  is_cancel: boolean
  interest_free: boolean
  performance_override: 'include' | 'exclude' | null
  created_at: string
  currency: string
  original_amount: number | null
  exchange_rate: number | null
  rate_at: string | null
  krw_confirmed: boolean
}

export const KRW_DEFAULTS = { currency: 'KRW', original_amount: null, exchange_rate: null, rate_at: null, krw_confirmed: true } as const

export function normalizeTransaction(row: Partial<Transaction> & Pick<Transaction, 'id'>): Transaction {
  // DB 행에 새 통화 칸이 없어도 기본값을 채우므로 반환 타입을 단언한다.
  return { ...KRW_DEFAULTS, ...row, currency: row.currency || KRW_DEFAULTS.currency } as Transaction
}

export interface DailyNote {
  id: string
  note_date: string
  body: string
  updated_at: string
}

export interface FixedRule {
  id: string
  merchant_keyword: string
  fixed_type: FixedType
  created_at: string
}

// 카드 실적 프로그램·혜택 (docs/PERFORMANCE_SPEC.md)
export type ExclusionMode = 'exclude' | 'flag' | 'ignore'
export type MeasureBasis = 'current_month' | 'previous_month'
export type InstallmentMode = 'full' | 'monthly'
export const BENEFIT_KINDS = ['렌탈', '통신', '구독', '보험', '기타'] as const
export type BenefitKind = (typeof BENEFIT_KINDS)[number]

export interface CardProgram {
  id: string
  account_id: string
  name: string
  target_amount: number
  measure_basis: MeasureBasis
  installment_mode: InstallmentMode
  period_start_day: number // 1~28
  exclude_keywords: string[]
  exclusion_modes: Record<string, ExclusionMode>
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface CardBenefit {
  id: string
  program_id: string
  name: string
  required_amount: number | null
  benefit_amount: number
  benefit_kind: BenefitKind
  linked_keyword: string | null
  memo: string | null
  created_at: string
}
