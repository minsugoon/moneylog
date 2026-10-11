import { NAV_ITEMS, type TabKey } from './navItems.ts'

interface BottomTabsProps {
  activeTab: TabKey
  onSelect: (tab: TabKey) => void
}

// 모바일(767px 이하) 전용 하단 탭. 아이폰 홈 인디케이터 영역(safe-area)을 피한다.
function BottomTabs({ activeTab, onSelect }: BottomTabsProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="주 메뉴"
    >
      <ul className="flex">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeTab
          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 text-sm ${
                  isActive ? 'font-bold text-brand' : 'text-gray-500'
                }`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomTabs
