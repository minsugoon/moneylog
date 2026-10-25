import EntryPanel from '../components/entry/EntryPanel.tsx'

// 입력 화면 (직접 입력). 붙여넣기·문자·파일 입력은 이후 단계에서 탭으로 추가한다.
function EntryPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">입력</h2>
      <EntryPanel />
    </div>
  )
}

export default EntryPage
