import { describe, expect, it } from 'vitest'
import { chargeInMonth, describePayments, installmentInfo, installmentPayments, netAmount, signedNet } from './installment.ts'

// 샘플은 모두 임의로 만든 값이다
const base = { used_at: '2026-10-05', amount: 120000, discount: 0, installment_months: 12, is_cancel: false }

describe('netAmount / signedNet', () => {
  it('실결제액 = 이용금액 - 할인', () => {
    expect(netAmount(30000, 5000)).toBe(25000)
  })

  it('할인이 더 커도 0원에서 멈춘다', () => {
    expect(netAmount(1000, 5000)).toBe(0)
  })

  it('취소 건은 마이너스', () => {
    expect(signedNet({ amount: 4000, discount: 0, is_cancel: true })).toBe(-4000)
    expect(signedNet({ amount: 4000, discount: 1000, is_cancel: false })).toBe(3000)
  })

  it('0원 취소도 "-0"이 되지 않는다', () => {
    expect(Object.is(signedNet({ amount: 0, discount: 0, is_cancel: true }), 0)).toBe(true)
  })
})

describe('installmentPayments (월 납부액)', () => {
  it('나누어떨어지면 같은 금액', () => {
    expect(installmentPayments(120000, 12)).toEqual(Array(12).fill(10000))
  })

  it('남는 오차는 마지막 회차에서 보정한다', () => {
    expect(installmentPayments(100000, 3)).toEqual([33333, 33333, 33334])
  })

  it('합계는 항상 실결제액과 같다', () => {
    for (const [net, months] of [[99999, 7], [1, 12], [5, 10], [250000, 24]]) {
      const payments = installmentPayments(net, months)
      expect(payments).toHaveLength(months)
      expect(payments.reduce((a, b) => a + b, 0)).toBe(net)
      expect(payments.every((p) => p >= 0)).toBe(true)
    }
  })

  it('일시불은 한 번에', () => {
    expect(installmentPayments(5000, 1)).toEqual([5000])
  })
})

describe('describePayments (입력 폼 미리보기)', () => {
  it('나누어떨어지면 "월 N원 × M개월"', () => {
    expect(describePayments(120000, 0, 12)).toBe('월 10,000원 × 12개월')
  })

  it('오차가 있으면 마지막 회차를 따로 알려준다', () => {
    expect(describePayments(100000, 0, 3)).toBe('월 33,333원 × 2개월 + 마지막 회차 33,334원')
  })

  it('할인을 뺀 금액으로 계산한다', () => {
    expect(describePayments(130000, 10000, 12)).toBe('월 10,000원 × 12개월')
  })
})

describe('installmentInfo (회차·잔액)', () => {
  it('12개월 120,000원, 3회차 잔액은 90,000원', () => {
    // 사용월 10월 → 12월이 3회차
    expect(installmentInfo(base, '2026-12')).toEqual({ round: 3, total: 12, payment: 10000, balance: 90000 })
  })

  it('쓴 달이 1회차', () => {
    expect(installmentInfo(base, '2026-10')).toEqual({ round: 1, total: 12, payment: 10000, balance: 110000 })
  })

  it('마지막 회차의 잔액은 0', () => {
    expect(installmentInfo(base, '2027-09')).toEqual({ round: 12, total: 12, payment: 10000, balance: 0 })
  })

  it('오차 보정이 있는 마지막 회차도 잔액 0', () => {
    const tx = { ...base, amount: 100000, installment_months: 3 }
    expect(installmentInfo(tx, '2026-12')).toEqual({ round: 3, total: 3, payment: 33334, balance: 0 })
  })

  it('할인은 실결제액에서 뺀 뒤 나눈다', () => {
    const tx = { ...base, amount: 130000, discount: 10000 }
    expect(installmentInfo(tx, '2026-11')?.balance).toBe(100000)
  })

  it('할부 기간 밖이거나 일시불이면 null', () => {
    expect(installmentInfo(base, '2026-09')).toBeNull()
    expect(installmentInfo(base, '2027-10')).toBeNull()
    expect(installmentInfo({ ...base, installment_months: 1 }, '2026-10')).toBeNull()
  })
})

describe('chargeInMonth (보기 기준)', () => {
  it('사용일 기준: 쓴 달에 전액, 다른 달은 해당 없음', () => {
    expect(chargeInMonth(base, '2026-10', 'usage')).toBe(120000)
    expect(chargeInMonth(base, '2026-11', 'usage')).toBeNull()
  })

  it('월 납부액 기준: 할부 기간 동안 매달 그 회차 금액', () => {
    expect(chargeInMonth(base, '2026-10', 'payment')).toBe(10000)
    expect(chargeInMonth(base, '2027-02', 'payment')).toBe(10000)
    expect(chargeInMonth(base, '2027-10', 'payment')).toBeNull()
    expect(chargeInMonth(base, '2026-09', 'payment')).toBeNull()
  })

  it('일시불은 두 기준이 같다', () => {
    const lump = { ...base, installment_months: 1, amount: 8000 }
    expect(chargeInMonth(lump, '2026-10', 'usage')).toBe(8000)
    expect(chargeInMonth(lump, '2026-10', 'payment')).toBe(8000)
  })

  it('취소 건은 마이너스로 계산한다', () => {
    const cancel = { ...base, installment_months: 1, amount: 8000, is_cancel: true }
    expect(chargeInMonth(cancel, '2026-10', 'usage')).toBe(-8000)
  })

  it('월 납부액 기준 합계는 실결제액과 같다', () => {
    const tx = { ...base, amount: 100000, installment_months: 3 }
    const months = ['2026-10', '2026-11', '2026-12']
    const total = months.reduce((sum, m) => sum + (chargeInMonth(tx, m, 'payment') ?? 0), 0)
    expect(total).toBe(100000)
  })
})
