import type { FixedType } from '../../lib/types.ts'
import { inputClass } from '../ui.ts'

interface FixedExpenseFieldsProps {
  idPrefix: string
  isFixed: boolean
  onIsFixedChange: (value: boolean) => void
  fixedType: FixedType
  onFixedTypeChange: (value: FixedType) => void
  typeOptions: string[]
}

function FixedExpenseFields({ idPrefix, isFixed, onIsFixedChange, fixedType, onFixedTypeChange, typeOptions }: FixedExpenseFieldsProps) {
  const options = typeOptions.includes(fixedType) ? typeOptions : [...typeOptions, fixedType]
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
            {options.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-600">저장하면 고정지출 목록에 등록돼요. 설정 탭에서 고치거나 뺄 수 있어요.</p>
        </div>
      )}
    </div>
  )
}

export default FixedExpenseFields
