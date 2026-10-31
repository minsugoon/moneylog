import EntryPanel from '../components/entry/EntryPanel.tsx'
import PasteImport from '../components/entry/PasteImport.tsx'
import CaptureImport from '../components/entry/CaptureImport.tsx'
import { useState } from 'react'
import { chipClass } from '../components/ui.ts'

// 입력 화면: 직접 입력 / 문자 붙여넣기 / 캡처(AI).
function EntryPage() {
  const [tab, setTab] = useState<'manual' | 'paste' | 'capture'>('manual')
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">입력</h2>
      <div className="flex gap-2" role="group" aria-label="입력 방식">
        <button type="button" aria-pressed={tab === 'manual'} className={chipClass(tab === 'manual')} onClick={() => setTab('manual')}>직접 입력</button>
        <button type="button" aria-pressed={tab === 'paste'} className={chipClass(tab === 'paste')} onClick={() => setTab('paste')}>문자 붙여넣기</button>
        <button type="button" aria-pressed={tab === 'capture'} className={chipClass(tab === 'capture')} onClick={() => setTab('capture')}>캡처(AI)</button>
      </div>
      {tab === 'manual' ? <EntryPanel /> : tab === 'paste' ? <PasteImport /> : <CaptureImport />}
    </div>
  )
}

export default EntryPage
