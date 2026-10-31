// Claude Code의 PreToolUse 훅: 위험한 명령을 실행 전에 막거나(deny) 사용자에게 되묻는다(ask).
// .claude/settings.json 에 등록되어 있고, Claude가 Bash·PowerShell 명령을 실행하기 직전에 호출된다.
import { pathToFileURL } from 'node:url'

const SEGMENT = '[^|;&\\n]*' // 명령 한 덩어리 안에서만 검사한다

const READ_VERBS =
  /\b(cat|type|more|less|head|tail|sed|awk|grep|rg|findstr|Get-Content|gc|Select-String|Copy-Item|cp|copy|scp|readFileSync|readFile|Import-Csv)\b/i

// .env 또는 .env.local 같은 이름이 들어 있는지 (.env.example 은 제외)
function mentionsEnvFile(text) {
  const re = /(?:^|[\s'"\\/=(])(\.env(?:\.[A-Za-z0-9_-]+)?)(?=$|[\s'";|&)])/g
  for (const match of text.matchAll(re)) {
    if (match[1] !== '.env.example') return true
  }
  return false
}

// 한 줄짜리 코드(node -e 등)는 안에서 ; 로 나뉘어도 한 덩어리로 본다
const INLINE_SCRIPT = /\b(node|python3?|deno|bun)\s+(-e|-c|--eval)\b|-Command\b/i

// 읽기 동작과 .env 이름이 **같은 명령 덩어리**에 함께 있을 때만 막는다.
// (예: `git check-ignore .env` 처럼 읽지 않는 명령은 통과)
function readsEnvFile(command) {
  const segments = INLINE_SCRIPT.test(command) ? [command] : command.split(/[|;&\n]+/)
  return segments.some((segment) => mentionsEnvFile(segment) && READ_VERBS.test(segment))
}

const DENY_RULES = [
  {
    id: 'force-push',
    test: (c) => new RegExp(`\\bgit\\s+push\\b${SEGMENT}(--force\\b|--force-with-lease|\\s-f\\b|\\s\\+\\S)`).test(c),
    reason: '강제 push(--force)는 기록을 덮어써서 되돌릴 수 없어요. 사용자 승인 없이 쓰지 않아요.',
  },
  {
    id: 'codex-danger',
    test: (c) => new RegExp(`\\bcodex\\b${SEGMENT}(--dangerously-bypass|danger-full-access|--yolo)`, 'i').test(c),
    reason: 'Codex의 샌드박스·승인 우회 옵션은 쓰지 않아요.',
  },
  {
    id: 'codex-direct-exec',
    test: (c) => /(^|[\s;&|(])(codex(\.cmd|\.exe|\.ps1)?|node\s+\S*codex\.js)\s+(exec|e)\b/i.test(c),
    reason: 'Codex는 직접 부르지 말고 `node scripts/agents/agent.mjs delegate <작업ID>`로만 호출해요. (격리·한도·기록이 거기서 지켜져요)',
  },
  {
    id: 'deploy',
    test: (c) => new RegExp(`\\b(vercel|npx\\s+vercel)\\b${SEGMENT}(--prod|deploy|promote)`, 'i').test(c) || /\bnpm\s+publish\b/.test(c),
    reason: '운영 배포는 사용자 승인 없이 하지 않아요.',
  },
  {
    id: 'api-key-in-command',
    test: (c) => /sk-ant-[A-Za-z0-9_-]{16,}/.test(c) || /\bsupabase\s+secrets\s+set\b/i.test(c),
    reason: 'AI 키는 명령어나 채팅에 쓰지 않아요. 키는 사용자가 Supabase 대시보드(Edge Functions → Secrets)에 직접 넣어요. (SETUP_GUIDE.md 12장)',
  },
  {
    id: 'read-env',
    test: readsEnvFile,
    reason: '.env에는 키가 들어 있어서 내용을 읽거나 복사하는 명령은 막아요. (값이 필요하면 사용자가 직접 확인해요)',
  },
]

const ASK_RULES = [
  {
    id: 'destructive-git',
    test: (c) => /\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f|checkout\s+--\s+\.|restore\s+--source|branch\s+-D)\b/.test(c),
    reason: '작업 내용을 지울 수 있는 git 명령이에요. 정말 실행할까요?',
  },
  {
    id: 'push-main',
    test: (c) => new RegExp(`\\bgit\\s+push\\b${SEGMENT}\\b(main|master)\\b`).test(c),
    reason: 'main에 push하면 운영 배포(Vercel)가 시작돼요. 승인할까요?',
  },
]

export function evaluateCommand(command) {
  for (const rule of DENY_RULES) if (rule.test(command)) return { decision: 'deny', id: rule.id, reason: rule.reason }
  for (const rule of ASK_RULES) if (rule.test(command)) return { decision: 'ask', id: rule.id, reason: rule.reason }
  return { decision: 'allow' }
}

async function main() {
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  let command = ''
  try {
    command = JSON.parse(input)?.tool_input?.command ?? ''
  } catch {
    return // 입력을 읽지 못하면 막지 않는다 (훅 오류로 작업이 멈추지 않게)
  }
  if (typeof command !== 'string' || !command) return

  const result = evaluateCommand(command)
  if (result.decision === 'deny') {
    console.error(`막힘(${result.id}): ${result.reason}`)
    process.exit(2)
  }
  if (result.decision === 'ask') {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'ask',
          permissionDecisionReason: result.reason,
        },
      }),
    )
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
