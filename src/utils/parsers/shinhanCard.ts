import { matchesCardApproval, parseCardApproval } from './cardApproval.ts'
import type { SmsParser } from './types.ts'

export const shinhanCard: SmsParser = {
  id: 'shinhan-card',
  matches: (message) => matchesCardApproval(message, '신한'),
  parse: (message, context) => parseCardApproval(message, context, '신한'),
}
