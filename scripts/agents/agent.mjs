// Claude Code ↔ Codex 협업 도구의 입구.  사용법: node scripts/agents/agent.mjs <명령> [작업ID] [옵션]
import {
  cmdCheck, cmdClean, cmdCommit, cmdDelegate, cmdList, cmdNew, cmdReport, cmdReview, cmdStart, cmdStatus,
} from './commands.mjs'
import { die } from './lib.mjs'

const HELP = `Moneylog 에이전트 협업 도구

흐름: new → (TASK.md 작성) → start → delegate → check → review → commit → (사용자 승인 후 main 병합) → clean

  new <id> --title "제목" --allow "경로1,경로2" [--base 브랜치] [--approve "보호경로"]   작업 만들기
  start <id>                      격리된 워크트리 만들고 패키지 설치
  delegate <id>                   Codex에게 구현·재수정 맡기기 (한도·시간 제한 적용)
  check <id>                      범위·비밀·크기·타입검사·테스트·빌드를 Claude가 직접 검증
  review <id> --verdict APPROVE|REQUEST_CHANGES|REJECT [--note "내용"]   리뷰 판정 기록
  commit <id> --message "메시지"   테스트 통과 + APPROVE 인 작업만 작업 브랜치에 커밋
  report <id>                     진행·실패 보고서
  status <id> | list              상태 보기
  clean <id> [--force] [--delete-branch]   워크트리 정리
  selftest                        도구 자체 점검`

function parse(argv) {
  const [command, maybeId, ...rest] = argv
  const hasId = maybeId && !maybeId.startsWith('--')
  const tokens = hasId ? rest : [maybeId, ...rest].filter(Boolean)
  const flags = {}
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].startsWith('--')) continue
    const key = tokens[i].slice(2)
    const next = tokens[i + 1]
    if (next === undefined || next.startsWith('--')) flags[key] = true
    else {
      flags[key] = next
      i++
    }
  }
  return { command, id: hasId ? maybeId : undefined, flags }
}

const { command, id, flags } = parse(process.argv.slice(2))
const needId = () => id ?? die('작업 ID가 필요해요. 예) node scripts/agents/agent.mjs check parser-shinhan')

switch (command) {
  case 'new': cmdNew(needId(), flags); break
  case 'start': cmdStart(needId()); break
  case 'delegate': await cmdDelegate(needId()); break
  case 'check': cmdCheck(needId()); break
  case 'review': cmdReview(needId(), flags); break
  case 'commit': cmdCommit(needId(), flags); break
  case 'report': cmdReport(needId()); break
  case 'clean': cmdClean(needId(), flags); break
  case 'status': cmdStatus(needId()); break
  case 'list': cmdList(); break
  case 'selftest': await import('./selftest.mjs'); break
  default: console.log(HELP)
}
