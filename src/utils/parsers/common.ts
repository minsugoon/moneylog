import type { ParsedRow } from './types.ts'

export function toAmount(text: string): number | null {
  const normalized = text.replace(/[\s,원]/g, '')
  if (!/^\d+$/.test(normalized)) return null
  const amount = Number(normalized)
  return Number.isSafeInteger(amount) ? amount : null
}

export function resolveDate(monthDay: string, now: Date): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(monthDay.trim())
  if (!match) return null

  const month = Number(match[1])
  const day = Number(match[2])
  const currentYear = now.getFullYear()
  const today = new Date(currentYear, now.getMonth(), now.getDate())

  for (let year = currentYear; year >= currentYear - 4; year -= 1) {
    const candidate = new Date(year, month - 1, day)
    if (candidate.getMonth() !== month - 1 || candidate.getDate() !== day) continue
    if (candidate <= today) {
      const yyyy = String(year).padStart(4, '0')
      const mm = String(month).padStart(2, '0')
      const dd = String(day).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }
  }
  return null
}

export function normalizeTime(text: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function cleanMerchant(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/\($/, '').trim()
}

export function parseInstallment(text: string): { installment: number; interestFree: boolean } {
  const interestFree = text.includes('무이자')
  const match = /(?<!\d)(\d+)\s*개월/.exec(text)
  return {
    installment: match ? Number(match[1]) : 1,
    interestFree,
  }
}

export function digitsFromMaskedAccount(text: string): string | null {
  const digits = text.replace(/\D/g, '')
  if (!digits) return null
  return digits.slice(-4)
}

export function normalizeMessage(raw: string): string {
  return raw
    .replace(/^\s*\[(?:Web발신|국제발신|SMS)\]\s*/i, '')
    .replace(/[\r\n\s]+/g, ' ')
    .trim()
}

export function makeFailedRow(
  raw: string,
  failReason: string,
  source: ParsedRow['source'] = 'sms',
): ParsedRow {
  return {
    status: 'failed',
    date: null,
    time: null,
    merchant: '',
    amount: null,
    installment: 1,
    isCancel: false,
    interestFree: false,
    direction: 'expense',
    accountHint: null,
    source,
    raw,
    failReason,
  }
}
