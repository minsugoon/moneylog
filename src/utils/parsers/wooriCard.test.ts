import { describe, expect, it } from 'vitest'
import { wooriCard } from './wooriCard.ts'

const context = { now: new Date(2026, 9, 31) }
const s7 = `[Web발신]
우리(5678)승인
홍*동님
46,900원 일시불
10/12 10:52
샘플전자 구독료`
const s8 = `[Web발신]
우리(5678)승인
홍*동님
62,670원 일시불
10/12 10:39
샘플통신요금 자동납부_7777`
const s9 = `[Web발신]
우리(5678)승인
홍*동님
151,000원 일시불
10/07 15:18
샘플레스토랑 여의도점`

describe('우리 카드 문자 파서', () => {
  it('S7을 읽는다', () => {
    expect(wooriCard.parse(s7, context)).toMatchObject({ status: 'ok', date: '2026-10-12', time: '10:52', amount: 46900, accountHint: { issuer: '우리', digits: '5678', kind: 'card' } })
  })
  it('S8 결제명을 그대로 읽는다', () => {
    expect(wooriCard.parse(s8, context)).toMatchObject({ status: 'ok', date: '2026-10-12', time: '10:39', merchant: '샘플통신요금 자동납부_7777', amount: 62670, accountHint: { issuer: '우리', digits: '5678', kind: 'card' } })
  })
  it('S9을 읽는다', () => {
    expect(wooriCard.parse(s9, context)).toMatchObject({ status: 'ok', date: '2026-10-07', time: '15:18', merchant: '샘플레스토랑 여의도점', amount: 151000, accountHint: { issuer: '우리', digits: '5678', kind: 'card' } })
  })
})
