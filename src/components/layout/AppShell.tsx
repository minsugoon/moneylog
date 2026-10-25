import { useState, type ReactNode } from 'react'
import type { TabKey } from './navItems.ts'
import BottomTabs from './BottomTabs.tsx'
import SideNav from './SideNav.tsx'
import QuickEntryPanel from './QuickEntryPanel.tsx'

interface AppShellProps {
  // 탭마다 보여줄 화면. 아직 없는 탭은 비워 둔다.
  pages: Partial<Record<TabKey, ReactNode>>
  // PC에서 오른쪽에 항상 보이는 "빠른 입력" 패널의 내용
  quickEntry?: ReactNode
}

// 화면 틀: 폭에 따라 배치만 바뀐다 (CSS로만 구분)
// 모바일: 본문 + 하단 탭 / 태블릿: 사이드바 + 본문 / PC: 사이드바 + 본문 + 빠른 입력
function AppShell({ pages, quickEntry }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('list')

  return (
    <div className="flex min-h-dvh">
      <SideNav activeTab={activeTab} onSelect={setActiveTab} />

      {/* 본문. 모바일에서는 하단 탭에 가리지 않도록 아래 여백을 둔다 */}
      <main className="min-w-0 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-2 md:hidden">
          <h1 className="text-xl font-bold text-brand">Moneylog</h1>
        </header>
        <section className="p-4 md:p-6" aria-label="본문">
          {pages[activeTab]}
        </section>
      </main>

      <QuickEntryPanel>{quickEntry}</QuickEntryPanel>
      <BottomTabs activeTab={activeTab} onSelect={setActiveTab} />
    </div>
  )
}

export default AppShell
