import { describe, expect, it } from 'vitest'
import AccountView from './components/views/AccountView.tsx'
import BarRow from './components/views/BarRow.tsx'
import FixedView from './components/views/FixedView.tsx'
import ViewsPage from './pages/ViewsPage.tsx'
import { fakeLedger, renderWithLedger } from './testing/ledgerFixtures.tsx'
import { currentMonthKey } from './utils/format.ts'
import { tx } from './testing/ledgerFixtures.tsx'

describe('보기 화면 시안', () => {
  it('기간별 보기의 첫 화면에 합계와 월별 지출을 보여준다', () => {
    const html = renderWithLedger(<ViewsPage />)
    expect(html).toContain('보기')
    expect(html).toContain('기간별')
    expect(html).toContain('결제수단별')
    expect(html).toContain('고정지출')
    expect(html).toContain('grid-cols-3')
    expect(html).toContain('bg-brand')
    expect(html).toContain('월별 지출')
    expect(html).not.toContain('고정지출 총합')
  })

  it('결제수단별 항목을 합쳐 금액 순서로 보여준다', () => {
    const html = renderWithLedger(<AccountView month={currentMonthKey()} basis="usage" />)
    expect(html).toContain('결제수단별')
    expect(html).toContain('bg-brand')
    expect(html).toContain('신한카드 · 생활카드 (5678)')
    expect(html).toContain('카카오뱅크 · 월급통장 (1234)')
    expect(html).toContain('%')
    expect(html.indexOf('카카오뱅크 · 월급통장 (1234)')).toBeLessThan(html.indexOf('신한카드 · 생활카드 (5678)'))
  })

  it('고정지출 종류를 소계가 큰 순서로 보여준다', () => {
    const ledger = fakeLedger()
    ledger.transactions = { ...ledger.transactions, items: [
      ...ledger.transactions.items,
      tx({ id: 'fixed-other', merchant: '샘플구독', amount: 70000, is_fixed: true, fixed_type: '구독' }),
    ] }
    const html = renderWithLedger(<FixedView month={currentMonthKey()} basis="usage" />, ledger)
    expect(html).toContain('고정지출 총합')
    expect(html).toContain('bg-brand')
    expect(html.indexOf('구독 소계')).toBeLessThan(html.indexOf('통신 소계'))
  })

  it('BarRow strong이면 기간 이름을 굵게 표시한다', () => {
    const html = renderWithLedger(<BarRow label="2026년 11월" value={1} max={1} valueLabel="1원" strong />)
    expect(html).toContain('font-bold')
  })
})
