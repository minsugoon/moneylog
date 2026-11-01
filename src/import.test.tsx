import { describe, expect, it } from 'vitest'
import PasteImport from './components/entry/PasteImport.tsx'
import { renderWithLedger } from './testing/ledgerFixtures.tsx'

describe('문자 붙여넣기 화면', () => {
  it('라벨과 큰 입력칸, 설명 및 읽기 버튼을 표시한다', () => {
    const html = renderWithLedger(<PasteImport />)
    expect(html).toContain('카드 승인 문자')
    expect(html).toContain('min-h-[280px]')
    expect(html).toContain('resize-none')
    expect(html).toContain('문자를 그대로 붙여넣으면 사용일·결제명·금액을 읽어 줘요. 저장하기 전에 한 번 더 확인할 수 있어요.')
    expect(html).toContain('읽기')
  })
})
