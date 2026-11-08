import { renderToString } from 'react-dom/server'
import type { ReactNode } from 'react'
import { LedgerContext, type LedgerValue } from '../hooks/ledgerContext.ts'
import { DEFAULT_FIXED_TYPES, KRW_DEFAULTS, type Account, type DailyNote, type Transaction } from '../lib/types.ts'
import { addMonths, currentMonthKey, todayString } from '../utils/format.ts'

// 화면 점검 테스트: 가짜 데이터를 넣고 화면을 한 번 그려서, 오류 없이 그려지고 핵심 글자가 보이는지 확인한다.
// 샘플은 모두 임의로 만든 값이다 (실제 카드·내역 아님).

export const ok = async () => ({ ok: true as const })
export const today = todayString()
export const thisMonth = currentMonthKey()

export const accountList: Account[] = [
  { id: 'a1', name: '생활카드', kind: 'card', issuer: '신한카드', last4: '5678', sort_order: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'a2', name: '월급통장', kind: 'account', issuer: '카카오뱅크', last4: '1234', sort_order: 1, is_active: true, created_at: '2026-01-02T00:00:00Z' },
  { id: 'a3', name: '현금', kind: 'cash', issuer: null, last4: null, sort_order: 2, is_active: true, created_at: '2026-01-03T00:00:00Z' },
]

export function tx(overrides: Partial<Transaction>): Transaction {
  return {
    ...KRW_DEFAULTS,
    id: 't', account_id: 'a1', used_at: today, merchant: '샘플 가게', amount: 10000, discount: 0,
    installment_months: 1, is_fixed: false, fixed_type: null, source: 'manual', import_hash: null,
    memo: null, is_cancel: false, interest_free: false, performance_override: null,
    created_at: '2026-01-01T00:00:00Z', ...overrides,
  }
}

export const txList: Transaction[] = [
  tx({ id: '1', merchant: '편의점샘플', amount: 12000, memo: '야식 메모' }),
  tx({ id: '2', merchant: '통신비샘플', amount: 55000, is_fixed: true, fixed_type: '통신', account_id: 'a2' }),
  tx({ id: '3', merchant: '환불샘플', amount: 3000, is_cancel: true, account_id: 'a3' }),
  tx({ id: '4', merchant: '노트북샘플', amount: 1200000, installment_months: 12, interest_free: true, used_at: `${addMonths(thisMonth, -2)}-05` }),
]

export const noteList: DailyNote[] = [{ id: 'n1', note_date: today, body: '샘플 하루 정리 글', updated_at: '2026-01-01T00:00:00Z' }]

export function fakeLedger(overrides: Partial<LedgerValue> = {}): LedgerValue {
  return {
    accounts: { accounts: accountList, loading: false, error: '', reload: async () => {}, add: ok, update: ok, setActive: ok, remove: ok, move: ok },
    transactions: { items: txList, loading: false, error: '', reload: async () => {}, add: ok, addMany: async () => ({ ok: true as const, saved: 0, skipped: 0 }), update: ok, remove: ok },
    notes: { items: noteList, byDate: new Map(noteList.map((n) => [n.note_date, n])), loading: false, error: '', reload: async () => {}, save: ok, remove: ok },
    fixedExpenses: { items: [], loading: false, error: '', reload: async () => {}, add: ok, update: ok, remove: ok, registerMany: ok },
    fixedTypes: { items: [], names: [...DEFAULT_FIXED_TYPES], loading: false, error: '', reload: async () => {}, add: ok, rename: ok, remove: ok },
    cardPrograms: { programs: [], benefits: [], loading: false, error: '', reload: async () => {}, addProgram: ok, updateProgram: ok, setProgramActive: ok, removeProgram: ok, addBenefit: ok, updateBenefit: ok, removeBenefit: ok },
    ...overrides,
  }
}

// React가 글자 사이에 끼워 넣는 구분 표시(<!-- -->)는 눈에 안 보이므로 지우고 비교한다
export function renderWithLedger(node: ReactNode, ledger: LedgerValue = fakeLedger()): string {
  return renderToString(<LedgerContext.Provider value={ledger}>{node}</LedgerContext.Provider>).replaceAll(
    '<!-- -->',
    '',
  )
}

