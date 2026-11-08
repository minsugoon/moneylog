import { useFxCurrencies } from '../../hooks/useFxCurrencies.ts'
import { useExchangeRate } from '../../hooks/useExchangeRate.ts'
import { FX_CURRENCIES } from '../../utils/currency.ts'
import { formatRateLabel, formatRateTime } from '../../utils/fxDisplay.ts'
import { RATE_CREDIT } from '../../utils/fxRates.ts'
import { cardClass } from '../ui.ts'

function CurrencySection() {
  const { codes, toggle, reset } = useFxCurrencies()
  const { live, cached, refreshing, notice, refresh } = useExchangeRate()
  const snapshot = live ?? cached
  const hasRates = FX_CURRENCIES.some((currency) => typeof snapshot?.rates[currency.code] === 'number')

  return (
    <section className={cardClass} aria-labelledby="currency-title">
      <h3 id="currency-title" className="text-sm font-bold text-gray-600">통화</h3>
      <p className="mt-1 text-xs text-gray-600">입력 탭에서 외화로 입력할 때 보여 줄 통화에 체크해요. 원화는 항상 보여요.</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-2 text-xs font-bold text-gray-600">
        <span>통화</span>
        <span className="text-right">현재 환율</span>
        <span className="text-center">표시</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {FX_CURRENCIES.map((currency) => {
          const selected = codes.includes(currency.code)
          const rate = snapshot?.rates[currency.code]
          return (
            <li key={currency.code}>
              <label className="grid grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-2 min-h-11 cursor-pointer">
                <span className="flex items-baseline gap-2">
                  <span className="text-base text-gray-800">{currency.label}</span>
                  <span className="text-xs text-gray-600">{currency.code}</span>
                </span>
                <span className="text-sm tabular-nums text-gray-700 text-right">
                  {typeof rate === 'number' ? formatRateLabel(currency.code, rate) : '—'}
                </span>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(currency.code)}
                  aria-label={`${currency.label} 입력 화면에 표시`}
                  className="h-5 w-5 accent-brand justify-self-center"
                />
              </label>
            </li>
          )
        })}
      </ul>
      {!hasRates && <p className="mt-1 text-xs text-gray-600">환율을 아직 받지 못했어요.</p>}
      <button type="button" onClick={reset} className="mt-2 min-h-11 text-sm font-bold text-brand">기본값으로 되돌리기</button>
      <div className="mt-2 flex flex-wrap items-center gap-x-3">
        {snapshot && <span className="text-xs text-gray-600">{formatRateTime(snapshot.fetchedAt)} 기준</span>}
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="min-h-11 text-xs text-brand disabled:opacity-50">
          {refreshing ? '받는 중…' : '↻ 환율 새로고침'}
        </button>
      </div>
      {notice && <p className="mt-1 text-xs text-gray-600">{notice}</p>}
      <p className="mt-3 text-xs text-gray-600">환율은 입력하는 순간의 값을 내역에 함께 저장해요. 나중에 환율이 바뀌어도 이미 적은 금액은 변하지 않아요.</p>
      <a href={RATE_CREDIT.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs text-gray-600 underline">{RATE_CREDIT.text}</a>
    </section>
  )
}

export default CurrencySection
