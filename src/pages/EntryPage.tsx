import EntryPanel from '../components/entry/EntryPanel.tsx'
import PasteImport from '../components/entry/PasteImport.tsx'
import { useState } from 'react'
import { chipClass } from '../components/ui.ts'

// 입력 화면: 직접 입력 / 문자 붙여넣기. 캡처(AI)와 파일 입력은 이후 단계에서 탭으로 추가한다.
function EntryPage() {
  const [tab, setTab] = useState<'manual' | 'paste'>('manual')
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">입력</h2>
      <div className="flex gap-2" role="group" aria-label="입력 방식">
        <button type="button" aria-pressed={tab === 'manual'} className={chipClass(tab === 'manual')} onClick={() => setTab('manual')}>직접 입력</button>
        <button type="button" aria-pressed={tab === 'paste'} className={chipClass(tab === 'paste')} onClick={() => setTab('paste')}>문자 붙여넣기</button>
      </div>
      {tab === 'manual' ? <EntryPanel /> : <PasteImport />}
    </div>
  )
}

export default EntryPage
