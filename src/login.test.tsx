import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LoginPage from './pages/LoginPage.tsx'

describe('로그인 화면', () => {
  it('기본 로그인과 장식 미리보기를 표시한다', () => {
    const html = renderToString(
      <LoginPage
        onGoogle={async () => ({ ok: false, message: '로그인 오류' })}
        onEmailSignIn={async () => ({ ok: false, message: '로그인 오류' })}
        onEmailSignUp={async () => ({ ok: false, message: '가입 오류' })}
      />,
    )
    const visibleText = html.replace(/<!-- -->/g, '')

    expect(visibleText).toContain('Moneylog')
    expect(visibleText).toContain('붙여넣기만 하면 정리되는 가계부')
    expect(visibleText).toContain('구글로 계속하기')
    expect(visibleText).toContain('또는 이메일로')
    expect(visibleText).toContain('이메일로 로그인')
    expect(visibleText).toContain('처음이신가요?')
    expect(visibleText).toContain('회원가입')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('type="email"')
    expect(html).toContain('type="password"')
    expect(visibleText).not.toMatch(/링크|매직/)
  })
})
