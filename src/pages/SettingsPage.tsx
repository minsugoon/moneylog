import { useState } from 'react'
import AccountSection from '../components/accounts/AccountSection.tsx'
import AiSettingsSection from '../components/settings/AiSettingsSection.tsx'
import CardProgramSection from '../components/settings/CardProgramSection.tsx'
import CurrencySection from '../components/settings/CurrencySection.tsx'
import FixedExpenseSection from '../components/settings/FixedExpenseSection.tsx'
import FixedTypeSection from '../components/settings/FixedTypeSection.tsx'
import HelpView from '../components/help/HelpView.tsx'
import { cardClass } from '../components/ui.ts'
import type { AuthResult } from '../hooks/useAuth.ts'

interface SettingsPageProps {
  email: string
  provider: string
  onSignOut: () => Promise<AuthResult>
}

// 설정 화면: 결제수단 관리, 계정 정보, 로그아웃
function SettingsPage({ email, provider, onSignOut }: SettingsPageProps) {
  const [helpOpen, setHelpOpen] = useState(false)
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

  if (helpOpen) return <HelpView onBack={() => setHelpOpen(false)} />

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-800">설정</h2>

      <div data-coach="settings-accounts"><AccountSection /></div>

      <div data-coach="settings-card-programs"><CardProgramSection /></div>

      <div data-coach="settings-fixed"><FixedExpenseSection /></div>

      <div data-coach="settings-fixed-types"><FixedTypeSection /></div>

      <div data-coach="settings-currency"><CurrencySection /></div>

      <div data-coach="settings-ai"><AiSettingsSection /></div>

      <button type="button" data-coach="settings-help" onClick={() => setHelpOpen(true)} className={`${cardClass} flex min-h-14 w-full items-center justify-between text-left`}>
        <span>
          <span className="block text-base font-bold text-gray-800">❓ 도움말</span>
          <span className="block text-xs text-gray-600">기능별 사용법과 자주 묻는 질문, 화면 안내 다시 보기</span>
        </span>
        <span aria-hidden="true" className="text-gray-500">›</span>
      </button>

      <section className="rounded-2xl bg-white p-5 shadow-sm" aria-labelledby="account-title">
        <h3 id="account-title" className="text-sm font-bold text-gray-600">
          내 계정
        </h3>
        <p className="mt-2 break-all text-base text-gray-800">{email}</p>
        <p className="mt-1 text-sm text-gray-600">{provider === 'google' ? '구글 계정으로 로그인' : '이메일로 로그인'}</p>

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
        <p className="mt-2 text-xs text-gray-500">이 기기에서만 로그아웃돼요.</p>
      </section>
    </div>
  )
}

export default SettingsPage
