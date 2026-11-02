import type { Transaction } from '../../lib/types.ts'
import { currencyDecimals } from '../../utils/currency.ts'
import { formatFxAmount, isEstimated } from '../../utils/fxDisplay.ts'
import { formatWon } from '../../utils/format.ts'

interface FxEditNoticeProps {
  tx: Transaction
}

function FxEditNotice({ tx }: FxEditNoticeProps) {
  const estimated = isEstimated(tx)
  const minor = tx.original_amount === null ? null : Math.round(tx.original_amount * 10 ** currencyDecimals(tx.currency))
  return (
    <section aria-label="외화 입력 안내" className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
      <div className="space-y-1">
        <p className="font-bold text-gray-800">{tx.currency} · 입력 당시 환율</p>
        {minor !== null && tx.exchange_rate !== null && (
          <p className="tabular-nums text-gray-700">
            {formatFxAmount(minor, tx.currency)} {tx.currency} × {String(tx.exchange_rate)} = {estimated ? '≈ ' : ''}{formatWon(tx.amount)}
          </p>
        )}
        <p className="text-xs text-gray-600">
          {estimated
            ? '환율로 계산한 추정 금액이에요. 카드 명세서가 나오면 아래 원화 금액을 청구액으로 고쳐 주세요. 고치면 ≈ 표시가 사라져요.'
            : '카드 청구액으로 확정한 금액이에요.'}
        </p>
      </div>
    </section>
  )
}

export default FxEditNotice
