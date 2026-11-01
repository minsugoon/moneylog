import { describe, expect, it } from 'vitest'
import EntryPage from './pages/EntryPage.tsx'
import { renderWithLedger } from './testing/ledgerFixtures.tsx'

describe('입력 화면 시안', () => {
  it('입력 방식 칩을 같은 폭으로 보여준다', () => {
    const html = renderWithLedger(<EntryPage />)
    expect(html).toContain('직접 입력')
    expect(html).toContain('문자 붙여넣기')
    expect(html).toContain('사진 입력')
    expect(html).toContain('grid grid-cols-3 gap-2')
  })

  it('직접 입력 폼과 하루 정리의 새 모양을 보여준다', () => {
    const html = renderWithLedger(<EntryPage />)
    const positions = ['결제명', '금액 (원)', '사용일', '결제수단', '고정지출 불러오기'].map((label) => html.indexOf(label))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))

    const amount = html.match(/<input id="[^"]*-amount"[^>]*>/)?.[0] ?? ''
    const discount = html.match(/<input id="[^"]*-discount"[^>]*>/)?.[0] ?? ''
    expect(amount).toContain('text-2xl')
    expect(amount).toContain('min-h-14')
    expect(discount).not.toContain('text-2xl')
    expect(discount).not.toContain('min-h-14')

    expect(html).toContain('할인 (선택)')
    expect(html).toContain('할부')
    expect(html).toContain('취소 건')
    expect(html).toContain('고정지출')
    expect(html).toContain('메모 (선택)')
    expect(html).toContain('하루 정리')
    expect(html).toContain('쓰면 자동으로 저장돼요.')
    expect(html).toContain('min-h-[88px]')
  })
})
