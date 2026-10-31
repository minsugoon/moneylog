export function kstMonthStart(now: Date): Date {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), 1) - 9 * 60 * 60 * 1000)
}

export type UsageRow = { image_count: number; refunded: boolean }

export function sumUsage(rows: UsageRow[]): number {
  return rows.reduce((total, row) => total + (row.refunded ? 0 : row.image_count), 0)
}

export type ErrorCode = 'ai_disabled' | 'not_authenticated' | 'bad_request' | 'ai_not_consented' | 'ai_limit_month' | 'ai_limit_day' | 'ai_rate_limit' | 'ai_failed' | 'ai_bad_output'

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  ai_disabled: 'AI 입력이 잠시 중단되었어요. 문자 붙여넣기나 직접 입력은 그대로 쓸 수 있어요.',
  not_authenticated: '로그인이 필요해요. 다시 로그인해 주세요.',
  bad_request: '요청을 처리할 수 없어요.',
  ai_not_consented: 'AI 입력을 쓰려면 먼저 안내를 확인하고 동의해 주세요.',
  ai_limit_month: '이번 달 AI 입력 한도를 모두 썼어요. 문자 붙여넣기나 직접 입력은 계속 쓸 수 있어요.',
  ai_limit_day: '오늘 AI 입력 한도를 모두 썼어요. 내일 다시 시도해 주세요.',
  ai_rate_limit: '너무 빠르게 요청했어요. 잠시 뒤에 다시 시도해 주세요.',
  ai_failed: 'AI가 응답하지 못했어요. 잠시 뒤에 다시 시도해 주세요. (이번 횟수는 차감되지 않아요)',
  ai_bad_output: '캡처 내용을 읽지 못했어요. 더 선명한 캡처로 다시 시도해 주세요. (이번 횟수는 차감되지 않아요)',
}

export function friendlyAiError(code: string | null | undefined, fallback = '잠시 뒤에 다시 시도해 주세요.'): string {
  return code && code in ERROR_MESSAGES ? ERROR_MESSAGES[code as ErrorCode] : fallback
}
