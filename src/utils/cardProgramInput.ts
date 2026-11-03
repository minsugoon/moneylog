import { BENEFIT_KINDS, type BenefitKind, type CardProgram, type ExclusionMode, type InstallmentMode, type MeasureBasis } from '../lib/types.ts'

export interface ProgramDraft {
  account_id: string
  name: string
  target_amount: number | null
  measure_basis: MeasureBasis
  installment_mode: InstallmentMode
  period_start_day: number
  exclude_keywords: string[]
  interest_free_mode: ExclusionMode
}

export interface BenefitDraft {
  name: string
  required_amount: number | null
  benefit_amount: number | null
  benefit_kind: BenefitKind
  linked_keyword: string
  memo: string
}

export type Checked<T> = { ok: true; value: T } | { ok: false; message: string }

export interface ProgramRow {
  account_id: string
  name: string
  target_amount: number
  measure_basis: MeasureBasis
  installment_mode: InstallmentMode
  period_start_day: number
  exclude_keywords: string[]
  exclusion_modes: Record<string, ExclusionMode>
}

export interface BenefitRow {
  name: string
  required_amount: number | null
  benefit_amount: number
  benefit_kind: BenefitKind
  linked_keyword: string | null
  memo: string | null
}

// DB 기본 제외 방식을 정의한다.
export const DEFAULT_EXCLUSION_MODES: Record<string, ExclusionMode> = {
  loan: 'exclude', fee: 'exclude', cancel: 'exclude', tax: 'exclude', fine: 'exclude',
  giftcard: 'flag', utility: 'flag', school: 'flag', insurance4: 'flag', interest_free: 'flag',
}

// 새 프로그램 입력 기본값을 만든다.
export function emptyProgramDraft(accountId: string): ProgramDraft {
  return { account_id: accountId, name: '', target_amount: null, measure_basis: 'previous_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: [], interest_free_mode: 'flag' }
}

// 저장된 프로그램을 수정 입력값으로 바꾼다.
export function draftFromProgram(p: CardProgram): ProgramDraft {
  return { account_id: p.account_id, name: p.name, target_amount: p.target_amount, measure_basis: p.measure_basis, installment_mode: p.installment_mode, period_start_day: p.period_start_day, exclude_keywords: p.exclude_keywords, interest_free_mode: p.exclusion_modes.interest_free ?? 'flag' }
}

// 쉼표와 줄바꿈으로 키워드를 나누고 정리한다.
export function parseKeywords(text: string): string[] {
  const seen = new Set<string>()
  return text.split(/[\n,]/).map((item) => item.trim()).filter((item) => {
    const key = item.toLocaleLowerCase()
    if (!item || seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 20).map((item) => item.slice(0, 30))
}

// 프로그램 입력값을 검사하고 저장 모양으로 정리한다.
export function checkProgram(d: ProgramDraft, existingModes?: Record<string, ExclusionMode>): Checked<ProgramRow> {
  const name = d.name.trim()
  if (!d.account_id) return { ok: false, message: '카드를 골라 주세요.' }
  if (!name || name.length > 40) return { ok: false, message: '프로그램 이름을 1~40자로 입력해 주세요.' }
  if (d.target_amount === null || !Number.isInteger(d.target_amount) || d.target_amount <= 0 || d.target_amount > 2000000000) return { ok: false, message: '월 목표 금액을 1원 이상 입력해 주세요.' }
  if (!Number.isInteger(d.period_start_day) || d.period_start_day < 1 || d.period_start_day > 28) return { ok: false, message: '측정 시작일은 1일부터 28일 사이로 골라 주세요.' }
  return { ok: true, value: { account_id: d.account_id, name, target_amount: d.target_amount, measure_basis: d.measure_basis, installment_mode: d.installment_mode, period_start_day: d.period_start_day, exclude_keywords: parseKeywords(d.exclude_keywords.join('\n')), exclusion_modes: { ...DEFAULT_EXCLUSION_MODES, ...(existingModes ?? {}), interest_free: d.interest_free_mode } } }
}

// 혜택 입력값을 검사하고 저장 모양으로 정리한다.
export function checkBenefit(d: BenefitDraft): Checked<BenefitRow> {
  const name = d.name.trim()
  const linked = d.linked_keyword.trim()
  const memo = d.memo.trim()
  if (!name || name.length > 40) return { ok: false, message: '혜택 이름을 1~40자로 입력해 주세요.' }
  if (d.benefit_amount === null || !Number.isInteger(d.benefit_amount) || d.benefit_amount < 0 || d.benefit_amount > 2000000000) return { ok: false, message: '혜택 금액을 0원 이상 입력해 주세요.' }
  if (d.required_amount !== null && (!Number.isInteger(d.required_amount) || d.required_amount < 1 || d.required_amount > 2000000000)) return { ok: false, message: '필요 실적은 비우거나 1원 이상으로 입력해 주세요.' }
  if (linked.length > 30) return { ok: false, message: '연결 결제명은 30자 이하로 입력해 주세요.' }
  if (memo.length > 200) return { ok: false, message: '메모는 200자 이하로 입력해 주세요.' }
  const benefit_kind = (BENEFIT_KINDS as readonly string[]).includes(d.benefit_kind) ? d.benefit_kind : '기타'
  return { ok: true, value: { name, required_amount: d.required_amount, benefit_amount: d.benefit_amount, benefit_kind, linked_keyword: linked || null, memo: memo || null } }
}

// DB 프로그램 행의 배열과 제외 설정을 안전한 기본값으로 정리한다.
export function normalizeProgram(row: CardProgram): CardProgram {
  const modes: Record<string, ExclusionMode> = { ...DEFAULT_EXCLUSION_MODES }
  if (row.exclusion_modes && typeof row.exclusion_modes === 'object' && !Array.isArray(row.exclusion_modes)) {
    for (const [key, value] of Object.entries(row.exclusion_modes)) modes[key] = ['exclude', 'flag', 'ignore'].includes(value) ? value : DEFAULT_EXCLUSION_MODES[key] ?? 'flag'
  }
  return { ...row, exclude_keywords: Array.isArray(row.exclude_keywords) ? row.exclude_keywords : [], exclusion_modes: modes }
}
