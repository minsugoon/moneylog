import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAllPages } from '../lib/fetchAllPages.ts'
import { supabase } from '../lib/supabase.ts'
import { NOT_CONFIGURED, toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import type { DailyNote } from '../lib/types.ts'

const NOTE_COLUMNS = 'id, note_date, body, updated_at'

// 하루 정리(일기). 하루에 한 편이고, 저장은 "있으면 고치고 없으면 만들기"(upsert)로 한다.
// 글 내용은 개인 기록이므로 오류 문구나 콘솔에 남기지 않는다.
export function useDailyNotes(userId: string) {
  const [items, setItems] = useState<DailyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    const result = await fetchAllPages<DailyNote>((from, to) =>
      client.from('daily_notes').select(NOTE_COLUMNS).order('note_date', { ascending: false }).range(from, to),
    )
    if (result.error) {
      setError(toKoreanDbMessage(result.error))
    } else {
      setItems(result.data)
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // 날짜로 바로 찾을 수 있게 정리해 둔다
  const byDate = useMemo(() => new Map(items.map((note) => [note.note_date, note])), [items])

  const save = useCallback(
    async (date: string, body: string): Promise<ActionResult> => {
      if (!supabase) return NOT_CONFIGURED
      const { data, error: dbError } = await supabase
        .from('daily_notes')
        .upsert(
          { user_id: userId, note_date: date, body, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,note_date' },
        )
        .select(NOTE_COLUMNS)
        .single()
      if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
      const saved = data as DailyNote
      setItems((current) => [saved, ...current.filter((n) => n.note_date !== date)])
      return { ok: true }
    },
    [userId],
  )

  const remove = useCallback(async (date: string): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('daily_notes').delete().eq('note_date', date)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.filter((n) => n.note_date !== date))
    return { ok: true }
  }, [])

  return { items, byDate, loading, error, reload, save, remove }
}
