import { describe, expect, it } from 'vitest'
import { hanaCard } from './hanaCard.ts'

const context = { now: new Date(2026, 9, 31) }
const s4 = `[Web발신]
하나56승인 홍*동 61,500원 일시불 10/15
20:51 샘플식당직영 누적820,061
원`
const s5 = `[Web발신]
하나56취소 홍*동 23,500원 일시불 10/14
19:27 (주)샘플배달_네 누적760,561
원`
const s6 = `[Web발신]
하나56취소 홍*동 23,500원 일시불 10/14
19:23 (주)샘플배달_네 누적784,061
원`

describe('하나 카드 문자 파서', () => {
  it('S4에서 두 자리 끝자리와 줄바꿈 누적을 읽는다', () => {
    expect(hanaCard.parse(s4, context)).toMatchObject({ status: 'ok', date: '2026-10-15', time: '20:51', merchant: '샘플식당직영', amount: 61500, accountHint: { issuer: '하나', digits: '56', kind: 'card' } })
  })
  it('S5와 S6 취소를 각각 읽는다', () => {
    const first = hanaCard.parse(s5, context)
    const second = hanaCard.parse(s6, context)
    expect(first).toMatchObject({ status: 'ok', date: '2026-10-14', time: '19:27', amount: 23500, isCancel: true, accountHint: { issuer: '하나', digits: '56', kind: 'card' } })
    expect(second).toMatchObject({ status: 'ok', date: '2026-10-14', time: '19:23', amount: 23500, isCancel: true, accountHint: { issuer: '하나', digits: '56', kind: 'card' } })
  })
  it('형식이 깨진 문자는 예외 없이 실패 행으로 돌려주고 원문을 보존한다', () => {
    const noAmount = '[Web발신]\n하나56승인 홍*동 금액없음'
    const badDate = '[Web발신]\n하나56승인 홍*동 1,000원 일시불 13/45 20:51 샘플가게'
    for (const broken of [noAmount, badDate]) {
      expect(hanaCard.matches(broken)).toBe(true)
      expect(hanaCard.parse(broken, context)).toMatchObject({ status: 'failed', amount: null, raw: broken })
    }
  })
  it('삼성 문자는 일치하지 않는다', () => {
    expect(hanaCard.matches('[Web발신]\n삼성1234승인 홍*동 31,800원 일시불 10/18 02:40 SampleApp')).toBe(false)
  })
})
