import { useCallback, useEffect, useState } from 'react'
import { fetchAllPages } from '../lib/fetchAllPages.ts'
import { NOT_CONFIGURED, toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import { supabase } from '../lib/supabase.ts'
import type { FixedRule, FixedType } from '../lib/types.ts'
import { isValidRuleKeyword } from '../utils/fixedRules.ts'

const RULE_COLUMNS = 'id, merchant_keyword, fixed_type, created_at'

export function useFixedRules(userId: string) {
  const [items, setItems] = useState<FixedRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    const result = await fetchAllPages<FixedRule>((from, to) =>
      client.from('fixed_rules').select(RULE_COLUMNS).order('created_at', { ascending: true }).range(from, to),
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

  const add = useCallback(async (keyword: string, fixedType: FixedType): Promise<ActionResult> => {
    if (!isValidRuleKeyword(keyword)) return { ok: false, message: '키워드는 두 글자 이상 50자 이하로 입력해 주세요.' }
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase
      .from('fixed_rules')
      .upsert(
        { user_id: userId, merchant_keyword: keyword.trim(), fixed_type: fixedType },
        { onConflict: 'user_id,merchant_keyword' },
      )
      .select(RULE_COLUMNS)
      .single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    const saved = data as FixedRule
    setItems((current) => {
      const index = current.findIndex((item) => item.merchant_keyword === saved.merchant_keyword)
      if (index < 0) return [...current, saved]
      return current.map((item, itemIndex) => itemIndex === index ? saved : item)
    })
    return { ok: true }
  }, [userId])

  const update = useCallback(async (id: string, fixedType: FixedType): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('fixed_rules').update({ fixed_type: fixedType }).eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.map((item) => item.id === id ? { ...item, fixed_type: fixedType } : item))
    return { ok: true }
  }, [])

  const remove = useCallback(async (id: string): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('fixed_rules').delete().eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setItems((current) => current.filter((item) => item.id !== id))
    return { ok: true }
  }, [])

  return { items, loading, error, reload, add, update, remove }
}
