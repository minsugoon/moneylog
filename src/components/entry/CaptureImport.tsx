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
import { cardClass, chipClass, inputClass, primaryButtonClass } from '../ui.ts'
import AiConsentDialog from './AiConsentDialog.tsx'
import PhotoPickArea from './PhotoPickArea.tsx'
import UsageBar from '../UsageBar.tsx'

function CaptureImport() {
  const ai = useAiCapture()
  const { accounts, transactions, fixedRules } = useLedger()
  const [showConsent, setShowConsent] = useState(false)
  const [consentBusy, setConsentBusy] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [kind, setKind] = useState<'capture' | 'receipt'>('capture')
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
      const outcome = await ai.parseCapture(images, kind === 'receipt' ? 'receipt' : 'capture')
      if (!outcome.ok) {
        setError(outcome.message)
        return
      }
      if (!outcome.rows.length) {
        setError(kind === 'receipt'
          ? '읽을 수 있는 영수증이 없어요. 영수증 전체가 보이도록 다시 찍어 주세요'
          : '읽을 수 있는 거래가 없어요. 더 선명한 캡처로 다시 시도해 주세요')
        return
      }
      let nextItems = buildPreviewItems(outcome.rows, activeAccounts, transactions.items, fixedRules.items)
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
  if (ai.loading && !ai.consented) return <div className={cardClass}><p>불러오는 중이에요</p></div>

  if (!ai.consented) {
    return (
      <section className={cardClass}>
        <div className="space-y-4">
        <p className="text-sm text-gray-600">카드앱 이용내역 화면 캡처나 영수증 사진을 올리면 AI가 읽어 줘요</p>
        <button type="button" onClick={() => setShowConsent(true)} className={primaryButtonClass}>AI 캡처 읽기 시작하기</button>
        </div>
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
    <section className={cardClass}>
      <div className="space-y-4">
      <UsageBar label="사진 읽기 사용량" used={ai.used} limit={ai.monthlyLimit} />
      {resultMessage && <p role="status" className="text-sm text-green-700">{resultMessage}</p>}
      <div>
        <p className="mb-2 text-sm font-bold text-gray-600">무엇을 읽을까요?</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" aria-pressed={kind === 'capture'} className={chipClass(kind === 'capture', true)} onClick={() => { setKind('capture'); setFiles([]); setError('') }}>카드사 앱 캡처</button>
          <button type="button" aria-pressed={kind === 'receipt'} className={chipClass(kind === 'receipt', true)} onClick={() => { setKind('receipt'); setFiles([]); setError('') }}>영수증</button>
        </div>
      </div>
      <div>
        <label htmlFor="capture-account" className="mb-1 block text-sm font-bold text-gray-600">{kind === 'receipt' ? '어느 결제수단으로 결제했나요?' : '어느 결제수단의 캡처인가요?'}</label>
        <select id="capture-account" value={accountId} onChange={(event) => setAccountId(event.target.value)} className={inputClass}>
          <option value="">선택 안 함</option>
          {activeAccounts.map((account) => <option key={account.id} value={account.id}>{formatAccountLabel(account)}</option>)}
        </select>
      </div>
      <PhotoPickArea files={files} kind={kind} onSelect={selectFiles} onRemove={(index) => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} />
      <p className="text-xs text-gray-500">AI가 읽은 결과는 틀릴 수 있어요. 읽은 내용은 저장하기 전에 미리보기에서 한 번 더 확인해요.</p>
      {overLimit && <p className="text-sm text-red-700">이번 달 한도를 넘어서 읽을 수 없어요</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {reading && <p role="status">읽는 중이에요… 몇 초 걸려요</p>}
      <button type="button" disabled={!files.length || reading || overLimit} onClick={() => void read()} className={primaryButtonClass}>읽기</button>
      </div>
    </section>
  )
}

export default CaptureImport
