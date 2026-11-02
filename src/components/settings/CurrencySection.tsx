import { useFxCurrencies } from '../../hooks/useFxCurrencies.ts'
import { useExchangeRate } from '../../hooks/useExchangeRate.ts'
import { FX_CURRENCIES } from '../../utils/currency.ts'
import { formatRateLabel, formatRateTime } from '../../utils/fxDisplay.ts'
import { RATE_CREDIT } from '../../utils/fxRates.ts'
import { cardClass, chipClass } from '../ui.ts'

function CurrencySection() {
  const { codes, toggle, reset } = useFxCurrencies()
  const { live, cached, refreshing, notice, refresh } = useExchangeRate()
  const snapshot = live ?? cached
  const enabledCurrencies = FX_CURRENCIES.filter((currency) => codes.includes(currency.code))
  const availableRates = enabledCurrencies.filter((currency) => typeof snapshot?.rates[currency.code] === 'number')

  return (
    <section className={cardClass} aria-labelledby="currency-title">
      <h3 id="currency-title" className="text-sm font-bold text-gray-600">통화</h3>
      <p className="mt-1 text-xs text-gray-600">입력 탭에서 외화로 입력할 때 보여 줄 자주 쓰는 통화를 골라요. 원화는 항상 보여요.</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="자주 쓰는 통화">
        {FX_CURRENCIES.map((currency) => {
          const selected = codes.includes(currency.code)
          return (
            <button key={currency.code} type="button" aria-pressed={selected} onClick={() => toggle(currency.code)} className={chipClass(selected)}>
              {currency.label} · {currency.code}
            </button>
          )
        })}
      </div>
      <button type="button" onClick={reset} className="mt-2 min-h-11 text-sm font-bold text-brand">기본값으로 되돌리기</button>
      <div className="mt-3 border-t border-gray-100 pt-3">
        <h4 className="text-xs font-bold text-gray-600">현재 환율</h4>
        {enabledCurrencies.length === 0 ? (
          <p className="mt-1 text-xs text-gray-600">켜 둔 외화가 없어요.</p>
        ) : availableRates.length === 0 ? (
          <p className="mt-1 text-xs text-gray-600">환율을 아직 받지 못했어요.</p>
        ) : (
          <ul className="mt-1 divide-y divide-gray-100">
            {availableRates.map((currency) => (
              <li key={currency.code} className="flex min-h-11 justify-between items-center text-sm text-gray-700">
                {formatRateLabel(currency.code, snapshot!.rates[currency.code])}
              </li>
            ))}
          </ul>
        )}
      </div>
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
