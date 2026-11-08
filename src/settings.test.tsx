import { describe, expect, it, vi } from 'vitest'
import AccountSection from './components/accounts/AccountSection.tsx'
import AiSettingsSection from './components/settings/AiSettingsSection.tsx'
import UsageBar from './components/UsageBar.tsx'
import { useAiCapture } from './hooks/useAiCapture.ts'
import { fakeLedger, renderWithLedger as render } from './testing/ledgerFixtures.tsx'
import FixedExpenseSection from './components/settings/FixedExpenseSection.tsx'
import FixedTypeSection from './components/settings/FixedTypeSection.tsx'
import FixedExpenseForm from './components/settings/FixedExpenseForm.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import { accountList, renderWithLedger } from './testing/ledgerFixtures.tsx'
import { fixedGroups } from './utils/viewStats.ts'
import { tx } from './testing/ledgerFixtures.tsx'
import type { FixedExpense } from './lib/types.ts'
import { emptyFixedExpenseDraft } from './utils/fixedExpenses.ts'
import { previewItems } from './components/settings/useExpandableList.ts'
import ExpandListButton from './components/settings/ExpandListButton.tsx'
import { primaryButtonClass } from './components/ui.ts'

vi.mock('./hooks/useAiCapture.ts', () => ({
  useAiCapture: vi.fn(() => ({ loading: false, error: '', consented: true, monthlyLimit: 20, used: 7, reload: async () => {}, acceptConsent: async () => ({ ok: true as const }), withdrawConsent: async () => ({ ok: true as const }), parseCapture: async () => ({ ok: true as const, rows: [] }) })),
}))

describe('설정 화면', () => {
  it('결제수단 줄과 순서 변경 버튼을 표시한다', () => {
    const html = render(<AccountSection />)
    expect(html).toContain('bg-gray-50')
    expect(html).toContain('카드 · 사용 중')
    expect(html).toContain('수정')
    expect(html).toContain('위로 옮기기')
    expect(html).toContain('아래로 옮기기')
    expect(html).not.toContain('≡')
    expect(html).not.toContain('끌기')
  })

  it('동의 상태와 사용량, 철회 버튼을 표시한다', () => {
    vi.mocked(useAiCapture).mockReturnValue({ loading: false, error: '', consented: true, monthlyLimit: 20, used: 7, reload: async () => {}, acceptConsent: async () => ({ ok: true }), withdrawConsent: async () => ({ ok: true }), parseCapture: async () => ({ ok: true, rows: [] }) })
    const html = render(<AiSettingsSection />)
    expect(html).toContain('사진 읽기 동의')
    expect(html).toContain('동의함')
    expect(html).toContain('이번 달 사용량')
    expect(html).toContain('/20장')
    expect(html).toContain('동의 철회')
  })

  it('사용량 접두사를 빈 문자열로 지정할 수 있다', () => {
    const html = render(<UsageBar label="사용량" used={7} limit={20} valuePrefix="" />)
    expect(html).toContain('7/20장')
    expect(html).not.toContain('이번 달')
  })
})

const ok = async () => ({ ok: true as const })
const sampleItems: FixedExpense[] = Array.from({ length: 7 }, (_, index) => ({ id: `f${index}`, merchant: `인터넷 요금 ${index}`, account_id: 'a1', amount: 55000, pay_day: 25, fixed_type: '생활카드', created_at: '2026-01-01T00:00:00Z' }))

describe('고정지출 설정', () => {
  it('목록 미리보기와 펼치기 버튼을 표시한다', () => {
    const items = [1, 2, 3, 4, 5, 6, 7]
    expect(previewItems(items, false)).toHaveLength(5)
    expect(previewItems(items, true)).toHaveLength(7)
    expect(previewItems(items.slice(0, 4), false)).toHaveLength(4)
    const closed = render(<ExpandListButton hiddenCount={3} expanded={false} onToggle={() => {}} />)
    expect(closed).toContain('펼치기 (3개 더)')
    expect(closed).toContain('aria-expanded="false"')
    const open = render(<ExpandListButton hiddenCount={3} expanded onToggle={() => {}} />)
    expect(open).toContain('접기')
    expect(open).toContain('aria-expanded="true"')
    expect(render(<ExpandListButton hiddenCount={0} expanded={false} onToggle={() => {}} />)).toBe('')
    expect(primaryButtonClass).toContain('whitespace-nowrap')
  })

  it('빈 목록 안내와 등록 목록 합계를 보여준다', () => {
    expect(renderWithLedger(<FixedExpenseSection />)).toContain('아직 등록한 고정지출이 없어요.')
    const ledger = fakeLedger()
    ledger.fixedExpenses = { ...ledger.fixedExpenses, items: sampleItems }
    const html = renderWithLedger(<FixedExpenseSection />, ledger)
    expect(html).toContain('인터넷 요금 4')
    expect(html).not.toContain('인터넷 요금 5')
    expect(html).toContain('매월 25일')
    expect(html).toContain('생활카드')
    expect(html).toContain('55,000원')
    expect(html).toContain('7개 · 매달 385,000원')
    expect(html).toContain('펼치기 (2개 더)')
  })

  it('결제수단이 없으면 안내하고 입력 폼에는 다섯 칸을 보여준다', () => {
    const ledger = fakeLedger()
    ledger.accounts = { ...ledger.accounts, accounts: [] }
    expect(renderWithLedger(<FixedExpenseSection />, ledger)).toContain('먼저 결제수단을 등록해 주세요.')
    const form = renderWithLedger(<FixedExpenseForm initial={emptyFixedExpenseDraft('a1')} accounts={accountList} typeOptions={['통신']} submitLabel="추가" onSubmit={ok} onCancel={() => {}} />)
    for (const label of ['결제명', '결제수단', '금액', '결제일', '분류']) expect(form).toContain(label)
    expect(form).toContain('매월 31일')
  })

  it('기본 분류와 사용자 분류 조작을 표시하고 설정 화면에서 규칙을 숨긴다', () => {
    const ledger = fakeLedger()
    ledger.fixedTypes = { ...ledger.fixedTypes, items: [{ id: 'f', name: '기타고정', sort_order: 0, created_at: '' }, { id: 'c', name: '통신', sort_order: 1, created_at: '' }] }
    const types = renderWithLedger(<FixedTypeSection />, ledger)
    expect(types).toContain('기본 분류')
    expect(types).toContain('aria-label="통신 수정"')
    const settings = renderWithLedger(<SettingsPage email="sample@example.test" provider="email" onSignOut={ok} />)
    expect(settings).toContain('고정지출 분류')
    expect(settings).not.toContain('고정지출 규칙')
  })

  it('사용자 분류도 고정지출 그룹에 포함한다', () => {
    const entry = { tx: tx({ id: 'custom', is_fixed: true, fixed_type: '대출이자' }), charge: 1200, info: null }
    expect(fixedGroups([entry]).map((group) => group.label)).toContain('대출이자')
  })
})
