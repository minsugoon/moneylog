import type { PostgrestError } from '@supabase/supabase-js'

// Supabase는 한 번에 최대 1000줄까지만 돌려준다. 내역이 많아져도 빠짐없이 가져오도록 나눠서 불러온다.
const PAGE_SIZE = 1000

type Page<T> = { data: T[] | null; error: PostgrestError | null }

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<Page<T>>,
): Promise<{ data: T[]; error: null } | { data: null; error: PostgrestError }> {
  const all: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) return { data: null, error }
    const rows = data ?? []
    all.push(...rows)
    if (rows.length < PAGE_SIZE) break
  }
  return { data: all, error: null }
}
