# .agent — Claude Code와 Codex의 협업 장치

Claude Code(PM·Tech Lead)가 일을 쪼개 Codex(Senior Engineer)에게 맡기고, 결과를 직접 검증·리뷰하는 체계다.
운영 규칙의 전체 설명은 `CLAUDE.md` 15장, Codex가 따르는 규칙은 루트의 `AGENTS.md`에 있다.

| 위치 | 내용 | 누가 고치나 |
|------|------|-------------|
| `policy.json` | 보호 경로, 한도(재시도·시간·크기), 비밀 문자열 패턴, 검사 명령 | 사람과 Claude만 (Codex 금지) |
| `templates/TASK.template.md` | Codex에게 줄 작업 명세 양식 | Claude |
| `schemas/result.schema.json` | Codex가 끝낼 때 내놓는 보고 형식 | Claude |
| `runs/<작업ID>/` | 작업 하나의 명세·상태·Codex 로그·검사 결과·보고서 (Git에 올리지 않음) | 도구가 자동 기록 |

도구: `node scripts/agents/agent.mjs` (도움말은 인자 없이 실행). 위험 명령 차단 훅은 `scripts/agents/guard.mjs`.

## 작업 한 건의 흐름
```
new → TASK.md 작성 → [사용자 OK] → start → delegate → check → review → commit → [사용자 OK] → main 병합 → clean
```
- 워크트리는 프로젝트 밖(`../MoneyLog-worktrees/<작업ID>`)에 만들고, `.env`는 없다. Codex는 네트워크가 막혀 있다.
- `check`는 Codex의 "통과" 말을 믿지 않고 Claude가 타입검사·테스트·빌드를 다시 실행한다.
- 테스트 통과(`check`)와 리뷰 통과(`review`)는 따로 기록된다. 둘 다 있어야 `commit`이 된다.
- 한도: Codex 호출 6회, 테스트 수정 3회, 리뷰 수정 2회, 같은 실패 2번이면 중단, 1회 20분.
- main 병합과 push, DB·인증·비밀키·운영 배포는 항상 사용자 승인이 필요하다.
