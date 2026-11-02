import AmountInput from '../AmountInput.tsx'
import { errorBoxClass, labelClass, secondaryButtonClass } from '../ui.ts'
import { formatApprox } from '../../utils/fxDisplay.ts'
import { formatWon } from '../../utils/format.ts'

interface FxConvertBoxProps {
  code: string
  hasAmount: boolean
  krw: number | null
  convertError: string | null
  rateLabel: string | null
  rateTime: string | null
  rateNote: string | null
  noRate: boolean
  refreshing: boolean
  refreshNotice: string
  onRefresh: () => void
  manualOpen: boolean
  manualKrw: number | null
  onManualOpen: () => void
  onManualClose: () => void
  onManualChange: (value: number | null) => void
  dayLine: string | null
  idPrefix: string
}

function FxConvertBox(props: FxConvertBoxProps) {
  const { hasAmount, krw, convertError, rateLabel, rateTime, rateNote, noRate, refreshing, refreshNotice, onRefresh, manualOpen, manualKrw, onManualOpen, onManualClose, onManualChange, dayLine, idPrefix } = props
  const displayManual = manualOpen && manualKrw !== null && manualKrw >= 1
  const showEmpty = !hasAmount || (noRate && !displayManual && krw === null)

  return (
    <section aria-label="원화 환산" className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-gray-700">원화로 바꾸면</span>
          <button type="button" disabled={refreshing} onClick={onRefresh} className={`${secondaryButtonClass} text-sm`}>{refreshing ? '받는 중…' : '↻ 환율 새로고침'}</button>
        </div>
        {refreshNotice && <p className="text-xs text-gray-600">{refreshNotice}</p>}
        <div aria-live="polite">
          {convertError ? <div className={errorBoxClass} role="alert">{convertError}</div> : displayManual ? <><p className="text-2xl font-bold tabular-nums text-gray-800">{formatWon(manualKrw)}</p><p className="text-xs text-gray-600">카드 청구액 기준으로 고쳤어요</p></> : krw !== null ? <p className="text-2xl font-bold tabular-nums text-gray-800">{formatApprox(krw)}</p> : showEmpty ? <p className="text-base font-normal text-gray-600">{noRate && rateNote ? rateNote : '금액을 넣으면 원화로 바꿔 드려요'}</p> : null}
        </div>
        {rateLabel && <p className="text-xs text-gray-600">{rateLabel}{rateTime ? ` · ${rateTime} 기준` : ''}</p>}
        {rateNote && !(showEmpty && noRate) && <p className="text-xs text-amber-800">{rateNote}</p>}
        {manualOpen ? (
          <div>
            <label htmlFor={`${idPrefix}-manual-krw`} className={labelClass}>카드 청구액 (원)</label>
            <AmountInput id={`${idPrefix}-manual-krw`} value={manualKrw} onChange={onManualChange} />
            <button type="button" onClick={onManualClose} className="min-h-11 text-sm font-bold text-brand">환율로 계산하기</button>
          </div>
        ) : <button type="button" onClick={onManualOpen} className={`w-full ${secondaryButtonClass}`}>카드 청구액으로 직접 입력</button>}
        {dayLine && <p className="border-t border-gray-200 pt-2 text-sm text-gray-700 tabular-nums">{dayLine}</p>}
      </div>
    </section>
  )
}

export default FxConvertBox
