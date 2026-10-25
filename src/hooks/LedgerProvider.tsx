import { useMemo, type ReactNode } from 'react'
import { LedgerContext } from './ledgerContext.ts'
import { useAccounts } from './useAccounts.ts'
import { useDailyNotes } from './useDailyNotes.ts'
import { useTransactions } from './useTransactions.ts'

interface LedgerProviderProps {
  // 로그인한 사용자 번호. 하루 정리를 저장할 때 쓴다 (내 것만 보이는 규칙은 DB가 따로 지킨다)
  userId: string
  children: ReactNode
}

// 로그인한 뒤의 화면 전체를 감싸서 데이터를 나눠 준다
function LedgerProvider({ userId, children }: LedgerProviderProps) {
  const accounts = useAccounts()
  const transactions = useTransactions()
  const notes = useDailyNotes(userId)
  const value = useMemo(() => ({ accounts, transactions, notes }), [accounts, transactions, notes])
  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}

export default LedgerProvider
