import type { ReactNode } from 'react'

// PC(1100px 이상) 전용 오른쪽 "빠른 입력" 패널. 안에 들어갈 내용은 밖에서 받는다 (화면 틀은 내용을 모른다).
function QuickEntryPanel({ children }: { children?: ReactNode }) {
  return (
    <aside
      className="sticky top-0 hidden h-dvh w-96 shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-6 pc:block"
      aria-label="빠른 입력"
    >
      <h2 className="mb-4 text-base font-bold text-gray-700">빠른 입력</h2>
      {children}
    </aside>
  )
}

export default QuickEntryPanel
