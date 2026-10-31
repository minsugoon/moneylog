import { useState, type ChangeEvent } from 'react'
import ImportPreview from '../import/ImportPreview.tsx'
import { useAiCapture } from '../../hooks/useAiCapture.ts'
import { useLedger } from '../../hooks/useLedger.ts'
import {
  applyAccountToAll,
  buildPreviewItems,
  refreshItems,
  toImportRecords,
  toggleItem,
  type PreviewItem,
} from '../../utils/importRows.ts'
import { resizeImageToBase64 } from '../../utils/imageResize.ts'
import { formatAccountLabel } from '../../utils/format.ts'
import { inputClass, primaryButtonClass } from '../ui.ts'
import AiConsentDialog from './AiConsentDialog.tsx'

function CaptureImport() {
  const ai = useAiCapture()
  const { accounts, transactions } = useLedger()
  const [showConsent, setShowConsent] = useState(false)
  const [consentBusy, setConsentBusy] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [accountId, setAccountId] = useState('')
  const [items, setItems] = useState<PreviewItem[]>([])
  const [preview, setPreview] = useState(false)
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [resultMessage, setResultMessage] = useState('')
  const activeAccounts = accounts.accounts.filter((account) => account.is_active)
  const overLimit = ai.used + files.length > ai.monthlyLimit

  const acceptConsent = async () => {
    setConsentBusy(true)
    setConsentError('')
    const outcome = await ai.acceptConsent()
    setConsentBusy(false)
    if (!outcome.ok) {
      setConsentError(outcome.message)
      return
    }
    setShowConsent(false)
  }

  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length + files.length > 5) {
      setError('한 번에 5장까지 올릴 수 있어요')
      return
    }
    setFiles((current) => [...current, ...selected])
    setError('')
  }

  const read = async () => {
    if (!files.length || overLimit || reading) return
    setReading(true)
    setError('')
    try {
      const images = await Promise.all(files.map((file) => resizeImageToBase64(file)))
      const outcome = await ai.parseCapture(images)
      if (!outcome.ok) {
        setError(outcome.message)
        return
      }
      if (!outcome.rows.length) {
        setError('읽을 수 있는 거래가 없어요. 더 선명한 캡처로 다시 시도해 주세요')
        return
      }
      let nextItems = buildPreviewItems(outcome.rows, activeAccounts, transactions.items)
      if (accountId) nextItems = applyAccountToAll(nextItems, accountId, transactions.items)
      setItems(nextItems)
      setPreview(true)
    } catch {
      setError('이미지를 읽을 수 없어요')
    } finally {
      setFiles([])
      setReading(false)
    }
  }

  const save = async () => {
    const records = toImportRecords(items, 'paste')
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
    setResultMessage(`${outcome.saved}건 저장했어요. ${outcome.skipped}건은 이미 있어서 건너뛰었어요.`)
    setItems([])
    setPreview(false)
    setError('')
  }

  if (preview) {
    return (
      <ImportPreview
        items={items}
        accounts={activeAccounts}
        saving={saving}
        error={error}
        onEdit={(id, patch) =>
          setItems((current) =>
            refreshItems(current.map((item) => (item.id === id ? { ...item, ...patch } : item)), transactions.items),
          )
        }
        onToggle={(id) => setItems((current) => toggleItem(current, id))}
        onApplyAccount={(nextAccountId) => setItems((current) => applyAccountToAll(current, nextAccountId, transactions.items))}
        onSave={() => void save()}
        onCancel={() => {
          setPreview(false)
          setError('')
        }}
      />
    )
  }

  // 처음 불러올 때만 로딩 문구를 보인다. 읽는 도중 사용량을 다시 불러올 때 화면이 깜빡이지 않게 한다.
  if (ai.loading && !ai.consented) return <p>불러오는 중이에요</p>

  if (!ai.consented) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-gray-600">카드앱 이용내역 화면을 캡처해서 올리면 AI가 읽어 줘요</p>
        <button type="button" onClick={() => setShowConsent(true)} className={primaryButtonClass}>AI 캡처 읽기 시작하기</button>
        {showConsent && (
          <AiConsentDialog
            onAgree={() => void acceptConsent()}
            onCancel={() => setShowConsent(false)}
            busy={consentBusy}
            error={consentError}
          />
        )}
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <p className="text-sm font-bold text-gray-700">이번 달 {ai.used}/{ai.monthlyLimit}장 사용</p>
      {resultMessage && <p role="status" className="text-sm text-green-700">{resultMessage}</p>}
      <div>
        <label htmlFor="capture-account" className="mb-1 block text-sm font-bold text-gray-600">어느 결제수단의 캡처인가요?</label>
        <select id="capture-account" value={accountId} onChange={(event) => setAccountId(event.target.value)} className={inputClass}>
          <option value="">선택 안 함</option>
          {activeAccounts.map((account) => <option key={account.id} value={account.id}>{formatAccountLabel(account)}</option>)}
        </select>
      </div>
      <label className="flex min-h-11 cursor-pointer items-center rounded-lg border border-gray-300 px-3 text-base text-gray-700">
        캡처 이미지 선택
        <input type="file" accept="image/*" multiple onChange={selectFiles} className="sr-only" aria-label="캡처 이미지 선택" />
      </label>
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="break-all">{file.name}</span>
              <button type="button" className="min-h-11 px-3" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>빼기</button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-gray-600">AI가 읽은 결과는 틀릴 수 있어요. 저장 전에 꼭 확인하세요.</p>
      {overLimit && <p className="text-sm text-red-700">이번 달 한도를 넘어서 읽을 수 없어요</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {reading && <p role="status">읽는 중이에요… 몇 초 걸려요</p>}
      <button type="button" disabled={!files.length || reading || overLimit} onClick={() => void read()} className={primaryButtonClass}>읽기</button>
    </section>
  )
}

export default CaptureImport
