import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { basename, join } from 'path'
import { aiTempDir, cliEnv, runCli, STRIPPED_ENV_KEYS, type CliResult } from './cliRunner'

// Chạy chính node (process.execPath) với script nhỏ thay cho claude.exe thật — không tốn hạn mức, không cần cài CLI
const NODE = process.execPath
const run = (script: string, stdin = '', opts: { timeoutMs?: number } = {}): Promise<CliResult> =>
  runCli(NODE, ['-e', script], stdin, { timeoutMs: opts.timeoutMs ?? 10_000 })

const saved: Record<string, string | undefined> = {}
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
    delete saved[k]
  }
})

describe('cliEnv', () => {
  it('xoá biến nhạy cảm, giữ biến khác', () => {
    const base: NodeJS.ProcessEnv = { PATH: 'p', HOME: 'h' }
    for (const k of STRIPPED_ENV_KEYS) base[k] = 'x'
    const env = cliEnv(base)
    for (const k of STRIPPED_ENV_KEYS) expect(env[k]).toBeUndefined()
    expect(env.PATH).toBe('p')
    expect(env.HOME).toBe('h')
    expect(base.ANTHROPIC_API_KEY).toBe('x') // không sửa object gốc
    expect(STRIPPED_ENV_KEYS).toEqual(
      expect.arrayContaining([
        'ANTHROPIC_API_KEY',
        'ANTHROPIC_AUTH_TOKEN',
        'ANTHROPIC_BASE_URL',
        'CLAUDE_CODE_USE_BEDROCK',
        'CLAUDE_CODE_USE_VERTEX',
        'NODE_OPTIONS',
        'ELECTRON_RUN_AS_NODE',
        'ANTHROPIC_CUSTOM_HEADERS',
        'ANTHROPIC_MODEL',
        'ANTHROPIC_BEDROCK_BASE_URL',
        'CLAUDE_CODE_USE_FOUNDRY',
        'CLAUDECODE'
      ])
    )
  })

  it('xoá theo mẫu ANTHROPIC_DEFAULT_*_MODEL, ANTHROPIC_VERTEX_*; giữ proxy và CLAUDE_CONFIG_DIR', () => {
    const env = cliEnv({
      ANTHROPIC_DEFAULT_HAIKU_MODEL: 'x',
      ANTHROPIC_DEFAULT_SONNET_MODEL: 'x',
      ANTHROPIC_VERTEX_PROJECT_ID: 'x',
      ANTHROPIC_VERTEX_BASE_URL: 'x',
      anthropic_api_key: 'x',
      HTTPS_PROXY: 'http://proxy:8080',
      HTTP_PROXY: 'http://proxy:8080',
      NO_PROXY: 'localhost',
      CLAUDE_CONFIG_DIR: 'C:\\cfg'
    })
    expect(Object.keys(env).sort()).toEqual(
      ['CLAUDE_CONFIG_DIR', 'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY'].sort()
    )
  })
})

describe('runCli', () => {
  it('stdin đi vào tiến trình, stdout/mã thoát trả về, UTF-8 nguyên vẹn', async () => {
    const res = await run(
      "let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{process.stdout.write(s.toUpperCase());process.exit(3)})",
      'xin chào tiếng việt'
    )
    expect(res.code).toBe(3)
    expect(res.stdout).toBe('XIN CHÀO TIẾNG VIỆT')
  })

  it('không qua shell: tham số rỗng, có dấu cách/nháy/ký tự shell đi nguyên vẹn', async () => {
    const args = ['', 'a b', '"q"', '& echo pwned', '%PATH%', '$(x)']
    const res = await runCli(
      NODE,
      ['-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', ...args],
      '',
      { timeoutMs: 10_000 }
    )
    expect(JSON.parse(res.stdout)).toEqual(args)
  })

  it('env tiến trình con không có biến nhạy cảm', async () => {
    for (const k of ['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_USE_BEDROCK']) {
      saved[k] = process.env[k]
      process.env[k] = 'leak'
    }
    const res = await run(
      'process.stdout.write(JSON.stringify([process.env.ANTHROPIC_API_KEY ?? null, process.env.ANTHROPIC_BASE_URL ?? null, process.env.CLAUDE_CODE_USE_BEDROCK ?? null]))'
    )
    expect(JSON.parse(res.stdout)).toEqual([null, null, null])
  })

  it('quá thời gian → kill + lỗi timeout', async () => {
    const t0 = Date.now()
    await expect(run('setTimeout(()=>{}, 20000)', '', { timeoutMs: 400 })).rejects.toThrow(
      'timeout'
    )
    expect(Date.now() - t0).toBeLessThan(8000)
  })

  it.skipIf(process.platform !== 'win32')(
    'quá thời gian → dừng cả cây (tiến trình cháu cũng chết)',
    async () => {
      const pidFile = join(mkdtempSync(join(tmpdir(), 'ea-cli-test-')), 'pid')
      const script = [
        "const { spawn } = require('child_process')",
        "const g = spawn(process.execPath, ['-e', 'setTimeout(()=>{}, 30000)'], { stdio: 'ignore', detached: true })",
        "require('fs').writeFileSync(process.argv[1], String(g.pid))",
        'setTimeout(()=>{}, 30000)'
      ].join(';')
      await expect(runCli(NODE, ['-e', script, pidFile], '', { timeoutMs: 1500 })).rejects.toThrow(
        'timeout'
      )
      const pid = Number(readFileSync(pidFile, 'utf8'))
      expect(pid).toBeGreaterThan(0)
      const alive = (): boolean => {
        try {
          process.kill(pid, 0)
          return true
        } catch {
          return false
        }
      }
      try {
        for (let i = 0; i < 50 && alive(); i++) await new Promise((r) => setTimeout(r, 100))
        expect(alive()).toBe(false)
      } finally {
        if (alive()) process.kill(pid)
      }
    },
    15_000
  )

  it('stdout quá 512 KB → kill + lỗi', async () => {
    await expect(
      run("process.stdout.write('x'.repeat(700*1024)); setTimeout(()=>{}, 20000)")
    ).rejects.toThrow('stdout')
  })

  it('stderr chỉ giữ tối đa 4 KB', async () => {
    const res = await run("process.stderr.write('e'.repeat(20000))")
    expect(res.stderr.length).toBeLessThanOrEqual(4096)
    expect(res.code).toBe(0)
  })

  it('exe không tồn tại → lỗi spawn (không treo)', async () => {
    await expect(
      runCli(join(aiTempDir(), 'no-such-claude.exe'), [], '', { timeoutMs: 2000 })
    ).rejects.toThrow('spawn')
  })
})

describe('aiTempDir', () => {
  it('thư mục tạm riêng mkdtemp (tên ngẫu nhiên), tạo một lần mỗi tiến trình, mới tạo thì rỗng', () => {
    const dir = aiTempDir()
    expect(basename(dir)).toMatch(/^english-assistant-ai-.+/)
    expect(statSync(dir).isDirectory()).toBe(true)
    expect(aiTempDir()).toBe(dir)
    expect(existsSync(dir)).toBe(true)
    expect(readdirSync(dir)).toEqual([])
  })
})
