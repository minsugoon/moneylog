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

describe('외화 입력 부품', () => {
  it('통화 변경 상태에 맞는 링크와 칩을 보여준다', () => {
    expect(renderToString(<CurrencyToggle expanded={false} selected="KRW" codes={['VND']} {...callbacks} />)).toContain('통화 변경 · 외화로 입력 ▾')
    const won = renderToString(<CurrencyToggle expanded selected="KRW" codes={['VND']} {...callbacks} />)
    expect(won).toContain('접기 ▴')
    expect(won).toContain('원')
    expect(won.replace('<!-- -->', '')).toContain('동 · VND')
    const foreign = renderToString(<CurrencyToggle expanded selected="VND" codes={['VND']} {...callbacks} />)
    expect(foreign).toContain('접고 원화로 입력 ▴')
    expect(foreign).toContain('aria-pressed="true"')
    expect(renderToString(<CurrencyToggle expanded selected="KRW" codes={[]} {...callbacks} />)).toContain('설정 → 통화에서 자주 쓰는 통화를 고를 수 있어요.')
  })

  it('통화에 맞는 입력 키패드와 이름, 코드를 보여준다', () => {
    const vnd = renderToString(<FxAmountInput id="vnd" code="VND" value="" onChange={() => {}} />)
    const usd = renderToString(<FxAmountInput id="usd" code="USD" value="" onChange={() => {}} />)
    expect(vnd).toContain('inputMode="numeric"')
    expect(vnd).toContain('aria-label="동 금액"')
    expect(vnd).toContain('>VND</span>')
    expect(usd).toContain('inputMode="decimal"')
  })

  it('환산 결과와 직접 입력, 오류 및 안내를 표시한다', () => {
    expect(renderConvert()).toContain('금액을 넣으면 원화로 바꿔 드려요')
    expect(renderConvert({ hasAmount: true, krw: 1042, rateLabel: '1동 = 0.0517원', rateTime: '10/08 14:02' })).toContain('≈ 1,042원')
    expect(renderConvert({ hasAmount: true, krw: 1042, rateLabel: '1동 = 0.0517원', rateTime: '10/08 14:02' }).replace('<!-- -->', '')).toContain('1동 = 0.0517원 · 10/08 14:02 기준')
    expect(renderConvert({ hasAmount: true, convertError: '금액을 확인해 주세요.' })).toContain('role="alert"')
    const manual = renderConvert({ hasAmount: true, manualOpen: true, manualKrw: 1050 })
    expect(manual).toContain('1,050원')
    expect(manual).toContain('카드 청구액 기준으로 고쳤어요')
    expect(manual).toContain('환율로 계산하기')
    expect(renderConvert({ noRate: true, rateNote: '환율을 불러오지 못했어요.' })).toContain('환율을 불러오지 못했어요.')
    expect(renderConvert({ dayLine: '11월 2일 (월) 합계 35,340원 → 36,382원' })).toContain('11월 2일 (월) 합계 35,340원 → 36,382원')
    const refreshing = renderConvert({ refreshing: true })
    expect(refreshing).toContain('받는 중…')
    expect(refreshing).toContain('disabled=""')
  })
})
