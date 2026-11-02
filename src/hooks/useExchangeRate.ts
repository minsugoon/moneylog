import { useCallback, useEffect, useRef, useState } from 'react'
import { FX_CURRENCIES } from '../utils/currency.ts'
import { FX_CACHE_KEY, parseCachedSnapshot, serializeSnapshot } from '../utils/fxCache.ts'
import { chooseRate, isRateFresh, parseRateResponse, RATE_REFRESH_MIN_MS, RATE_REUSE_MS, RATE_URL, type RateChoice, type RateSnapshot } from '../utils/fxRates.ts'
import { readSetting, writeSetting } from '../utils/storage.ts'

let inFlight: Promise<RateSnapshot | null> | null = null

export async function fetchRateSnapshot(fetchImpl: typeof fetch, now: Date, timeoutMs = 8000): Promise<RateSnapshot | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(RATE_URL, { signal: controller.signal })
    if (!response.ok) return null
    const json: unknown = await response.json()
    return parseRateResponse(json, FX_CURRENCIES.map((currency) => currency.code), now)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function sharedFetch(): Promise<RateSnapshot | null> {
  if (!inFlight) {
    inFlight = fetchRateSnapshot(fetch, new Date()).finally(() => { inFlight = null })
  }
  return inFlight
}

export function useExchangeRate() {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [live, setLive] = useState<RateSnapshot | null>(null)
  const [cached, setCached] = useState<RateSnapshot | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState('')
  const mounted = useRef(false)
  const busy = useRef(false)

  useEffect(() => {
    mounted.current = true
    let active = true
    const saved = parseCachedSnapshot(readSetting(FX_CACHE_KEY))
    setCached(saved)
    if (isRateFresh(saved, new Date(), RATE_REUSE_MS)) {
      setLive(saved)
      setStatus('ready')
    } else {
      void sharedFetch().then((snapshot) => {
        if (!active) return
        if (snapshot) {
          writeSetting(FX_CACHE_KEY, serializeSnapshot(snapshot))
          setCached(snapshot)
          setLive(snapshot)
        } else setLive(null)
        setStatus('ready')
      })
    }
    return () => { active = false; mounted.current = false }
  }, [])

  const refresh = useCallback(async (): Promise<void> => {
    if (busy.current) return
    const previous = cached ?? live
    if (isRateFresh(previous, new Date(), RATE_REFRESH_MIN_MS)) {
      setNotice('방금 받은 환율이에요. 환율은 하루에 한 번 바뀌어요.')
      return
    }
    busy.current = true
    setRefreshing(true)
    try {
      const snapshot = await sharedFetch()
      if (!mounted.current) return
      if (snapshot) {
        writeSetting(FX_CACHE_KEY, serializeSnapshot(snapshot))
        setCached(snapshot)
        setLive(snapshot)
        setNotice('')
      } else {
        setNotice(previous ? '환율을 새로 받지 못했어요. 받아 둔 환율로 계산해요.' : '환율을 불러오지 못했어요.')
      }
    } finally {
      busy.current = false
      if (mounted.current) setRefreshing(false)
    }
  }, [cached, live])

  const choose = useCallback((code: string): RateChoice => chooseRate(code, live, cached), [live, cached])
  return { status, live, cached, refreshing, notice, refresh, choose }
}
