import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRateSnapshot } from './useExchangeRate.ts'
import { RATE_URL } from '../utils/fxRates.ts'

const body = { result: 'success', rates: { KRW: 1300, VND: 25000, USD: 1, JPY: 150, EUR: 0.9, CNY: 7, THB: 35 } }

afterEach(() => vi.useRealTimers())

describe('fetchRateSnapshot', () => {
  it('달러 기준 응답을 코드별 환율로 바꾼다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
    const result = await fetchRateSnapshot(fetchMock, new Date('2026-10-31T00:00:00.000Z'))
    expect(result?.rates.USD).toBe(1300)
    expect(result?.rates.EUR).toBeCloseTo(1300 / 0.9)
  })

  it('429 응답은 null로 처리한다', async () => {
    expect(await fetchRateSnapshot(vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 429 })), new Date())).toBeNull()
  })

  it('네트워크 예외와 JSON 오류는 null로 처리한다', async () => {
    expect(await fetchRateSnapshot(vi.fn<typeof fetch>().mockRejectedValue(new Error('network')), new Date())).toBeNull()
    expect(await fetchRateSnapshot(vi.fn<typeof fetch>().mockResolvedValue(new Response('{', { status: 200 })), new Date())).toBeNull()
  })

  it('시간 초과 시 요청을 중단하고 null을 돌려준다', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<typeof fetch>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
    }))
    const pending = fetchRateSnapshot(fetchMock, new Date(), 100)
    await vi.advanceTimersByTimeAsync(100)
    expect(await pending).toBeNull()
  })

  it('주소와 signal 옵션만 전달한다', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
    await fetchRateSnapshot(fetchMock, new Date())
    expect(fetchMock).toHaveBeenCalledWith(RATE_URL, { signal: expect.any(AbortSignal) })
  })
})
