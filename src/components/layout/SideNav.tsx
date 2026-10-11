import { NAV_ITEMS, type TabKey } from './navItems.ts'

interface SideNavProps {
  activeTab: TabKey
  onSelect: (tab: TabKey) => void
}

// 태블릿·PC(768px 이상) 전용 왼쪽 사이드바
function SideNav({ activeTab, onSelect }: SideNavProps) {
  return (
    <nav
      className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-6 md:flex"
      aria-label="주 메뉴"
    >
      <h1 className="mb-6 px-3 text-xl font-bold text-brand">Moneylog</h1>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeTab
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-base ${
                  isActive ? 'bg-brand/10 font-bold text-brand' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default SideNav
