export type AccountHint = {
  issuer: string | null
  digits: string | null
  kind: 'card' | 'account' | null
}

export type ParsedRow = {
  status: 'ok' | 'failed'
  date: string | null
  time: string | null
  merchant: string
  amount: number | null
  installment: number
  isCancel: boolean
  interestFree: boolean
  direction: 'expense' | 'income'
  accountHint: AccountHint | null
  source: 'sms' | 'capture' | 'file'
  raw: string
  failReason: string | null
}

export type ParseContext = { now: Date }

export type SmsParser = {
  id: string
  matches: (message: string) => boolean
  parse: (message: string, context: ParseContext) => ParsedRow
}
