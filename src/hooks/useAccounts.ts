import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import { NOT_CONFIGURED, toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import type { Account, AccountKind } from '../lib/types.ts'

export interface AccountInput {
  name: string
  kind: AccountKind
  issuer: string | null
  last4: string | null
}

// 순서 번호가 작은 것부터, 같으면 먼저 만든 것부터
export function sortAccounts(list: Account[]): Account[] {
  return [...list].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
}

// 같은 별칭을 두 번 등록하려 하면 DB가 막는다 (표의 unique 규칙)
function accountMessage(error: { code: string; message: string }): string {
  if (error.code === '23505') return '같은 별칭의 결제수단이 이미 있어요. 다른 별칭을 써 주세요.'
  return toKoreanDbMessage(error)
}

// 결제수단(accounts 표)을 불러오고 추가·수정·삭제·사용중지·순서 바꾸기를 한다
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data, error: dbError } = await supabase.from('accounts').select('*')
    if (dbError) {
      setError(toKoreanDbMessage(dbError))
    } else {
      // 표 구조는 docs/DATA_MODEL.md와 같아서 타입을 그대로 지정한다
      setAccounts(sortAccounts((data ?? []) as Account[]))
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const add = useCallback(
    async (input: AccountInput): Promise<ActionResult> => {
      if (!supabase) return NOT_CONFIGURED
      const nextOrder = accounts.reduce((max, a) => Math.max(max, a.sort_order), -1) + 1
      const { data, error: dbError } = await supabase
        .from('accounts')
        .insert({ ...input, sort_order: nextOrder })
        .select()
        .single()
      if (dbError) return { ok: false, message: accountMessage(dbError) }
      setAccounts((current) => sortAccounts([...current, data as Account]))
      return { ok: true }
    },
    [accounts],
  )

  const update = useCallback(async (id: string, input: AccountInput): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('accounts').update(input).eq('id', id).select().single()
    if (dbError) return { ok: false, message: accountMessage(dbError) }
    setAccounts((current) => sortAccounts(current.map((a) => (a.id === id ? (data as Account) : a))))
    return { ok: true }
  }, [])

  const setActive = useCallback(async (id: string, isActive: boolean): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('accounts').update({ is_active: isActive }).eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setAccounts((current) => current.map((a) => (a.id === id ? { ...a, is_active: isActive } : a)))
    return { ok: true }
  }, [])

  // 지우면 이 결제수단으로 입력한 내역은 남고, 내역의 결제수단 칸만 비게 된다 (DB가 처리)
  const remove = useCallback(async (id: string): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('accounts').delete().eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setAccounts((current) => current.filter((a) => a.id !== id))
    return { ok: true }
  }, [])

  // 위(-1) 또는 아래(+1)로 한 칸 옮긴다. 순서 번호를 0, 1, 2…로 다시 매긴다.
  const move = useCallback(
    async (id: string, direction: -1 | 1): Promise<ActionResult> => {
      const client = supabase
      if (!client) return NOT_CONFIGURED
      const ordered = sortAccounts(accounts)
      const from = ordered.findIndex((a) => a.id === id)
      const to = from + direction
      if (from < 0 || to < 0 || to >= ordered.length) return { ok: true }

      const next = [...ordered]
      ;[next[from], next[to]] = [next[to], next[from]]
      const changed = next.map((account, order) => ({ account, order })).filter((x) => x.account.sort_order !== x.order)

      const results = await Promise.all(
        changed.map(({ account, order }) => client.from('accounts').update({ sort_order: order }).eq('id', account.id)),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) {
        await reload()
        return { ok: false, message: toKoreanDbMessage(failed.error) }
      }
      setAccounts(next.map((account, order) => ({ ...account, sort_order: order })))
      return { ok: true }
    },
    [accounts, reload],
  )

  return { accounts, loading, error, reload, add, update, setActive, remove, move }
}
