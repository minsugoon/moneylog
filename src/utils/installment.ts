import type { Transaction } from '../lib/types.ts'

// 실결제액 = 이용금액 - 할인. 할인이 더 커도 마이너스가 되지 않게 0에서 멈춘다.
export function netAmount(amount: number, discount: number): number {
  return Math.max(0, amount - discount)
}

// 취소 건은 금액을 마이너스로 본다. DB의 금액은 항상 0 이상이다.
export function signedNet(tx: Pick<Transaction, 'amount' | 'discount' | 'is_cancel'>): number {
  const net = netAmount(tx.amount, tx.discount)
  return tx.is_cancel ? -net : net
}
