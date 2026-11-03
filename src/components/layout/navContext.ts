import { createContext, useContext } from 'react'

// 다른 탭의 특정 화면으로 이동하는 통로. 화면 틀(AppShell)이 값을 넣고, 틀 밖에서는 아무 일도 하지 않는다.
export type ViewTarget = 'period' | 'account' | 'fixed' | 'performance'

export interface NavValue {
  goToView: (view: ViewTarget) => void
  pendingView: ViewTarget | null
  clearPendingView: () => void
}

export const NavContext = createContext<NavValue>({ goToView: () => {}, pendingView: null, clearPendingView: () => {} })

export function useNav(): NavValue {
  return useContext(NavContext)
}
