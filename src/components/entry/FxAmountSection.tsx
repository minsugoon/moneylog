import type { useFxEntry } from '../../hooks/useFxEntry.ts'
import AmountInput from '../AmountInput.tsx'
import { labelClass } from '../ui.ts'
import CurrencyToggle from './CurrencyToggle.tsx'
import FxAmountInput from './FxAmountInput.tsx'
import FxConvertBox from './FxConvertBox.tsx'

interface FxAmountSectionProps {
  idPrefix: string
  fx: ReturnType<typeof useFxEntry>
  amount: number | null
  onAmountChange: (value: number | null) => void
  amountLabel?: string
}

function FxAmountSection({ idPrefix, fx, amount, onAmountChange, amountLabel }: FxAmountSectionProps) {
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={`${idPrefix}-amount`} className={labelClass}>{amountLabel ?? (fx.isFx ? `금액 (${fx.code})` : '금액 (원)')}</label>
        {fx.isFx ? (
          <FxAmountInput id={`${idPrefix}-amount`} code={fx.code} value={fx.text} onChange={fx.setText} placeholder="0" />
        ) : (
          <AmountInput id={`${idPrefix}-amount`} value={amount} onChange={onAmountChange} placeholder="0" size="large" />
        )}
      </div>
      {fx.enabled && <CurrencyToggle expanded={fx.expanded} selected={fx.code} codes={fx.favoriteCodes} onToggle={fx.toggle} onSelect={fx.selectCode} />}
      {fx.isFx && (
        <div className="mt-2">
          <FxConvertBox
            code={fx.code}
            hasAmount={fx.state.hasAmount}
            krw={fx.state.krw}
            convertError={fx.state.convertError}
            rateLabel={fx.rateLabel}
            rateTime={fx.rateTime}
            rateNote={fx.state.rateNote}
            noRate={fx.state.noRate}
            refreshing={fx.refreshing}
            refreshNotice={fx.refreshNotice}
            onRefresh={fx.refresh}
            manualOpen={fx.manualOpen}
            manualKrw={fx.manualKrw}
            onManualOpen={fx.openManual}
            onManualClose={fx.closeManual}
            onManualChange={fx.setManualKrw}
            dayLine={fx.dayLine}
            idPrefix={idPrefix}
          />
        </div>
      )}
    </div>
  )
}

export default FxAmountSection
