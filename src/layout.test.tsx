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
