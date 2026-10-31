import { cleanMerchant, makeFailedRow, normalizeMessage, normalizeTime, parseInstallment, resolveDate, toAmount } from './common.ts'
import type { ParsedRow, ParseContext } from './types.ts'

export function matchesCardApproval(message: string, issuer: string): boolean {
  return new RegExp(`^${issuer}\\(?\\d{2,4}\\)?(?:승인|취소)`).test(normalizeMessage(message))
}

export function parseCardApproval(message: string, context: ParseContext, issuer: string): ParsedRow {
  const text = normalizeMessage(message)
  const match = new RegExp(`^${issuer}\\(?([0-9]{2,4})\\)?(승인|취소)\\s+(?:(\\S*\\*\\S*)\\s+)?([0-9,]+\\s*원)\\s+(일시불|[0-9]+\\s*개월(?:\\s*\\(무이자\\))?)\\s+([0-9]{1,2}/[0-9]{1,2})\\s+([0-9]{1,2}:[0-9]{2})\\s+(.+)$`).exec(text)
  if (!match) return makeFailedRow(message, '카드 승인·취소 문자 형식을 읽을 수 없습니다')

  const amount = toAmount(match[4])
  const date = resolveDate(match[6], context.now)
  const time = normalizeTime(match[7])
  const merchant = cleanMerchant(match[8].replace(/\s*누적\s*[0-9,]+.*$/, ''))
  if (amount === null || date === null || time === null || !merchant) {
    return makeFailedRow(message, '금액, 날짜, 시각 또는 결제명이 올바르지 않습니다')
  }
  const installment = parseInstallment(match[5])
  return {
    status: 'ok', date, time, merchant, amount,
    installment: installment.installment, isCancel: match[2] === '취소',
    interestFree: installment.interestFree, direction: 'expense',
    accountHint: { issuer, digits: match[1], kind: 'card' },
    source: 'sms', raw: message, failReason: null,
  }
}
