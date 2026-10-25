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

export const FIXED_TYPES = ['통신', '구독', '렌탈', '적금', '기부', '보험', '기타고정'] as const
export type FixedType = (typeof FIXED_TYPES)[number]

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
}

export interface DailyNote {
  id: string
  note_date: string
  body: string
  updated_at: string
}
