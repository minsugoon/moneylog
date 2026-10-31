import { useState } from 'react'
import Dialog from '../Dialog.tsx'
import { primaryButtonClass, secondaryButtonClass } from '../ui.ts'

interface AiConsentDialogProps {
  onAgree: () => void
  onCancel: () => void
  busy: boolean
  error: string
}

function AiConsentDialog({ onAgree, onCancel, busy, error }: AiConsentDialogProps) {
  const [checked, setChecked] = useState(false)

  return (
    <Dialog title="AI로 캡처 읽기, 먼저 확인해 주세요" onClose={onCancel}>
      <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
        <li>올린 캡처 이미지는 글자를 읽기 위해 AI 회사(Anthropic의 Claude)로 전송돼요. 이미지에 보이는 가맹점, 금액, 카드 끝자리 등이 함께 전송돼요.</li>
        <li>Moneylog 서버는 이미지와 읽은 내용을 저장하지 않아요. 사용 횟수만 기록해요.</li>
        <li>전체 카드번호·계좌번호, 이름 등 보이면 안 되는 부분은 가리고 올려 주세요.</li>
        <li>무료로는 한 달에 20장(하루 10장)까지 읽을 수 있어요.</li>
        <li>읽은 결과는 틀릴 수 있어요. 저장하기 전에 꼭 확인해 주세요.</li>
        <li>설정 탭에서 언제든 동의를 철회할 수 있어요. AI를 쓰지 않아도 문자 붙여넣기와 직접 입력은 그대로 쓸 수 있어요.</li>
      </ul>
      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
        위 내용을 확인했고 동의합니다
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" disabled={!checked || busy} onClick={onAgree} className={`flex-1 ${primaryButtonClass}`}>
          {busy ? '처리하는 중…' : '동의하고 시작'}
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className={`flex-1 ${secondaryButtonClass}`}>
          취소
        </button>
      </div>
    </Dialog>
  )
}

export default AiConsentDialog
