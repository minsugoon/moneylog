import type { PostgrestError } from '@supabase/supabase-js'

// 저장·삭제 같은 동작의 결과. 실패하면 화면에 그대로 보여줄 한국어 문구가 들어 있다.
export type ActionResult = { ok: true } | { ok: false; message: string }

export const NOT_CONFIGURED: ActionResult = { ok: false, message: '앱 설정(.env)이 아직 없어요.' }

// DB가 돌려준 오류를 쉬운 한국어 문구로 바꾼다.
// 메모·결제명 같은 개인 기록이 오류 내용에 섞일 수 있으므로 콘솔에 남기지 않는다.
export function toKoreanDbMessage(error: Pick<PostgrestError, 'code' | 'message'>): string {
  switch (error.code) {
    case '23505':
      return '같은 내용이 이미 있어요.'
    case '23514':
      return '입력한 값이 허용 범위를 벗어났어요. 내용을 다시 확인해 주세요.'
    case '22003':
      return '금액이 너무 커요. 다시 확인해 주세요.'
    case '42501':
    case 'PGRST301':
      return '권한이 없어요. 로그아웃한 뒤 다시 로그인해 주세요.'
  }
  if (/fetch|network/i.test(error.message)) {
    return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
  }
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}
