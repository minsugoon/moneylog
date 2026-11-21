import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import HelpTopicItem from './components/help/HelpTopicItem.tsx'
import HelpView from './components/help/HelpView.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import { renderWithLedger } from './testing/ledgerFixtures.tsx'
import { TOURS } from './utils/helpTours.ts'
import { HELP_TOPICS } from './utils/helpTopics.ts'

describe('도움말 내용', () => {
  it('11개 항목의 id가 겹치지 않고 모든 섹션에 글이 있어요', () => {
    expect(HELP_TOPICS).toHaveLength(11)
    expect(new Set(HELP_TOPICS.map((topic) => topic.id)).size).toBe(11)
    expect(HELP_TOPICS.every((topic) => topic.sections.length > 0 && topic.sections.every((section) => section.heading && section.lines.length > 0))).toBe(true)
    expect(HELP_TOPICS.filter((topic) => topic.tourTab === null).map((topic) => topic.id)).toEqual(['faq'])
  })
})

describe('도움말 화면', () => {
  it('제목과 접힌 도움말 항목을 보여줘요', () => {
    const html = renderWithLedger(<HelpView onBack={() => {}} />)
    expect(html).toContain('도움말')
    expect(html).toContain('‹ 설정으로')
    for (const topic of HELP_TOPICS) expect(html).toContain(topic.title)
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(11)
  })

  it('접힌 항목에는 안내 다시 보기 버튼이 없어요', () => {
    const html = renderToString(<HelpTopicItem topic={HELP_TOPICS[0]} onReplay={() => {}} />)
    expect(html).not.toContain('이 화면 안내 다시 보기')
  })
})

describe('설정 도움말 연결', () => {
  it('도움말이 내 계정 앞에 있고 설정 안내 대상이 모두 있어요', () => {
    const html = renderWithLedger(<SettingsPage email="sample@example.test" provider="email" onSignOut={async () => ({ ok: true })} />)
    expect(html).toContain('data-coach="settings-help"')
    expect(html).toContain('❓ 도움말')
    expect(html.indexOf('settings-help')).toBeLessThan(html.indexOf('내 계정'))
    for (const { target } of TOURS.settings) {
      if (target) expect(html).toContain(`data-coach="${target}"`)
    }
  })
})
