import { useState } from 'react'
import { useAiCapture } from '../../hooks/useAiCapture.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import UsageBar from '../UsageBar.tsx'
import { cardClass, errorBoxClass, secondaryButtonClass } from '../ui.ts'

function AiSettingsSection() {
  const ai = useAiCapture()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleWithdraw() {
    setBusy(true)
    setError('')
    const result = await ai.withdrawConsent()
    setBusy(false)
    if (result.ok) setConfirming(false)
    else setError(result.message)
  }

  return (
    <section className={cardClass} aria-labelledby="ai-settings-title">
      <h3 id="ai-settings-title" className="text-sm font-bold text-gray-600">AI 입력</h3>
      {ai.loading ? (
        <p className="mt-3 text-sm text-gray-600">불러오는 중이에요</p>
      ) : ai.error ? (
        <p className={`mt-3 ${errorBoxClass}`} role="alert">{ai.error}</p>
      ) : (
        <>
          <p className="mt-3 text-xs text-gray-600">한 달 기준은 한국 시간이에요. 하루 10장까지 읽을 수 있어요.</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">사진 읽기 동의</span>
            <span className="text-sm font-bold text-gray-800">{ai.consented ? '동의함' : '동의 안 함'}</span>
          </div>
          <div className="mt-2">
            <UsageBar label="이번 달 사용량" used={ai.used} limit={ai.monthlyLimit} valuePrefix="" />
          </div>
          {!ai.consented && (
            <p className="mt-3 text-sm text-gray-600">AI 입력을 사용하지 않아요. 입력 탭의 사진 입력에서 안내를 확인하고 시작할 수 있어요.</p>
          )}
          {ai.consented && (
            <button type="button" onClick={() => { setError(''); setConfirming(true) }} className={`mt-4 ${secondaryButtonClass}`}>
              동의 철회
            </button>
          )}
        </>
      )}
      {confirming && (
        <ConfirmDialog
          title="AI 입력 동의를 철회할까요?"
          message="철회하면 사진 입력을 쓸 수 없어요. 이미 저장한 내역은 그대로예요. 나중에 다시 동의할 수 있어요."
          confirmLabel="철회"
          danger
          busy={busy}
          error={error}
          onConfirm={() => void handleWithdraw()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  )
}

export default AiSettingsSection
