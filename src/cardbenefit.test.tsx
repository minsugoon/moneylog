import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import BenefitForm from './components/settings/BenefitForm.tsx'
import BenefitList from './components/settings/BenefitList.tsx'
import CardProgramRow from './components/settings/CardProgramRow.tsx'
import type { CardBenefit, CardProgram } from './lib/types.ts'
import { fakeLedger, renderWithLedger } from './testing/ledgerFixtures.tsx'
import type { BenefitDraft } from './utils/cardProgramInput.ts'

const program: CardProgram = { id: 'p1', account_id: 'a1', name: '생활카드 실적', target_amount: 300000, measure_basis: 'previous_month', installment_mode: 'full', period_start_day: 1, exclude_keywords: [], exclusion_modes: {}, is_active: true, sort_order: 0, created_at: '2026-01-01T00:00:00Z' }
const other: CardProgram = { ...program, id: 'p2', name: '다른 실적' }
const benefits: CardBenefit[] = [
  { id: 'b1', program_id: 'p1', name: '추가 할인', required_amount: 500000, benefit_amount: 10000, benefit_kind: '기타', linked_keyword: null, memo: null, created_at: '2026-01-03T00:00:00Z' },
  { id: 'b2', program_id: 'p1', name: '통신 할인', required_amount: null, benefit_amount: 5000, benefit_kind: '통신', linked_keyword: null, memo: null, created_at: '2026-01-02T00:00:00Z' },
  { id: 'b3', program_id: 'p1', name: '정수기 할인', required_amount: 300000, benefit_amount: 10000, benefit_kind: '렌탈', linked_keyword: '코웨이샘플', memo: '샘플 메모', created_at: '2026-01-01T00:00:00Z' },
  { id: 'b4', program_id: 'p2', name: '다른 프로그램 혜택', required_amount: 1, benefit_amount: 1, benefit_kind: '기타', linked_keyword: null, memo: null, created_at: '2026-01-01T00:00:00Z' },
]
const ledger = fakeLedger({ cardPrograms: { ...fakeLedger().cardPrograms, programs: [program, other], benefits } })

describe('카드 혜택 관리', () => {
  it('혜택을 조건 순서로 보여주고 다른 프로그램은 제외한다', () => {
    const html = renderWithLedger(<BenefitList program={program} />, ledger)
    const namePosition = (name: string) => html.indexOf(`<p class="text-base font-bold text-gray-800">${name}</p>`)
    expect(namePosition('정수기 할인')).toBeLessThan(namePosition('통신 할인'))
    expect(namePosition('통신 할인')).toBeLessThan(namePosition('추가 할인'))
    for (const text of ['300,000원 이상(목표 금액)', '500,000원 이상', '연결: 코웨이샘플', '샘플 메모', '-10,000원', '정수기 할인 수정', '+ 혜택 추가']) expect(html).toContain(text)
    expect(html).not.toContain('다른 프로그램 혜택')
  })

  it('혜택이 없으면 안내 문구를 보여준다', () => {
    const html = renderWithLedger(<BenefitList program={program} />, fakeLedger())
    expect(html).toContain('아직 등록한 혜택이 없어요.')
  })

  it('빈 입력값과 기본 혜택 종류를 보여준다', () => {
    const initial: BenefitDraft = { name: '', required_amount: null, benefit_amount: null, benefit_kind: '기타', linked_keyword: '', memo: '' }
    const html = renderToString(<BenefitForm initial={initial} targetAmount={300000} submitLabel="추가" onSubmit={async () => ({ ok: true })} onCancel={() => {}} />)
    for (const label of ['혜택 이름', '혜택 금액', '필요 실적 (선택)', '혜택 종류', '연결 결제명 (선택)', '메모 (선택)', '비우면 300,000원']) expect(html).toContain(label)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
  })

  it('혜택 목록을 처음에는 접어 둔다', () => {
    const html = renderWithLedger(<CardProgramRow program={program} benefitCount={2} onEdit={() => {}} onToggleActive={() => {}} onDelete={() => {}} busy={false} />)
    expect(html).toContain('혜택 관리 (2개)')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('🔽')
    expect(html).not.toContain('아직 등록한 혜택이 없어요.')
  })
})
