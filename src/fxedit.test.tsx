import { describe, expect, it } from 'vitest'
import EntryForm from './components/entry/EntryForm.tsx'
import { renderWithLedger, tx } from './testing/ledgerFixtures.tsx'

describe('외화 내역 수정', () => {
  it('추정 외화 내역에 환율 안내와 원화 금액을 보여준다', () => {
    const html = renderWithLedger(<EntryForm initial={tx({ currency: 'VND', original_amount: 20000, exchange_rate: 0.0521, amount: 1042, krw_confirmed: false })} date="2026-10-31" onDateChange={() => {}} />)
    expect(html).toContain('VND · 입력 당시 환율')
    expect(html).toContain('20,000 VND × 0.0521 = ≈ 1,042원')
    expect(html).toContain('환율로 계산한 추정 금액이에요')
    expect(html).toContain('원화 금액')
    expect(html).not.toContain('할인 (선택)')
    expect(html).not.toContain('할부')
  })

  it('확정 외화 내역에는 청구 확정 안내를 보여준다', () => {
    const html = renderWithLedger(<EntryForm initial={tx({ currency: 'VND', original_amount: 20000, exchange_rate: 0.0521, amount: 1042, krw_confirmed: true })} date="2026-10-31" onDateChange={() => {}} />)
    expect(html).toContain('카드 청구액으로 확정한 금액이에요.')
    expect(html).toContain('= 1,042원')
    expect(html).not.toContain('≈ 1,042원')
  })

  it('원화 내역 수정은 기존 금액과 할인 항목을 유지한다', () => {
    const html = renderWithLedger(<EntryForm initial={tx({ currency: 'KRW' })} date="2026-10-31" onDateChange={() => {}} />)
    expect(html).not.toContain('외화 입력 안내')
    expect(html).toContain('금액 (원)')
    expect(html).toContain('할인 (선택)')
  })
})
