// Codex가 만든 결과를 Claude가 독립적으로 검증하는 부분.
// "테스트 통과"와 "리뷰 통과"는 별개이므로, 여기서는 기계가 확인할 수 있는 것만 본다.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { git, matchesAny, run } from './lib.mjs'

// 워크트리에서 바뀐 파일 목록 (새 파일 포함)
export function changedFiles(worktree) {
  const result = git(worktree, '-c', 'core.quotepath=false', 'status', '--porcelain=v1', '-uall')
  if (result.code !== 0) throw new Error(`git status 실패: ${result.stderr.trim()}`)
  const files = []
  for (const line of result.stdout.split('\n')) {
    if (!line.trim()) continue
    const status = line.slice(0, 2)
    let file = line.slice(3)
    if (file.includes(' -> ')) file = file.split(' -> ')[1]
    files.push({ file: file.replace(/^"|"$/g, ''), deleted: status.includes('D') })
  }
  return files
}

// 범위 검사: 보호 경로를 건드렸는지, 허용 경로 밖을 고쳤는지
export function checkScope(files, task, policy) {
  const approved = task.approvedProtected ?? []
  const violations = []
  for (const { file } of files) {
    const isApproved = matchesAny(file, approved)
    if (matchesAny(file, policy.protectedPaths) && !isApproved) {
      violations.push({ file, reason: '보호 경로 (사용자 승인 없이 수정 불가)' })
    } else if (task.allowedPaths?.length && !matchesAny(file, task.allowedPaths) && !isApproved) {
      violations.push({ file, reason: '허용 경로 밖' })
    }
  }
  const sharedTouched = files.filter((f) => matchesAny(f.file, policy.sharedFiles)).map((f) => f.file)
  return { ok: violations.length === 0, violations, sharedTouched }
}

function readText(worktree, file) {
  const full = path.join(worktree, file)
  try {
    const stat = fs.statSync(full)
    if (!stat.isFile() || stat.size > 1024 * 1024) return null
    const buffer = fs.readFileSync(full)
    if (buffer.includes(0)) return null // 이진 파일은 건너뛴다
    return buffer.toString('utf8')
  } catch {
    return null
  }
}

// 바뀐 파일 안에 키·토큰 같은 문자열이 있는지. 찾은 값은 화면에 드러내지 않고 종류만 알려준다.
export function scanSecrets(worktree, files, policy) {
  const hits = []
  const patterns = policy.secretPatterns.map((p) => ({ source: p, re: new RegExp(p) }))
  for (const { file, deleted } of files) {
    if (deleted) continue
    const text = readText(worktree, file)
    if (text === null) continue
    for (const { source, re } of patterns) {
      if (re.test(text)) hits.push({ file, pattern: source })
    }
  }
  return { ok: hits.length === 0, hits }
}

// 코드 규칙 위반 후보(리뷰 때 참고). 실패로 처리하지는 않는다.
export function scanCodePatterns(worktree, files, policy) {
  const warnings = []
  for (const { file, deleted } of files) {
    if (deleted) continue
    const text = readText(worktree, file)
    if (text === null) continue
    for (const rule of policy.codePatterns) {
      if (!matchesAny(file, rule.paths) || matchesAny(file, rule.exclude)) continue
      const re = new RegExp(rule.pattern, 'i')
      text.split('\n').forEach((line, index) => {
        if (re.test(line)) warnings.push({ file, line: index + 1, rule: rule.id, message: rule.message })
      })
    }
  }
  return warnings
}

// 변경 크기: 파일 수, 바뀐 줄 수, 300줄을 넘는 소스 파일
export function checkSize(worktree, files, policy) {
  const limits = policy.limits
  let lines = 0
  const numstat = git(worktree, 'diff', '--numstat', 'HEAD')
  for (const row of numstat.stdout.split('\n')) {
    const [added, removed] = row.split('\t')
    if (/^\d+$/.test(added)) lines += Number(added) + Number(removed)
  }
  const tracked = new Set(numstat.stdout.split('\n').map((r) => r.split('\t')[2]))
  const tooLong = []
  for (const { file, deleted } of files) {
    if (deleted) continue
    const text = readText(worktree, file)
    if (text === null) continue
    const count = text.split('\n').length
    if (!tracked.has(file)) lines += count // 새 파일은 전체 줄을 센다
    if (/^src\/.*\.(ts|tsx)$/.test(file) && count > limits.maxFileLines) tooLong.push({ file, lines: count })
  }
  const problems = []
  if (files.length > limits.maxFilesChanged) problems.push(`파일 ${files.length}개 (한도 ${limits.maxFilesChanged}개)`)
  if (lines > limits.maxLinesChanged) problems.push(`변경 ${lines}줄 (한도 ${limits.maxLinesChanged}줄)`)
  for (const item of tooLong) problems.push(`${item.file} ${item.lines}줄 (한 파일 ${limits.maxFileLines}줄 한도)`)
  return { ok: problems.length === 0, filesChanged: files.length, linesChanged: lines, problems }
}

// 타입 검사 → 테스트 → 빌드를 차례로 실행한다. 첫 실패에서 멈춰 시간과 토큰을 아낀다.
export function runChecks(worktree, policy) {
  const results = []
  for (const command of policy.checks) {
    const [bin, ...args] = command.split(' ')
    const started = Date.now()
    const r = run(bin, args, { cwd: worktree, timeout: policy.limits.checkTimeoutMinutes * 60 * 1000 })
    const tail = (r.stdout + '\n' + r.stderr)
      .split('\n')
      .filter((line) => line.trim())
      .slice(-60)
      .join('\n')
    const ok = r.code === 0 && !r.timedOut
    results.push({ command, ok, code: r.code, timedOut: r.timedOut, seconds: Math.round((Date.now() - started) / 1000), tail })
    if (!ok) break
  }
  const allRan = results.length === policy.checks.length
  return { ok: allRan && results.every((r) => r.ok), results }
}

// 같은 실패가 반복되는지 알아보기 위한 지문
export function failureSignature(testRun) {
  const failed = testRun.results.find((r) => !r.ok)
  if (!failed) return null
  const lines = failed.tail.split('\n').filter((l) => /error|fail|assert|✗|×/i.test(l)).slice(0, 5)
  return crypto.createHash('sha1').update(`${failed.command}\n${lines.join('\n')}`).digest('hex').slice(0, 12)
}
