import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import CurrencySection from './components/settings/CurrencySection.tsx'
import { useExchangeRate } from './hooks/useExchangeRate.ts'

vi.mock('./hooks/useFxCurrencies.ts', () => ({
  useFxCurrencies: vi.fn(() => ({ codes: ['VND', 'USD'], toggle: vi.fn(), reset: vi.fn() })),
}))

vi.mock('./hooks/useExchangeRate.ts', () => ({
  useExchangeRate: vi.fn(() => ({ status: 'ready', live: { rates: { VND: 0.0517, USD: 1332.76, JPY: 9.12 }, fetchedAt: '2026-10-31T12:00:00.000Z', sourceUpdatedAt: null }, cached: null, refreshing: false, notice: '', refresh: vi.fn(), choose: vi.fn() })),
}))

describe('통화 설정', () => {
  it('통화 설명과 전체 통화 및 선택 상태를 보여 준다', () => {
    const html = renderToString(<CurrencySection />)

    expect(html).toContain('통화')
    expect(html).toContain('입력 탭에서 외화로 입력할 때 보여 줄 통화에 체크해요. 원화는 항상 보여요.')
    const readableHtml = html.replace(/<!-- -->/g, '')
    for (const label of ['달러', 'USD', '유로', 'EUR', '엔', 'JPY', '대만', 'TWD', '베트남', 'VND', '중국', 'CNY', '몽골', 'MNT', '필리핀', 'PHP', '영국', 'GBP']) expect(readableHtml).toContain(label)
    expect((html.match(/type="checkbox"/g) ?? [])).toHaveLength(9)
    expect(html).toContain('aria-label="달러 입력 화면에 표시"')
    expect(html).toContain('>현재 환율</span>')
    expect(html).toContain('>표시</span>')
    expect(html).toContain('grid-cols-[minmax(0,1fr)_auto_44px]')
    expect(html).toContain('checked=""')
    expect(html).toContain('type="checkbox"')
  })

  it('체크 여부와 관계없이 통화의 환율을 보여 준다', () => {
    const html = renderToString(<CurrencySection />)

    expect(html).toContain('현재 환율')
    expect(html).toContain('1동 = 0.0517원')
    expect(html).toContain('1달러 = 1,332.8원')
    expect(html).toContain('1엔 = 9.12원')
  })

  it('환율이 없으면 안내 문구를 보여 준다', () => {
    vi.mocked(useExchangeRate).mockReturnValue({ status: 'ready', live: null, cached: null, refreshing: false, notice: '', refresh: vi.fn(), choose: vi.fn() })
    expect(renderToString(<CurrencySection />)).toContain('환율을 아직 받지 못했어요.')
  })

  it('출처 링크와 환율 안내를 표시한다', () => {
    const html = renderToString(<CurrencySection />)
    expect(html).toContain('Rates By Exchange Rate API')
    expect(html).toContain('href="https://www.exchangerate-api.com"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('이미 적은 금액은 변하지 않아요')
  })
})
