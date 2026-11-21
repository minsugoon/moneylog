import { useId, useState } from 'react'
import type { TabKey } from '../layout/navItems.ts'
import { secondaryButtonClass } from '../ui.ts'
import type { HelpTopic } from '../../utils/helpTopics.ts'

interface HelpTopicItemProps {
  topic: HelpTopic
  onReplay?: (tab: TabKey) => void
}

// 접고 펼치는 도움말 항목을 보여줘요.
function HelpTopicItem({ topic, onReplay }: HelpTopicItemProps) {
  const [open, setOpen] = useState(false)
  const contentId = useId()

  return (
    <li className="py-2">
      <button type="button" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen((value) => !value)} className="flex min-h-12 w-full items-center justify-between text-left text-base font-bold text-gray-800">
        <span>{topic.title}</span>
        <span aria-hidden="true">{open ? '🔼' : '🔽'}</span>
      </button>
      {open && (
        <div id={contentId} className="pb-3">
          {topic.sections.map((section) => (
            <section key={section.heading} className="mt-3">
              <h4 className="text-sm font-bold text-gray-700">{section.heading}</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                {section.lines.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </section>
          ))}
          {topic.tourTab && onReplay && (
            <button type="button" className={`${secondaryButtonClass} mt-4 w-full`} onClick={() => onReplay(topic.tourTab!)}>
              이 화면 안내 다시 보기
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export default HelpTopicItem
