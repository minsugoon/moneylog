import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Badge from './components/Badge.tsx'
import SummaryCard from './components/SummaryCard.tsx'
import { primaryButtonClass } from './components/ui.ts'

describe('공통 부품', () => {
  it('합계 카드에 라벨과 금액과 설명을 표시하고 설명이 없으면 생략한다', () => {
    const html = renderToString(<SummaryCard label="이번 달" amount="1,284,500원" sub="지난달보다 증가" />)
    expect(html).toContain('이번 달')
    expect(html).toContain('1,284,500원')
    expect(html).toContain('지난달보다 증가')
    expect(html).toContain('bg-brand')
    expect(html).toContain('tabular-nums')

    const withoutSub = renderToString(<SummaryCard label="이번 달" amount="1,284,500원" />)
    expect(withoutSub).not.toContain('지난달보다 증가')
  })

  it('여덟 종류의 배지를 지정한 색과 글자로 표시한다', () => {
    const colors = {
      cancel: 'bg-red-50', free: 'bg-green-50', fixed: 'bg-blue-50', dup: 'bg-red-600',
      maybe: 'bg-amber-100', income: 'bg-gray-100', fail: 'bg-red-100', perf: 'bg-amber-100',
    } as const

    for (const [kind, color] of Object.entries(colors)) {
      const html = renderToString(<Badge kind={kind as keyof typeof colors}>{kind}</Badge>)
      expect(html).toContain(kind)
      expect(html).toContain(color)
    }
  })

  it('주 버튼의 비활성 색을 지정한다', () => {
    expect(primaryButtonClass).toContain('disabled:bg-gray-200')
  })
})
