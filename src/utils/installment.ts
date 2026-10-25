import type { Transaction } from '../lib/types.ts'
import { formatWon, monthDiff, toMonthKey } from './format.ts'

// 보기 기준: 사용일 기준(쓴 달에 전액) / 월 납부액 기준(할부는 매달 나눠서)
export type ViewBasis = 'usage' | 'payment'

type Amounts = Pick<Transaction, 'amount' | 'discount' | 'is_cancel'>
type InstallmentSource = Amounts & Pick<Transaction, 'used_at' | 'installment_months'>

// 실결제액 = 이용금액 - 할인. 할인이 더 커도 마이너스가 되지 않게 0에서 멈춘다.
export function netAmount(amount: number, discount: number): number {
  return Math.max(0, amount - discount)
}

// 취소 건은 금액을 마이너스로 본다. DB의 금액은 항상 0 이상이다. (0 - x 로 써서 "-0"이 나오지 않게 한다)
export function signedNet(tx: Amounts): number {
  const net = netAmount(tx.amount, tx.discount)
  return tx.is_cancel ? 0 - net : net
}

// 회차별 납부액. 월 납부액 = 실결제액 / 개월(원 단위 반올림), 남는 오차는 마지막 회차에서 보정한다.
// 예) 100,000원 3개월 → [33,333, 33,333, 33,334]
export function installmentPayments(net: number, months: number): number[] {
  const count = Math.max(1, Math.floor(months))
  if (count === 1) return [net]

  let base = Math.round(net / count)
  // 아주 작은 금액에서 반올림이 마지막 회차를 마이너스로 만들면 내림으로 바꾼다
  if (base * (count - 1) > net) base = Math.floor(net / count)

  const payments = Array<number>(count - 1).fill(base)
  payments.push(net - base * (count - 1))
  return payments
}

// 입력 폼에 보여줄 할부 미리보기 문구. 예) "월 10,000원 × 12개월"
export function describePayments(amount: number, discount: number, months: number): string {
  const payments = installmentPayments(netAmount(amount, discount), months)
  const first = payments[0]
  const last = payments[payments.length - 1]
  return last === first
    ? `월 ${formatWon(first)} × ${months}개월`
    : `월 ${formatWon(first)} × ${months - 1}개월 + 마지막 회차 ${formatWon(last)}`
}

export interface InstallmentInfo {
  round: number // 몇 회차
  total: number // 전체 개월
  payment: number // 이번 회차 납부액
  balance: number // 이번 회차까지 내고 남은 할부잔액 (마지막 회차는 0)
}

// 선택한 달에 이 내역이 몇 회차인지, 잔액이 얼마인지.
// 회차 = (선택월 - 사용월) + 1. 일시불이거나 할부 기간 밖의 달이면 null.
export function installmentInfo(tx: InstallmentSource, monthKey: string): InstallmentInfo | null {
  const total = tx.installment_months
  if (total <= 1) return null
  const index = monthDiff(toMonthKey(tx.used_at), monthKey)
  if (index < 0 || index >= total) return null

  const net = netAmount(tx.amount, tx.discount)
  const payments = installmentPayments(net, total)
  const paid = payments.slice(0, index + 1).reduce((sum, p) => sum + p, 0)
  return { round: index + 1, total, payment: payments[index], balance: net - paid }
}

// 선택한 달에 이 내역으로 계산할 금액(취소는 마이너스). 그 달에 해당하지 않으면 null.
// - 사용일 기준: 쓴 달에만 실결제액 전액
// - 월 납부액 기준: 할부 기간 동안 매달 그 회차의 납부액
export function chargeInMonth(tx: InstallmentSource, monthKey: string, basis: ViewBasis): number | null {
  const index = monthDiff(toMonthKey(tx.used_at), monthKey)
  const net = netAmount(tx.amount, tx.discount)
  const sign = tx.is_cancel ? -1 : 1

  if (basis === 'usage') return index === 0 ? sign * net + 0 : null

  const payments = installmentPayments(net, tx.installment_months)
  return index >= 0 && index < payments.length ? sign * payments[index] + 0 : null
}
