# Moneylog (moneylog.vibecodelab.dev)

- 문서 세트 버전: v0.6 / 최종 수정: 2026-10-19
- 이어서 작업할 때는 맨 아래 **14장 "현재 진행 상황"**을 먼저 읽는다.

## 0. 먼저 읽을 것
작업 전 아래 문서를 읽는다. 문서는 모두 `docs/` 폴더에 있다.

| 문서 | 내용 | 언제 읽나 |
|------|------|-----------|
| docs/PRD.md | 무엇을 만드는지, 기능 목록, 화면 | 항상 |
| docs/SCHEDULE.md | 개발 순서와 현재 단계 | 항상 |
| docs/DATA_MODEL.md | Supabase 표 구조와 SQL | DB·저장 관련 작업 |
| docs/PERFORMANCE_SPEC.md | 카드 실적·제외 항목 규칙 | 카드 실적 기능 작업 |
| docs/PARSER_SPEC.md | 붙여넣기·문자·파일 인식 규칙 | 입력 자동화 작업 |
| docs/SETUP_GUIDE.md | 환경 준비, 배포, 도메인 설정 | 환경·배포 작업 |

- 지금 진행 중인 단계는 `docs/SCHEDULE.md`의 "진행 기록"에서 확인한다.
- PRD에 없는 기능은 임의로 추가하지 말고, 제안만 하고 내 답을 기다린다.

## 1. 프로젝트 요약
개인용 가계부 PWA. 카드·통장·현금 내역을 붙여넣기만 하면 정리되고, 제휴카드 실적과 실적 제외 항목까지 챙겨준다.
분류(식비/교통 등)는 하지 않고 "어디에 얼마 썼는지"만 본다.
입력은 최소 터치. PC와 모바일 모두 사용. 한국어 UI, 원화(₩).

## 2. 작업자 정보 (중요)
- 나는 코딩 경험이 거의 없는 초보 개발자이고, 아이디어와 방향을 제시하는 바이브 코딩을 한다.
- 설명은 전문 용어 대신 "이 버튼을 누르면 이 데이터가 저장된다" 식으로 동작과 결과 중심으로 쉽게 한다. 필요하면 쉬운 비유를 쓴다.
- 코드는 생략하지 않는다. "기존 코드 동일" 같은 표현 금지. 수정한 파일은 전체 내용을 보여준다.
- 새 패키지 설치나 큰 구조 변경 전에는 이유를 한 줄로 설명하고 확인을 받는다.

## 3. 작업 방식
1. **계획 먼저**: 큰 작업은 만들 파일 목록과 계획을 먼저 말하고, 내가 OK 하면 진행한다.
2. **한 번에 한 단계**: 스케줄의 현재 단계만 한다. 다음 단계로 미리 넘어가지 않는다.
3. **끝나면 3가지를 알려준다**
   - 무엇이 바뀌었는지 쉬운 말로 요약
   - 내가 직접 확인하는 방법 (어느 주소/화면에서 무엇을 눌러보면 되는지)
   - 커밋 메시지 제안
4. **에러가 나면**: 원인을 쉬운 말로 설명하고, 고친 뒤 같은 에러가 다시 안 나는지 확인한다.
5. **커밋 전 점검**: 키·비밀번호가 코드에 들어간 곳이 없는지, `.env`가 `.gitignore`에 있는지 확인한다.
6. 능동적 제안은 환영하되, 구현 전에 "이렇게 하면 어떨까요?"로 먼저 묻는다.
7. DB 구조를 바꿀 때는 코드만 고치지 말고, **Supabase SQL Editor에 붙여넣을 SQL을 따로 만들어 준다.** 그리고 `docs/DATA_MODEL.md`도 함께 갱신한다.

## 4. 기술 스택
- Vite + React + TypeScript + Tailwind CSS
- React Router, @supabase/supabase-js, xlsx, papaparse, vite-plugin-pwa, vitest(테스트)
- 백엔드: Supabase (Auth + Postgres + RLS)
- 코드 보관: GitHub (Private) / 배포: Vercel / 도메인 DNS: Cloudflare
- SPA이므로 새로고침 시 404가 나지 않게 `vercel.json`에 rewrite 설정 필요
- PWA: `vite-plugin-pwa` (설정 예시는 `docs/SETUP_GUIDE.md` 11장)

## 5. 데이터 구조 요약 (상세는 docs/DATA_MODEL.md)
- **accounts**: 결제수단 (name, kind[card|cash|account], issuer, last4, sort_order, is_active)
- **transactions**: 내역 (account_id, used_at, merchant, amount, discount, installment_months, is_fixed, fixed_type, source, import_hash, memo, is_cancel, interest_free, performance_override)
- **fixed_rules**: 고정지출 자동 인식 (merchant_keyword, fixed_type)
- **card_programs**: 카드 실적 프로그램 (account_id, name, target_amount, measure_basis, installment_mode, period_start_day, exclude_keywords, exclusion_modes, is_active)
- **card_benefits**: 실적 달성 혜택 (program_id, name, required_amount, benefit_amount, benefit_kind, linked_keyword, memo)
- **exclusion_rules**: 실적 제외 키워드 사전 (category, keyword, is_default, is_active)
- **daily_notes**: 하루 정리 일기 (note_date, body, updated_at) — 하루 한 편, 저장은 upsert
- fixed_type 값: 통신, 구독, 렌탈, 적금, 기부, 보험, 기타고정
- 모든 표는 RLS로 `user_id = auth.uid()`만 접근 가능

## 6. 폴더 구조
```
moneylog/
├─ CLAUDE.md
├─ docs/
│  ├─ PRD.md
│  ├─ SCHEDULE.md
│  ├─ DATA_MODEL.md
│  ├─ PERFORMANCE_SPEC.md
│  ├─ PARSER_SPEC.md
│  └─ SETUP_GUIDE.md
├─ vercel.json
├─ public/              PWA 아이콘 (pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png, apple-touch-icon.png)
├─ .env                 (GitHub에 올리지 않음)
├─ .env.example         (빈 값 예시, 올려도 됨)
└─ src/
   ├─ lib/supabase.ts          Supabase 클라이언트
   ├─ utils/
   │  ├─ parsers/              붙여넣기·문자·CSV 파서 (카드사/은행별 파일 분리)
   │  ├─ installment.ts        할부 회차·잔액 계산
   │  ├─ performance.ts        카드 실적 계산
   │  ├─ exclusion.ts          실적 제외 판정
   │  └─ format.ts             금액·날짜 표시
   ├─ components/              화면 조각
   │  └─ layout/               화면 틀 (AppShell, BottomTabs, SideNav, QuickEntryPanel)
   ├─ pages/                   화면 단위
   └─ hooks/                   데이터 불러오기 로직
```
- 화면(UI)과 계산·파싱 로직은 분리한다. 계산 로직은 `utils/`에만 둔다.

## 7. 절대 규칙 (보안)
1. 환경변수는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 두 개만 사용한다.
2. **`service_role` 키는 코드·문서·채팅 어디에도 넣지 않는다.** (모든 보안을 우회하는 마스터키)
3. `.env`는 `.gitignore`에 반드시 포함한다. 실수로 올라갔다면 즉시 알리고 키 재발급 방법을 안내한다.
4. 전체 카드번호·계좌번호는 저장하지 않는다. 끝 4자리만 허용한다.
5. 실제 내역·문자 샘플을 테스트 데이터로 쓸 때는 이름, 번호, 금액을 임의 값으로 바꾼다.
6. 사용자 데이터를 읽고 쓰는 쿼리는 항상 로그인한 사용자 기준이어야 한다. RLS를 끄는 코드는 쓰지 않는다.
7. 메모와 하루 정리는 개인 기록이다. 콘솔 로그, 에러 메시지, 테스트 샘플에 실제 내용을 넣지 않는다.
8. 서비스워커(PWA 캐시)에 로그인 정보나 내역 응답을 저장하지 않는다.

## 8. 계산 규칙
- 실결제액 = 이용금액 - 할인
- 월 납부액 = 실결제액 / 할부개월 (원 단위 반올림, 마지막 회차에서 오차 보정)
- 회차 = (선택월 - 사용월) + 1, 할부잔액 = 실결제액 - 월 납부액 × 회차 (마지막 회차는 0)
- 취소 건(`is_cancel`)은 금액을 마이너스로 계산한다. DB의 `amount`는 항상 0 이상.
- 금액은 정수(원). 소수점 계산 금지.
- 카드 실적·제외 판정 규칙은 `docs/PERFORMANCE_SPEC.md`를 따른다. **사용자 확정(performance_override)이 항상 자동 판정보다 우선**한다.
- 계산·판정 함수는 반드시 테스트 파일과 함께 만든다. (예: 12개월 120,000원 → 3회차 잔액 90,000원)

## 9. 입력 파서 규칙 (상세는 docs/PARSER_SPEC.md)
- 파서는 카드사/은행별로 파일을 나눈다. 새 형식이 생기면 기존 파서를 고치지 말고 파일을 추가한다.
- 모든 파서는 같은 모양의 결과를 돌려준다: `{ date, merchant, amount, installment, isCancel, interestFree, accountHint, raw }`
- 인식 실패한 줄은 버리지 말고 "실패" 표시로 미리보기에 보여준다.
- 저장 전 항상 **미리보기 → 사용자 확인** 단계를 거친다.
- 중복 감지: `import_hash` = 날짜 + 결제명 + 금액 + 결제수단으로 만든 지문.
- 통장 문자는 "출금"만 지출로 저장하고 "입금"은 기본 해제 상태로 보여준다.
- 파서마다 샘플 문자열을 넣은 테스트 파일을 같이 만든다.

## 10. 화면·디자인 규칙
- **앱은 하나, 배치는 둘 (PRD 5-1장).** 같은 코드, 같은 데이터, 같은 기능이고 화면 폭에 따라 배치만 바뀐다.
  - 모바일(767px 이하): 한 열, 하단 탭 4개(내역/입력/보기/설정)
  - 태블릿(768~1099px): 좌측 사이드바 + 본문
  - PC(1100px 이상): 사이드바 + 본문 + 오른쪽 "빠른 입력" 패널
  - Tailwind 기준: 기본값이 모바일, `md:`(768px), `pc:`(1100px, 직접 추가. 방법은 `docs/SETUP_GUIDE.md` 11장)
  - 기기를 알아내는 코드(`userAgent` 검사)는 쓰지 않는다. 반응형 CSS로만 나눈다.
  - 화면 틀은 `components/layout/`에만 둔다. 각 화면(pages)은 화면 틀을 몰라도 동작해야 한다.
  - 미리보기 표: PC는 넓은 표, 모바일은 줄마다 카드 형태
  - 작업이 끝나면 폰 화면(약 400px)과 PC 화면(1280px 이상) 둘 다 확인한다.
- 모바일 우선으로 만든다. 작은 화면 기준으로 먼저 만들고, 넓어질 때 배치를 추가한다.
- 버튼 최소 44px, 입력창 글자 16px 이상 (iOS 자동 확대 방지)
- 금액 입력은 숫자 키패드(`inputMode="numeric"`), 천 단위 콤마 표시
- 하단 탭은 아이폰 홈 인디케이터 영역을 피한다. (`safe-area` 적용)
- 로딩 / 빈 화면 / 오류 상태를 모두 친절한 한국어 문구로 표시한다.
- 삭제는 반드시 확인 단계를 둔다.
- 결제수단 표시 형식 (앱 전체 공통)
  - 통장: `카카오뱅크 · 월급통장 (1234)`
  - 카드: `신한카드 · 생활카드 (5678)`
  - 현금: `현금`
  - 끝 4자리가 없으면 괄호 생략
- 실적 제외 가능 배지: `⚠ 실적 제외 가능 · 사유`. 색만으로 구분하지 않고 문구도 함께 쓴다. 카드에만 표시하고 현금·통장에는 표시하지 않는다.
- 카드 실적 화면에는 "내 입력 기준 참고용" 문구를 표시한다.
- 메모: 지출 입력 폼의 선택 항목(200자). 내역 목록에서는 결제명 아래에 작은 글씨로 보여준다.
- 하루 정리: 입력 화면 하단 카드에서 자동 저장, 내역 목록에서는 날짜 아래에 보여주고 눌러서 고친다. 지우기 전에 확인을 받는다. 지출 없는 날도 목록에 표시한다.
- 다크 모드는 마지막 단계(단계 12)에서 적용한다.

## 10-1. PWA 규칙 (PRD 8-1장)
- 설치 가능한 PWA로 만든다. manifest(이름 Moneylog, display standalone, lang ko, 테마 색 `#2C4DD6`, 배경 색 `#F2F4F9`), 아이콘 4종, 서비스워커.
- 서비스워커는 **앱 껍데기(화면 파일)만 캐시**한다. Supabase 요청(`*.supabase.co`)은 절대 캐시하지 않는다(NetworkOnly). 내역과 로그인 정보를 기기 캐시에 남기지 않기 위해서다.
- 가입·로그인은 구글(기본) + 이메일+비밀번호(예비) 두 가지를 제공한다. 이메일 링크(매직링크) 로그인은 쓰지 않는다. 아이폰에서 링크가 설치한 앱이 아니라 Safari로 열려 로그인이 끊긴다. 구글 로그인도 바깥 페이지를 거치므로 아이폰 설치 앱에서 꼭 확인한다. Apple 로그인은 정식 런칭 단계에서 추가한다.
- `index.html`에 아이폰용 메타 태그(`apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color`)를 넣는다.
- 새 버전을 배포하면 다음 실행 때 자동 갱신한다 (`registerType: 'autoUpdate'`).
- PWA는 `npm run dev`에서 설치 확인이 어렵다. 배포 주소, 또는 `npm run build` 후 `npm run preview`로 확인한다.
- PWA를 만들거나 고친 뒤에는 아이폰 Safari, 안드로이드 Chrome, PC 크롬에서 설치와 실행을 확인한다.

## 11. SEO·메타
- `index.html`에 `lang="ko"`, 제목, 설명, 모바일 `viewport`(`viewport-fit=cover`), 테마 색상 설정.
- 개인 가계부이므로 검색에 노출되지 않게 `noindex` 메타 태그를 넣는다. (공개 서비스로 바꿀 때 재검토)

## 12. 코드 스타일
- TypeScript 사용, `any` 금지 (불가피하면 이유를 주석으로)
- 컴포넌트는 함수형, 파일 하나에 컴포넌트 하나
- 변수·함수 이름은 영어, 화면에 보이는 문구와 주석은 한국어
- 한 파일이 300줄을 넘으면 나누는 것을 먼저 제안한다.
- Supabase 호출은 `hooks/`에만 둔다. 화면 컴포넌트에서 직접 호출하지 않는다.

## 13. 하지 않는 것 (PRD 범위 밖)
지출 분류/카테고리, 예산 설정, 은행·카드사 자동 연동(API), 전체 계좌번호 저장, 카드사 실적 조건 자동 수집, 제외 판단의 100% 자동화, 앱스토어 등록용 네이티브 앱(PWA 설치로 대신)

## 14. 현재 진행 상황 (2026-10-19 기준, 데스크탑 → 노트북 인수인계)

### 14-1. 단계별 상태
| 단계 | 상태 | 커밋 | 내용 |
|------|------|------|------|
| 1 | ✅ 완료 (2026-10-11) | `cf6b186` | Vite+React+TS+Tailwind 뼈대, 반응형 화면 틀(하단 탭/사이드바/빠른 입력 자리), PWA 설정, Vercel 배포, 도메인 moneylog.vibecodelab.dev 연결 |
| 1 이후 | ✅ | `ce23972`, `67b6470` | 도메인을 moneylog.vibecodelab.dev로 문서 일괄 변경, `.mcp.json`(Supabase MCP) 추가 |
| 2 | 🔶 코드 완료, 완료 확인 남음 | `32300bf` | Supabase 연결, 구글 로그인(기본) + 이메일·비밀번호 가입/로그인(예비), 로그인 안 하면 앱 진입 불가, 설정 화면에 계정 정보·로그아웃 |
| 3~12 | ⬜ 시작 전 | | |

### 14-2. 단계 2에서 남은 일 (다음 작업은 여기부터)
- [ ] Supabase에 `DATA_MODEL.md` **1~4번 SQL**(결제수단·내역·고정지출 표)이 실행됐는지 확인 — 2026-10-19에 MCP 연결 시간 초과로 **확인 못 함**. Supabase Table Editor에서 `accounts`, `transactions`, `fixed_rules` 표가 있는지 눈으로 확인한다. 없으면 실행.
- [ ] Vercel 환경변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) 등록 후 Redeploy 했는지 확인
- [ ] 완료 확인: 폰과 PC에서 같은 계정으로 로그인, 설치한 앱(홈 화면 아이콘)에서도 로그인 유지
- [ ] 완료 확인(구글): 아이폰 설치 앱에서 "구글로 계속하기" → 로그인 후 앱으로 돌아오는지
- [ ] 모두 통과하면 `docs/SCHEDULE.md` 진행 기록의 단계 2 완료일을 채우고 커밋 → 단계 3(결제수단 등록) 시작

### 14-3. 지금까지 만든 파일 (화면/로직 위치)
- `src/App.tsx` — 로그인 여부에 따라 "설정 필요 / 확인 중 / 로그인 화면 / 앱 본문"을 고른다
- `src/lib/supabase.ts` — Supabase 연결 하나. `.env`가 비면 연결을 만들지 않고 "앱 설정이 필요해요" 화면을 띄운다
- `src/hooks/useAuth.ts` — 로그인 상태, 구글 로그인, 이메일 로그인·가입, 로그아웃
- `src/pages/LoginPage.tsx` — 로그인/가입 화면 / `src/pages/SettingsPage.tsx` — 계정 정보·로그아웃
- `src/components/StatusScreen.tsx` — 로딩·안내 문구 화면 / `src/components/GoogleLogo.tsx` — 구글 버튼 로고
- `src/components/layout/` — `AppShell`, `BottomTabs`, `SideNav`, `QuickEntryPanel`(아직 빈 자리), `navItems.ts`(탭 4개 정의)
- `vite.config.ts` — PWA 설정(Supabase 요청은 캐시 안 함), `vercel.json` — 새로고침 404 방지
- `public/` — **임시** PWA 아이콘 4종 (정식 아이콘은 단계 12)

### 14-4. 현재 구조에서 알아둘 점
- 화면 전환은 아직 React Router 없이 `AppShell` 안의 탭 상태(`activeTab`)로만 한다. 탭별 화면은 `App.tsx`에서 `pages={{ settings: ... }}`로 넘긴다. 지금 채워진 탭은 **설정**뿐이다.
- 설치된 패키지: react, react-dom, @supabase/supabase-js, tailwindcss(v4, `@tailwindcss/vite`), vite-plugin-pwa, typescript.
- **아직 설치 안 한 패키지**: React Router, xlsx, papaparse, vitest. 필요한 단계에서 이유를 한 줄 설명하고 확인받은 뒤 설치한다. (vitest는 계산 함수가 처음 생기는 단계 5 전에 필요)
- Tailwind `pc:`(1100px) 기준점은 `src/index.css`에 정의되어 있다.
- `package.json` 스크립트: `npm run dev` / `npm run build` / `npm run preview` (테스트 스크립트는 vitest 설치 때 추가)

### 14-5. 새 컴퓨터(노트북)에서 처음 할 일
1. Node.js(LTS), Git, VS Code, Claude Code 설치 후 로그인 (`SETUP_GUIDE.md`)
2. `git clone` 으로 GitHub Private 저장소 `moneylog`를 받는다 → 폴더에서 `npm install`
3. **`.env`는 GitHub에 없다.** 프로젝트 맨 위에 `.env`를 새로 만들고 Supabase 대시보드(Project Settings → API)에서 URL과 anon key를 다시 복사해 넣는다. (`.env.example` 모양 참고. 메신저·메일로 키를 보내지 않는다.)
4. `npm run dev` → `http://localhost:5173` 에서 로그인 화면이 뜨고 로그인되는지 확인. (localhost:5173은 Supabase·Google 양쪽에 이미 등록되어 있어 노트북에서도 그대로 된다. 포트가 5173이 아니면 로그인 후 돌아오지 못하니 다른 dev 서버를 끄고 다시 실행.)
5. Claude Code에서 Supabase MCP(`.mcp.json`, 읽기 전용) 사용 시 처음 한 번 Supabase 로그인(인증) 창이 뜬다. 허용한다.
6. `.claude/settings.local.json`(권한 허용 목록)과 Claude 메모리는 컴퓨터마다 따로라 옮겨지지 않는다. 필요한 내용은 이 문서에 다 적었다.
7. `git pull` 로 시작하고 `git push` 로 끝내는 습관: 데스크탑과 노트북을 오갈 때 충돌을 막는다.
