import { describe, expect, it } from 'vitest'
import TransactionRow from './components/list/TransactionRow.tsx'
import HistoryPage from './pages/HistoryPage.tsx'
import { fakeLedger, renderWithLedger, tx } from './testing/ledgerFixtures.tsx'

describe('내역 시안', () => {
  it('제목과 이번 달 버튼, 브랜드 합계 카드를 보여준다', () => {
    const html = renderWithLedger(<HistoryPage />)
    expect(html).toContain('내역')
    expect(html).toContain('이번 달')
    expect(html).toContain('합계')
    expect(html).toContain('bg-brand')
  })

  it('날짜가 있으면 흐름의 선과 점을 보여주고 비어 있으면 점이 없다', () => {
    const html = renderWithLedger(<HistoryPage />)
    expect(html).toContain('bg-gray-300')
    expect(html).toContain('border-brand')

    const empty = fakeLedger({
      transactions: { ...fakeLedger().transactions, items: [] },
      notes: { ...fakeLedger().notes, items: [], byDate: new Map() },
    })
    expect(renderWithLedger(<HistoryPage />, empty)).not.toContain('absolute -left-6 top-5 h-3 w-3 rounded-full border-[3px] border-brand bg-app-bg')
  })

  it('취소, 무이자, 고정 배지를 보여준다', () => {
    const ledger = fakeLedger()
    const html = renderWithLedger(
      <ul>
        <TransactionRow entry={{ tx: tx({ is_cancel: true }), charge: -10000, info: null }} accountLabel="샘플" onSelect={() => {}} />
        <TransactionRow entry={{ tx: tx({ interest_free: true }), charge: 10000, info: null }} accountLabel="샘플" onSelect={() => {}} />
        <TransactionRow entry={{ tx: tx({ is_fixed: true, fixed_type: '통신' }), charge: 10000, info: null }} accountLabel="샘플" onSelect={() => {}} />
      </ul>,
      ledger,
    )
    expect(html).toContain('취소')
    expect(html).toContain('무이자')
    expect(html).toContain('고정 · 통신')
  })
})

