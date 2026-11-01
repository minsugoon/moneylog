import { describe, expect, it, vi } from 'vitest'
import AccountSection from './components/accounts/AccountSection.tsx'
import AiSettingsSection from './components/settings/AiSettingsSection.tsx'
import FixedRuleSection from './components/settings/FixedRuleSection.tsx'
import UsageBar from './components/UsageBar.tsx'
import { useAiCapture } from './hooks/useAiCapture.ts'
import { fakeLedger, renderWithLedger as render } from './testing/ledgerFixtures.tsx'

vi.mock('./hooks/useAiCapture.ts', () => ({
  useAiCapture: vi.fn(() => ({ loading: false, error: '', consented: true, monthlyLimit: 20, used: 7, reload: async () => {}, acceptConsent: async () => ({ ok: true as const }), withdrawConsent: async () => ({ ok: true as const }), parseCapture: async () => ({ ok: true as const, rows: [] }) })),
}))

describe('설정 화면', () => {
  it('고정지출 후보를 세로 목록으로 표시한다', () => {
    const html = render(<FixedRuleSection />, fakeLedger())

    expect(html).toContain('이미 입력한 고정지출에서 고르기')
    expect(html).toContain('<ul class="max-h-64 overflow-y-auto divide-y divide-gray-100">')
    expect(html).toContain('<li><button type="button" aria-label="통신비샘플, 통신, 1건" aria-pressed="false"')
    expect(html).toContain('통신 · 1건')
    expect(html).not.toContain('rounded-full')
  })

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
