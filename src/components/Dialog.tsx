import { useEffect, useId, type ReactNode } from 'react'

interface DialogProps {
  title: string
  onClose: () => void
  children: ReactNode
}

// 화면 위에 뜨는 창. 모바일에서는 아래에서 올라오고, 넓은 화면에서는 가운데에 뜬다.
// 바깥을 눌러도 닫히지 않는다 (입력하던 내용을 실수로 잃지 않도록). Esc 키와 버튼으로만 닫는다.
function Dialog({ title, onClose, children }: DialogProps) {
  const titleId = useId()

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 md:items-center md:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl md:rounded-2xl md:pb-5"
      >
        <h3 id={titleId} className="text-lg font-bold text-gray-800">
          {title}
        </h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export default Dialog
