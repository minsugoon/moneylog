// PC(1100px 이상) 전용 오른쪽 "빠른 입력" 패널. 지금은 자리만 잡아 둔다 (내용은 단계 4).
function QuickEntryPanel() {
  return (
    <aside
      className="sticky top-0 hidden h-dvh w-80 shrink-0 border-l border-gray-200 bg-white p-6 pc:block"
      aria-label="빠른 입력"
    >
      <h2 className="text-base font-bold text-gray-700">빠른 입력</h2>
    </aside>
  )
}

export default QuickEntryPanel
