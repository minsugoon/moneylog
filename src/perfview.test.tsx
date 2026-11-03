import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import type { CardBenefit, CardProgram } from './lib/types.ts'
import ProgramCard from './components/views/ProgramCard.tsx'
import PerformanceView from './components/views/PerformanceView.tsx'
import ViewsPage from './pages/ViewsPage.tsx'
import { accountList, fakeLedger, renderWithLedger, tx } from './testing/ledgerFixtures.tsx'
import { computeAllPrograms, type CreditedTransaction } from './utils/performance.ts'
import { basisHint, nextStepText, periodOffsetLabel, reasonLabel, statusLabel } from './utils/performanceLabels.ts'

const program: CardProgram = { id: 'p1', account_id: 'a1', name: '생활 카드 실적', target_amount: 300000, measure_basis: 'previous_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: [], exclusion_modes: { interest_free: 'flag' }, is_active: true, sort_order: 0, created_at: '2026-01-01T00:00:00Z' }
const benefits: CardBenefit[] = [
  { id: 'b1', program_id: 'p1', name: '첫 혜택', required_amount: 300000, benefit_amount: 10000, benefit_kind: '기타', linked_keyword: null, memo: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'b2', program_id: 'p1', name: '추가 혜택', required_amount: 500000, benefit_amount: 10000, benefit_kind: '기타', linked_keyword: null, memo: null, created_at: '2026-01-01T00:00:00Z' },
]
function ledger(items = [tx({ id: 't1', amount: 100000 }), tx({ id: 't2', amount: 20000, interest_free: true })], currentBenefits = benefits) {
  const base = fakeLedger()
  return fakeLedger({ transactions: { ...base.transactions, items }, cardPrograms: { ...base.cardPrograms, programs: [program], benefits: currentBenefits } })
}

describe('카드 실적 보기 화면', () => {
  it('등록 조건이 없을 때 안내를 표시한다', () => {
    const html = renderWithLedger(<PerformanceView />)
    expect(html).toContain('아직 등록한 실적 조건이 없어요.')
    expect(html).toContain('내 입력 기준 참고용이에요.')
  })
  it('이번 기간 실적과 다음 혜택을 표시한다', () => {
    const html = renderWithLedger(<PerformanceView />, ledger())
    expect(html).toContain('120,000원')
    expect(html).toContain('/ 300,000원')
    expect(html).toContain('40%')
    expect(html).toContain('role="progressbar"')
    expect(html).toContain('남은 금액 180,000원')
    expect(html).toContain('제외될 수 있는 내역 1건')
    expect(html).toContain('이번 기간')
    expect(html).toContain('disabled=""')
    expect(html).toContain('300,000원까지 180,000원 남음 · 추가 혜택 10,000원')
    expect(html).toContain('받을 혜택 합계 0원')
  })
  it('목표 달성과 지난 기간에는 각기 맞는 문구를 표시한다', () => {
    const html = renderWithLedger(<PerformanceView />, ledger([tx({ id: 't1', amount: 310000 })]))
    expect(html).toContain('달성 ✓')
    expect(html).toContain('목표를 채웠어요!')
    expect(html).toContain('-10,000원')
    const past = { ...computeAllPrograms([program], [], [], () => '2026-09', '2026-11-03')[0], phase: 'past' as const, status: 'missed' as const }
    const pastHtml = renderToString(<ProgramCard result={past} account={accountList[0]} />)
    expect(pastHtml).toContain('미달성')
    expect(pastHtml).toContain('모자랐어요')
    expect(pastHtml).not.toContain('남은 금액')
    expect(pastHtml).not.toContain('하루')
    expect(pastHtml).not.toContain('일 남음')
  })
  it('보기 탭을 명세 순서로 표시한다', () => {
    const html = renderWithLedger(<ViewsPage />)
    expect(html.indexOf('기간별')).toBeLessThan(html.indexOf('결제수단별'))
    expect(html.indexOf('결제수단별')).toBeLessThan(html.indexOf('고정지출'))
    expect(html.indexOf('고정지출')).toBeLessThan(html.indexOf('카드 실적'))
  })
})

// 화면 문구 함수 (utils/performanceLabels.ts)
const row = (reason: CreditedTransaction['reason'], status: CreditedTransaction['status'] = 'included', keyword: string | null = null): CreditedTransaction => ({ tx: tx({}), amount: 10000, status, reason, keyword })

describe('카드 실적 문구', () => {
  it('모든 상태 문구와 색상을 표시한다', () => {
    expect(statusLabel('achieved')).toEqual({ text: '달성 ✓', className: 'bg-green-50 text-green-800' })
    expect(statusLabel('in_progress')).toEqual({ text: '진행 중', className: 'bg-blue-50 text-blue-800' })
    expect(statusLabel('warning')).toEqual({ text: '⚠ 주의', className: 'bg-amber-100 text-amber-800' })
    expect(statusLabel('missed')).toEqual({ text: '미달성', className: 'bg-gray-100 text-gray-700' })
    expect(statusLabel('upcoming')).toEqual({ text: '시작 전', className: 'bg-gray-100 text-gray-700' })
  })
  it('분류 이유를 설명한다', () => {
    expect(reasonLabel(row('override_include'))).toBe('직접 포함')
    expect(reasonLabel(row('override_exclude'))).toBe('직접 제외')
    expect(reasonLabel(row('cancel'))).toBe('취소 차감')
    expect(reasonLabel(row('interest_free', 'flagged'))).toBe('무이자 할부 · 제외될 수 있음')
    expect(reasonLabel(row('interest_free', 'excluded'))).toBe('무이자 할부 제외')
    expect(reasonLabel(row('keyword', 'excluded', '교통'))).toBe('제외 결제명: 교통')
    expect(reasonLabel(row(null))).toBeNull()
  })
  it('기간 위치를 표시한다', () => {
    expect(periodOffsetLabel(0)).toBe('이번 기간')
    expect(periodOffsetLabel(-1)).toBe('지난 기간')
    expect(periodOffsetLabel(-3)).toBe('3기간 전')
  })
  it('다음 단계와 실적 기준 문구를 만든다', () => {
    expect(nextStepText({ required: 300000, remaining: 180000, extra: 10000 })).toBe('300,000원까지 180,000원 남음 · 추가 혜택 10,000원')
    expect(basisHint('previous_month')).toBe('이 기간 실적으로 다음 달 혜택이 정해져요')
    expect(basisHint('current_month')).toBe('이 기간 실적으로 이번 달 혜택이 정해져요')
  })
})
