import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AppShell from './components/layout/AppShell.tsx'

// 앱 틀(하단 탭·사이드바) 점검 테스트
describe('앱 레이아웃', () => {
  it('하단 탭에 선 아이콘과 메뉴 글자를 표시한다', () => {
    const html = renderToString(<AppShell pages={{}} />).replaceAll('<!-- -->', '')
    const bottomTabs = html.match(/<nav[^>]*md:hidden[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? ''

    expect(bottomTabs).toContain('내역')
    expect(bottomTabs).toContain('입력')
    expect(bottomTabs).toContain('보기')
    expect(bottomTabs).toContain('설정')
    expect(bottomTabs.match(/<svg/g)).toHaveLength(4)
    expect(bottomTabs.match(/aria-hidden="true"/g)).toHaveLength(4)
    expect(html).not.toContain('📋')
    expect(html).not.toContain('✏️')
    expect(html).not.toContain('📊')
    expect(html).not.toContain('⚙️')
  })
})

describe('PC 3단 배치', () => {
  const html = renderToString(<AppShell pages={{}} quickEntry={<p>빠른 입력 내용</p>} />).replaceAll('<!-- -->', '')

  it('사이드바는 768px 이상에서만, 224px 폭으로 보인다', () => {
    expect(html).toMatch(/<nav[^>]*hidden[^>]*w-56[^>]*md:flex/)
  })

  it('빠른 입력 패널은 1100px(pc) 이상에서만, 384px 폭으로 보이고 내용이 들어간다', () => {
    expect(html).toMatch(/<aside[^>]*hidden[^>]*w-96[^>]*pc:block/)
    expect(html).toContain('빠른 입력 내용')
  })

  it('하단 탭은 768px 이상에서 숨는다', () => {
    expect(html).toMatch(/<nav[^>]*fixed[^>]*md:hidden/)
  })

  it('본문은 768px 이상에서 안쪽 여백 24px를 쓴다', () => {
    expect(html).toContain('md:p-6')
  })
})
