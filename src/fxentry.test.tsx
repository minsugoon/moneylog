import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import type { useFxEntry } from './hooks/useFxEntry.ts'
import EntryPanel from './components/entry/EntryPanel.tsx'
import FxAmountSection from './components/entry/FxAmountSection.tsx'
import InstallmentFields from './components/entry/InstallmentFields.tsx'
import { renderWithLedger } from './testing/ledgerFixtures.tsx'

type Fx = ReturnType<typeof useFxEntry>

function makeFx(overrides: Partial<Fx> = {}): Fx {
  return {
    enabled: true, expanded: true, code: 'VND', isFx: true, favoriteCodes: ['VND'], text: '20,000', setText: () => {},
    toggle: () => {}, selectCode: () => {}, manualOpen: false, manualKrw: null, openManual: () => {}, closeManual: () => {},
    setManualKrw: () => {}, state: { minor: 20000, hasAmount: true, krw: 1042, rate: 0.0521, rateAt: null, confirmed: false, convertError: null, noRate: false, stale: false, rateNote: null, canSave: true, blockMessage: null },
    rateLabel: null, rateTime: null, dayLine: null, refresh: () => {}, refreshing: false, refreshNotice: '', resetAfterSave: () => {}, resetToKrw: () => {}, buildSaveFields: () => null,
    ...overrides,
  }
}

describe('외화 입력 화면', () => {
  it('기본 입력 화면에 원화 입력과 통화 변경 링크를 표시한다', () => {
    const html = renderWithLedger(<EntryPanel />)
    expect(html).toContain('통화 변경 · 외화로 입력')
    expect(html).not.toContain('원화로 바꾸면')
    expect(html).not.toContain('입력 통화')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('VND')
    expect(html).toContain('금액 (원)')
    expect(html).toContain('할인 (선택)')
    expect(html).toContain('할부')
  })

  it('외화 금액과 원화 환산 정보를 표시한다', () => {
    const html = renderToString(<FxAmountSection idPrefix="test" fx={makeFx()} amount={null} onAmountChange={() => {}} />)
    expect(html).toContain('금액 (VND)')
    expect(html).toContain('inputMode="numeric"')
    expect(html).toContain('통화 변경 · 외화로 입력')
    expect(html).toContain('입력 통화')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('min-h-[13rem]')
    expect(html).toContain('원화로 바꾸면')
    expect(html).toContain('≈ 1,042원')

    const noRate = makeFx({ state: { ...makeFx().state, krw: null, noRate: true, rateNote: '환율을 불러오지 못했어요. 카드 청구액으로 직접 입력해 주세요.', canSave: false } })
    const noRateHtml = renderToString(<FxAmountSection idPrefix="test" fx={noRate} amount={null} onAmountChange={() => {}} />)
    expect(noRateHtml).toContain('환율을 불러오지 못했어요. 카드 청구액으로 직접 입력해 주세요.')
  })

  it('원화를 선택해 펼치면 외화 입력 안내를 같은 높이로 보여준다', () => {
    const fx = makeFx({ expanded: true, code: 'KRW', isFx: false })
    const html = renderToString(<FxAmountSection idPrefix="test" fx={fx} amount={null} onAmountChange={() => {}} />)
    expect(html).toContain('해외에서 쓴 금액, 현지 통화로 바로 입력해요')
    expect(html).toContain('min-h-[13rem]')
  })

  it('할인과 할부 입력을 표시한다', () => {
    const html = renderToString(<InstallmentFields idPrefix="test" amount={12000} discount={null} onDiscountChange={() => {}} months={1} onMonthsChange={() => {}} />)
    expect(html).toContain('할인 (선택)')
    expect(html).toContain('할부')
  })
})
