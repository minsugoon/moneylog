import AppShell from './components/layout/AppShell.tsx'
import StatusScreen from './components/StatusScreen.tsx'
import { useAuth } from './hooks/useAuth.ts'
import LoginPage from './pages/LoginPage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'

// 로그인 여부에 따라 보여줄 화면을 고른다. 로그인하지 않으면 앱 안으로 들어갈 수 없다.
function App() {
  const auth = useAuth()

  if (!auth.isConfigured) {
    return (
      <StatusScreen
        title="앱 설정이 필요해요"
        message="Supabase 주소와 키(.env)가 아직 등록되지 않았어요. 관리자에게 알려 주세요."
      />
    )
  }

  if (auth.loading) {
    return <StatusScreen title="로그인 정보를 확인하고 있어요…" />
  }

  if (!auth.session) {
    return (
      <LoginPage
        onGoogle={auth.signInWithGoogle}
        onEmailSignIn={auth.signInWithEmail}
        onEmailSignUp={auth.signUpWithEmail}
      />
    )
  }

  const { user } = auth.session

  return (
    <AppShell
      pages={{
        settings: (
          <SettingsPage
            email={user.email ?? ''}
            provider={user.app_metadata.provider ?? 'email'}
            onSignOut={auth.signOut}
          />
        ),
      }}
    />
  )
}

export default App
