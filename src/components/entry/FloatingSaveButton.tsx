interface FloatingSaveButtonProps {
  busy: boolean
}

function FloatingSaveButton({ busy }: FloatingSaveButtonProps) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-20 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 font-bold text-white shadow-lg disabled:bg-gray-200 disabled:text-gray-500 md:bottom-6 md:right-6 pc:hidden"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {busy ? '저장하는 중…' : '저장'}
    </button>
  )
}

export default FloatingSaveButton
