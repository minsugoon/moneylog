import { formatWon } from '../../utils/format.ts'
import { currencyDecimals } from '../../utils/currency.ts'
import { formatFxAmount, formatRateLabel, isEstimated } from '../../utils/fxDisplay.ts'
import type { MonthEntry } from '../../utils/summary.ts'
import Badge from '../Badge.tsx'

interface TransactionRowProps {
  entry: MonthEntry
  accountLabel: string
  onSelect: () => void
}

// 내역 한 줄. 눌러서 수정·삭제 창을 연다. 결제명 아래에 메모를 작은 글씨로 보여준다.
function TransactionRow({ entry, accountLabel, onSelect }: TransactionRowProps) {
  const { tx, charge, info } = entry
  const foreign = tx.currency !== 'KRW'
  const estimated = isEstimated(tx)

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-11 w-full items-start justify-between gap-3 px-1 py-3 text-left hover:bg-gray-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block break-words text-base text-gray-800">{tx.merchant}</span>
          {tx.memo && <span className="mt-0.5 block break-words text-xs text-gray-600">{tx.memo}</span>}
          {foreign && (
            <span className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-gray-600">
              <Badge kind="fx">{tx.currency}</Badge>
              {tx.original_amount !== null && (
                <span>{formatFxAmount(Math.round(tx.original_amount * 10 ** currencyDecimals(tx.currency)), tx.currency)}</span>
              )}
              {tx.original_amount !== null && tx.exchange_rate !== null && <span>·</span>}
              {tx.exchange_rate !== null && <span>{formatRateLabel(tx.currency, tx.exchange_rate)}</span>}
              {tx.krw_confirmed && <Badge kind="confirmed">청구액 확정</Badge>}
            </span>
          )}
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
            <span>{accountLabel}</span>
            {tx.is_cancel && <Badge kind="cancel">취소</Badge>}
            {tx.interest_free && <Badge kind="free">무이자</Badge>}
            {tx.is_fixed && <Badge kind="fixed">고정{tx.fixed_type ? ` · ${tx.fixed_type}` : ''}</Badge>}
          </span>
          {tx.installment_months > 1 && (
            <span className="mt-1 block text-xs text-gray-600">
              {tx.installment_months}개월 할부
              {info && ` · ${info.round}/${info.total}회차 · 월 ${formatWon(info.payment)} · 잔액 ${formatWon(info.balance)}`}
            </span>
          )}
        </span>
        <span className={`shrink-0 text-base font-bold tabular-nums ${charge < 0 ? 'text-red-600' : 'text-gray-800'}`}>
          {estimated && <span className="mr-0.5 text-xs font-normal text-gray-600">≈</span>}{formatWon(charge)}
        </span>
      </button>
    </li>
  )
}

export default TransactionRow
