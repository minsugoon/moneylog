import { describe, expect, it } from 'vitest'
import { shinhanCard } from './shinhanCard.ts'

const now = new Date(2026, 9, 31)
const e1 = `[Web발신]
신한1234승인 홍*동
120,000원 3개월
10/05 14:20 샘플가전
누적300,000원`
const e2 = `[Web발신]
신한1234승인 홍*동
120,000원 3개월(무이자)
10/05 14:20 샘플가전
누적300,000원`

describe('신한 카드 문자 파서', () => {
  it('3개월 할부를 읽는다', () => {
    expect(shinhanCard.matches(e1)).toBe(true)
    expect(shinhanCard.parse(e1, { now })).toMatchObject({
      status: 'ok', date: '2026-10-05', time: '14:20', merchant: '샘플가전', amount: 120000,
      installment: 3, isCancel: false, interestFree: false, direction: 'expense',
      accountHint: { issuer: '신한', digits: '1234', kind: 'card' },
    })
  })

  it('무이자 할부를 읽는다', () => {
    expect(shinhanCard.parse(e2, { now })).toMatchObject({
      status: 'ok', date: '2026-10-05', time: '14:20', amount: 120000,
      installment: 3, interestFree: true,
    })
  })

  it('다른 형식에는 일치하지 않는다', () => {
    expect(shinhanCard.matches('알 수 없는 문자')).toBe(false)
  })
})
