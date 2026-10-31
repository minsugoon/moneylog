import { hanaBank } from './hanaBank.ts'
import { hanaCard } from './hanaCard.ts'
import { makeFailedRow } from './common.ts'
import { samsungAutopay } from './samsungAutopay.ts'
import { samsungCard } from './samsungCard.ts'
import { shinhanCard } from './shinhanCard.ts'
import { splitMessages } from './splitMessages.ts'
import type { ParseContext, ParsedRow, SmsParser } from './types.ts'
import { wooriCard } from './wooriCard.ts'

export const smsParsers: SmsParser[] = [
  samsungAutopay,
  samsungCard,
  hanaCard,
  wooriCard,
  shinhanCard,
  hanaBank,
]

export function parseMessage(message: string, context: ParseContext): ParsedRow {
  try {
    const parser = smsParsers.find((candidate) => candidate.matches(message))
    return parser
      ? parser.parse(message, context)
      : makeFailedRow(message, '알 수 없는 형식이에요')
  } catch {
    return makeFailedRow(message, '읽는 중 문제가 생겼어요')
  }
}

export function parseMessages(text: string, context: ParseContext): ParsedRow[] {
  return splitMessages(text).map((message) => parseMessage(message, context))
}
