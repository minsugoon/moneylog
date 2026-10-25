import { useMemo, type ReactNode } from 'react'
import { LedgerContext } from './ledgerContext.ts'
import { useAccounts } from './useAccounts.ts'

// 로그인한 뒤의 화면 전체를 감싸서 데이터를 나눠 준다
function LedgerProvider({ children }: { children: ReactNode }) {
  const accounts = useAccounts()
  const value = useMemo(() => ({ accounts }), [accounts])
  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}

export default LedgerProvider
