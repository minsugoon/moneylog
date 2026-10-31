import { describe, expect, it } from 'vitest'
import { hanaBank } from './hanaBank.ts'

const now = new Date(2026, 9, 31)
const b1 = `[Web발신]
하나,10/26 15:01
123******45678
출금21,900원
샘플페이`
const b2 = `[Web발신]
하나,10/27 10:17
123******45678
입금11,003원
샘플보험환급`

describe('하나은행 통장 문자 파서', () => {
  it('출금 내역에서 계좌 끝 4자리만 힌트로 반환한다', () => {
    expect(hanaBank.matches(b1)).toBe(true)
    const row = hanaBank.parse(b1, { now })
    expect(row).toMatchObject({
      status: 'ok', date: '2026-10-26', time: '15:01', merchant: '샘플페이', amount: 21900,
      direction: 'expense', isCancel: false,
      accountHint: { issuer: '하나', digits: '5678', kind: 'account' },
    })
    const { raw, ...storedFields } = row
    expect(raw).toBe(b1)
    expect(JSON.stringify(storedFields)).not.toContain('123******45678')
    expect(JSON.stringify(storedFields)).not.toContain('45678')
  })

  it('입금은 수입으로 읽는다', () => {
    expect(hanaBank.parse(b2, { now })).toMatchObject({
      status: 'ok', date: '2026-10-27', time: '10:17', merchant: '샘플보험환급', amount: 11003,
      direction: 'income', accountHint: { digits: '5678', kind: 'account' },
    })
  })

  it('다른 형식에는 일치하지 않는다', () => {
    expect(hanaBank.matches('국민,10/26 15:01 입금')).toBe(false)
  })

  it('형식이 깨진 문자는 예외 없이 실패 행으로 돌려주고 원문을 보존한다', () => {
    const broken = '[Web발신]\n하나,10/26 25:61\n123******45678\n출금21,900원\n샘플페이'
    expect(hanaBank.matches(broken)).toBe(true)
    expect(hanaBank.parse(broken, { now })).toMatchObject({ status: 'failed', amount: null, raw: broken })
  })
})
