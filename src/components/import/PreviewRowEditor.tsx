import { useId, type ReactNode } from 'react'
import type { Account } from '../../lib/types.ts'
import type { PreviewItem } from '../../utils/importRows.ts'
import AmountInput from '../AmountInput.tsx'
import { formatAccountLabel } from '../../utils/format.ts'
import { inputClass, labelClass } from '../ui.ts'

interface PreviewRowEditorProps {
  item: PreviewItem
  accounts: Account[]
  onEdit: (
    id: string,
    patch: Partial<Pick<PreviewItem, 'accountId' | 'date' | 'merchant' | 'amount' | 'installment' | 'isCancel'>>,
  ) => void
  onToggle: (id: string) => void
}

const statusLabels = { duplicate: '중복', possible: '중복 가능', income: '입금', failed: '실패' } as const

function PreviewRowEditor({ item, accounts, onEdit, onToggle }: PreviewRowEditorProps) {
  const id = useId()
  const failed = item.status === 'failed'
  return (
    <li className={`rounded-xl border p-4 ${failed ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="grid gap-3 pc:grid-cols-[auto_auto_1fr_2fr_1fr_1fr_auto_2fr] pc:items-center">
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={item.selected}
            disabled={failed}
            onChange={() => onToggle(item.id)}
            className="h-5 w-5"
          />
          <span className="sr-only">저장 대상</span>
        </label>
        <span className="text-sm font-bold">{item.status !== 'new' && statusLabels[item.status]}</span>
        <Field id={`${id}-date`} label="사용일">
          <input
            id={`${id}-date`}
            type="date"
            value={item.date}
            onChange={(e) => onEdit(item.id, { date: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-merchant`} label="결제명">
          <input
            id={`${id}-merchant`}
            lang="ko"
            value={item.merchant}
            onChange={(e) => onEdit(item.id, { merchant: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id={`${id}-amount`} label="금액">
          <AmountInput id={`${id}-amount`} value={item.amount} onChange={(amount) => onEdit(item.id, { amount })} />
        </Field>
        <Field id={`${id}-installment`} label="할부">
          <select
            id={`${id}-installment`}
            value={item.installment}
            onChange={(e) => onEdit(item.id, { installment: Number(e.target.value) })}
            className={inputClass}
          >
            {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? '일시불' : `${n}개월`}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-base">
          <input
            type="checkbox"
            checked={item.isCancel}
            onChange={(e) => onEdit(item.id, { isCancel: e.target.checked })}
            className="h-5 w-5"
          />
          취소
        </label>
        <Field id={`${id}-account`} label="결제수단">
          <select
            id={`${id}-account`}
            value={item.accountId}
            onChange={(e) => onEdit(item.id, { accountId: e.target.value })}
            className={inputClass}
          >
            <option value="">선택 안 함</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {formatAccountLabel(account)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {failed && (
        <div className="mt-2 space-y-1 text-sm text-red-700">
          <p>{item.error}</p>
          {item.row.failReason && <p>읽지 못한 이유: {item.row.failReason}</p>}
          <details>
            <summary className="min-h-11 cursor-pointer py-2">원문 보기</summary>
            <pre className="whitespace-pre-wrap">{item.row.raw}</pre>
          </details>
        </div>
      )}
    </li>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  )
}

export default PreviewRowEditor
