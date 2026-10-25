import { useState } from 'react'
import BasisToggle from '../components/BasisToggle.tsx'
import MonthSwitcher from '../components/MonthSwitcher.tsx'
import { chipClass, errorBoxClass, secondaryButtonClass } from '../components/ui.ts'
import AccountView from '../components/views/AccountView.tsx'
import FixedView from '../components/views/FixedView.tsx'
import PeriodView from '../components/views/PeriodView.tsx'
import { useLedger } from '../hooks/useLedger.ts'
import { useViewBasis } from '../hooks/useViewBasis.ts'
import { currentMonthKey } from '../utils/format.ts'

type ViewKey = 'fixed' | 'period' | 'account'

// 보기 탭 순서: 기간별 → 결제수단별 → 고정지출 (맨 앞이 처음 열리는 화면)
const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'period', label: '기간별' },
  { key: 'account', label: '결제수단별' },
  { key: 'fixed', label: '고정지출' },
]

// 보기 화면: 기간별 / 결제수단별 / 고정지출 (카드 실적 탭은 이후 단계에서 추가)
function ViewsPage() {
  const { transactions } = useLedger()
  const [view, setView] = useState<ViewKey>(VIEWS[0].key)
  const [month, setMonth] = useState(currentMonthKey)
  const [basis, setBasis] = useViewBasis()

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">보기</h2>

      <div className="flex flex-wrap gap-2" role="group" aria-label="보기 종류">
        {VIEWS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={view === item.key}
            onClick={() => setView(item.key)}
            className={chipClass(view === item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view !== 'period' && <MonthSwitcher month={month} onChange={setMonth} />}
      <BasisToggle basis={basis} onChange={setBasis} />

      {transactions.loading ? (
        <p className="py-8 text-center text-sm text-gray-500">내역을 불러오고 있어요…</p>
      ) : transactions.error ? (
        <div className="flex flex-col items-start gap-2">
          <p className={errorBoxClass} role="alert">
            {transactions.error}
          </p>
          <button type="button" onClick={() => void transactions.reload()} className={secondaryButtonClass}>
            다시 불러오기
          </button>
        </div>
      ) : view === 'fixed' ? (
        <FixedView month={month} basis={basis} />
      ) : view === 'period' ? (
        <PeriodView basis={basis} />
      ) : (
        <AccountView month={month} basis={basis} />
      )}
    </div>
  )
}

export default ViewsPage
