import { matchesCardApproval, parseCardApproval } from './cardApproval.ts'
import type { SmsParser } from './types.ts'

export const wooriCard: SmsParser = {
  id: 'woori-card',
  matches: (message) => matchesCardApproval(message, '우리'),
  parse: (message, context) => parseCardApproval(message, context, '우리'),
}
