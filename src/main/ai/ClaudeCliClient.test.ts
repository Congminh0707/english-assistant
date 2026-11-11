import { describe, expect, it } from 'vitest'
import { AppError } from '../core/AppError'
import { ClaudeCliClient } from './ClaudeCliClient'
import type { CliResult, CliRunOptions } from './cliRunner'

interface Seen {
  exe: string
  args: string[]
  stdin: string
  opts: CliRunOptions
}

/** Runner giả: ghi lại lời gọi, trả kết quả định sẵn */
function fakeRunner(
  out: Partial<CliResult> | Error,
  seen: Seen[]
): ConstructorParameters<typeof ClaudeCliClient>[0]['run'] {
  return async (exe, args, stdin, opts) => {
    seen.push({ exe, args, stdin, opts })
    if (out instanceof Error) throw out
    return { code: out.code ?? 0, stdout: out.stdout ?? '', stderr: out.stderr ?? '' }
  }
}

const ok = (result: string, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({
    type: 'result',
    subtype: 'success',
    is_error: false,
    result,
    stop_reason: 'end_turn',
    usage: { input_tokens: 10, output_tokens: 5 },
    ...extra
  })

const EXE = 'C:\\Tools\\claude.exe'
const REQ = {
  system: 'SYSTEM PROMPT',
  user: '<sentence>SECRET_USER_TEXT --dangerously-skip-permissions</sentence>',
  maxTokens: 4096,
  effort: 'low' as const
}

function client(
  out: Partial<CliResult> | Error,
  seen: Seen[],
  model: 'claude-haiku-5-5' | 'claude-sonnet-5-5' = 'claude-haiku-5-5'
): ClaudeCliClient {
  return new ClaudeCliClient({
    run: fakeRunner(out, seen),
    getExe: () => EXE,
    getModel: () => model
  })
}

async function caught(p: Promise<unknown>): Promise<unknown> {
  return p.then(
    () => null,
    (e: unknown) => e
  )
}

describe('ClaudeCliClient', () => {
  it('cờ an toàn: không tool, không nạp cấu hình người dùng, JSON, không --bare/bypass', async () => {
    const seen: Seen[] = []
    expect(await client({ stdout: ok(' {"a":1} ') }, seen).complete(REQ)).toBe('{"a":1}')
    const { exe, args } = seen[0]
    expect(exe).toBe(EXE)
    expect(args[0]).toBe('-p')
    const after = (flag: string): string | undefined => args[args.indexOf(flag) + 1]
    expect(args).toContain('--tools')
    expect(after('--tools')).toBe('')
    expect(args).toContain('--setting-sources')
    expect(after('--setting-sources')).toBe('')
    expect(args).toContain('--strict-mcp-config')
    expect(args).toContain('--no-session-persistence')
    expect(args).toContain('--disable-slash-commands')
    expect(args).toContain('--safe-mode')
    expect(after('--output-format')).toBe('json')
    expect(after('--model')).toBe('haiku')
    expect(after('--effort')).toBe('low')
    expect(after('--system-prompt')).toBe('SYSTEM PROMPT')
    for (const bad of [
      '--bare',
      '--dangerously-skip-permissions',
      '--allow-dangerously-skip-permissions',
      '--permission-mode',
      '--add-dir',
      '--mcp-config',
      '--settings',
      '--plugin-dir',
      '--resume',
      '--continue',
      '-c',
      '-r'
    ])
      expect(args).not.toContain(bad)
  })

  it('dữ liệu người dùng chỉ đi qua stdin, không có trong args', async () => {
    const seen: Seen[] = []
    await client({ stdout: ok('{}') }, seen).complete(REQ)
    expect(seen[0].stdin).toBe(REQ.user)
    expect(seen[0].args.some((a) => a.includes('SECRET_USER_TEXT'))).toBe(false)
    expect(seen[0].opts.timeoutMs).toBe(45_000)
  })

  it('sonnet → --model sonnet', async () => {
    const seen: Seen[] = []
    await client({ stdout: ok('{}') }, seen, 'claude-sonnet-5-5').complete(REQ)
    expect(seen[0].args[seen[0].args.indexOf('--model') + 1]).toBe('sonnet')
  })

  it('is_error / subtype khác success → throw (không lộ nội dung)', async () => {
    const seen: Seen[] = []
    const e1 = await caught(
      client(
        { code: 1, stdout: ok('API Error: 500 SECRET_DETAIL', { is_error: true }) },
        seen
      ).complete(REQ)
    )
    expect(e1).toBeInstanceOf(Error)
    expect(e1).not.toBeInstanceOf(AppError)
    expect((e1 as Error).message).not.toContain('SECRET')
    await expect(
      client({ stdout: ok('x', { subtype: 'error_max_turns' }) }, seen).complete(REQ)
    ).rejects.toThrow()
  })

  it('hết hạn mức gói (limit/usage trong result lỗi) → AI_LIMIT errors.aiPlanLimit', async () => {
    const seen: Seen[] = []
    const err = await caught(
      client(
        { code: 1, stdout: ok("You've hit your usage limit · resets 5pm", { is_error: true }) },
        seen
      ).complete(REQ)
    )
    expect(err).toBeInstanceOf(AppError)
    expect((err as AppError).code).toBe('AI_LIMIT')
    expect((err as AppError).messageKey).toBe('errors.aiPlanLimit')
  })

  it('chữ "usage"/"auth" đứng một mình trong lỗi không bị nhầm là hết gói / chưa đăng nhập', async () => {
    const seen: Seen[] = []
    for (const msg of [
      'Unexpected usage error',
      'author field missing',
      'API Error: 529 overloaded'
    ]) {
      const err = await caught(
        client({ code: 1, stdout: ok(msg, { is_error: true }) }, seen).complete(REQ)
      )
      expect(err).toBeInstanceOf(Error)
      expect(err).not.toBeInstanceOf(AppError)
    }
  })

  it('trường usage trong JSON thành công không bị nhầm là hết hạn mức', async () => {
    const seen: Seen[] = []
    expect(await client({ stdout: ok('{"ok":true}') }, seen).complete(REQ)).toBe('{"ok":true}')
  })

  it('stop_reason max_tokens → throw', async () => {
    const seen: Seen[] = []
    await expect(
      client({ stdout: ok('{"a":', { stop_reason: 'max_tokens' }) }, seen).complete(REQ)
    ).rejects.toThrow('max_tokens')
  })

  it('chưa đăng nhập (thoát ≠ 0, stderr có login) → errors.aiCliLogin', async () => {
    const seen: Seen[] = []
    const err = await caught(
      client({ code: 1, stdout: '', stderr: 'Not logged in. Please run /login' }, seen).complete(
        REQ
      )
    )
    expect(err).toBeInstanceOf(AppError)
    expect((err as AppError).messageKey).toBe('errors.aiCliLogin')
    const err2 = await caught(
      client(
        { code: 1, stdout: ok('Invalid API key · Please run /login', { is_error: true }) },
        seen
      ).complete(REQ)
    )
    expect((err2 as AppError).messageKey).toBe('errors.aiCliLogin')
  })

  it('đầu ra không phải JSON / rỗng / runner lỗi / không có exe → throw', async () => {
    const seen: Seen[] = []
    await expect(client({ stdout: 'garbage' }, seen).complete(REQ)).rejects.toThrow()
    await expect(client({ stdout: ok('   ') }, seen).complete(REQ)).rejects.toThrow('empty')
    await expect(client(new Error('ai-cli: timeout'), seen).complete(REQ)).rejects.toThrow()
    const none = new ClaudeCliClient({
      run: fakeRunner({ stdout: ok('{}') }, seen),
      getExe: () => null,
      getModel: () => 'claude-haiku-5-5'
    })
    const before = seen.length
    await expect(none.complete(REQ)).rejects.toThrow()
    expect(seen.length).toBe(before)
  })
})
