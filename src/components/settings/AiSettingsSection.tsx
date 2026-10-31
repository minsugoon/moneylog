import { useState } from 'react'
import { useAiCapture } from '../../hooks/useAiCapture.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
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
      <h3 id="ai-settings-title" className="text-sm font-bold text-gray-500">AI 입력</h3>
      {ai.loading ? (
        <p className="mt-3 text-sm text-gray-500">불러오는 중이에요</p>
      ) : ai.error ? (
        <p className={`mt-3 ${errorBoxClass}`} role="alert">{ai.error}</p>
      ) : (
        <>
          <p className="mt-3 text-base text-gray-800">이번 달 {ai.used}/{ai.monthlyLimit}장 사용</p>
          <p className="mt-1 text-xs text-gray-500">한 달 기준은 한국 시간이에요. 하루 10장까지 읽을 수 있어요.</p>
          <p className="mt-3 text-sm text-gray-600">
            {ai.consented
              ? 'AI 입력을 사용 중이에요'
              : 'AI 입력을 사용하지 않아요. 입력 탭의 캡처(AI)에서 안내를 확인하고 시작할 수 있어요.'}
          </p>
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
          message="철회하면 캡처(AI) 입력을 쓸 수 없어요. 이미 저장한 내역은 그대로예요. 나중에 다시 동의할 수 있어요."
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
