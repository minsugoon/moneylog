import { createContext } from 'react'
import type { useAccounts } from './useAccounts.ts'
import type { useDailyNotes } from './useDailyNotes.ts'
import type { useFixedExpenses } from './useFixedExpenses.ts'
import type { useFixedTypes } from './useFixedTypes.ts'
import type { useCardPrograms } from './useCardPrograms.ts'
import type { useTransactions } from './useTransactions.ts'

// 화면 여러 곳(입력·내역·보기·설정)이 같은 데이터를 보도록 한 번만 불러와서 나눠 쓴다.
// 입력 화면에서 저장하면 내역 화면에도 바로 반영되는 이유다.
export interface LedgerValue {
  accounts: ReturnType<typeof useAccounts>
  transactions: ReturnType<typeof useTransactions>
  notes: ReturnType<typeof useDailyNotes>
  fixedExpenses: ReturnType<typeof useFixedExpenses>
  fixedTypes: ReturnType<typeof useFixedTypes>
  cardPrograms: ReturnType<typeof useCardPrograms>
}

export const LedgerContext = createContext<LedgerValue | null>(null)
