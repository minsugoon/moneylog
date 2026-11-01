import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import BasisToggle from './components/BasisToggle.tsx'
import PeriodView from './components/views/PeriodView.tsx'
import { chipClass } from './components/ui.ts'
import { renderWithLedger } from './testing/ledgerFixtures.tsx'

describe('화면 다듬기', () => {
  it('compact 칩은 줄바꿈을 막고 기본 칩은 전체 폭을 쓰지 않는다', () => {
    expect(chipClass(true, true)).toContain('whitespace-nowrap')
    expect(chipClass(true, true)).toContain('text-sm')
    expect(chipClass(true)).not.toContain('w-full')
  })

  it('보기 기준을 탭으로 표시한다', () => {
    const html = renderToString(<BasisToggle basis="usage" onChange={() => {}} />)
    expect(html).toContain('role="tablist"')
    expect(html).toContain('사용일 기준')
    expect(html).toContain('월 납부액 기준')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('border-brand')
    expect(html).toContain('쓴 달에 결제 금액 전체를 계산해요.')
    expect(html).not.toContain('aria-pressed')
  })

  it('기간 선택을 한 줄 보조 메뉴로 표시한다', () => {
    const html = renderWithLedger(<PeriodView basis="usage" />)
    expect(html).toContain('이번 달')
    expect(html).toContain('지난 달')
    expect(html).toContain('최근 3개월')
    expect(html).toContain('올해')
    expect(html).toContain('직접 선택')
    expect(html).toContain('overflow-x-auto')
    expect(html).toContain('whitespace-nowrap')
    expect(html).toContain('bg-gray-100')
  })
})
