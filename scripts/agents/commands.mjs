// agent.mjs 가 부르는 명령들: new / start / delegate / check / review / commit / report / clean / status / list
import fs from 'node:fs'
import path from 'node:path'
import {
  AGENT_DIR, REPO_ROOT, RUNS_DIR, assertRunId, branchName, die, git, loadPolicy, loadState, logHistory, now,
  readJson, run, runDir, saveState, worktreeDir, writeJson,
} from './lib.mjs'
import {
  changedFiles, checkScope, checkSize, failureSignature, runChecks, scanCodePatterns, scanSecrets,
} from './checks.mjs'
import { preflight, runCodex, sumTokens } from './codex.mjs'

const taskPath = (id) => path.join(runDir(id), 'task.json')
const last = (n) => String(n).padStart(2, '0')

// ---- 새 작업 만들기 ----
export function cmdNew(id, flags) {
  assertRunId(id)
  const policy = loadPolicy()
  if (fs.existsSync(runDir(id))) die(`작업 "${id}"가 이미 있어요.`)
  if (!flags.title) die('--title "작업 제목"이 필요해요.')
  const allowed = (flags.allow ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (allowed.length === 0) die('--allow "경로1,경로2"가 필요해요. 예) --allow "src/utils/parsers/**"')
  const base = flags.base ?? policy.baseBranch
  if (git(REPO_ROOT, 'rev-parse', '--verify', base).code !== 0) die(`기준 브랜치 "${base}"를 찾을 수 없어요.`)

  const template = fs.readFileSync(path.join(AGENT_DIR, 'templates', 'TASK.template.md'), 'utf8')
  const md = template
    .replaceAll('{{id}}', id)
    .replaceAll('{{title}}', flags.title)
    .replaceAll('{{allow}}', allowed.map((a) => `- \`${a}\``).join('\n'))
    .replaceAll('{{files}}', String(policy.limits.maxFilesChanged))
    .replaceAll('{{lines}}', String(policy.limits.maxLinesChanged))
  fs.mkdirSync(runDir(id), { recursive: true })
  fs.writeFileSync(path.join(runDir(id), 'TASK.md'), md)

  // 보호 경로 수정은 사용자가 승인한 경로만 --approve 로 적는다
  const approved = (flags.approve ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  writeJson(taskPath(id), { id, title: flags.title, allowedPaths: allowed, approvedProtected: approved, base })
  saveState(id, {
    id, status: 'created', base, branch: branchName(id, policy), worktree: worktreeDir(id, policy), createdAt: now(),
    codexCalls: 0, fixAttempts: 0, reviewRounds: 0, lastSignature: null, sameSignatureCount: 0,
    testsPassed: null, review: null, history: [],
  })
  console.log(`작업 "${id}" 생성 완료.\n명세 파일: ${path.join(runDir(id), 'TASK.md')}\n목표·완료 기준을 채운 뒤 start 를 실행하세요.`)
}

// ---- 격리된 작업 폴더(워크트리) 만들기 ----
export function cmdStart(id) {
  const state = loadState(id)
  if (state.status !== 'created') die(`현재 상태(${state.status})에서는 start 할 수 없어요.`)
  const wt = state.worktree
  if (fs.existsSync(wt)) die(`워크트리 폴더가 이미 있어요: ${wt}`)
  fs.mkdirSync(path.dirname(wt), { recursive: true })

  const added = git(REPO_ROOT, 'worktree', 'add', '-b', state.branch, wt, state.base)
  if (added.code !== 0) die(`워크트리 생성 실패: ${added.stderr.trim()}`)
  if (fs.existsSync(path.join(wt, '.env'))) die('워크트리에 .env가 있어요. 비밀 보호 규칙 위반이라 중단합니다.')

  console.log('패키지 설치 중(npm ci)… Codex는 네트워크를 못 쓰므로 여기서 미리 설치해요.')
  const installed = run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: wt, timeout: 10 * 60 * 1000 })
  if (installed.code !== 0) die(`npm ci 실패:\n${installed.stderr.split('\n').slice(-15).join('\n')}`)

  state.status = 'ready'
  logHistory(state, 'start', { base: state.base, branch: state.branch })
  saveState(id, state)
  console.log(`준비 완료\n  워크트리: ${wt}\n  브랜치: ${state.branch}`)
}

function buildPrompt(id, state) {
  const dir = runDir(id)
  const taskMd = fs.readFileSync(path.join(dir, 'TASK.md'), 'utf8')
  const parts = [
    [
      '당신은 Moneylog 프로젝트의 Senior Software Engineer입니다.',
      '이 폴더는 격리된 Git 워크트리입니다. 먼저 AGENTS.md를 읽고 따르세요. CLAUDE.md는 통째로 읽지 말고 TASK.md가 가리키는 장만 읽으세요(읽는 양이 곧 비용입니다).',
      '글쓰기 스타일은 기존 코드(src/utils/format.ts 등)와 똑같이 맞춥니다: 세미콜론 없음, 작은따옴표, 가져오기 경로에 .ts/.tsx 확장자(예: from \'./common.ts\'), 테스트 이름과 주석은 한국어.',
      '아래 TASK 명세 범위 안에서만 작업하세요. git commit·push, 네트워크, 패키지 설치, .env 접근, 허용 경로 밖 수정은 금지입니다.',
      '끝내기 전에 npx tsc -b, npm test, npm run build 를 실행하고, 최종 응답은 지정된 JSON 형식으로만 하세요.',
    ].join('\n'),
    '=== TASK.md ===\n' + taskMd,
  ]
  if (state.status === 'checked_failed') {
    const check = readJson(path.join(dir, `check-${last(state.codexCalls)}.json`))
    const failed = check?.tests?.results?.find((r) => !r.ok)
    const lines = []
    if (check && !check.scope.ok) lines.push('범위 위반:\n' + check.scope.violations.map((v) => `- ${v.file}: ${v.reason}`).join('\n'))
    if (check && !check.secrets.ok) lines.push('비밀 문자열 의심: ' + check.secrets.hits.map((h) => h.file).join(', ') + ' (값을 제거하세요)')
    if (check && !check.size.ok) lines.push('크기 한도 초과:\n' + check.size.problems.map((p) => `- ${p}`).join('\n'))
    if (failed) lines.push(`실패한 검사: ${failed.command}\n${failed.tail}`)
    parts.push('=== 직전 검사 실패 (이 문제만 고치세요) ===\n' + lines.join('\n\n'))
  }
  if (state.status === 'review_requested') {
    const note = fs.readFileSync(path.join(dir, `review-${last(state.codexCalls)}.md`), 'utf8')
    parts.push('=== 리뷰어(Claude)의 수정 요청 (이 내용만 반영하세요) ===\n' + note)
  }
  return parts.join('\n\n')
}

// ---- Codex에게 구현(또는 재수정) 맡기기 ----
export async function cmdDelegate(id) {
  const state = loadState(id)
  const policy = loadPolicy()
  const limits = policy.limits
  if (!['ready', 'checked_failed', 'review_requested', 'delegated'].includes(state.status)) {
    die(`현재 상태(${state.status})에서는 위임할 수 없어요.`)
  }
  if (state.codexCalls >= limits.maxCodexCalls) fail(id, state, `Codex 호출 한도(${limits.maxCodexCalls}회)에 도달했어요.`)
  const isTestFix = state.status === 'checked_failed'
  if (isTestFix && state.fixAttempts >= limits.testFixAttempts) fail(id, state, `테스트 수정 ${limits.testFixAttempts}회를 모두 썼어요.`)
  if (isTestFix && state.sameSignatureCount >= limits.sameFailureStop) fail(id, state, '같은 실패가 반복돼 진전이 없어요.')

  const ready = preflight()
  if (!ready.ok) die(ready.reason)

  const prompt = buildPrompt(id, state)
  const attempt = state.codexCalls + 1
  const dir = runDir(id)
  const files = {
    lastMessageFile: path.join(dir, `codex-${last(attempt)}.last.json`),
    jsonlFile: path.join(dir, `codex-${last(attempt)}.jsonl`),
    errFile: path.join(dir, `codex-${last(attempt)}.err.log`),
  }
  state.codexCalls = attempt
  if (isTestFix) state.fixAttempts += 1
  const kind = isTestFix ? '테스트 수정' : state.status === 'review_requested' ? '리뷰 수정' : attempt === 1 ? '최초 구현' : '재시도'
  state.status = 'delegated'
  logHistory(state, 'delegate', { attempt, kind })
  saveState(id, state) // 중간에 멈춰도 호출 횟수는 남긴다

  console.log(`Codex 호출 ${attempt}/${limits.maxCodexCalls} (${kind}), 제한 시간 ${limits.codexTimeoutMinutes}분… (${ready.version})`)
  const started = Date.now()
  const result = await runCodex({
    codex: ready.codex, cwd: state.worktree, prompt,
    schemaFile: path.join(AGENT_DIR, 'schemas', 'result.schema.json'),
    timeoutMs: limits.codexTimeoutMinutes * 60 * 1000, ...files,
  })

  const jsonl = fs.existsSync(files.jsonlFile) ? fs.readFileSync(files.jsonlFile, 'utf8') : ''
  const report = readJson(files.lastMessageFile)
  const tokens = sumTokens(jsonl)
  const leaked = policy.secretPatterns.some((p) => new RegExp(p).test(jsonl))

  const fresh = loadState(id)
  fresh.lastCodex = { attempt, exitCode: result.code, timedOut: result.timedOut, tokens, report }
  logHistory(fresh, 'codex-finished', { attempt, exitCode: result.code, timedOut: result.timedOut, tokens, status: report?.status ?? null })
  saveState(id, fresh)

  console.log(JSON.stringify({
    종료코드: result.code, 시간초과: result.timedOut, 걸린시간초: Math.round((Date.now() - started) / 1000), 토큰: tokens || '알 수 없음',
    비밀문자열의심: leaked, 보고: report,
  }, null, 2))
  if (result.timedOut || result.code !== 0 || !report) process.exitCode = 1
  if (leaked) console.error('경고: Codex 로그에 키·토큰처럼 보이는 문자열이 있어요. 로그를 열어 보지 말고 확인해 주세요.')
}

function fail(id, state, reason) {
  state.status = 'failed'
  logHistory(state, 'failed', { reason })
  saveState(id, state)
  die(`${reason} 더 이상 Codex를 호출하지 않아요. report 로 실패 보고서를 만드세요.`)
}

// ---- 결과 검증: 범위·비밀·크기·타입검사·테스트·빌드 ----
export function cmdCheck(id) {
  const state = loadState(id)
  const policy = loadPolicy()
  if (!['delegated', 'checked_failed', 'checked_passed'].includes(state.status)) die(`현재 상태(${state.status})에서는 check 할 수 없어요.`)
  const task = readJson(taskPath(id))
  const wt = state.worktree

  const files = changedFiles(wt)
  if (files.length === 0) die('워크트리에 변경된 파일이 없어요. Codex가 아무것도 바꾸지 않았어요.')
  const scope = checkScope(files, task, policy)
  const secrets = scanSecrets(wt, files, policy)
  const size = checkSize(wt, files, policy)
  const warnings = scanCodePatterns(wt, files, policy)
  // 규칙 위반이 있으면 시간·토큰을 아끼려고 테스트는 돌리지 않는다
  const tests = scope.ok && secrets.ok ? runChecks(wt, policy) : { ok: false, skipped: true, results: [] }
  const testsPassed = scope.ok && secrets.ok && size.ok && tests.ok

  let signature = null
  if (!testsPassed) {
    signature = tests.skipped || tests.ok
      ? 'rule:' + [...scope.violations.map((v) => v.file), ...secrets.hits.map((h) => h.file), ...size.problems].join('|')
      : failureSignature(tests)
  }
  const check = { at: now(), attempt: state.codexCalls, files: files.map((f) => f.file), scope, secrets, size, warnings, tests, testsPassed, signature }
  writeJson(path.join(runDir(id), `check-${last(state.codexCalls)}.json`), check)

  state.testsPassed = testsPassed
  state.review = null
  state.status = testsPassed ? 'checked_passed' : 'checked_failed'
  if (testsPassed) {
    state.sameSignatureCount = 0
  } else {
    state.sameSignatureCount = signature && signature === state.lastSignature ? state.sameSignatureCount + 1 : 1
    state.lastSignature = signature
  }
  logHistory(state, 'check', { testsPassed, signature })
  saveState(id, state)

  const summary = {
    테스트통과: testsPassed,
    범위: scope.ok ? '정상' : scope.violations,
    공유파일수정: scope.sharedTouched,
    비밀문자열: secrets.ok ? '없음' : secrets.hits,
    크기: size.ok ? `정상 (파일 ${size.filesChanged}개, ${size.linesChanged}줄)` : size.problems,
    검사: tests.skipped ? '규칙 위반으로 건너뜀' : tests.results.map((r) => `${r.ok ? '통과' : '실패'}: ${r.command} (${r.seconds}초)`),
    리뷰참고경고: warnings.length ? warnings.slice(0, 20) : '없음',
    변경파일: files.map((f) => f.file),
  }
  console.log(JSON.stringify(summary, null, 2))
  const failed = tests.results?.find((r) => !r.ok)
  if (failed) console.log(`\n--- 실패 로그 끝부분 (${failed.command}) ---\n${failed.tail.split('\n').slice(-25).join('\n')}`)
  if (!testsPassed) process.exitCode = 1
}

// ---- 리뷰 판정 기록 (테스트 통과와는 별개) ----
export function cmdReview(id, flags) {
  const state = loadState(id)
  const policy = loadPolicy()
  const verdict = (flags.verdict ?? '').toUpperCase()
  if (!['APPROVE', 'REQUEST_CHANGES', 'REJECT'].includes(verdict)) die('--verdict APPROVE | REQUEST_CHANGES | REJECT 중 하나가 필요해요.')
  if (state.status !== 'checked_passed') die('테스트·검사가 통과한 뒤에만 리뷰 판정을 기록할 수 있어요. 먼저 check 를 통과시키세요.')
  if (verdict !== 'APPROVE' && !flags.note) die('수정 요청·거절에는 --note "이유와 고칠 내용"이 필요해요.')

  state.review = { verdict, note: flags.note ?? '', at: now(), attempt: state.codexCalls }
  if (verdict === 'APPROVE') {
    state.status = 'approved'
  } else if (verdict === 'REJECT') {
    state.status = 'failed'
  } else {
    state.reviewRounds += 1
    fs.writeFileSync(path.join(runDir(id), `review-${last(state.codexCalls)}.md`), flags.note)
    state.status = state.reviewRounds > policy.limits.reviewFixRounds ? 'failed' : 'review_requested'
  }
  logHistory(state, 'review', { verdict })
  saveState(id, state)
  console.log(`리뷰 판정: ${verdict} → 상태: ${state.status}`)
  if (state.status === 'failed') console.log('수정 요청 한도를 넘었거나 거절되어 작업을 중단해요. report 로 보고서를 만드세요.')
}

// ---- 워크트리 브랜치에 커밋 (Claude가 한다. 승인된 작업만) ----
export function cmdCommit(id, flags) {
  const state = loadState(id)
  const policy = loadPolicy()
  if (state.status !== 'approved' || !state.testsPassed) die('테스트 통과 + 리뷰 APPROVE 가 모두 있어야 커밋할 수 있어요.')
  if (!flags.message) die('--message "커밋 메시지"가 필요해요.')
  const wt = state.worktree
  const files = changedFiles(wt)
  const task = readJson(taskPath(id))
  if (!checkScope(files, task, policy).ok || !scanSecrets(wt, files, policy).ok) die('커밋 직전 검사에서 범위 또는 비밀 문자열 문제가 발견됐어요. check 를 다시 실행하세요.')

  git(wt, 'add', '-A')
  const committed = git(wt, 'commit', '-m', flags.message, '-m', 'Implemented-by: OpenAI Codex CLI (delegated by Claude Code)\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>')
  if (committed.code !== 0) die(`커밋 실패: ${committed.stderr.trim() || committed.stdout.trim()}`)
  state.status = 'committed'
  logHistory(state, 'commit', { head: git(wt, 'rev-parse', '--short', 'HEAD').stdout.trim() })
  saveState(id, state)
  console.log(`커밋 완료 (${state.branch}). main에는 아직 합치지 않았어요.\n` + git(wt, 'diff', '--stat', `${state.base}...HEAD`).stdout)
}

// ---- 보고서 ----
export function cmdReport(id) {
  const state = loadState(id)
  const task = readJson(taskPath(id))
  const tokens = state.history.filter((h) => h.event === 'codex-finished').reduce((s, h) => s + (h.tokens || 0), 0)
  const lastCheck = readJson(path.join(runDir(id), `check-${last(state.codexCalls)}.json`))
  const lines = [
    `# 작업 보고서: ${id} (${task.title})`,
    `- 상태: ${state.status}`,
    `- 브랜치: ${state.branch} / 워크트리: ${state.worktree}`,
    `- Codex 호출: ${state.codexCalls}회 (테스트 수정 ${state.fixAttempts}회, 리뷰 수정 ${state.reviewRounds}회), 토큰 합계 약 ${tokens || '알 수 없음'}`,
    `- 테스트 통과: ${state.testsPassed} / 리뷰: ${state.review?.verdict ?? '아직 없음'}`,
    '', '## 진행 기록', ...state.history.map((h) => `- ${h.at} ${h.event} ${JSON.stringify({ ...h, at: undefined, event: undefined })}`),
  ]
  if (state.status === 'failed' && lastCheck) {
    const failed = lastCheck.tests?.results?.find((r) => !r.ok)
    lines.push('', '## 실패 원인', failed ? `검사 "${failed.command}" 실패\n\n${failed.tail.split('\n').slice(-20).join('\n')}` : JSON.stringify({ scope: lastCheck.scope, secrets: lastCheck.secrets, size: lastCheck.size }, null, 2))
    lines.push('', '## 다음 선택지', '- 작업을 더 작게 쪼개서 새 작업으로 시작', '- 명세(TASK.md)를 더 구체적으로 고쳐서 새 작업으로 시작', '- 사용자가 직접 원인을 보고 방향을 정하기')
  }
  const text = lines.join('\n') + '\n'
  fs.writeFileSync(path.join(runDir(id), 'REPORT.md'), text)
  console.log(text)
}

// ---- 정리 ----
export function cmdClean(id, flags) {
  const state = loadState(id)
  const wt = state.worktree
  if (fs.existsSync(wt)) {
    const pending = changedFiles(wt).length > 0
    if (pending && !flags.force && state.status !== 'committed') die('커밋하지 않은 변경이 있어요. 버려도 되면 --force 를 붙이세요.')
    const removed = git(REPO_ROOT, 'worktree', 'remove', '--force', wt)
    if (removed.code !== 0) die(`워크트리 제거 실패: ${removed.stderr.trim()}`)
  }
  if (flags['delete-branch']) {
    const deleted = git(REPO_ROOT, 'branch', '-d', state.branch)
    console.log(deleted.code === 0 ? `브랜치 삭제: ${state.branch}` : `브랜치는 남겼어요(아직 main에 합쳐지지 않았을 수 있어요): ${deleted.stderr.trim()}`)
  }
  state.status = 'cleaned'
  logHistory(state, 'clean')
  saveState(id, state)
  console.log('정리 완료')
}

export function cmdStatus(id) {
  const state = loadState(id)
  const { history, ...rest } = state
  console.log(JSON.stringify({ ...rest, 최근기록: history.slice(-5) }, null, 2))
}

export function cmdList() {
  if (!fs.existsSync(RUNS_DIR)) return console.log('작업이 없어요.')
  for (const name of fs.readdirSync(RUNS_DIR)) {
    const state = readJson(path.join(RUNS_DIR, name, 'state.json'))
    if (state) console.log(`${name.padEnd(28)} ${state.status.padEnd(18)} Codex ${state.codexCalls}회`)
  }
}
