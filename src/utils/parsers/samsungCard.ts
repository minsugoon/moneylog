import { matchesCardApproval, parseCardApproval } from './cardApproval.ts'
import type { SmsParser } from './types.ts'

export const samsungCard: SmsParser = {
  id: 'samsung-card',
  matches: (message) => matchesCardApproval(message, '삼성'),
  parse: (message, context) => parseCardApproval(message, context, '삼성'),
}
