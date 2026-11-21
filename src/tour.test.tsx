import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import AppShell from './components/layout/AppShell.tsx'
import CoachMark from './components/tour/CoachMark.tsx'
import { placeTooltip, spotlightBox } from './utils/coachLayout.ts'
import { TOURS } from './utils/helpTours.ts'
import { parseSeen } from './utils/helpTours.ts'

describe('안내 본 기록', () => {
  it('정상 배열과 모르는 키를 처리한다', () => {
    expect(parseSeen('["list","unknown","entry"]')).toEqual(['list', 'entry'])
  })
  it('깨진 JSON과 null은 빈 배열로 처리한다', () => {
    expect(parseSeen('{')).toEqual([])
    expect(parseSeen(null)).toEqual([])
  })
})

describe('탭별 안내 내용', () => {
  it('모든 탭의 안내와 필수 단계를 가진다', () => {
    expect(Object.keys(TOURS)).toEqual(['list', 'entry', 'view', 'settings'])
    for (const steps of Object.values(TOURS)) for (const step of steps) {
      expect(step.title.trim()).not.toBe('')
      expect(step.body.trim()).not.toBe('')
    }
    expect(TOURS.settings[0].target).toBe('settings-accounts')
    expect(TOURS.list[1].target).toBe('nav-settings')
  })
})

describe('코치 마크 위치', () => {
  it('강조 상자를 여백만큼 넓힌다', () => {
    expect(spotlightBox({ top: 10, left: 20, width: 30, height: 40 })).toEqual({ top: 4, left: 14, width: 42, height: 52 })
  })
  it('공간에 맞춰 말풍선을 배치하고 화면 안으로 자른다', () => {
    expect(placeTooltip({ top: 20, left: 100, width: 40, height: 20 }, { width: 400, height: 500 }, { width: 200, height: 100 }).side).toBe('below')
    expect(placeTooltip({ top: 360, left: 100, width: 40, height: 20 }, { width: 400, height: 500 }, { width: 200, height: 100 }).side).toBe('above')
    const crowded = placeTooltip({ top: 100, left: 0, width: 10, height: 10 }, { width: 200, height: 180 }, { width: 250, height: 160 })
    expect(crowded.top).toBeGreaterThanOrEqual(16)
    expect(crowded.left).toBe(16)
    expect(placeTooltip(null, { width: 400, height: 500 }, { width: 200, height: 100 }).side).toBe('center')
    expect(placeTooltip({ top: 10, left: 380, width: 10, height: 10 }, { width: 400, height: 500 }, { width: 200, height: 100 }).left).toBe(184)
    expect(placeTooltip({ top: 10, left: 0, width: 10, height: 10 }, { width: 400, height: 500 }, { width: 200, height: 100 }).left).toBe(16)
  })
})

describe('코치 마크 서버 렌더링', () => {
  it('단계 버튼과 접근성 정보를 그린다', () => {
    const html = renderToString(<CoachMark steps={TOURS.list} onClose={() => {}} />).replaceAll('<!-- -->', '')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('1/')
    expect(html).not.toContain('이전')
    expect(html).toContain('다음')
    expect(html).toContain('건너뛰기')
    expect(renderToString(<CoachMark steps={[TOURS.entry[0]]} onClose={() => {}} />).replaceAll('<!-- -->', '')).toContain('시작하기')
  })
  it('AppShell 안내 렌더 함수에 기본 탭을 전달한다', () => {
    let selected = ''
    renderToString(<AppShell pages={{}} renderTour={(state) => { selected = state.tab; return null }} />)
    expect(selected).toBe('list')
  })
})
