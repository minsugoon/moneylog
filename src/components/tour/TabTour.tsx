import { useCallback, useEffect, useRef, useState } from 'react'
import type { TabKey } from '../layout/navItems.ts'
import { useLedger } from '../../hooks/useLedger.ts'
import { isTourSeen, markTourSeen } from '../../utils/helpTours.ts'
import { TOURS } from '../../utils/helpTours.ts'
import CoachMark from './CoachMark.tsx'

interface TabTourProps { tab: TabKey; replayKey: number }

// 탭의 데이터가 준비된 뒤 필요한 안내를 연다.
function TabTour({ tab, replayKey }: TabTourProps) {
  const ledger = useLedger()
  const loading = ledger.accounts.loading || ledger.transactions.loading || ledger.cardPrograms.loading || ledger.fixedExpenses.loading
  const [open, setOpen] = useState(false)
  // 이미 처리한 "다시 보기" 신호. 상태로 두면 바꿀 때 아래 효과가 다시 돌아 열린 안내가 닫힌다
  const lastReplay = useRef(0)
  const previousTab = useRef(tab)

  useEffect(() => {
    if (previousTab.current !== tab) {
      if (open) markTourSeen(previousTab.current)
      setOpen(false)
      previousTab.current = tab
    }
  }, [tab, open])

  useEffect(() => {
    if (loading) return
    const timer = window.setTimeout(() => {
      const replay = replayKey > 0 && replayKey !== lastReplay.current
      if (replay) lastReplay.current = replayKey
      if (replay || !isTourSeen(tab)) setOpen(true)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [tab, replayKey, loading])

  // 안내를 닫고 이 탭의 본 기록을 저장한다.
  const close = useCallback(() => { setOpen(false); markTourSeen(tab) }, [tab])
  return open ? <CoachMark steps={TOURS[tab]} onClose={close} /> : null
}

export default TabTour
