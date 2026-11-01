import { FIXED_TYPES, type FixedType } from '../../lib/types.ts'
import { inputClass } from '../ui.ts'

interface FixedExpenseFieldsProps {
  idPrefix: string
  isFixed: boolean
  onIsFixedChange: (value: boolean) => void
  fixedType: FixedType
  onFixedTypeChange: (value: FixedType) => void
  matchedKeyword: string | null
  canSaveRule: boolean
  saveRule: boolean
  onSaveRuleChange: (value: boolean) => void
  ruleKeyword: string
  onRuleKeywordChange: (value: string) => void
}

function FixedExpenseFields({ idPrefix, isFixed, onIsFixedChange, fixedType, onFixedTypeChange, matchedKeyword, canSaveRule, saveRule, onSaveRuleChange, ruleKeyword, onRuleKeywordChange }: FixedExpenseFieldsProps) {
  return (
    <div className="flex flex-col">
      <label className="flex min-h-11 items-center gap-3 text-base text-gray-700">
        <input type="checkbox" checked={isFixed} onChange={(e) => onIsFixedChange(e.target.checked)} className="h-5 w-5 accent-brand" />
        고정지출 (매달 나가는 돈)
      </label>
      {isFixed && (
        <div className="mt-1">
          <label htmlFor={`${idPrefix}-fixed`} className="sr-only">고정지출 종류</label>
          <select id={`${idPrefix}-fixed`} value={fixedType} onChange={(e) => onFixedTypeChange(e.target.value as FixedType)} className={inputClass}>
            {FIXED_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          {matchedKeyword && <p className="mt-1 text-xs text-gray-500">‘{matchedKeyword}’ 규칙에 따라 고정지출로 잡았어요.</p>}
        </div>
      )}
      {canSaveRule && (
        <div className="mt-1">
          <label className="flex min-h-11 items-center gap-3 text-base text-gray-700">
            <input type="checkbox" checked={saveRule} onChange={(e) => onSaveRuleChange(e.target.checked)} className="h-5 w-5 accent-brand" />
            고정 지출 이름 설정하기
          </label>
          {saveRule && (
            <div>
              <input type="text" value={ruleKeyword} onChange={(e) => onRuleKeywordChange(e.target.value)} className={inputClass} lang="ko" maxLength={50} aria-label="고정 지출 이름" />
              <p className="mt-1 text-xs text-gray-500">이 이름이 들어간 결제는 앞으로 자동으로 고정지출이 돼요. 짧게 줄일수록 더 많은 결제명에 맞고, 두 글자 이상 입력해야 해요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FixedExpenseFields
