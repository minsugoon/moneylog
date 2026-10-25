import { useCallback, useEffect, useRef, useState } from 'react'
import { useLedger } from '../../hooks/useLedger.ts'
import ConfirmDialog from '../ConfirmDialog.tsx'
import { errorBoxClass, inputClass, secondaryButtonClass } from '../ui.ts'

const MAX_LENGTH = 2000
const SAVE_DELAY_MS = 800

type Status = 'idle' | 'saving' | 'saved' | 'error'

interface DailyNoteEditorProps {
  // 이 날짜의 하루 정리를 쓴다. 날짜가 바뀌면 부모가 key를 바꿔 새로 열어 준다.
  date: string
  autoFocus?: boolean
}

// 하루 정리 글쓰기 칸. 글을 쓰다 멈추면 자동으로 저장한다.
// 글을 모두 지워도 저장돼 있던 글을 몰래 지우지 않고, "지우기" 버튼과 확인 단계를 거친다.
function DailyNoteEditor({ date, autoFocus }: DailyNoteEditorProps) {
  const { notes } = useLedger()
  const { save: saveNote, remove: removeNote } = notes

  const [text, setText] = useState(() => notes.byDate.get(date)?.body ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 저장된 글(공백 뺀 것)과 아직 저장하지 않은 변경이 있는지를 기억한다
  const savedRef = useRef(notes.byDate.get(date)?.body ?? '')
  const textRef = useRef(text)
  const dirtyRef = useRef(false)

  const save = useCallback(
    async (value: string) => {
      setStatus('saving')
      const result = await saveNote(date, value.trim())
      if (result.ok) {
        savedRef.current = value.trim()
        dirtyRef.current = textRef.current.trim() !== savedRef.current
        setStatus('saved')
        setError('')
      } else {
        setStatus('error')
        setError(result.message)
      }
    },
    [date, saveNote],
  )

  // 쓰다 멈추면 저장한다. 빈 글은 자동으로 저장·삭제하지 않는다.
  useEffect(() => {
    if (!dirtyRef.current || text.trim() === '') return
    const timer = setTimeout(() => void save(text), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [text, save])

  // 저장 전에 화면을 떠나거나 날짜를 바꿔도 쓰던 글이 사라지지 않게 마지막으로 저장한다
  useEffect(() => {
    return () => {
      if (dirtyRef.current && textRef.current.trim() !== '') {
        void saveNote(date, textRef.current.trim())
      }
    }
  }, [date, saveNote])

  function handleChange(value: string) {
    textRef.current = value
    dirtyRef.current = value.trim() !== savedRef.current
    setText(value)
    setStatus('idle')
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await removeNote(date)
    setDeleting(false)
    if (result.ok) {
      savedRef.current = ''
      dirtyRef.current = false
      textRef.current = ''
      setText('')
      setStatus('idle')
      setConfirmingDelete(false)
    } else {
      setError(result.message)
      setStatus('error')
      setConfirmingDelete(false)
    }
  }

  const hasSaved = savedRef.current !== ''
  const emptied = text.trim() === '' && hasSaved

  return (
    <div className="flex flex-col gap-2">
      <textarea
        aria-label="하루 정리"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        autoFocus={autoFocus}
        placeholder="오늘 하루는 어땠나요? 쓰다 멈추면 자동으로 저장돼요."
        className={`${inputClass} resize-y py-2 leading-relaxed`}
      />
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
        <span role="status" aria-live="polite">
          {status === 'saving' && '저장하는 중…'}
          {status === 'saved' && '저장했어요'}
          {status === 'idle' && dirtyRef.current && '쓰는 중…'}
        </span>
        <span>
          {text.length} / {MAX_LENGTH}
        </span>
      </div>

      {error && (
        <p className={errorBoxClass} role="alert">
          {error}
        </p>
      )}

      {hasSaved && (
        <div className="flex flex-col items-start gap-1">
          {emptied && <p className="text-xs text-amber-700">글을 모두 지웠어요. 저장돼 있던 글은 아직 남아 있어요.</p>}
          <button type="button" onClick={() => setConfirmingDelete(true)} className={secondaryButtonClass}>
            하루 정리 지우기
          </button>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="하루 정리를 지울까요?"
          message="이 날짜에 쓴 글이 완전히 지워져요. 되돌릴 수 없어요."
          confirmLabel="지우기"
          danger
          busy={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}

export default DailyNoteEditor
