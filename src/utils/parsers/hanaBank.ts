import { cleanMerchant, digitsFromMaskedAccount, makeFailedRow, normalizeMessage, normalizeTime, resolveDate, toAmount } from './common.ts'
import type { ParsedRow, SmsParser } from './types.ts'

export const hanaBank: SmsParser = {
  id: 'hana-bank',
  matches: (message) => /^하나\s*,\s*\d{1,2}\/\d{1,2}/.test(normalizeMessage(message)),
  parse: (message, context): ParsedRow => {
    const text = normalizeMessage(message)
    const match = /^하나\s*,\s*(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})\s+(\S+)\s+(출금|입금)([0-9,]+\s*원)\s*(.*)$/.exec(text)
    if (!match) return makeFailedRow(message, '하나은행 통장 문자 형식을 읽을 수 없습니다')

    const date = resolveDate(match[1], context.now)
    const time = normalizeTime(match[2])
    const amount = toAmount(match[5])
    if (!date || !time || amount === null) {
      return makeFailedRow(message, '날짜, 시각 또는 금액이 올바르지 않습니다')
    }

    return {
      status: 'ok', date, time, merchant: cleanMerchant(match[6]), amount,
      installment: 1, isCancel: false, interestFree: false,
      direction: match[4] === '출금' ? 'expense' : 'income',
      accountHint: { issuer: '하나', digits: digitsFromMaskedAccount(match[3]), kind: 'account' },
      source: 'sms', raw: message, failReason: null,
    }
  },
}
