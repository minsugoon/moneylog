import { createContext } from 'react'
import type { useAccounts } from './useAccounts.ts'

// 화면 여러 곳(입력·내역·보기·설정)이 같은 데이터를 보도록 한 번만 불러와서 나눠 쓴다.
// 입력 화면에서 저장하면 내역 화면에도 바로 반영되는 이유다.
export interface LedgerValue {
  accounts: ReturnType<typeof useAccounts>
}

export const LedgerContext = createContext<LedgerValue | null>(null)
