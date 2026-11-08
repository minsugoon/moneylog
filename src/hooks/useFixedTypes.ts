import { useCallback, useEffect, useState } from 'react'
import { fetchAllPages } from '../lib/fetchAllPages.ts'
import { NOT_CONFIGURED, toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import { supabase } from '../lib/supabase.ts'
import { DEFAULT_FIXED_TYPES, FALLBACK_FIXED_TYPE, type FixedTypeRow } from '../lib/types.ts'
import { checkFixedTypeName } from '../utils/fixedExpenses.ts'

const FIXED_TYPE_COLUMNS = 'id, name, sort_order, created_at'

export function useFixedTypes(userId: string) {
  const [items, setItems] = useState<FixedTypeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const names = items.length ? items.map((item) => item.name) : [...DEFAULT_FIXED_TYPES]

  const reload = useCallback(async () => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    const readItems = async () => fetchAllPages<FixedTypeRow>((from, to) =>
      client.from('fixed_types').select(FIXED_TYPE_COLUMNS).order('sort_order', { ascending: true }).order('created_at', { ascending: true }).range(from, to),
    )
    let result = await readItems()
    if (result.error) setError(toKoreanDbMessage(result.error))
    else if (result.data.length === 0) {
      const { error: dbError } = await client.from('fixed_types').upsert(
        DEFAULT_FIXED_TYPES.map((name, sort_order) => ({ user_id: userId, name, sort_order })),
        { onConflict: 'user_id,name', ignoreDuplicates: true },
      )
      if (dbError) setError(toKoreanDbMessage(dbError))
      else {
        result = await readItems()
        if (result.error) setError(toKoreanDbMessage(result.error))
        else { setItems(result.data); setError('') }
      }
    } else { setItems(result.data); setError('') }
    setLoading(false)
  }, [userId])

  useEffect(() => { void reload() }, [reload])

  const add = useCallback(async (name: string): Promise<ActionResult> => {
    const checked = checkFixedTypeName(name, names)
    if (!checked.ok) return { ok: false, message: checked.message }
    if (!supabase) return NOT_CONFIGURED
    const sort_order = items.reduce((max, item) => Math.max(max, item.sort_order), -1) + 1
    const { data, error: dbError } = await supabase.from('fixed_types').insert({ user_id: userId, name: checked.value, sort_order }).select(FIXED_TYPE_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => [...current, data as FixedTypeRow])
    return { ok: true }
  }, [items, names, userId])

  const rename = useCallback(async (row: FixedTypeRow, name: string): Promise<ActionResult> => {
    if (row.name === FALLBACK_FIXED_TYPE) return { ok: false, message: '기타고정은 기본 분류라 바꿀 수 없어요.' }
    const checked = checkFixedTypeName(name, names, row.name)
    if (!checked.ok) return { ok: false, message: checked.message }
    if (!supabase) return NOT_CONFIGURED
    const transactionResult = await supabase.from('transactions').update({ fixed_type: checked.value }).eq('fixed_type', row.name)
    if (transactionResult.error) return { ok: false, message: toKoreanDbMessage(transactionResult.error) }
    const expenseResult = await supabase.from('fixed_expenses').update({ fixed_type: checked.value }).eq('fixed_type', row.name)
    if (expenseResult.error) return { ok: false, message: toKoreanDbMessage(expenseResult.error) }
    const { data, error: dbError } = await supabase.from('fixed_types').update({ name: checked.value }).eq('id', row.id).select(FIXED_TYPE_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.map((item) => item.id === row.id ? data as FixedTypeRow : item))
    return { ok: true }
  }, [names])

  const remove = useCallback(async (row: FixedTypeRow): Promise<ActionResult> => {
    if (row.name === FALLBACK_FIXED_TYPE) return { ok: false, message: '기타고정은 기본 분류라 지울 수 없어요.' }
    if (!supabase) return NOT_CONFIGURED
    const expenseResult = await supabase.from('fixed_expenses').update({ fixed_type: FALLBACK_FIXED_TYPE }).eq('fixed_type', row.name)
    if (expenseResult.error) return { ok: false, message: toKoreanDbMessage(expenseResult.error) }
    const { error: dbError } = await supabase.from('fixed_types').delete().eq('id', row.id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.filter((item) => item.id !== row.id))
    return { ok: true }
  }, [])

  return { items, names, loading, error, reload, add, rename, remove }
}
