import { useCallback, useEffect, useState } from 'react'
import type { AuthError, Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase.ts'

export type AuthResult = { ok: true; message?: string } | { ok: false; message: string }

const NOT_CONFIGURED: AuthResult = { ok: false, message: '앱 설정(.env)이 아직 없어요.' }

// Supabase가 돌려준 오류를 쉬운 한국어 문구로 바꾼다.
// 오류 내용에 개인 정보가 섞일 수 있으므로 콘솔에 남기지 않는다.
function toKoreanMessage(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return '이메일 또는 비밀번호가 맞지 않아요.'
    case 'email_not_confirmed':
      return '아직 이메일 확인이 안 됐어요. 가입할 때 받은 메일의 링크를 먼저 눌러 주세요.'
    case 'user_already_exists':
    case 'email_exists':
      return '이미 가입된 이메일이에요. 로그인해 주세요.'
    case 'weak_password':
      return '비밀번호가 너무 쉬워요. 더 길게 만들어 주세요.'
    case 'email_address_invalid':
      return '이메일 주소 형식을 다시 확인해 주세요.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
    case 'signup_disabled':
    case 'email_provider_disabled':
      return '지금은 이메일 가입을 받을 수 없어요.'
  }
  if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
    return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
  }
  return '문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

// 로그인 상태 확인, 로그인, 가입, 로그아웃을 담당한다
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  // 설정이 없으면 확인할 것도 없으므로 처음부터 로딩이 아니다
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return

    // 기기에 기억된 로그인 상태를 먼저 불러온다
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // 로그인·로그아웃·자동 갱신이 일어날 때마다 화면을 바꾼다
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // 구글 로그인 페이지로 이동한다. 끝나면 이 앱 주소로 돌아온다.
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return error ? { ok: false, message: toKoreanMessage(error) } : { ok: true }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { ok: false, message: toKoreanMessage(error) } : { ok: true }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) return { ok: false, message: toKoreanMessage(error) }

    // 이미 가입된 이메일이면 Supabase는 오류 대신 빈 계정 정보를 돌려준다
    if (data.user && data.user.identities?.length === 0) {
      return { ok: false, message: '이미 가입된 이메일이에요. 로그인해 주세요.' }
    }
    // 이메일 확인이 켜져 있으면 바로 로그인되지 않는다
    if (!data.session) {
      return {
        ok: true,
        message: '확인 메일을 보냈어요. 메일의 링크를 누른 뒤, 이 화면에서 로그인해 주세요.',
      }
    }
    return { ok: true }
  }, [])

  // 이 기기에서만 로그아웃한다 (다른 기기의 로그인은 그대로)
  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    return error ? { ok: false, message: toKoreanMessage(error) } : { ok: true }
  }, [])

  return {
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}
