// Codex CLI를 비대화형으로 호출하는 부분
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { run } from './lib.mjs'

// 꼭 필요한 옵션. 버전이 바뀌어 사라졌다면 호출하기 전에 멈춘다.
const REQUIRED_FLAGS = ['--sandbox', '--cd', '--json', '--output-last-message', '--output-schema', '--ephemeral']

// npm 전역 설치된 codex.js를 직접 실행한다 (셸·인용 문제를 피하기 위해)
export function resolveCodex() {
  const root = run('npm', ['root', '-g']).stdout.trim()
  const script = path.join(root, '@openai', 'codex', 'bin', 'codex.js')
  if (root && fs.existsSync(script)) return { command: process.execPath, prefix: [script] }
  return null
}

export function preflight() {
  const codex = resolveCodex()
  if (!codex) return { ok: false, reason: 'Codex CLI를 찾지 못했어요. npm i -g @openai/codex 로 설치해 주세요.' }

  const version = run(codex.command, [...codex.prefix, '--version'])
  if (version.code !== 0) return { ok: false, reason: 'codex --version 실행에 실패했어요.' }

  const login = run(codex.command, [...codex.prefix, 'login', 'status'])
  const loginText = login.stdout + login.stderr
  if (!/logged in/i.test(loginText)) return { ok: false, reason: 'Codex 로그인이 필요해요. 터미널에서 codex login 을 실행해 주세요.' }

  const help = run(codex.command, [...codex.prefix, 'exec', '--help'])
  const missing = REQUIRED_FLAGS.filter((flag) => !(help.stdout + help.stderr).includes(flag))
  if (missing.length > 0) return { ok: false, reason: `이 Codex 버전에 필요한 옵션이 없어요: ${missing.join(', ')}` }

  return { ok: true, codex, version: version.stdout.trim(), login: loginText.trim() }
}

// 토큰 사용량을 이벤트 로그에서 찾아 합친다 (형식이 바뀌어도 멈추지 않도록 느슨하게)
export function sumTokens(jsonlText) {
  let total = 0
  for (const line of jsonlText.split('\n')) {
    if (!line.includes('usage')) continue
    try {
      const usage = JSON.parse(line).usage ?? JSON.parse(line).msg?.usage
      if (usage) total += usage.total_tokens ?? (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)
    } catch {
      // 한 줄이 JSON이 아니어도 무시한다
    }
  }
  return total
}

function killTree(pid) {
  if (process.platform === 'win32') run('taskkill', ['/pid', String(pid), '/T', '/F'])
  else process.kill(pid, 'SIGKILL')
}

// 격리된 워크트리에서 읽기·쓰기만 허용하고(네트워크 차단), 명세는 표준입력으로 전달한다
export function runCodex({ codex, cwd, prompt, lastMessageFile, schemaFile, jsonlFile, errFile, timeoutMs }) {
  const args = [
    ...codex.prefix,
    'exec',
    '-s', 'workspace-write',
    '-C', cwd,
    '--json',
    '--ephemeral',
    '-o', lastMessageFile,
    '--output-schema', schemaFile,
    '-c', 'sandbox_workspace_write.network_access=false',
    '-',
  ]
  return new Promise((resolve) => {
    const out = fs.createWriteStream(jsonlFile)
    const err = fs.createWriteStream(errFile)
    const child = spawn(codex.command, args, { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      killTree(child.pid)
    }, timeoutMs)

    child.stdout.pipe(out)
    child.stderr.pipe(err)
    child.stdin.end(prompt)
    child.on('close', (code) => {
      clearTimeout(timer)
      out.end()
      err.end()
      resolve({ code: code ?? -1, timedOut })
    })
    child.on('error', () => {
      clearTimeout(timer)
      resolve({ code: -1, timedOut })
    })
  })
}
