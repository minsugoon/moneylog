import { useId } from 'react'
import type { Account } from '../../lib/types.ts'
import { summarizeItems, type PreviewItem } from '../../utils/importRows.ts'
import { formatAccountLabel } from '../../utils/format.ts'
import PreviewRowEditor from './PreviewRowEditor.tsx'
import { cardClass, inputClass, primaryButtonClass, secondaryButtonClass } from '../ui.ts'

export interface ImportPreviewProps {
  items: PreviewItem[]
  accounts: Account[]
  saving: boolean
  error: string
  onEdit: (
    id: string,
    patch: Partial<Pick<PreviewItem, 'accountId' | 'date' | 'merchant' | 'amount' | 'installment' | 'isCancel'>>,
  ) => void
  onToggle: (id: string) => void
  onApplyAccount: (accountId: string) => void
  onSave: () => void
  onCancel: () => void
}

function ImportPreview({
  items,
  accounts,
  saving,
  error,
  onEdit,
  onToggle,
  onApplyAccount,
  onSave,
  onCancel,
}: ImportPreviewProps) {
  const accountId = useId()
  const summary = summarizeItems(items)
  return (
    <section className={`${cardClass} space-y-4`}>
      <div>
        <label htmlFor={accountId} className="mb-1 block text-sm font-bold text-gray-600">
          결제수단 일괄 지정
        </label>
        <select
          id={accountId}
          defaultValue=""
          onChange={(e) => e.target.value && onApplyAccount(e.target.value)}
          className={inputClass}
        >
          <option value="">선택 안 함</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {formatAccountLabel(account)}
            </option>
          ))}
        </select>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-gray-500">읽을 수 있는 문자가 없어요</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <PreviewRowEditor key={item.id} item={item} accounts={accounts} onEdit={onEdit} onToggle={onToggle} />
          ))}
        </ul>
      )}
      <p className="font-bold">
        저장 {summary.save}건 / 제외 {summary.excluded}건 / 실패 {summary.failed}건
      </p>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={summary.save === 0 || saving}
          className={`flex-1 ${primaryButtonClass}`}
        >
          {saving ? '저장하는 중…' : '저장'}
        </button>
        <button type="button" onClick={onCancel} className={`flex-1 ${secondaryButtonClass}`}>
          다시 붙여넣기
        </button>
      </div>
    </section>
  )
}

export default ImportPreview
