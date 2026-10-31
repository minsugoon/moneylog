import { describe, expect, it } from 'vitest'
import { samsungCard } from './samsungCard.ts'

const context = { now: new Date(2026, 9, 31) }
const s2 = `[Web발신]
삼성1234승인 홍*동
31,800원 일시불
10/18 02:40 SampleApp
누적184,350원`
const s3 = `[Web발신]
삼성1234승인 홍*동
7,300원 일시불
10/07 15:07 샘플택시(
누적480,111원`

describe('삼성 카드 문자 파서', () => {
  it('S2 승인과 누적 금액을 읽는다', () => {
    const row = samsungCard.parse(s2, context)
    expect(samsungCard.matches(s2)).toBe(true)
    expect(row).toMatchObject({ status: 'ok', date: '2026-10-18', time: '02:40', merchant: 'SampleApp', amount: 31800, accountHint: { issuer: '삼성', digits: '1234', kind: 'card' } })
  })
  it('S3 결제명 끝의 괄호를 제거한다', () => {
    expect(samsungCard.parse(s3, context)).toMatchObject({ status: 'ok', date: '2026-10-07', time: '15:07', merchant: '샘플택시', amount: 7300, accountHint: { issuer: '삼성', digits: '1234', kind: 'card' } })
  })
  it('다른 카드사 문자는 일치하지 않는다', () => {
    expect(samsungCard.matches('[Web발신]\n하나56승인 홍*동 61,500원 일시불 10/15 20:51 샘플식당직영')).toBe(false)
  })
})
