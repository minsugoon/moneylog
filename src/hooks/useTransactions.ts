import { useCallback, useEffect, useState } from 'react'
import { fetchAllPages } from '../lib/fetchAllPages.ts'
import { supabase } from '../lib/supabase.ts'
import { NOT_CONFIGURED, toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import type { FixedType, Transaction } from '../lib/types.ts'
import type { ImportRecord } from '../utils/importRows.ts'

export type AddManyResult = { ok: true; saved: number; skipped: number } | { ok: false; message: string }

// 입력 폼이 저장할 때 보내는 값. id, 만든 시각, 출처는 DB가 채운다.
export interface TransactionInput {
  account_id: string | null
  used_at: string
  merchant: string
  amount: number
  discount: number
  installment_months: number
  is_fixed: boolean
  fixed_type: FixedType | null
  memo: string | null
  is_cancel: boolean
  interest_free: boolean
}

// 사용일이 최근인 것부터, 같은 날이면 나중에 입력한 것부터
export function sortTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => b.used_at.localeCompare(a.used_at) || b.created_at.localeCompare(a.created_at))
}

// 내 지출 내역(transactions 표)을 불러오고 추가·수정·삭제한다.
// 할부는 몇 달 전 내역이 이번 달에도 걸리므로 날짜로 자르지 않고 전부 불러온다.
export function useTransactions() {
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    const result = await fetchAllPages<Transaction>((from, to) =>
      client
        .from('transactions')
        .select('*')
        .order('used_at', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id')
        .range(from, to),
    )
    if (result.error) {
      setError(toKoreanDbMessage(result.error))
    } else {
      setItems(sortTransactions(result.data))
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const add = useCallback(async (input: TransactionInput): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase
      .from('transactions')
      .insert({ ...input, source: 'manual' })
      .select()
      .single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => sortTransactions([...current, data as Transaction]))
    return { ok: true }
  }, [])

  const addMany = useCallback(async (records: ImportRecord[]): Promise<AddManyResult> => {
    if (!records.length) return { ok: true, saved: 0, skipped: 0 }
    if (!supabase) return { ok: false, message: '앱 설정(.env)이 아직 없어요.' }
    let saved = 0
    for (let index = 0; index < records.length; index += 200) {
      const { data, error: dbError } = await supabase.from('transactions')
        .upsert(records.slice(index, index + 200), { onConflict: 'user_id,import_hash', ignoreDuplicates: true }).select()
      if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
      const inserted = (data ?? []) as Transaction[]
      saved += inserted.length
      setItems((current) => sortTransactions([...current, ...inserted]))
    }
    return { ok: true, saved, skipped: records.length - saved }
  }, [])

  const update = useCallback(async (id: string, input: TransactionInput): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('transactions').update(input).eq('id', id).select().single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => sortTransactions(current.map((t) => (t.id === id ? (data as Transaction) : t))))
    return { ok: true }
  }, [])

  const remove = useCallback(async (id: string): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('transactions').delete().eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.filter((t) => t.id !== id))
    return { ok: true }
  }, [])

  return { items, loading, error, reload, add, addMany, update, remove }
}
