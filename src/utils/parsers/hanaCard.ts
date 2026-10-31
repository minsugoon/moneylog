import { matchesCardApproval, parseCardApproval } from './cardApproval.ts'
import type { SmsParser } from './types.ts'

export const hanaCard: SmsParser = {
  id: 'hana-card',
  matches: (message) => matchesCardApproval(message, '하나'),
  parse: (message, context) => parseCardApproval(message, context, '하나'),
}
