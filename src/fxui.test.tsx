import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import CurrencyToggle from './components/entry/CurrencyToggle.tsx'
import FxAmountInput from './components/entry/FxAmountInput.tsx'
import FxConvertBox from './components/entry/FxConvertBox.tsx'

const callbacks = { onToggle: () => {}, onSelect: () => {} }

function renderConvert(overrides: Partial<Parameters<typeof FxConvertBox>[0]> = {}): string {
  const props: Parameters<typeof FxConvertBox>[0] = {
    code: 'VND', hasAmount: false, krw: null, convertError: null, rateLabel: null, rateTime: null, rateNote: null,
    noRate: false, refreshing: false, refreshNotice: '', onRefresh: () => {}, manualOpen: false, manualKrw: null,
    onManualOpen: () => {}, onManualClose: () => {}, onManualChange: () => {}, dayLine: null, idPrefix: 'fx', ...overrides,
  }
  return renderToString(<FxConvertBox {...props} />)
}

describe('외화 입력 구성 요소', () => {
  it('접힌 통화 박스는 제목과 펼침 표시만 보여준다', () => {
    const html = renderToString(<CurrencyToggle expanded={false} selected="KRW" codes={['USD']} {...callbacks}>내용</CurrencyToggle>)
    expect(html).toContain('통화 변경 · 외화로 입력')
    expect(html).toContain('🔽')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('입력 통화')
    expect(html).not.toContain('내용')
  })

  it('펼친 통화 박스는 같은 제목과 같은 크기의 통화 카드를 보여준다', () => {
    const html = renderToString(<CurrencyToggle expanded selected="USD" codes={['USD', 'VND']} {...callbacks}>내용</CurrencyToggle>)
    expect(html).toContain('통화 변경 · 외화로 입력')
    expect(html).toContain('🔼')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('>원</span>')
    expect(html).toContain('>KRW</span>')
    expect(html).toContain('>달러</span>')
    expect(html).toContain('>USD</span>')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('w-[84px]')
    expect(html).toContain('overflow-x-auto')
    expect(html).toContain('snap-x')
    expect(html).toContain('aria-label="이전 통화 보기"')
    expect(html).toContain('aria-label="다음 통화 보기"')
  })

  it('자주 쓰는 통화가 없으면 설정 안내를 보여준다', () => {
    expect(renderToString(<CurrencyToggle expanded selected="KRW" codes={[]} {...callbacks}>안내</CurrencyToggle>)).toContain('설정 → 통화에서 자주 쓰는 통화를 고를 수 있어요.')
  })

  it('통화에 맞는 입력 모드와 이름을 쓴다', () => {
    const vnd = renderToString(<FxAmountInput id="vnd" code="VND" value="" onChange={() => {}} />)
    const usd = renderToString(<FxAmountInput id="usd" code="USD" value="" onChange={() => {}} />)
    expect(vnd).toContain('inputMode="numeric"')
    expect(vnd).toContain('aria-label="동 금액"')
    expect(vnd).toContain('>VND</span>')
    expect(usd).toContain('inputMode="decimal"')
  })

  it('환산 결과와 직접 입력을 표시하고 박스 틀을 선택할 수 있다', () => {
    expect(renderConvert()).toContain('금액을 넣으면 원화로 바꿔 드려요')
    expect(renderConvert({ hasAmount: true, krw: 1042 })).toContain('≈ 1,042원')
    expect(renderConvert({ hasAmount: true, convertError: '금액을 확인해 주세요' })).toContain('role="alert"')
    expect(renderConvert({ bare: true })).not.toContain('border-gray-200')
    expect(renderConvert()).toContain('border-gray-200')
  })
})
