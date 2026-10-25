import { formatWon } from '../../utils/format.ts'
import type { MonthEntry } from '../../utils/summary.ts'

interface TransactionRowProps {
  entry: MonthEntry
  accountLabel: string
  onSelect: () => void
}

// 내역 한 줄. 눌러서 수정·삭제 창을 연다. 결제명 아래에 메모를 작은 글씨로 보여준다.
function TransactionRow({ entry, accountLabel, onSelect }: TransactionRowProps) {
  const { tx, charge, info } = entry

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-11 w-full items-start justify-between gap-3 px-1 py-3 text-left hover:bg-gray-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block break-words text-base text-gray-800">{tx.merchant}</span>
          {tx.memo && <span className="mt-0.5 block break-words text-xs text-gray-500">{tx.memo}</span>}
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
            <span>{accountLabel}</span>
            {tx.is_cancel && <span className="rounded-full bg-red-50 px-2 py-0.5 text-red-700">취소</span>}
            {tx.interest_free && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-800">무이자</span>}
            {tx.is_fixed && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
                고정{tx.fixed_type ? ` · ${tx.fixed_type}` : ''}
              </span>
            )}
          </span>
          {tx.installment_months > 1 && (
            <span className="mt-1 block text-xs text-gray-600">
              {tx.installment_months}개월 할부
              {info && ` · ${info.round}/${info.total}회차 · 월 ${formatWon(info.payment)} · 잔액 ${formatWon(info.balance)}`}
            </span>
          )}
        </span>
        <span className={`shrink-0 text-base font-bold tabular-nums ${charge < 0 ? 'text-red-600' : 'text-gray-800'}`}>
          {formatWon(charge)}
        </span>
      </button>
    </li>
  )
}

export default TransactionRow
