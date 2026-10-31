import { useState } from 'react'
import ImportPreview from '../import/ImportPreview.tsx'
import { useLedger } from '../../hooks/useLedger.ts'
import {
  applyAccountToAll,
  buildPreviewItems,
  refreshItems,
  toImportRecords,
  toggleItem,
  type PreviewItem,
} from '../../utils/importRows.ts'
import { parseMessages } from '../../utils/parsers/index.ts'
import { inputClass, primaryButtonClass } from '../ui.ts'

function PasteImport() {
  const { accounts, transactions } = useLedger()
  const [text, setText] = useState('')
  const [items, setItems] = useState<PreviewItem[]>([])
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ saved: number; skipped: number } | null>(null)
  const activeAccounts = accounts.accounts.filter((account) => account.is_active)

  const read = () => {
    setItems(buildPreviewItems(parseMessages(text, { now: new Date() }), activeAccounts, transactions.items))
    setError('')
    setPreview(true)
  }
  const save = async () => {
    const records = toImportRecords(items, 'sms')
    const missing = items.filter((item) => item.selected && !item.accountId).length
    if (missing) {
      setError(`결제수단을 선택해 주세요 (${missing}건)`)
      return
    }
    if (!records.length) return
    setSaving(true)
    const outcome = await transactions.addMany(records)
    setSaving(false)
    if (!outcome.ok) {
      setError(outcome.message)
      return
    }
    setResult({ saved: outcome.saved, skipped: outcome.skipped })
    setText('')
    setItems([])
    setPreview(false)
    setError('')
  }

  if (preview)
    return (
      <ImportPreview
        items={items}
        accounts={activeAccounts}
        saving={saving}
        error={error}
        onEdit={(id, patch) =>
          setItems((current) =>
            refreshItems(
              current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
              transactions.items,
            ),
          )
        }
        onToggle={(id) => setItems((current) => toggleItem(current, id))}
        onApplyAccount={(accountId) => setItems((current) => applyAccountToAll(current, accountId, transactions.items))}
        onSave={() => void save()}
        onCancel={() => {
          setPreview(false)
          setError('')
        }}
      />
    )

  return (
    <section className="space-y-4">
      <p className="text-sm text-gray-600">
        카드·통장 문자를 복사해서 붙여넣으세요. 여러 건을 한꺼번에 붙여넣어도 돼요.
      </p>
      {activeAccounts.length === 0 && (
        <p className="text-sm text-gray-600">설정 탭에서 결제수단을 먼저 등록하면 자동으로 골라 드려요</p>
      )}
      {result && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {result.saved}건 저장했어요. {result.skipped}건은 이미 있어서 건너뛰었어요.
        </p>
      )}
      <textarea
        lang="ko"
        rows={8}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className={inputClass}
        aria-label="문자 붙여넣기"
      />
      <button
        type="button"
        disabled={!text.trim() || accounts.loading || transactions.loading}
        onClick={read}
        className={primaryButtonClass}
      >
        읽기
      </button>
    </section>
  )
}

export default PasteImport
