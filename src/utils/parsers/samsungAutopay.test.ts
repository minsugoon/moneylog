import { describe, expect, it } from 'vitest'
import { samsungAutopay } from './samsungAutopay.ts'

const now = new Date(2026, 9, 31)
const s1 = `[Web발신]
[삼성카드]1234
자동결제 10/20접수
샘플통신 유선상품 자동(7777)
6,130원`

describe('삼성 자동결제 문자 파서', () => {
  it('접수일과 결제 정보를 읽고 시각은 비운다', () => {
    expect(samsungAutopay.matches(s1)).toBe(true)
    expect(samsungAutopay.parse(s1, { now })).toMatchObject({
      status: 'ok', date: '2026-10-20', time: null,
      merchant: '샘플통신 유선상품 자동(7777)', amount: 6130,
      installment: 1, isCancel: false, direction: 'expense',
      accountHint: { issuer: '삼성', digits: '1234', kind: 'card' },
    })
  })

  it('다른 형식에는 일치하지 않는다', () => {
    expect(samsungAutopay.matches('삼성1234승인 문자')).toBe(false)
  })

  it('형식이 깨진 문자는 예외 없이 실패 행으로 돌려주고 원문을 보존한다', () => {
    const broken = '[Web발신]\n[삼성카드]1234\n자동결제 13/45접수\n샘플통신\n6,130원'
    expect(samsungAutopay.matches(broken)).toBe(true)
    expect(samsungAutopay.parse(broken, { now })).toMatchObject({ status: 'failed', amount: null, raw: broken })
  })
})
