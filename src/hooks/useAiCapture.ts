import { useCallback, useEffect, useState } from 'react'
import { toKoreanDbMessage, type ActionResult } from '../lib/errors.ts'
import { supabase } from '../lib/supabase.ts'
import type { ParsedRow } from '../utils/parsers/types.ts'
import { friendlyAiError, kstMonthStart, sumUsage, type UsageRow } from '../utils/aiUsage.ts'
import type { ResizedImage } from '../utils/imageResize.ts'

export type ParseCaptureResult = { ok: true; rows: ParsedRow[] } | { ok: false; code: string | null; message: string }

const NOT_CONFIGURED_MESSAGE = '앱 설정(.env)이 아직 없어요.'

export function useAiCapture() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [consented, setConsented] = useState(false)
  const [monthlyLimit, setMonthlyLimit] = useState(20)
  const [used, setUsed] = useState(0)

  const reload = useCallback(async (): Promise<void> => {
    const client = supabase
    if (!client) {
      setError(NOT_CONFIGURED_MESSAGE)
      setLoading(false)
      return
    }
    setLoading(true)
    const settings = await client.from('user_settings').select('ai_consent_at, ai_monthly_limit').maybeSingle()
    if (settings.error) {
      setError(toKoreanDbMessage(settings.error))
      setLoading(false)
      return
    }
    setConsented(Boolean(settings.data?.ai_consent_at))
    setMonthlyLimit(settings.data?.ai_monthly_limit ?? 20)

    const usage = await client.from('ai_usage').select('image_count, refunded').gte('used_at', kstMonthStart(new Date()).toISOString())
    if (usage.error) {
      setError(toKoreanDbMessage(usage.error))
      setLoading(false)
      return
    }
    setUsed(sumUsage((usage.data ?? []) as UsageRow[]))
    setError('')
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const acceptConsent = useCallback(async (): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
    const { error: dbError } = await supabase.rpc('accept_ai_consent', { p_version: 1 })
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    await reload()
    return { ok: true }
  }, [reload])

  const withdrawConsent = useCallback(async (): Promise<ActionResult> => {
    if (!supabase) return { ok: false, message: NOT_CONFIGURED_MESSAGE }
    const { error: dbError } = await supabase.rpc('withdraw_ai_consent')
    if (dbError) return { ok: false, message: toKoreanDbMessage(dbError) }
    await reload()
    return { ok: true }
  }, [reload])

  const parseCapture = useCallback(async (images: ResizedImage[]): Promise<ParseCaptureResult> => {
    const client = supabase
    if (!client) return { ok: false, code: null, message: NOT_CONFIGURED_MESSAGE }
    try {
      const { data, error: invokeError } = await client.functions.invoke('parse-capture', {
        body: { images: images.map((image) => ({ mediaType: image.mediaType, data: image.data })) },
      })
      if (invokeError) {
        let code: string | null = null
        let message: string | undefined
        const context: unknown = invokeError.context
        if (context instanceof Response) {
          try {
            const body: unknown = await context.json()
            if (typeof body === 'object' && body !== null) {
              const payload = body as { error?: unknown; message?: unknown }
              if (typeof payload.error === 'string') code = payload.error
              if (typeof payload.message === 'string') message = payload.message
            }
          } catch {
            // 응답 본문을 읽지 못하면 기본 오류 문구를 사용한다.
          }
        }
        return { ok: false, code, message: friendlyAiError(code, message) }
      }
      if (typeof data !== 'object' || data === null || !Array.isArray((data as { rows?: unknown }).rows)) {
        return { ok: false, code: 'ai_bad_output', message: friendlyAiError('ai_bad_output') }
      }
      return { ok: true, rows: (data as { rows: ParsedRow[] }).rows }
    } catch {
      return { ok: false, code: null, message: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.' }
    } finally {
      await reload()
    }
  }, [reload])

  return { loading, error, consented, monthlyLimit, used, reload, acceptConsent, withdrawConsent, parseCapture }
}
