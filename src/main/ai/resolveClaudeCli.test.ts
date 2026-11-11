import { describe, expect, it } from 'vitest'
import { ClaudeCliLocator, parseAuthStatus, pickClaudeExe } from './resolveClaudeCli'
import type { CliResult } from './cliRunner'

describe('pickClaudeExe', () => {
  const all = (): boolean => true
  it('Windows: bỏ .cmd/.bat/.ps1, chấp nhận claude.exe', () => {
    expect(
      pickClaudeExe(
        [
          'C:\\npm\\claude.cmd',
          'C:\\npm\\claude.ps1',
          'C:\\x\\claude.bat',
          'C:\\Tools\\Claude.EXE',
          'C:\\Other\\claude.exe'
        ],
        'win32',
        all
      )
    ).toBe('C:\\Tools\\Claude.EXE')
    expect(pickClaudeExe(['C:\\npm\\claude.cmd', 'C:\\npm\\claude'], 'win32', all)).toBeNull()
  })

  it('bỏ đường dẫn tương đối, tên khác, file không tồn tại', () => {
    expect(pickClaudeExe(['claude.exe', '.\\claude.exe'], 'win32', all)).toBeNull()
    expect(pickClaudeExe(['C:\\x\\claude-evil.exe'], 'win32', all)).toBeNull()
    expect(pickClaudeExe(['C:\\x\\claude.exe'], 'win32', () => false)).toBeNull()
  })

  it('không phải Windows: chỉ nhận file tên "claude"', () => {
    expect(pickClaudeExe(['/usr/local/bin/claude.sh', '/usr/bin/claude'], 'linux', all)).toBe(
      '/usr/bin/claude'
    )
  })
})

describe('parseAuthStatus', () => {
  it('loggedIn true → true; false / hỏng → false', () => {
    expect(parseAuthStatus('{"loggedIn": true, "authMethod": "claude.ai"}')).toBe(true)
    expect(parseAuthStatus('{"loggedIn": false}')).toBe(false)
    expect(parseAuthStatus('{"loggedIn": "yes"}')).toBe(false)
    expect(parseAuthStatus('not json')).toBe(false)
    expect(parseAuthStatus('')).toBe(false)
  })
})

describe('ClaudeCliLocator', () => {
  function make(opts: { candidates?: string[]; auth?: Partial<CliResult> | Error }): {
    loc: ClaudeCliLocator
    calls: { find: number; run: Array<{ exe: string; args: string[] }> }
    now: { t: number }
  } {
    const calls = { find: 0, run: [] as Array<{ exe: string; args: string[] }> }
    const now = { t: 1_000_000 }
    const loc = new ClaudeCliLocator({
      findCandidates: async () => {
        calls.find++
        return opts.candidates ?? ['C:\\Tools\\claude.exe']
      },
      isFile: () => true,
      platform: 'win32',
      now: () => now.t,
      run: async (exe, args) => {
        calls.run.push({ exe, args })
        const a = opts.auth ?? { stdout: '{"loggedIn": true}' }
        if (a instanceof Error) throw a
        return { code: a.code ?? 0, stdout: a.stdout ?? '', stderr: a.stderr ?? '' }
      }
    })
    return { loc, calls, now }
  }

  it('đã cài + đăng nhập → ready, cache 10 phút, Kiểm tra lại (force) phân giải lại', async () => {
    const { loc, calls, now } = make({})
    expect(loc.peek()).toBe('unknown')
    expect(await loc.check()).toBe('ready')
    expect(loc.exe()).toBe('C:\\Tools\\claude.exe')
    expect(calls.run[0]).toEqual({ exe: 'C:\\Tools\\claude.exe', args: ['auth', 'status'] })
    await loc.check()
    now.t += 9 * 60_000
    await loc.check()
    expect(calls.run).toHaveLength(1)
    now.t += 2 * 60_000
    await loc.check()
    expect(calls.run).toHaveLength(2)
    expect(calls.find).toBe(1) // hết hạn cache: chỉ hỏi lại auth, giữ exe đã phân giải
    await loc.check({ force: true })
    expect(calls.find).toBe(2)
    expect(calls.run).toHaveLength(3)
  })

  it('gọi đồng thời → chỉ kiểm tra 1 lần', async () => {
    const { loc, calls } = make({})
    await Promise.all([loc.check(), loc.check(), loc.check()])
    expect(calls.run).toHaveLength(1)
  })

  it('chỉ có claude.cmd → missing, không chạy gì', async () => {
    const { loc, calls } = make({ candidates: ['C:\\npm\\claude.cmd'] })
    expect(await loc.check()).toBe('missing')
    expect(loc.exe()).toBeNull()
    expect(calls.run).toHaveLength(0)
  })

  it('where.exe không có gì hợp lệ → thử ~/.local/bin/claude.exe (cùng kiểm tra tên/đường dẫn/file)', async () => {
    const mk = (fallback: string[], files: string[]): ClaudeCliLocator =>
      new ClaudeCliLocator({
        findCandidates: async () => ['C:\\npm\\claude.cmd'],
        fallbackCandidates: () => fallback,
        isFile: (p) => files.includes(p),
        platform: 'win32',
        now: () => 0,
        run: async () => ({ code: 0, stdout: '{"loggedIn": true}', stderr: '' })
      })
    const home = 'C:\\Users\\u\\.local\\bin\\claude.exe'
    const ok = mk([home], [home])
    expect(await ok.check()).toBe('ready')
    expect(ok.exe()).toBe(home)
    expect(await mk([home], []).check()).toBe('missing')
    expect(
      await mk(
        ['C:\\Users\\u\\.local\\bin\\claude.cmd'],
        ['C:\\Users\\u\\.local\\bin\\claude.cmd']
      ).check()
    ).toBe('missing')
  })

  it('chưa đăng nhập → loggedOut; lỗi chạy → error; invalidate → kiểm tra lại', async () => {
    const out = make({ auth: { code: 1, stdout: '{"loggedIn": false}' } })
    expect(await out.loc.check()).toBe('loggedOut')
    const bad = make({ auth: new Error('ai-cli: timeout') })
    expect(await bad.loc.check()).toBe('error')
    const ok = make({})
    await ok.loc.check()
    ok.loc.invalidate()
    expect(ok.loc.peek()).toBe('unknown')
    await ok.loc.check()
    expect(ok.calls.run).toHaveLength(2)
  })
})
