import { useCallback, useEffect, useState } from 'react'
import { fetchAllPages } from '../lib/fetchAllPages.ts'
import { NOT_CONFIGURED, toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import { supabase } from '../lib/supabase.ts'
import type { FixedExpense } from '../lib/types.ts'
import { checkFixedExpense, fixedExpenseKey, newRegistrations, type FixedExpenseDraft, type FixedExpenseRow } from '../utils/fixedExpenses.ts'

export const FIXED_EXPENSE_COLUMNS = 'id, merchant, account_id, amount, pay_day, fixed_type, created_at'
const DUPLICATE_MESSAGE = '같은 고정지출이 이미 있어요.'

export function useFixedExpenses() {
  const [items, setItems] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    const result = await fetchAllPages<FixedExpense>((from, to) =>
      client.from('fixed_expenses').select(FIXED_EXPENSE_COLUMNS).order('created_at', { ascending: true }).range(from, to),
    )
    if (result.error) setError(toKoreanDbMessage(result.error))
    else {
      setItems(result.data)
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  const add = useCallback(async (draft: FixedExpenseDraft): Promise<ActionResult> => {
    const checked = checkFixedExpense(draft)
    if (!checked.ok) return { ok: false, message: checked.message }
    if (newRegistrations(items, [checked.value]).length === 0) return { ok: false, message: DUPLICATE_MESSAGE }
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('fixed_expenses').insert(checked.value).select(FIXED_EXPENSE_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => [...current, data as FixedExpense])
    return { ok: true }
  }, [items])

  const update = useCallback(async (id: string, draft: FixedExpenseDraft): Promise<ActionResult> => {
    const checked = checkFixedExpense(draft)
    if (!checked.ok) return { ok: false, message: checked.message }
    if (items.some((item) => item.id !== id && fixedExpenseKey(item) === fixedExpenseKey(checked.value))) return { ok: false, message: DUPLICATE_MESSAGE }
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('fixed_expenses').update(checked.value).eq('id', id).select(FIXED_EXPENSE_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.map((item) => item.id === id ? data as FixedExpense : item))
    return { ok: true }
  }, [items])

  const remove = useCallback(async (id: string): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('fixed_expenses').delete().eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.filter((item) => item.id !== id))
    return { ok: true }
  }, [])

  const registerMany = useCallback(async (candidates: FixedExpenseRow[]): Promise<ActionResult> => {
    const additions = newRegistrations(items, candidates)
    if (additions.length === 0) return { ok: true }
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('fixed_expenses').insert(additions).select(FIXED_EXPENSE_COLUMNS)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => [...current, ...(data as FixedExpense[])])
    return { ok: true }
  }, [items])

  return { items, loading, error, reload, add, update, remove, registerMany }
}
