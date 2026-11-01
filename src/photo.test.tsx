import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import UsageBar from './components/UsageBar.tsx'
import PhotoPickArea from './components/entry/PhotoPickArea.tsx'
import CaptureImport from './components/entry/CaptureImport.tsx'
import { renderWithLedger } from './testing/ledgerFixtures.tsx'

vi.mock('./hooks/useAiCapture.ts', () => ({
  useAiCapture: vi.fn(() => ({ loading: false, error: '', consented: true, monthlyLimit: 20, used: 7, reload: async () => {}, acceptConsent: async () => ({ ok: true as const }), withdrawConsent: async () => ({ ok: true as const }), parseCapture: async () => ({ ok: true as const, rows: [] }) })),
}))

describe('사진 입력 UI', () => {
  it('사용량을 막대와 글자로 표시하고 한도가 0이면 막대를 비운다', () => {
    const html = renderToString(<UsageBar label="사진 읽기 사용량" used={7} limit={20} />).replaceAll('<!-- -->', '')
    expect(html).toContain('이번 달 7/20장')
    expect(html).toContain('bg-brand')
    expect(html).toContain('width:35%')
    expect(renderToString(<UsageBar label="사진 읽기 사용량" used={7} limit={0} />).replaceAll('<!-- -->', '')).toContain('width:0%')
  })

  it('동의한 사진 입력 화면에 새 구성을 표시한다', () => {
    const html = renderWithLedger(<CaptureImport />)
    expect(html).toContain('사진 읽기 사용량')
    expect(html).toContain('무엇을 읽을까요?')
    expect(html).toContain('카드사 앱 캡처')
    expect(html).toContain('영수증')
    expect(html).toContain('border-dashed')
    expect(html).toContain('min-h-[168px]')
    expect(html).toContain('이미지 고르기')
    expect(html).toContain('읽기')
    expect(html).toContain('grid-cols-2')
  })

  it('사진이 없으면 읽기 버튼을 비활성화한다', () => {
    const html = renderWithLedger(<CaptureImport />)
    expect(html).toContain('disabled=""')
  })

  it('영수증 사진 찍기와 사진 고르기 입력을 제공한다', () => {
    const html = renderToString(<PhotoPickArea files={[]} kind="receipt" onSelect={() => {}} onRemove={() => {}} />)
    expect(html).toContain('영수증 사진 찍기')
    expect(html).toContain('사진 고르기')
    expect(html).toContain('capture="environment"')
  })
})
