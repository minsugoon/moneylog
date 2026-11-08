# Moneylog (moneylog.vibecodelab.dev)

- 문서 세트 버전: v0.10 / 최종 수정: 2026-11-02
- 이어서 작업할 때는 **14장 "현재 진행 상황"**을 먼저 읽는다. Claude Code와 Codex의 협업 규칙은 **15장**에 있다.

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
- **transactions**: 내역 (account_id, used_at, merchant, amount, discount, installment_months, is_fixed, fixed_type, source, import_hash, memo, is_cancel, interest_free, performance_override, **currency, original_amount, exchange_rate, rate_at, krw_confirmed** — 외화 입력용, 단계 4-1)
- **fixed_expenses**: 등록한 고정지출 (merchant, account_id, amount, pay_day, fixed_type)
- **fixed_types**: 고정지출 분류 (name, sort_order) — 사용자가 추가·변경·삭제, `기타고정`은 고정
- `fixed_rules`: 옛 키워드 규칙. 앱에서 쓰지 않고 표만 남아 있음
- **card_programs**: 카드 실적 프로그램 (account_id, name, target_amount, measure_basis, installment_mode, period_start_day, exclude_keywords, exclusion_modes, is_active)
- **card_benefits**: 실적 달성 혜택 (program_id, name, required_amount, benefit_amount, benefit_kind, linked_keyword, memo)
- **exclusion_rules**: 실적 제외 키워드 사전 (category, keyword, is_default, is_active)
- **daily_notes**: 하루 정리 일기 (note_date, body, updated_at) — 하루 한 편, 저장은 upsert
- fixed_type 값: 기본 통신, 구독, 렌탈, 적금, 기부, 보험, 기타고정 + 사용자가 만든 분류 (글자로 저장)
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
├─ supabase/functions/  서버 함수 (AI 캡처 읽기 `parse-capture`, 단계 7-B). 배포는 사용자 승인 후 Claude가 한다
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
1. **비밀 값은 두 종류로 나눈다.**
   - **브라우저용(공개돼도 안전한 값)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 두 개만 쓴다. `VITE_`로 시작하는 값은 앱 코드에 그대로 들어가 공개되므로 **비밀 값에는 절대 `VITE_`를 붙이지 않는다.**
   - **서버용(공개되면 안 되는 값)**: Supabase **Edge Functions → Secrets**(서버 비밀 금고)에만 둔다. 허용 이름은 `ANTHROPIC_API_KEY`(비밀), `AI_ENABLED`, `AI_MODEL`(비밀 아님) 세 개뿐이다. 키 값은 코드·`.env`·Vercel·문서·채팅(Claude와 Codex에게도) 어디에도 쓰지 않고, **사용자가 대시보드에서 직접** 넣는다. 방법은 `SETUP_GUIDE.md` 12장.
2. **`service_role` 키는 코드·문서·채팅 어디에도 넣지 않는다.** (모든 보안을 우회하는 마스터키)
3. `.env`는 `.gitignore`에 반드시 포함한다. 실수로 올라갔다면 즉시 알리고 키 재발급 방법을 안내한다.
4. 전체 카드번호·계좌번호는 저장하지 않는다. 끝 4자리만 허용한다.
5. 실제 내역·문자 샘플을 테스트 데이터로 쓸 때는 이름, 번호, 금액을 임의 값으로 바꾼다.
6. 사용자 데이터를 읽고 쓰는 쿼리는 항상 로그인한 사용자 기준이어야 한다. RLS를 끄는 코드는 쓰지 않는다.
7. 메모와 하루 정리는 개인 기록이다. 콘솔 로그, 에러 메시지, 테스트 샘플에 실제 내용을 넣지 않는다.
8. 서비스워커(PWA 캐시)에 로그인 정보나 내역 응답을 저장하지 않는다.
9. 환율 서비스(`open.er-api.com`, 키 없음)에는 **통화 코드 요청만** 보낸다. 금액·결제명·메모 등 가계부 내용은 절대 보내지 않는다. 응답은 서비스워커가 캐시하지 않는다(NetworkOnly). 이용 조건상 설정 화면에 `Rates By Exchange Rate API` 출처 링크를 둔다.

## 8. 계산 규칙
- 실결제액 = 이용금액 - 할인
- 월 납부액 = 실결제액 / 할부개월 (원 단위 반올림, 마지막 회차에서 오차 보정)
- 회차 = (선택월 - 사용월) + 1, 할부잔액 = 실결제액 - 월 납부액 × 회차 (마지막 회차는 0)
- 취소 건(`is_cancel`)은 금액을 마이너스로 계산한다. DB의 `amount`는 항상 0 이상.
- 금액은 정수(원). 소수점 계산 금지.
- **외화 입력(단계 4-1)**: `amount`는 항상 **원화 정수**가 메인이다. 외화는 `currency`·`original_amount`·`exchange_rate`(외화 1단위당 원화, 입력 당시 값 그대로 저장)·`rate_at`로 보조 저장하고, 합계·할부·카드 실적 계산은 원화 `amount`만 쓴다. 환산은 `BigInt` 정수 계산으로 하고 0.5는 올림한다(`utils/currency.ts`). 환산 결과가 1원 미만이면 저장하지 않는다. `krw_confirmed=false`(환율 계산값)는 화면에 `≈`를 붙이고, 카드 청구액으로 고치면 `true`로 바꾸고 환율을 `청구액 ÷ 외화금액`으로 다시 계산한다. 환율이 바뀌어도 이미 저장된 내역은 바꾸지 않는다.
- 카드 실적·제외 판정 규칙은 `docs/PERFORMANCE_SPEC.md`를 따른다. **사용자 확정(performance_override)이 항상 자동 판정보다 우선**한다.
- 계산·판정 함수는 반드시 테스트 파일과 함께 만든다. (예: 12개월 120,000원 → 3회차 잔액 90,000원)

## 9. 입력 파서 규칙 (상세는 docs/PARSER_SPEC.md)
- 파서는 카드사/은행별로 파일을 나눈다. 새 형식이 생기면 기존 파서를 고치지 말고 파일을 추가한다.
- 모든 파서는 같은 모양의 결과(`ParsedRow`, `PARSER_SPEC.md` 2장)를 돌려준다: `status, date, time, merchant, amount, installment, isCancel, interestFree, direction, accountHint, source, raw, failReason`. "오늘"은 인자로 받아 테스트에서 고정한다.
- 입력 방식: 문자·통장 문자는 텍스트 붙여넣기(규칙 기반, AI 없음), 카드앱은 **화면 캡처 + AI(Claude)**(서버 함수 경유, 첫 사용 때 안내·동의, 이용자별 월 한도). AI 결과도 항상 미리보기·확인을 거친다.
- 인식 실패한 줄은 버리지 말고 "실패" 표시로 미리보기에 보여준다.
- 저장 전 항상 **미리보기 → 사용자 확인** 단계를 거친다.
- 중복 감지: `import_hash` = 결제수단 + 날짜 + **시각(있으면)** + 결제명 + 금액 + 취소 여부로 만든 지문(`v1:`). 같은 지문은 **개수로 비교**하고, 날짜가 ±1일·결제명이 비슷하면 "중복 가능"으로 표시한다. 상세는 `PARSER_SPEC.md` 6장.
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
- 글을 쓰는 입력칸(결제명·메모·하루 정리·별칭)은 `lang="ko"`로 한글을 기본으로 한다. 키보드 언어는 웹이 강제할 수 없고 힌트만 줄 수 있다. 금액은 숫자 키패드, 이메일·비밀번호는 영문 그대로.
- 보기 탭 순서: 기간별 → 결제수단별 → 고정지출 (→ 이후 카드 실적). 처음 열리는 화면은 기간별.
- **외화 입력(단계 4-1)**: 입력은 기본이 원화다. 이용금액 칸 아래 `통화 변경 · 외화로 입력 ▾` 링크로 통화 칩을 펼치고, 외화를 고르면 할인·할부·무이자를 숨긴다(외화는 일시불·할인 0). 환산 박스에 `≈ 1,042원`(추정), 환율·기준 시각, `카드 청구액으로 직접 입력`을 보여 준다. 환율 계산값은 목록·합계에 `≈`를 붙인다. 원화는 `1,042원`처럼 숫자 뒤에 `원`을 쓴다(`₩` 쓰지 않음). 자주 쓰는 통화 선택은 이 기기에만 저장하고, 고른 통화는 앱을 켜 둔 동안만 기억한다.
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
외화 할부·외화 현금 잔액·통화별 합계 화면·문자 붙여넣기의 외화 자동 인식·저장된 내역의 환율 자동 갱신(외화 입력은 단계 4-1에서 제안 범위 밖으로 둠), 지출 분류/카테고리, 예산 설정, 은행·카드사 자동 연동(API), 전체 계좌번호 저장, 카드사 실적 조건 자동 수집, 제외 판단의 100% 자동화, 앱스토어 등록용 네이티브 앱(PWA 설치로 대신), 유료 플랜 결제·광고 연동(이번 범위 밖, 이용 한도 구조만 준비), 캡처 이미지의 서버 저장

## 14. 현재 진행 상황 (2026-10-31 기준)

### 14-1. 단계별 상태
| 단계 | 상태 | 커밋 | 내용 |
|------|------|------|------|
| 1 | ✅ 완료 (2026-10-11) | `cf6b186` | Vite+React+TS+Tailwind 뼈대, 반응형 화면 틀, PWA 설정, Vercel 배포, 도메인 moneylog.vibecodelab.dev 연결 |
| 2 | ✅ 완료 (2026-10-24) | `32300bf` | Supabase 연결, 구글 로그인(기본) + 이메일·비밀번호(예비). Supabase는 **새 프로젝트**(ID `nytowuyczllgwuomoivv`)로 다시 만들었다 |
| 3 | ✅ 완료 (2026-10-25, 직접 확인 완료) | `65b1d9d` | 결제수단 등록·수정·삭제·사용중지·순서변경 (설정 탭) |
| 4 | ✅ 완료 (2026-10-25, 직접 확인 완료) | `3ba7dc9` | 입력 폼, 내역 목록, 메모, 하루 정리(자동 저장), PC 빠른 입력 패널. `daily_notes` 표 생성 |
| 4-1 | 🔶 구현 완료 (2026-11-02), **운영 확인 대기** (SQL 적용 완료) | `agent/fx-*` | 통화 변경 입력(외화 입력, PRD F28): 환율 서비스 `open.er-api.com`, 입력·목록·수정·설정 화면. DB 통화 칸은 `DATA_MODEL.md` 12번 SQL을 사용자가 적용해야 외화 저장이 된다 |
| 5 | ✅ 완료 (2026-10-25, 직접 확인 완료) | `8e4dd35` | 할부 회차·잔액, 사용일/월 납부액 기준 토글, 고정지출 입력 |
| 6 | ✅ 완료 (2026-10-25, 직접 확인 완료) | `54abcb9` | 보기 3종(기간별·결제수단별·고정지출) → **MVP 확정** |
| 7-A | ✅ 완료·main 병합 (2026-10-31) | `d481dce` | 문자·통장 문자 붙여넣기(규칙 기반, AI 없음): 파서 6종, 중복 판정, 미리보기, 저장. Codex 작업 8건 모두 1회 호출로 완료 |
| 7-B | ✅ 완료 (2026-10-31) | 브랜치 `agent/step7b` | DB(`user_settings`, `ai_usage`, 함수 4개) 적용, 서버 함수 `parse-capture` 배포(버전 1, 기본 모델 `claude-haiku-5-5`). 키·`AI_ENABLED`는 사용자가 금고에 입력 완료 |
| 7-C | ✅ 완료·main 병합 (2026-10-31, 직접 확인 완료: 실제 캡처 읽기 정상) | `agent/step7b` 병합 | 입력 탭 "사진 입력"(옛 이름 캡처(AI), 동의 창·결제수단 선택·이미지 줄이기·미리보기 연결), 설정 탭 AI 사용량·동의 철회. 캡처 내역은 `source`를 `paste`로 저장 |
| 7-D | ✅ 결정 (2026-11-01) | | 모델은 Haiku 5.5 유지(Sonnet 비교 시험은 하지 않음). 한도 월 20장도 그대로. 영수증·캡처 1장 = 1건으로 센다 |
| 7-E | ✅ 구현·서버 배포 완료, main 병합 (2026-11-01), 직접 확인 완료: 영수증 촬영·사진 선택 정상 | 브랜치 `agent/receipt` | 입력 탭 "사진 입력"에서 "카드사 앱 캡처"/"영수증" 선택. 서버 함수 `parse-capture` 영수증 모드(버전 4) 배포. 영수증은 끝 4자리가 정확히 보일 때만 결제수단 자동 선택. 로컬 시험에서 인식 양호 |
| 8 | ✅ 완료 (2026-11-01, 운영 배포) | `agent/fix-*`·`load-*`·`in-menu` | 고정지출 규칙 저장·자동 적용·설정 관리, 입력 폼 "고정지출 불러오기"(맨 위 접이식 박스), 설정 "이미 입력한 고정지출에서 고르기" 목록 |
| 디자인 | ✅ 시안 적용 완료 (2026-11-01, 운영 배포) | `redesign` 병합 | 시안 1~12단계(선 아이콘 탭, 브랜드 합계 카드, 날짜 흐름, 새 입력 순서, 미리보기 하단 바 등)와 다듬기. 가이드는 `docs/DESIGN.md` v1.2, 샘플은 "Moneylog 화면 샘플" 아티팩트 |
| 9 | 🔶 구현 완료 (2026-11-03), **운영 배포 완료, 직접 확인 대기** | `perf-*` 6건 | DB `card_programs`·`card_benefits`(사용자 직접 적용). 설정 "카드 실적"(조건·혜택 관리), 보기 "카드 실적" 탭(이번/지난 기간 이동, 지난 기간은 달성/미달성만), 내역 위 요약 띠(→ 보기 카드 실적), 고정지출 "실적 달성 시 -○원", 결제 예정 고정지출 예상(주황 막대, 2026-11-07 추가). 판정은 확정 → 취소 → 무이자 → 개별 키워드까지(기본 제외 사전·배지·확정 버튼은 단계 10) |
| 고정지출 개편 | 🔶 구현·로컬 병합 (2026-11-08), **SQL 적용 → push 대기** | `fx2-*`·`cur-list` | 키워드 규칙 제거, 등록 목록(F30)·분류 관리(F31), 실적 예상을 등록 목록 기준으로, 설정 통화 목록형. DB는 `DATA_MODEL.md` 13번 |
| 10~12 | ⬜ 시작 전 | | 실적 제외 → 파일 업로드 → 마무리 |

단계 3~6은 빌드·테스트·DB 동작 검증에 더해 **사용자가 배포 주소에서 직접 확인을 마쳤다**(2026-10-25). 로그인이 필요한 화면은 Claude가 직접 눌러볼 수 없어서 이 확인이 꼭 필요하다.

### 14-2. 다음 작업은 여기부터
- [x] **7-A 직접 확인·병합 완료** (main 병합됨).
- [x] **7-C 직접 확인·병합 완료** (2026-10-31). 처음엔 `AI_ENABLED` 값이 늦게 반영돼 "AI 입력이 잠시 중단" 문구가 나왔고(서버 503), 값 수정 후 정상 동작했다.
- [x] **7-D**: Haiku 5.5 유지로 확정, `AI_MODEL`은 설정하지 않는다
- [x] **7-E 영수증 완료** (2026-11-01): 서버 함수 버전 4 배포, 운영 주소에서 촬영·사진 선택 확인
- [x] **8 완료·디자인 시안 적용 완료** (2026-11-01, 운영 배포)
- [ ] **4-1 외화 입력 마무리**: `DATA_MODEL.md` 12번 SQL을 Supabase SQL Editor에서 적용한 뒤 운영에서 확인한다 (사용자)
- [ ] **고정지출 개편**: `DATA_MODEL.md` 13번 SQL 적용 확인 후 push한다. 표가 없는 상태로 push하면 고정지출 기능이 깨진다
- [ ] **9 카드 실적**: 운영 배포 완료. 직접 확인이 남았다
- [ ] **10 실적 제외** (다음 단계): 시작 전 DATA_MODEL 8번 SQL을 보여주고 적용 승인을 받는다. `performance.ts`의 `classifyTransaction` 5번 자리에 기본 제외 사전을 끼우고, 배지·확정 버튼(보기 카드 실적의 포함/제외 내역 포함)을 만든다
- 참고: 이 세션 환경에서는 Supabase MCP 쓰기 도구의 승인 창이 뜨지 않아 자동 거절됐다. 그때는 SQL을 보여 주고 사용자가 SQL Editor에서 직접 적용한다
- 실제 문자에서 인식이 안 되는 형식(다른 카드사, 할부, 해외결제 등)은 미리보기에서 "실패"로 뜬다. 그 문자(이름·번호·금액은 임의 값으로 바꿔서)를 주면 `src/utils/parsers/`에 파일을 추가해 넓힌다.
- 보류: Supabase "유출된 비밀번호 차단"은 Pro 요금제 이상에서만 켤 수 있어서 보류(무료 요금제 한계). 이메일 가입은 예비 로그인이라 영향이 작다.
- 완료: 데스크탑 `.env`를 새 Supabase 값으로 교체함
- 참고(해결됨): 구글 로그인 후 `localhost:3000`으로 돌아가던 문제는 Supabase **Site URL이 기본값**이어서였다. Authentication → URL Configuration에서 Site URL을 `https://moneylog.vibecodelab.dev`로, Redirect URLs에 `https://moneylog.vibecodelab.dev/**`, `http://localhost:5173/**`를 등록해 해결했다. Supabase 프로젝트를 새로 만들면 구글 로그인 설정과 이 주소 등록을 다시 해야 한다.

### 14-3. 지금까지 만든 파일 (화면/로직 위치)
- `src/App.tsx` — 로그인 여부에 따라 "설정 필요 / 확인 중 / 로그인 화면 / 앱 본문"을 고른다. 앱 본문은 `LedgerProvider`로 감싸고, 탭별 화면(내역·입력·보기·설정)과 PC 빠른 입력 패널 내용을 `AppShell`에 넘긴다
- `src/lib/` — `supabase.ts`(연결 하나), `types.ts`(DB 표와 같은 모양의 타입), `errors.ts`(DB 오류 → 한국어 문구, `ActionResult`), `fetchAllPages.ts`(1000줄 넘는 데이터도 나눠 불러오기)
- `src/hooks/` — 데이터 호출은 여기에만 있다: `useAuth`, `useAccounts`, `useTransactions`, `useDailyNotes`, `useViewBasis`(보기 기준을 기기에 기억). `LedgerProvider` + `useLedger`가 결제수단·내역·하루 정리를 한 번만 불러와 모든 화면이 나눠 쓴다
- `src/utils/` — 계산·표시 로직(테스트 파일 동반): `format`(금액·날짜·결제수단 표시), `installment`(실결제액·월 납부액·회차·잔액·기준별 금액), `summary`(월별 내역·날짜별 묶기), `viewStats`(보기 3종 집계), `issuers`(은행·카드사 목록), `storage`(기기에 작은 설정 기억)
- `src/pages/` — `HistoryPage`(내역), `EntryPage`(입력), `ViewsPage`(보기), `SettingsPage`(결제수단·계정), `LoginPage`
- `src/components/` — `ui.ts`(공통 모양), `Dialog`, `ConfirmDialog`, `AmountInput`, `MonthSwitcher`, `BasisToggle` / `accounts/`(결제수단 폼·목록) / `entry/`(입력 폼, 하루 정리, `EntryPanel`) / `list/`(내역 줄·날짜 묶음·수정 창) / `views/`(보기 3종) / `layout/`(`AppShell`, `BottomTabs`, `SideNav`, `QuickEntryPanel`)
- `src/utils/parsers/` — 문자 파서(단계 7-A): `types.ts`(`ParsedRow` 등), `common.ts`(금액·날짜·시각·할부 해석), `splitMessages.ts`(여러 건 분리, 카톡 시간 줄 제거), `samsungCard`·`hanaCard`·`wooriCard`·`shinhanCard`(승인·취소, 공통 `cardApproval.ts`), `samsungAutopay`(자동결제 접수), `hanaBank`(통장), `index.ts`(`smsParsers` 목록, `parseMessages`). **새 형식은 파일을 추가하고 `index.ts`의 `smsParsers`에 등록한다**
- `src/utils/importHash.ts`·`importMatch.ts`(지문과 중복 판정), `importRows.ts`(미리보기 항목 만들기·재판정·저장 모양), `importFlow.test.ts`(문자 → 저장 전체 흐름 통합 시험)
- `src/components/import/` — 미리보기 화면(`ImportPreview`, `PreviewRowEditor`), `src/components/entry/PasteImport.tsx`(문자 붙여넣기 탭), `useTransactions.addMany`(중복은 건너뛰고 한꺼번에 저장)
- `src/screens.test.tsx` — 가짜 데이터로 주요 화면을 그려 보는 점검 테스트 (로그인 없이 화면 코드가 오류 없이 그려지는지 확인)
- `vite.config.ts` — PWA 설정(Supabase 요청은 캐시 안 함), `vitest.config.ts` — 테스트 설정, `vercel.json` — 새로고침 404 방지
- `public/` — **임시** PWA 아이콘 4종 (정식 아이콘은 단계 12)

### 14-4. 현재 구조에서 알아둘 점
- 화면 전환은 아직 React Router 없이 `AppShell` 안의 탭 상태(`activeTab`)로만 한다. 탭별 화면은 `App.tsx`에서 `pages={{ list, entry, view, settings }}`로 넘긴다.
- 내역은 날짜로 자르지 않고 **전부 불러온다**(할부가 이전 달에서 이어지기 때문). 한 번에 1000줄씩 나눠 가져온다. 수만 건이 되면 느려질 수 있으니 그때 범위를 줄이는 방법을 검토한다.
- 보기 기준 기본값은 "사용일 기준". 선택은 이 기기에만 기억한다(localStorage). 내역·메모 같은 개인 기록은 기기에 저장하지 않는다.
- 결제수단이 지워진 내역은 "결제수단 없음"으로 표시된다. 현금 이름이 "현금"이 아니면 `현금 · 이름`으로 표시한다.
- 설치된 패키지: react, react-dom, @supabase/supabase-js, tailwindcss(v4, `@tailwindcss/vite`), vite-plugin-pwa, typescript, **vitest**.
- **아직 설치 안 한 패키지**: React Router, xlsx, papaparse. 필요한 단계에서 이유를 한 줄 설명하고 확인받은 뒤 설치한다.
- Tailwind `pc:`(1100px) 기준점은 `src/index.css`에 정의되어 있다.
- `package.json` 스크립트: `npm run dev` / `npm run build` / `npm run preview` / `npm test`
- Supabase MCP는 쓰기 가능(`read_only=false`)이다. SQL은 실행 전에 보여주고, 구조를 바꾸면 `docs/DATA_MODEL.md`도 함께 고친다.

### 14-5. 새 컴퓨터(노트북)에서 처음 할 일
1. Node.js(LTS), Git, VS Code, Claude Code 설치 후 로그인 (`SETUP_GUIDE.md`)
2. `git clone` 으로 GitHub Private 저장소 `moneylog`를 받는다 → 폴더에서 `npm install`
3. **`.env`는 GitHub에 없다.** 프로젝트 맨 위에 `.env`를 새로 만들고 Supabase 대시보드(Project Settings → API Keys)에서 URL과 **Publishable key**(`sb_publishable_…`)를 다시 복사해 넣는다. 변수 이름은 `VITE_SUPABASE_ANON_KEY` 그대로 쓴다. Secret key와 `service_role`은 쓰지 않는다. (`.env.example` 모양 참고. 메신저·메일로 키를 보내지 않는다.)
4. `npm run dev` → `http://localhost:5173` 에서 로그인 화면이 뜨고 로그인되는지 확인. (localhost:5173은 Supabase·Google 양쪽에 이미 등록되어 있어 노트북에서도 그대로 된다. 포트가 5173이 아니면 로그인 후 돌아오지 못하니 다른 dev 서버를 끄고 다시 실행.)
5. Claude Code에서 Supabase MCP(`.mcp.json`, **쓰기 가능** `read_only=false`) 사용 시 처음 한 번 `/mcp`에서 Supabase 로그인(인증)을 한다. 인증은 노트북 브라우저에서 해야 하고, 한 번 하면 Remote Control(폰)에서도 쓴다. 쓰기 권한이라 SQL은 실행 전에 내용을 보여주고 확인을 받으며, 구조를 바꾸면 `docs/DATA_MODEL.md`도 함께 고친다. 삭제와 RLS 끄기는 하지 않는다.
6. `.claude/settings.local.json`(권한 허용 목록)과 Claude 메모리는 컴퓨터마다 따로라 옮겨지지 않는다. 필요한 내용은 이 문서에 다 적었다.
7. `git pull` 로 시작하고 `git push` 로 끝내는 습관: 데스크탑과 노트북을 오갈 때 충돌을 막는다.

## 15. 멀티 에이전트 운영 (Claude Code ↔ Codex) — 2026-10-29 도입

사용자가 자연어로 지시하면 **Claude Code가 설계·위임·검증**을 하고, **Codex CLI가 실제 코딩**을 한다. 아래 규칙은 1~14장을 대체하지 않고 **덧붙인다.** 충돌하면 보안(7장)과 이 장의 승인 규칙이 먼저다.

### 15-1. 역할
| 역할 | 하는 일 | 하지 않는 일 |
|------|---------|--------------|
| 사용자 | 요구 전달, 계획·DB·인증·병합·배포 승인 | |
| Claude Code (PM·Tech Lead) | 요구 분석, 작업 분할, 명세(TASK.md) 작성, 워크트리 준비, Codex 호출, 독립 검증, 코드 리뷰, 커밋, 보고 | 기능 코드를 직접 쓰지 않는다. **예외: 문서, 설정, 20줄 이하 긴급 수정** |
| Codex (Senior Engineer) | 지정된 워크트리 안에서 구현과 테스트 | 네트워크, git commit·push, DB·인증·배포, `.env`, 보호 경로 수정 |

Codex가 따르는 규칙은 루트의 `AGENTS.md`다. 프로젝트 규칙의 원본은 이 문서다.

### 15-2. 작업 한 건의 흐름 (도구: `node scripts/agents/agent.mjs`, 설명은 `.agent/README.md`)
1. 사용자 요구 → Claude가 분석하고 **계획을 보여준다 → 사용자 OK** (3장 1·2번 규칙 그대로)
2. `new` → TASK.md(목표, 완료 기준, 허용 경로, 크기) 작성 → `start`(격리 워크트리 + `npm ci`)
3. `delegate`(Codex 구현) → `check`(Claude가 범위·비밀·크기·타입검사·테스트·빌드를 **직접** 재실행)
4. `review`: 변경분을 읽고 CLAUDE.md 규칙을 점검해 `APPROVE / REQUEST_CHANGES / REJECT`를 기록한다. **테스트 통과와 리뷰 통과는 따로 기록**하고, 둘 다 있어야 `commit`이 된다.
5. 사용자에게 변경 요약을 보고 → **승인 후에만** `main`에 병합한다. `main` push는 곧 운영 배포(Vercel)다.

### 15-3. 한도 (`.agent/policy.json`)
- 테스트 실패 시 Codex 수정 **최대 3회**, 리뷰 수정 요청 최대 2회, 작업당 Codex 호출 6회, 1회 20분
- 같은 실패가 2번 연속이면 진전이 없다고 보고 중단. 한도를 넘으면 더 호출하지 않고 `report`로 실패 보고서를 만든다
- 변경이 파일 8개·400줄을 넘거나 소스 한 파일이 300줄을 넘으면 거절하고 작업을 쪼갠다

### 15-4. 충돌 방지
- 작업마다 별도 워크트리(`../MoneyLog-worktrees/<ID>`)와 브랜치(`agent/<ID>`). 두 AI가 같은 파일을 동시에 고치지 않는다.
- 명세의 허용 경로가 겹치는 작업은 동시에 돌리지 않는다. 공유 파일(`App.tsx`, `types.ts`, `ledgerContext.ts`, `LedgerProvider.tsx`, `ui.ts`)은 한 번에 한 작업만 건드린다.
- 문서·`CLAUDE.md`·`AGENTS.md`·`.claude/`·`.agent/`·`scripts/agents/`는 Claude만 고친다.

### 15-5. 사용자 승인이 필요한 것 (승인 없이 바꾸지 않는다)
- 운영 DB(Supabase) 변경, 인증(OAuth) 설정·코드, 비밀키·환경변수, `main` 브랜치 병합·push, 운영 배포
- **서버 함수(`supabase/functions/`) 배포**, AI 키 등록(사용자가 직접), AI 모델·한도·동의 안내문 변경
- 보호 경로 수정(`package.json`·패키지 설치, `vite.config.ts`, `vercel.json`, `.mcp.json` 등. 목록은 `policy.json`의 `protectedPaths`)
- Supabase MCP의 쓰기 도구(`apply_migration`, `execute_sql` 등)는 `.claude/settings.json`에서 **매번 승인**을 받도록 해 두었다. 읽기 도구는 자동 허용.
- 위험 명령(강제 push, 배포 명령, `.env` 읽기, Codex 직접 호출·샌드박스 우회)은 `scripts/agents/guard.mjs` 훅이 막는다.

### 15-6. 2장 보고 규칙의 조정
2장의 "수정한 파일은 전체 내용을 보여준다"는 **Claude가 직접 쓴 코드**에 그대로 적용한다. **Codex가 쓴 코드**는 "변경 요약 + 파일 위치 + 검증 결과"로 보고하고, 전체 내용은 사용자가 요청하면 보여준다. 사용자 보고는 3장의 3가지(쉬운 요약, 직접 확인 방법, 커밋 메시지 제안)를 유지한다.

### 15-7. 현재 상태
- 1단계(규칙·도구 추가) 완료: `AGENTS.md`, `.agent/`, `scripts/agents/`, `.claude/settings.json` (2026-10-30 사용자 승인으로 main 병합·push 완료)
- 2단계(시험 운행) 완료 (2026-10-29): 성공 경로(위임 → 독립 검증 → 리뷰 → 커밋)와 실패 경로(보호 파일 수정 감지, 테스트 실패 재수정, 같은 실패 반복 시 Codex 호출 없이 중단 + 실패 보고서)를 모두 확인했다. 도구 자체 시험은 `node scripts/agents/agent.mjs selftest`.
- Codex는 `npm i -g @openai/codex`로 설치한 0.165.0을 쓴다(ChatGPT 로그인). 작은 작업도 1회 호출에 약 17만 토큰이 든다(읽은 문서를 되읽는 양 포함). 명세에 읽을 파일을 정확히 적고, 한 작업을 너무 잘게 쪼개지 않는다.
- 다음: 3단계 실제 개발(단계 7 파서부터). main 병합 승인은 받았다. 작업 하나를 시작할 때는 계획을 보여주고 OK를 받는다(15-2).
