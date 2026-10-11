# Moneylog 환경 준비 · 배포 가이드

- 버전: v0.5 / 최종 수정: 2026-10-09
- 대상: 제로베이스 초보자. 한 단계씩, 확인하고 넘어간다.

## 1. 전체 연결 구조
| 도구 | 역할 | 쉬운 비유 |
|------|------|-----------|
| VS Code + Claude CLI | 코드를 만드는 곳 | 작업대 |
| GitHub | 코드 보관 | 보관함 |
| Vercel | 코드를 인터넷에 공개 | 가게 |
| Cloudflare | `moneylog.vibecodelab.dev` 주소 연결 | 주소록 |
| Supabase | 로그인과 데이터 저장 | 금고 |

흐름: 코드 수정 → GitHub에 올림(push) → Vercel이 자동으로 다시 공개

## 2. 준비물 설치 확인
터미널(VS Code 안에서 `` Ctrl+` ``)에서 확인한다.
```bash
node -v
git --version
claude --version
```
세 줄 모두 버전 숫자가 나오면 통과. 안 나오면 해당 프로그램을 설치한다.

## 3. 프로젝트 폴더와 GitHub 연결
```bash
mkdir moneylog
cd moneylog
git init
git branch -M main
code .
```
1. GitHub에서 **비공개(Private)** 저장소 `moneylog`를 만든다. (가계부 앱이라 비공개 필수)
2. 저장소 화면에 나오는 `git remote add origin ...` 명령을 그대로 실행한다.
3. 이 폴더에 `CLAUDE.md`와 `docs/` 폴더(문서 6개)를 넣는다.

## 4. 첫 프로젝트 만들기 (Claude CLI에게 요청)
폴더에서 `claude`를 실행하고 아래를 붙여넣는다.
```text
CLAUDE.md와 docs/PRD.md, docs/SCHEDULE.md를 읽어줘.
지금은 단계 1이야. 먼저 만들 파일 목록과 계획을 말해줘. 내가 OK 하면 진행해.
- Vite + React + TypeScript + Tailwind CSS 프로젝트를 이 폴더에 만든다.
- 화면에는 'Moneylog' 글자만 표시한다.
- .gitignore에 .env가 포함되게 하고, .env.example을 만든다.
- vercel.json에 새로고침 시 404가 나지 않도록 설정한다.
- index.html에 lang="ko", noindex, viewport-fit=cover를 설정한다.
- 화면 틀을 만든다: 모바일(767px 이하)은 하단 탭 4개(내역/입력/보기/설정), PC(1100px 이상)는 좌측 사이드바. 내용은 빈 화면이면 된다. src/components/layout/에 둔다.
- PWA 설치가 되게 한다: vite-plugin-pwa, manifest, 임시 아이콘 4종, 아이폰용 메타 태그. docs/SETUP_GUIDE.md 11장을 따른다.
끝나면 바뀐 내용 요약, 내가 직접 확인하는 방법, 커밋 메시지를 알려줘.
```

### vercel.json (새로고침 404 방지)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### .env.example (빈 값 예시, GitHub에 올려도 됨)
```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### .gitignore에 반드시 있어야 하는 줄
```text
.env
.env.local
node_modules
dist
```

로컬 실행: `npm install` → `npm run dev` → 브라우저에서 `http://localhost:5173`

## 5. 첫 배포 (Vercel)
1. Vercel에서 **Add New → Project** → GitHub의 `moneylog` 저장소 선택 → Deploy
2. 배포가 끝나면 `xxxx.vercel.app` 주소가 생긴다. 열어서 "Moneylog"가 보이는지 확인

## 6. 도메인 연결 (Cloudflare + Vercel)
1. Vercel 프로젝트 **Settings → Domains**에 `moneylog.vibecodelab.dev` 입력
2. Vercel이 알려주는 값(보통 CNAME)을 확인
3. Cloudflare **DNS**에서 레코드 추가
   - Type: `CNAME` / Name: `moneylog` / Target: Vercel이 알려준 값
   - **프록시 상태는 처음엔 "DNS only"(회색 구름)로 둔다.** (주황 구름이면 인증서 연결에서 막히기 쉬움)
4. Vercel Domains 화면에서 상태가 Valid로 바뀔 때까지 기다린다. (몇 분~몇 십 분)
5. `https://moneylog.vibecodelab.dev`에서 자물쇠와 함께 "Moneylog"가 보이면 성공

## 7. Supabase 연결
1. Supabase에서 새 프로젝트 `moneylog` 생성
2. **SQL Editor**에 `DATA_MODEL.md`의 SQL을 단계에 맞춰 실행 (단계 2에서는 1~4번)
3. **Project Settings → API**에서 두 값을 복사
   - Project URL
   - anon public key
   - ⚠ `service_role` 키는 **절대** 쓰지 않는다. (모든 보안을 우회하는 마스터키)
4. 로컬: 프로젝트 폴더에 `.env` 파일을 만들고 값 입력
```text
VITE_SUPABASE_URL=복사한_URL
VITE_SUPABASE_ANON_KEY=복사한_anon_key
```
5. Vercel: **Settings → Environment Variables**에 같은 이름 두 개를 등록 후 **다시 배포(Redeploy)**
6. Supabase **Authentication → URL Configuration**
   - Site URL: `https://moneylog.vibecodelab.dev`
   - Redirect URLs: `https://moneylog.vibecodelab.dev`, `http://localhost:5173`
7. Supabase **Authentication → Sign In / Providers → Email**
   - Email 켜짐, "Confirm email" 켜짐(가입하면 확인 메일이 간다. 메일 링크를 누른 뒤 앱에서 비밀번호로 로그인)

## 7-1. 구글 로그인 연결
구글 로그인은 "구글이 이 사람이 맞다고 보증해 주는" 방식이다. 구글과 Supabase 양쪽에 서로를 등록해야 한다.

1. Supabase **Authentication → Sign In / Providers → Google**을 열어 **Callback URL**을 복사해 둔다.
   - 모양: `https://<프로젝트ID>.supabase.co/auth/v1/callback`
2. [Google Cloud Console](https://console.cloud.google.com)에서 새 프로젝트 `moneylog` 생성
3. **Google Auth Platform**(또는 APIs & Services → OAuth consent screen)
   - 앱 이름 `Moneylog`, 지원 이메일 입력, 대상(Audience)은 **External(외부)**
   - 처음에는 "테스트" 상태다. 테스트 상태에서는 **테스트 사용자로 등록한 구글 계정만** 로그인된다. 내 구글 계정을 테스트 사용자에 추가한다.
4. **Clients(사용자 인증 정보) → OAuth 클라이언트 만들기**
   - 유형: **웹 애플리케이션**
   - 승인된 JavaScript 원본: `https://moneylog.vibecodelab.dev`, `http://localhost:5173`
   - 승인된 리디렉션 URI: 1번에서 복사한 Supabase Callback URL
5. 만들어진 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 Supabase Google 화면에 붙여넣고 켠 뒤 저장
   - ⚠ 클라이언트 보안 비밀번호는 Supabase 화면에만 넣는다. 코드·`.env`·채팅에 넣지 않는다.
6. 정식 런칭 때: 동의 화면을 "프로덕션"으로 게시하고 구글 검수를 받는다. 개인정보 처리방침 주소가 필요하다.

## 8. 매일 작업 흐름
```bash
git status                      # 바뀐 파일 확인
git add .                       # 올릴 파일 담기
git commit -m "단계 N: 내용"    # 저장 지점 만들기
git push                        # GitHub에 올리기 → Vercel 자동 배포
```
- 올리기 전 Claude CLI에게: "민감한 키가 코드에 들어간 곳이 없는지 확인해줘"
- 망가졌을 때: `git log --oneline`으로 정상이던 커밋을 찾아 Claude CLI에게 "이 커밋 상태로 되돌리는 방법을 쉽게 알려줘"라고 요청

## 9. 막히기 쉬운 곳
| 증상 | 확인할 것 |
|------|-----------|
| 도메인이 안 열림 | Cloudflare가 "DNS only"인지, Vercel Domains가 Valid인지 |
| 새로고침하면 404 | `vercel.json`이 있는지 |
| 로그인 후 주소가 이상하게 이동 | Supabase Redirect URLs에 도메인이 등록됐는지 |
| 구글 로그인에서 `redirect_uri_mismatch` | Google Cloud의 승인된 리디렉션 URI가 Supabase Callback URL과 글자 하나까지 같은지 |
| 구글 로그인에서 "액세스 차단됨" | 동의 화면이 테스트 상태라면 내 구글 계정이 테스트 사용자에 있는지 |
| 구글 로그인 후 localhost로 돌아감 | Supabase Site URL이 배포 주소인지, Redirect URLs에 배포 주소가 있는지 |
| 배포 후 데이터가 안 불러와짐 | Vercel 환경변수 등록 후 Redeploy 했는지 |
| 로컬에서는 되는데 배포에서 안 됨 | 환경변수 이름이 `VITE_`로 시작하는지 |
| `.env`를 GitHub에 올려버림 | 즉시 Supabase에서 anon key 재발급, Claude CLI에게 기록에서 제거하는 방법 문의 |

## 10. 완료 체크리스트 (단계 1~2)
- [ ] `moneylog.vibecodelab.dev`에서 "Moneylog"가 보인다 (자물쇠 포함)
- [ ] 새로고침해도 404가 나지 않는다
- [ ] GitHub 저장소가 Private이고 `.env`가 올라가 있지 않다
- [ ] 폰과 PC에서 같은 계정으로 로그인된다
- [ ] 폰 홈 화면에 추가하면 아이콘이 생기고, 주소창 없이 열린다
- [ ] 브라우저 창 폭을 바꾸면 하단 탭과 사이드바가 바뀐다

## 11. 폰·PC에 설치하기 (PWA)

PWA는 인터넷 주소(`moneylog.vibecodelab.dev`)를 앱처럼 설치해서 쓰는 방식이다. 앱스토어 등록 없이 홈 화면 아이콘으로 열 수 있다. 단계 1에서 만들고 단계 2·12에서 다시 확인한다.

### 설치 방법
| 기기 | 방법 |
|------|------|
| 아이폰 | Safari로 주소를 열고 → 아래 공유 버튼 → "홈 화면에 추가" → 추가 (Safari에서만 확실히 된다) |
| 안드로이드 | Chrome으로 주소를 열고 → 오른쪽 위 ⋮ 메뉴 → "앱 설치" 또는 "홈 화면에 추가" |
| PC | 크롬·엣지로 주소를 열면 주소창 오른쪽에 설치 아이콘이 나온다 |

### 필요한 아이콘 4개
| 파일 | 크기 | 용도 |
|------|------|------|
| public/pwa-192x192.png | 192×192 | 기본 아이콘 |
| public/pwa-512x512.png | 512×512 | 큰 아이콘 (설치 조건) |
| public/pwa-maskable-512x512.png | 512×512 | 안드로이드 둥근 아이콘용. 글자는 가운데 80% 안에 |
| public/apple-touch-icon.png | 180×180 | 아이폰 홈 화면 |

처음에는 임시 아이콘으로 시작한다. Claude CLI에게 이렇게 요청한다.
```text
임시 PWA 아이콘 4개를 만들어줘. 파란 배경(#2C4DD6)에 흰색 'M' 글자를 가운데에 둔다.
파일: public/pwa-192x192.png, public/pwa-512x512.png,
public/pwa-maskable-512x512.png(글자는 가운데 80% 안), public/apple-touch-icon.png(180x180).
나중에 아이콘을 바꾸는 방법도 쉽게 알려줘.
```

### index.html (head 안에 추가)
```html
<meta name="theme-color" content="#2C4DD6" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Moneylog" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### vite.config.ts
기존 파일에 `VitePWA` 부분을 합친다. Tailwind 설정이 이미 있으면 그대로 두고 아래 PWA 부분만 추가한다. 설치된 버전에 맞게 Claude CLI가 조정한다.
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Moneylog',
        short_name: 'Moneylog',
        description: '붙여넣기만 하면 정리되는 가계부',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#2C4DD6',
        background_color: '#F2F4F9',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          // 내역과 로그인 정보는 기기에 캐시하지 않는다
          { urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'), handler: 'NetworkOnly' },
        ],
      },
    }),
  ],
})
```

### 화면 폭 기준 `pc:` 추가 (PC 1100px 이상)
Tailwind 버전에 맞는 쪽을 쓴다. 어느 버전인지 모르면 Claude CLI에게 "Tailwind 버전을 확인하고 pc: 1100px 기준을 추가해줘"라고 요청한다.
```js
// Tailwind v3: tailwind.config.js
export default {
  theme: { extend: { screens: { pc: '1100px' } } },
}
```
```css
/* Tailwind v4: src/index.css */
@theme {
  --breakpoint-pc: 1100px;
}
```

### 확인 방법
1. 배포한 주소(`https://moneylog.vibecodelab.dev`)를 크롬으로 연다.
2. `F12` → Application → Manifest에 오류가 없고, Service Workers가 활성인지 본다.
3. 폰으로 설치해 보고, 홈 화면 아이콘으로 열었을 때 주소창이 없는지 확인한다.
4. 로그인한 뒤 앱을 완전히 닫았다가 다시 열어도 로그인이 유지되는지 확인한다.

### 막히기 쉬운 곳
| 증상 | 확인할 것 |
|------|-----------|
| 설치 항목이 안 보임 | 주소가 HTTPS인지, Manifest 오류가 없는지, 512×512 아이콘이 있는지 |
| 아이폰에서 설치 후 로그인이 풀림 | 이메일 링크 로그인을 쓰고 있지 않은지. 구글 로그인 후 앱으로 돌아오지 않으면 이메일+비밀번호로 로그인한다 |
| 새 버전이 안 보임 | 앱을 완전히 종료(앱 전환 화면에서 위로 밀기)한 뒤 다시 열기 |
| 안드로이드 아이콘이 잘림 | 마스커블 아이콘의 글자를 가운데 80% 안에 두기 |
| `npm run dev`에서 설치가 안 됨 | 정상이다. 배포 주소나 `npm run build` 후 `npm run preview`로 확인 |
