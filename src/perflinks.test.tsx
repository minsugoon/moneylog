import { describe, expect, it } from 'vitest'
import { renderWithLedger, fakeLedger, tx, today } from './testing/ledgerFixtures.tsx'
import PerformanceStrip from './components/list/PerformanceStrip.tsx'
import { fixedDiscountFor, pickStripItems, stripLine } from './utils/performanceLinks.ts'
import type { CardBenefit, CardProgram } from './lib/types.ts'
import { computeAllPrograms, currentPeriodKey } from './utils/performance.ts'

const program: CardProgram = { id: 'p1', account_id: 'a1', name: '생활 실적', target_amount: 300000, measure_basis: 'current_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: [], exclusion_modes: { interest_free: 'ignore' }, is_active: true, sort_order: 0, created_at: '2026-01-01T00:00:00Z' }
const benefit: CardBenefit = { id: 'b1', program_id: 'p1', name: '렌탈 할인', required_amount: null, benefit_amount: 10000, benefit_kind: '렌탈', linked_keyword: '코웨이샘플', memo: null, created_at: '2026-01-01T00:00:00Z' }

describe('실적 화면 연결', () => {
  it('연결 결제명에 해당하는 혜택을 합산한다', () => {
    expect(fixedDiscountFor('코웨이샘플 렌탈', [program], [benefit])).toBe(10000)
    expect(fixedDiscountFor('다른 결제', [program], [benefit])).toBe(0)
  })

  it('현재 기간 실적 요약을 그린다', () => {
    const base = fakeLedger()
    const html = renderWithLedger(<PerformanceStrip />, fakeLedger({
      transactions: { ...base.transactions, items: [tx({ id: 'today', amount: 260000, used_at: today })] },
      cardPrograms: { ...base.cardPrograms, programs: [program] },
    }))
    expect(html).toContain('카드 실적 자세히 보기')
    expect(html).toContain('자세히 ›')
    expect(html).toContain('86%')
  })

  it('요약 줄에 남은 금액과 날짜를 표시한다', () => {
    const result = computeAllPrograms([program], [], [tx({ amount: 255000 })], (item) => currentPeriodKey(item, today), today)[0]
    expect(stripLine({ ...result, percent: 85, remaining: 45000, daysLeft: 3 })).toBe('생활 실적 85% · 45,000원 남음 · 3일 남음')
    expect(pickStripItems([result])).toHaveLength(1)
  })
})
