// 에이전트 협업 도구의 공통 부품: 경로, 정책 불러오기, 명령 실행, 파일 패턴 비교
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const AGENT_DIR = path.join(REPO_ROOT, '.agent')
export const RUNS_DIR = path.join(AGENT_DIR, 'runs')

export function loadPolicy() {
  return JSON.parse(fs.readFileSync(path.join(AGENT_DIR, 'policy.json'), 'utf8'))
}

export function die(message) {
  console.error(`중단: ${message}`)
  process.exit(1)
}

// 작업 ID는 폴더·브랜치 이름이 되므로 안전한 글자만 허용한다
export function assertRunId(id) {
  if (!/^[a-z0-9][a-z0-9-]{2,40}$/.test(id ?? '')) {
    die('작업 ID는 영문 소문자·숫자·하이픈 3~41자여야 해요. 예) parser-shinhan')
  }
}

export const runDir = (id) => path.join(RUNS_DIR, id)
export const worktreeDir = (id, policy = loadPolicy()) => path.resolve(REPO_ROOT, policy.worktreeRoot, id)
export const branchName = (id, policy = loadPolicy()) => `${policy.branchPrefix}${id}`

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
}

export function now() {
  return new Date().toISOString()
}

// 명령을 실행하고 결과를 돌려준다. Windows에서 npm·npx는 셸을 거쳐야 한다.
export function run(command, args, options = {}) {
  const needsShell = process.platform === 'win32' && /^(npm|npx)$/.test(command)
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: needsShell,
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    ...options,
  })
  return {
    code: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    timedOut: result.error?.code === 'ETIMEDOUT',
  }
}

export const git = (cwd, ...args) => run('git', args, { cwd })

// ---- 파일 패턴 (** 와 * 만 지원하는 간단한 방식) ----

export function globToRegExp(glob) {
  let source = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        source += '.*'
        i++
        if (glob[i + 1] === '/') i++
      } else {
        source += '[^/]*'
      }
    } else if ('\\^$+?.()|{}[]'.includes(c)) {
      source += `\\${c}`
    } else {
      source += c
    }
  }
  return new RegExp(`^${source}$`)
}

export function matchesAny(file, globs = []) {
  const normalized = file.replaceAll('\\', '/')
  return globs.some((glob) => globToRegExp(glob).test(normalized))
}

// ---- 작업 상태 파일 ----

export const statePath = (id) => path.join(runDir(id), 'state.json')

export function loadState(id) {
  const state = readJson(statePath(id))
  if (!state) die(`작업 "${id}"를 찾을 수 없어요. 먼저 new 명령으로 만들어 주세요.`)
  return state
}

export function saveState(id, state) {
  writeJson(statePath(id), state)
}

export function logHistory(state, event, detail = {}) {
  state.history.push({ at: now(), event, ...detail })
}
