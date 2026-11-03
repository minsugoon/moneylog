import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CardProgramForm from './components/settings/CardProgramForm.tsx'
import CardProgramSection from './components/settings/CardProgramSection.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import type { CardBenefit, CardProgram } from './lib/types.ts'
import { fakeLedger, renderWithLedger, accountList } from './testing/ledgerFixtures.tsx'
import type { ProgramDraft } from './utils/cardProgramInput.ts'

const programs: CardProgram[] = [
  { id: 'p1', account_id: 'a1', name: '생활카드 실적', target_amount: 300000, measure_basis: 'previous_month', installment_mode: 'full', period_start_day: 15, exclude_keywords: [], exclusion_modes: {}, is_active: false, sort_order: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p2', account_id: 'a1', name: '교통카드 실적', target_amount: 500000, measure_basis: 'current_month', installment_mode: 'monthly', period_start_day: 10, exclude_keywords: [], exclusion_modes: {}, is_active: true, sort_order: 1, created_at: '2026-01-02T00:00:00Z' },
]
const benefits: CardBenefit[] = [{ id: 'b1', program_id: 'p1', name: '교통 할인', required_amount: null, benefit_amount: 10000, benefit_kind: '기타', linked_keyword: null, memo: null, created_at: '2026-01-01T00:00:00Z' }]

function ledger(overrides: Parameters<typeof fakeLedger>[0] = {}) {
  return fakeLedger({ cardPrograms: { ...fakeLedger().cardPrograms, programs, benefits, ...overrides.cardPrograms }, ...overrides })
}

describe('카드 실적 설정', () => {
  it('카드가 없으면 안내와 결제수단 이동 버튼을 보여준다', () => {
    const value = fakeLedger({ accounts: { ...fakeLedger().accounts, accounts: accountList.filter((account) => account.kind !== 'card') } })
    const html = renderWithLedger(<CardProgramSection />, value)
    expect(html).toContain('먼저 결제수단에 카드를 등록해 주세요.')
    expect(html).toContain('카드 등록하러 가기 ↑')
    expect(html).not.toContain('+ 실적 조건 추가')
  })

  it('카드가 있고 조건이 없으면 빈 상태와 추가 버튼을 보여준다', () => {
    const html = renderWithLedger(<CardProgramSection />)
    expect(html).toContain('아직 등록한 실적 조건이 없어요.')
    expect(html).toContain('+ 실적 조건 추가')
  })

  it('등록된 실적 조건과 혜택 수를 보여준다', () => {
    const html = renderWithLedger(<CardProgramSection />, ledger())
    for (const text of ['생활카드 실적', '월 300,000원', '전월 실적', '매월 15일부터', '매월 10일부터', '혜택 1개', '사용 중지', '다시 사용', '생활카드']) expect(html).toContain(text)
  })

  it('폼에 모든 입력 항목과 기본 선택을 보여준다', () => {
    const draft: ProgramDraft = { account_id: 'a1', name: '', target_amount: null, measure_basis: 'previous_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: [], interest_free_mode: 'flag' }
    const html = renderToString(<CardProgramForm initial={draft} cards={accountList.filter((account) => account.kind === 'card')} submitLabel="추가" onSubmit={async () => ({ ok: true })} onCancel={() => {}} />)
    for (const text of ['대상 카드', '이름', '월 목표 금액', '측정 방식', '측정 시작일', '할부 인정', '무이자 할부', '이 카드만 빼는 결제명 (선택)', '1일 (달력 기준)', '28일', '전월 실적', '당월 실적', '전액', '월 납부액', '표시만', '실적 제외', '신경 안 씀']) expect(html).toContain(text)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(3)
  })

  it('설정 화면에서 결제수단 다음에 카드 실적을 보여준다', () => {
    const html = renderWithLedger(<SettingsPage email="sample@example.test" provider="email" onSignOut={async () => ({ ok: true })} />)
    expect(html.indexOf('결제수단')).toBeLessThan(html.indexOf('카드 실적'))
  })
})
