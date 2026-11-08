import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import ProgramCard from './components/views/ProgramCard.tsx'
import { accountList } from './testing/ledgerFixtures.tsx'
import { computeProgramResult } from './utils/performance.ts'
import type { CardProgram } from './lib/types.ts'
import type { Forecast } from './utils/performanceForecast.ts'
import FixedView from './components/views/FixedView.tsx'
import { fakeLedger, renderWithLedger } from './testing/ledgerFixtures.tsx'

const program: CardProgram = { id: 'p', account_id: 'a1', name: '카드샘플', target_amount: 500000, measure_basis: 'current_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: [], exclusion_modes: {}, is_active: true, sort_order: 0, created_at: '2026-01-01' }
const forecast: Forecast = { pending: [{ expense: { id: 'pending', merchant: '구독샘플', account_id: 'a1', amount: 100000, pay_day: 20, fixed_type: '구독', created_at: '2026-01-01' }, amount: 100000, expectedDate: '2026-10-20' }], pendingTotal: 100000, expectedTotal: 350000, expectedRemaining: 150000, expectedPercent: 70, expectedBarPercent: 70 }

describe('고정지출 예상 표시', () => {
  it('카드에 결제 예정과 예상 실적을 표시한다', () => {
    const result = { ...computeProgramResult({ program, benefits: [], transactions: [], periodKey: '2026-10', today: '2026-10-10' }), total: 250000, program }
    const html = renderToString(<ProgramCard result={result} account={accountList[0]} forecast={forecast} />).replaceAll('<!-- -->', '')
    expect(html).toContain('bg-orange-400')
    expect(html).toContain('결제 예정 고정지출 +100,000원')
    expect(html).toContain('고정지출 포함 예상 350,000원 · 예상 잔여 150,000원')
    expect(html).toContain('role="progressbar"')
  })
})

describe('등록한 고정지출 패널', () => {
  it('등록 항목이 없으면 제목을 표시하지 않는다', () => {
    expect(renderWithLedger(<FixedView month="2026-10" basis="usage" />)).not.toContain('등록한 고정지출')
  })
  it('등록 항목 제목과 접힌 상태를 표시한다', () => {
    const ledger = fakeLedger({ fixedExpenses: { ...fakeLedger().fixedExpenses, items: [{ id: 'f', merchant: '구독샘플', account_id: 'a1', amount: 100000, pay_day: 20, fixed_type: '구독', created_at: '2026-01-01' }] } })
    const html = renderWithLedger(<FixedView month="2026-10" basis="usage" />, ledger)
    expect(html).toContain('등록한 고정지출 (1개 · 매달 100,000원)')
    expect(html).toContain('aria-expanded="false"')
  })
})
