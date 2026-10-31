import { cleanMerchant, makeFailedRow, normalizeMessage, resolveDate, toAmount } from './common.ts'
import type { ParsedRow, SmsParser } from './types.ts'

export const samsungAutopay: SmsParser = {
  id: 'samsung-autopay',
  matches: (message) => /^\[삼성카드\]\d{2,4}\s*자동결제/.test(normalizeMessage(message)),
  parse: (message, context): ParsedRow => {
    const text = normalizeMessage(message)
    const match = /^\[삼성카드\](\d{2,4})\s*자동결제\s+(\d{1,2}\/\d{1,2})\s*접수\s+(.+?)\s+([0-9,]+\s*원)$/.exec(text)
    if (!match) return makeFailedRow(message, '자동결제 접수 문자 형식을 읽을 수 없습니다')

    const date = resolveDate(match[2], context.now)
    const merchant = cleanMerchant(match[3])
    const amount = toAmount(match[4])
    if (!date || !merchant || amount === null) {
      return makeFailedRow(message, '날짜, 금액 또는 결제명이 올바르지 않습니다')
    }

    return {
      status: 'ok', date, time: null, merchant, amount, installment: 1,
      isCancel: false, interestFree: false, direction: 'expense',
      accountHint: { issuer: '삼성', digits: match[1], kind: 'card' },
      source: 'sms', raw: message, failReason: null,
    }
  },
}
