import { useState, type FormEvent } from 'react'
import type { AuthResult } from '../hooks/useAuth.ts'
import GoogleLogo from '../components/GoogleLogo.tsx'

type Mode = 'signin' | 'signup'

interface LoginPageProps {
  onGoogle: () => Promise<AuthResult>
  onEmailSignIn: (email: string, password: string) => Promise<AuthResult>
  onEmailSignUp: (email: string, password: string) => Promise<AuthResult>
}

// Supabase 기본 설정의 최소 비밀번호 길이
const MIN_PASSWORD_LENGTH = 6

const inputClass =
  'min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'

// 로그인·회원가입 화면. 구글이 기본이고, 이메일+비밀번호도 쓸 수 있다.
function LoginPage({ onGoogle, onEmailSignIn, onEmailSignUp }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const isSignUp = mode === 'signup'

  function switchMode(next: Mode) {
    setMode(next)
    setPassword('')
    setPasswordConfirm('')
    setError('')
    setNotice('')
  }

  async function handleGoogle() {
    setBusy(true)
    setError('')
    setNotice('')
    const result = await onGoogle()
    // 성공하면 구글 페이지로 이동하므로, 실패했을 때만 이 화면에 남는다
    if (!result.ok) {
      setError(result.message)
      setBusy(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상으로 만들어 주세요.`)
      return
    }
    if (isSignUp && password !== passwordConfirm) {
      setError('비밀번호 확인이 일치하지 않아요.')
      return
    }

    setBusy(true)
    const result = isSignUp
      ? await onEmailSignUp(trimmedEmail, password)
      : await onEmailSignIn(trimmedEmail, password)
    setBusy(false)

    if (!result.ok) {
      setError(result.message)
      return
    }
    // 확인 메일을 보낸 경우: 로그인 화면으로 돌아가 안내를 보여준다
    if (result.message) {
      setMode('signin')
      setPassword('')
      setPasswordConfirm('')
      setNotice(result.message)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <main className="w-full max-w-sm py-8">
        <h1 className="text-center text-3xl font-bold text-brand">Moneylog</h1>
        <p className="mt-2 text-center text-sm text-gray-500">붙여넣기만 하면 정리되는 가계부</p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">{isSignUp ? '회원가입' : '로그인'}</h2>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <GoogleLogo />
            구글로 {isSignUp ? '가입하기' : '계속하기'}
          </button>

          <div className="my-5 flex items-center gap-3 text-sm text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            또는 이메일로
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              이메일
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              비밀번호
              <input
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            {isSignUp && (
              <label className="flex flex-col gap-1 text-sm text-gray-600">
                비밀번호 확인
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={inputClass}
                />
              </label>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand" role="status">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 min-h-12 w-full rounded-lg bg-brand text-base font-bold text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {busy ? '잠시만요…' : isSignUp ? '이메일로 가입하기' : '이메일로 로그인'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            {isSignUp ? '이미 계정이 있나요?' : '처음이신가요?'}
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
              className="ml-1 min-h-11 px-1 font-bold text-brand"
            >
              {isSignUp ? '로그인' : '회원가입'}
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
