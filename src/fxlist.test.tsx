import { describe, expect, it } from 'vitest'
import Badge from './components/Badge.tsx'
import DayGroup from './components/list/DayGroup.tsx'
import TransactionRow from './components/list/TransactionRow.tsx'
import HistoryPage from './pages/HistoryPage.tsx'
import { fakeLedger, renderWithLedger, tx } from './testing/ledgerFixtures.tsx'

describe('외화 내역 표시', () => {
  const estimatedTx = tx({ currency: 'VND', original_amount: 85000, exchange_rate: 0.0521, krw_confirmed: false })

  it('추정 외화 내역에 원화 추정 표시와 환율 정보를 보여준다', () => {
    const html = renderWithLedger(<TransactionRow entry={{ tx: estimatedTx, charge: 4429, info: null }} accountLabel="샘플" onSelect={() => {}} />)
    expect(html).toContain('≈')
    expect(html).toContain('VND')
    expect(html).toContain('85,000')
    expect(html).toContain('1동 = 0.0521원')
    expect(html).not.toContain('청구액 확정')
  })

  it('확정 외화 내역에는 확정 배지를 보이고 금액 추정 표시를 하지 않는다', () => {
    const html = renderWithLedger(<TransactionRow entry={{ tx: tx({ ...estimatedTx, krw_confirmed: true }), charge: 4429, info: null }} accountLabel="샘플" onSelect={() => {}} />)
    expect(html).toContain('청구액 확정')
    expect(html).not.toContain('≈')
  })

  it('원화 내역은 외화 줄과 추정 표시가 없다', () => {
    const html = renderWithLedger(<TransactionRow entry={{ tx: tx({}), charge: 10000, info: null }} accountLabel="샘플" onSelect={() => {}} />)
    expect(html).not.toContain('VND')
    expect(html).not.toContain('≈')
  })

  it('추정 외화 건이 있는 날에만 합계 앞에 근사 표시를 붙인다', () => {
    const estimated = renderWithLedger(<DayGroup date={estimatedTx.used_at} entries={[{ tx: estimatedTx, charge: 4429, info: null }]} onSelect={() => {}} />)
    const confirmed = renderWithLedger(<DayGroup date={estimatedTx.used_at} entries={[{ tx: tx({ ...estimatedTx, krw_confirmed: true }), charge: 4429, info: null }]} onSelect={() => {}} />)
    expect(estimated).toContain('≈ 4,429원')
    expect(confirmed).not.toContain('≈')
  })

  it('월 안내를 외화 추정 여부에 따라 표시한다', () => {
    const base = fakeLedger()
    const render = (items: ReturnType<typeof tx>[]) => renderWithLedger(<HistoryPage />, {
      ...base,
      transactions: { ...base.transactions, items },
      notes: { ...base.notes, items: [], byDate: new Map() },
    })
    expect(render([estimatedTx])).toContain('추정 금액(≈)')
    expect(render([tx({ ...estimatedTx, krw_confirmed: true })])).toContain('모두 청구액으로 확정했어요')
    expect(render([tx({})])).not.toContain('외화 결제')
  })

  it('새 배지 종류의 글자와 색 클래스를 보여준다', () => {
    const html = renderWithLedger(<><Badge kind="fx">VND</Badge><Badge kind="confirmed">청구액 확정</Badge></>)
    expect(html).toContain('bg-gray-100 text-gray-700')
    expect(html).toContain('bg-green-50 text-green-800')
    expect(html).toContain('VND')
    expect(html).toContain('청구액 확정')
  })
})
