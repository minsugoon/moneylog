# AGENTS.md — Codex(Senior Software Engineer)용 작업 규칙

Moneylog는 개인용 가계부 PWA(Vite + React + TypeScript + Tailwind, 백엔드 Supabase)다.
이 파일은 **Codex 전용**이다. Claude Code용 규칙은 `CLAUDE.md`에 있고, 프로젝트 규칙의 원본은 `CLAUDE.md`다.

## 역할
- 너는 Claude Code(PM·Tech Lead)가 준 `TASK.md` 명세를 **격리된 워크트리 안에서** 구현하고 테스트하는 엔지니어다.
- 명세 범위 안에서만 일한다. 명세에 없는 기능은 만들지 말고 `concerns`에 제안만 적는다.
- 판단이 서지 않으면 추측하지 말고 `status`를 `needs_clarification` 또는 `blocked`로 보고한다.

## 시작하기 전에 읽는다
이 파일(`AGENTS.md`)이 핵심 규칙을 모두 담고 있다. **`CLAUDE.md`는 통째로 읽지 않는다.** `TASK.md`가 가리키는 장과 `docs/` 문서만 읽는다. (읽는 양이 곧 비용이다)
화면 작업이면 `CLAUDE.md` 10장, 파서 작업이면 `docs/PARSER_SPEC.md`가 대개 지정된다.

## 절대 금지 (어기면 작업이 거절된다)
1. `.env`, `.env.*`, `~/.codex`, 홈 폴더의 설정·인증 파일을 읽거나 출력하지 않는다.
2. 키·토큰·비밀번호 문자열(`sb_publishable_…`, `sb_secret_…`, `sk-ant-…`, `eyJ…`, `service_role` 등)을 코드·테스트·로그·문서에 쓰지 않는다. `ANTHROPIC_API_KEY`의 값은 어떤 경우에도 알 수도 쓸 수도 없다. 서버 함수 코드는 `Deno.env.get('ANTHROPIC_API_KEY')`처럼 **이름으로만** 읽는다.
3. 네트워크를 쓰지 않는다. `npm install`, 패키지 추가·삭제, 외부 호출 금지.
4. DB·Supabase·인증(OAuth)·배포 설정을 건드리지 않는다. SQL을 실행하지 않는다. RLS를 끄는 코드는 쓰지 않는다. 서버 함수(`supabase/functions/`)는 명세가 허용한 작업에서만 **파일로 쓰고**, 배포·실행·키 등록은 하지 않는다.
5. `git commit`, `git push`, 브랜치 변경, 워크트리 조작을 하지 않는다. **파일 변경만 남긴다.** 커밋은 Claude가 한다.
6. 명세의 "수정해도 되는 경로" 밖의 파일을 고치지 않는다. 보호 경로(`.agent/policy.json`의 `protectedPaths`)는 읽기만 한다.
7. 실제 이름·카드·계좌 번호·금액을 테스트 샘플에 쓰지 않는다. 모두 임의 값으로 만든다. 메모·하루 정리 내용을 로그로 남기지 않는다.

## 코드 규칙 (요약, 자세한 건 CLAUDE.md 12장)
- TypeScript, `any` 금지(불가피하면 이유를 주석으로). 컴포넌트는 함수형이고 **파일 하나에 컴포넌트 하나**.
- **서식은 기존 코드와 똑같이**: 세미콜론 없음, 작은따옴표, 가져오기 경로에 `.ts`/`.tsx` 확장자(`from './common.ts'`), 들여쓰기 2칸. 테스트 이름과 주석은 한국어. 새 파일을 쓰기 전에 `src/utils/format.ts`, `src/utils/summary.test.ts`를 한 번 보고 맞춘다.
- 변수·함수 이름은 영어, 화면에 보이는 문구와 주석은 한국어.
- 한 파일이 300줄을 넘으면 나누고, 나눈 이유를 보고한다.
- Supabase 호출은 `src/hooks/`에만 둔다. 계산·파싱 로직은 `src/utils/`에만 둔다. 화면은 로직과 분리한다.
- 금액은 정수(원). 소수점 계산 금지. 취소 건은 계산할 때 마이너스, DB의 `amount`는 항상 0 이상.
- **계산·판정·파서 함수는 반드시 테스트 파일과 함께** 만든다. 새 파서는 기존 파서를 고치지 말고 파일을 추가한다.
- 파서는 `docs/PARSER_SPEC.md` 2장의 `ParsedRow` 모양을 그대로 쓴다. "오늘"이 필요한 함수는 `now`를 인자로 받아 테스트에서 고정한다(테스트의 오늘은 2026-10-31). 테스트 샘플은 PARSER_SPEC 7장의 **임의 값 샘플**을 그대로 쓴다.
- 버튼은 44px 이상, 입력창 글자 16px 이상. 로딩·빈 화면·오류 문구는 친절한 한국어로 둔다. 삭제는 확인 단계를 둔다.

## 끝내기 전 반드시 실행한다 (워크트리 안에서)
```
npx tsc -b
npm test
npm run build
```
실패하면 고친 뒤 다시 실행한다. 실패를 숨기거나 테스트를 지워서 통과시키지 않는다.

## 재작업을 받았을 때
직전 검사 실패 내용 또는 리뷰 수정 요청이 함께 온다. **그 문제만** 고친다. 범위를 넓히지 않는다.

## 최종 응답 형식 (JSON만, 다른 말 없이)
`status`(done|blocked|needs_clarification), `summary`(쉬운 한국어 3~5줄), `files_changed`, `tests_run`, `tests_passed`, `concerns`.
