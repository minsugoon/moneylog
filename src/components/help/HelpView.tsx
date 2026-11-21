import { useNav } from '../layout/navContext.ts'
import { cardClass } from '../ui.ts'
import { resetTour } from '../../utils/helpTours.ts'
import { HELP_TOPICS } from '../../utils/helpTopics.ts'
import HelpTopicItem from './HelpTopicItem.tsx'

interface HelpViewProps {
  onBack: () => void
}

// 도움말 목록과 화면 안내 다시 보기를 제공해요.
function HelpView({ onBack }: HelpViewProps) {
  const nav = useNav()

  function handleReplay(tab: Parameters<typeof nav.replayTour>[0]) {
    resetTour(tab)
    onBack()
    nav.replayTour(tab)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div>
        <button type="button" onClick={onBack} className="min-h-11 text-base font-bold text-brand">‹ 설정으로</button>
        <h2 className="text-lg font-bold text-gray-800">도움말</h2>
      </div>
      <p className="text-sm text-gray-600">기능별 사용법과 자주 묻는 질문이에요. 항목을 눌러 펼쳐 보세요.</p>
      <div className={cardClass}>
        <ul className="divide-y divide-gray-100">
          {HELP_TOPICS.map((topic) => <HelpTopicItem key={topic.id} topic={topic} onReplay={handleReplay} />)}
        </ul>
      </div>
    </div>
  )
}

export default HelpView
