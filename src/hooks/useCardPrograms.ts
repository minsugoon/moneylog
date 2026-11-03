import { useCallback, useEffect, useState } from 'react'
import { fetchAllPages } from '../lib/fetchAllPages.ts'
import { NOT_CONFIGURED, toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import { supabase } from '../lib/supabase.ts'
import type { CardBenefit, CardProgram } from '../lib/types.ts'
import { checkBenefit, checkProgram, normalizeProgram, type BenefitDraft, type ProgramDraft } from '../utils/cardProgramInput.ts'

const PROGRAM_COLUMNS = 'id, account_id, name, target_amount, measure_basis, installment_mode, period_start_day, exclude_keywords, exclusion_modes, is_active, sort_order, created_at'
const BENEFIT_COLUMNS = 'id, program_id, name, required_amount, benefit_amount, benefit_kind, linked_keyword, memo, created_at'

// 카드 실적 프로그램과 혜택 데이터를 불러오고 관리한다.
export function useCardPrograms() {
  const [programs, setPrograms] = useState<CardProgram[]>([])
  const [benefits, setBenefits] = useState<CardBenefit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const client = supabase
    if (!client) { setLoading(false); return }
    const [programResult, benefitResult] = await Promise.all([
      fetchAllPages<CardProgram>((from, to) => client.from('card_programs').select(PROGRAM_COLUMNS).order('sort_order', { ascending: true }).order('created_at', { ascending: true }).range(from, to)),
      fetchAllPages<CardBenefit>((from, to) => client.from('card_benefits').select(BENEFIT_COLUMNS).order('created_at', { ascending: true }).range(from, to)),
    ])
    if (programResult.error) setError(toKoreanDbMessage(programResult.error))
    else if (benefitResult.error) setError(toKoreanDbMessage(benefitResult.error))
    else { setPrograms(programResult.data.map(normalizeProgram)); setBenefits(benefitResult.data); setError('') }
    setLoading(false)
  }, [])

  useEffect(() => { void reload() }, [reload])

  const addProgram = useCallback(async (draft: ProgramDraft): Promise<ActionResult> => {
    const checked = checkProgram(draft)
    if (!checked.ok) return checked
    if (!supabase) return NOT_CONFIGURED
    const sort_order = programs.reduce((max, item) => Math.max(max, item.sort_order), -1) + 1
    const { data, error: dbError } = await supabase.from('card_programs').insert({ ...checked.value, sort_order }).select(PROGRAM_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setPrograms((current) => [...current, normalizeProgram(data as CardProgram)])
    return { ok: true }
  }, [programs])

  const updateProgram = useCallback(async (id: string, draft: ProgramDraft): Promise<ActionResult> => {
    const existing = programs.find((item) => item.id === id)
    const checked = checkProgram(draft, existing?.exclusion_modes)
    if (!checked.ok) return checked
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('card_programs').update(checked.value).eq('id', id).select(PROGRAM_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    const saved = normalizeProgram(data as CardProgram)
    setPrograms((current) => current.map((item) => item.id === id ? saved : item))
    return { ok: true }
  }, [programs])

  const setProgramActive = useCallback(async (id: string, active: boolean): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('card_programs').update({ is_active: active }).eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setPrograms((current) => current.map((item) => item.id === id ? { ...item, is_active: active } : item))
    return { ok: true }
  }, [])

  const removeProgram = useCallback(async (id: string): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('card_programs').delete().eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setPrograms((current) => current.filter((item) => item.id !== id))
    setBenefits((current) => current.filter((item) => item.program_id !== id))
    return { ok: true }
  }, [])

  const addBenefit = useCallback(async (programId: string, draft: BenefitDraft): Promise<ActionResult> => {
    const checked = checkBenefit(draft)
    if (!checked.ok) return checked
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('card_benefits').insert({ ...checked.value, program_id: programId }).select(BENEFIT_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setBenefits((current) => [...current, data as CardBenefit])
    return { ok: true }
  }, [])

  const updateBenefit = useCallback(async (id: string, draft: BenefitDraft): Promise<ActionResult> => {
    const checked = checkBenefit(draft)
    if (!checked.ok) return checked
    if (!supabase) return NOT_CONFIGURED
    const { data, error: dbError } = await supabase.from('card_benefits').update(checked.value).eq('id', id).select(BENEFIT_COLUMNS).single()
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setBenefits((current) => current.map((item) => item.id === id ? data as CardBenefit : item))
    return { ok: true }
  }, [])

  const removeBenefit = useCallback(async (id: string): Promise<ActionResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error: dbError } = await supabase.from('card_benefits').delete().eq('id', id)
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    setBenefits((current) => current.filter((item) => item.id !== id))
    return { ok: true }
  }, [])

  return { programs, benefits, loading, error, reload, addProgram, updateProgram, setProgramActive, removeProgram, addBenefit, updateBenefit, removeBenefit }
}
