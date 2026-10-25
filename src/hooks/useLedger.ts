import { useContext } from 'react'
import { LedgerContext, type LedgerValue } from './ledgerContext.ts'

// 화면에서 내 결제수단·내역 데이터를 꺼내 쓸 때 사용한다
export function useLedger(): LedgerValue {
  const value = useContext(LedgerContext)
  if (!value) throw new Error('LedgerProvider 안에서만 쓸 수 있어요.')
  return value
}
