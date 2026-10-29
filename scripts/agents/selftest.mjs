// 협업 도구 자체 점검: 파일 패턴, 범위·비밀 검사, 위험 명령 차단이 의도대로 동작하는지 확인한다.
// 키처럼 보이는 샘플은 일부러 조각내어 이어 붙여 만든다 (이 파일 자체가 비밀 검사에 걸리지 않게).
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkScope, scanSecrets } from './checks.mjs'
import { evaluateCommand } from './guard.mjs'
import { loadPolicy, matchesAny } from './lib.mjs'

const policy = loadPolicy()
let passed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  통과  ${name}`)
  } catch (error) {
    console.error(`  실패  ${name}\n        ${error.message}`)
    process.exitCode = 1
  }
}

console.log('파일 패턴')
test('** 는 하위 폴더 전체', () => {
  assert.ok(matchesAny('.claude/settings.json', ['.claude/**']))
  assert.ok(matchesAny('docs/a/b.md', ['docs/**']))
  assert.ok(!matchesAny('src/docs.ts', ['docs/**']))
})
test('.env* 는 .env 와 .env.local 모두', () => {
  assert.ok(matchesAny('.env', policy.protectedPaths))
  assert.ok(matchesAny('.env.local', policy.protectedPaths))
})
test('보호 경로 목록에 핵심 파일이 들어 있다', () => {
  for (const file of ['package.json', 'vercel.json', 'CLAUDE.md', 'AGENTS.md', 'src/hooks/useAuth.ts', '.mcp.json']) {
    assert.ok(matchesAny(file, policy.protectedPaths), file)
  }
  assert.ok(!matchesAny('src/utils/parsers/shinhan.ts', policy.protectedPaths))
})

console.log('범위 검사')
test('허용 경로 안은 통과, 밖과 보호 경로는 위반', () => {
  const task = { allowedPaths: ['src/utils/parsers/**'], approvedProtected: [] }
  const files = [{ file: 'src/utils/parsers/a.ts' }, { file: 'src/App.tsx' }, { file: 'package.json' }]
  const scope = checkScope(files, task, policy)
  assert.equal(scope.ok, false)
  assert.deepEqual(scope.violations.map((v) => v.file), ['src/App.tsx', 'package.json'])
  assert.deepEqual(scope.sharedTouched, ['src/App.tsx'])
})
test('사용자가 승인한 보호 경로는 허용', () => {
  const task = { allowedPaths: ['src/**'], approvedProtected: ['src/lib/supabase.ts'] }
  assert.ok(checkScope([{ file: 'src/lib/supabase.ts' }], task, policy).ok)
})

console.log('비밀 문자열 검사')
test('키·토큰 모양을 찾아내고, 평범한 코드는 통과', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-selftest-'))
  const secrets = {
    'a.ts': `const k = "${'sb_' + 'secret_'}abcdefgh12345"`,
    'b.ts': `const u = "${'sb_' + 'publishable_'}abcdefghijklmnop1234"`,
    'c.ts': `const j = "${'ey' + 'J'}hbGciOiJIUzI1NiJ9abcdefghij.abcdefghijkl"`,
    'd.ts': `// ${'service' + '_role'} 키`,
    'ok.ts': 'export const add = (a: number, b: number) => a + b',
  }
  for (const [name, text] of Object.entries(secrets)) fs.writeFileSync(path.join(dir, name), text)
  const result = scanSecrets(dir, Object.keys(secrets).map((file) => ({ file })), policy)
  fs.rmSync(dir, { recursive: true, force: true })
  assert.deepEqual([...new Set(result.hits.map((h) => h.file))].sort(), ['a.ts', 'b.ts', 'c.ts', 'd.ts'])
})

console.log('위험 명령 차단 (guard)')
const cases = [
  ['git push --force origin agent/x', 'deny'],
  ['git push -f', 'deny'],
  ['git push origin +main', 'deny'],
  ['codex exec -s danger-full-access "x"', 'deny'],
  ['codex exec --dangerously-bypass-approvals-and-sandbox x', 'deny'],
  ['codex exec "직접 호출"', 'deny'],
  ['node C:/x/codex.js exec foo', 'deny'],
  ['vercel --prod', 'deny'],
  ['npx vercel deploy', 'deny'],
  ['cat .env', 'deny'],
  ['Get-Content .env.local', 'deny'],
  ['node -e "fs.readFileSync(\'.env\')"', 'deny'],
  ['echo ok; cat .env', 'deny'],
  ['cat .env && ls', 'deny'],
  ['git check-ignore -q .env && echo ok', 'allow'],
  ["git ls-files --cached | grep -E '^\\.env$'", 'allow'],
  ['ls -a | grep .env.example', 'allow'],
  ['git reset --hard HEAD~1', 'ask'],
  ['git push origin main', 'ask'],
  ['codex --version', 'allow'],
  ['codex login status', 'allow'],
  ['node scripts/agents/agent.mjs delegate parser-a', 'allow'],
  ['git push origin agent/setup', 'allow'],
  ['cat .env.example', 'allow'],
  ['git status -sb', 'allow'],
  ['npm test', 'allow'],
]
for (const [command, expected] of cases) {
  test(`${expected.padEnd(5)} ${command}`, () => assert.equal(evaluateCommand(command).decision, expected))
}

console.log(`\n${process.exitCode ? '실패가 있어요' : `모두 통과 (${passed}개)`}`)
