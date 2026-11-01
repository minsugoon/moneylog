// 하단 탭(모바일)과 사이드바(태블릿·PC)가 함께 쓰는 메뉴 목록
export type TabKey = 'list' | 'entry' | 'view' | 'settings'

export interface NavItem {
  key: TabKey
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'list', label: '내역' },
  { key: 'entry', label: '입력' },
  { key: 'view', label: '보기' },
  { key: 'settings', label: '설정' },
]
