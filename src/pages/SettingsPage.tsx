import { useState } from 'react'
import AccountSection from '../components/accounts/AccountSection.tsx'
import type { AuthResult } from '../hooks/useAuth.ts'

interface SettingsPageProps {
  email: string
  provider: string
  onSignOut: () => Promise<AuthResult>
}

// 설정 화면: 결제수단 관리, 계정 정보, 로그아웃
function SettingsPage({ email, provider, onSignOut }: SettingsPageProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSignOut() {
    setBusy(true)
    setError('')
    const result = await onSignOut()
    // 성공하면 로그인 화면으로 바뀌므로, 실패했을 때만 이 화면에 남는다
    if (!result.ok) {
      setError(result.message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">설정</h2>

      <AccountSection />

      <section className="rounded-2xl bg-white p-5 shadow-sm" aria-labelledby="account-title">
        <h3 id="account-title" className="text-sm font-bold text-gray-500">
          내 계정
        </h3>
        <p className="mt-2 break-all text-base text-gray-800">{email}</p>
        <p className="mt-1 text-sm text-gray-500">{provider === 'google' ? '구글 계정으로 로그인' : '이메일로 로그인'}</p>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          disabled={busy}
          className="mt-4 min-h-11 w-full rounded-lg border border-gray-300 text-base text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? '로그아웃하는 중…' : '로그아웃'}
        </button>
        <p className="mt-2 text-xs text-gray-400">이 기기에서만 로그아웃돼요.</p>
      </section>
    </div>
  )
}

export default SettingsPage
