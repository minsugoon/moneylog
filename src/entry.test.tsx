import { describe, expect, it } from 'vitest'
import EntryPage from './pages/EntryPage.tsx'
import EntryPanel from './components/entry/EntryPanel.tsx'
import FixedLoadPanel from './components/entry/FixedLoadPanel.tsx'
import { listFixedLoadOptions } from './utils/fixedLoadOptions.ts'
import { fakeLedger, renderWithLedger, txList } from './testing/ledgerFixtures.tsx'

describe('입력 화면 시안', () => {
  it('입력 방식 칩을 같은 폭으로 보여준다', () => {
    const html = renderWithLedger(<EntryPage />)
    expect(html).toContain('직접 입력')
    expect(html).toContain('문자 붙여넣기')
    expect(html).toContain('사진 입력')
    expect(html).toContain('grid grid-cols-[1fr_1.4fr_1fr] gap-2')
    expect(html).toContain('✍️')
    expect(html).toContain('💬')
    expect(html).toContain('📷')
  })

  it('직접 입력 폼과 하루 정리의 새 모양을 보여준다', () => {
    const html = renderWithLedger(<EntryPage />)
    const positions = ['고정지출 불러오기', '결제명', '금액 (원)', '사용일', '결제수단'].map((label) => html.indexOf(label))
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

  it('직접 입력 패널에만 플로팅 저장 버튼을 보여준다', () => {
    const enabled = renderWithLedger(<EntryPanel floatingSave />)
    const disabled = renderWithLedger(<EntryPanel />)
    expect(enabled).toContain('fixed')
    expect(enabled).toContain('rounded-full')
    expect(enabled).toContain('type="submit"')
    expect(disabled).not.toContain('fixed right-')
  })

  it('고정지출 불러오기 박스에 빈 안내를 보여준다', () => {
    const ledger = fakeLedger({
      transactions: { ...fakeLedger().transactions, items: txList.filter((item) => !item.is_fixed) },
    })
    const html = renderWithLedger(<EntryPage />, ledger)
    expect(html).toContain('rounded-xl')
    expect(html).toContain('bg-gray-50')
    expect(html).toContain('아직 고정지출로 저장한 내역이 없어요.')
  })

  it('펼친 고정지출 불러오기 박스에 저장 내역을 보여준다', () => {
    const options = listFixedLoadOptions(txList, 10)
    const html = renderWithLedger(<FixedLoadPanel options={options} onPick={() => {}} defaultOpen />)
    expect(html).toContain('📌 고정지출 불러오기')
    expect(html).toContain('rounded-xl')
    expect(html).toContain('bg-gray-50')
    expect(html).toContain('통신비')
    expect(html).toContain('55,000원')
    expect(html).toContain('2026-11-01')
  })
})
