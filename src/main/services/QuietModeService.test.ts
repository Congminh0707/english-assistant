import { describe, expect, it } from 'vitest'
import {
  QuietModeService,
  type QuietConfig,
  type QuietEnv,
  type QuietState
} from './QuietModeService'

type Foreground = NonNullable<ReturnType<QuietEnv['foreground']>>

function setup(config: Partial<QuietConfig> = {}): {
  quiet: QuietModeService
  env: { fg: Foreground | null; notify: number; now: Date }
  states: QuietState[]
} {
  const env = {
    fg: null as Foreground | null,
    notify: 7,
    now: new Date(2026, 9, 19, 14, 0)
  }
  const states: QuietState[] = []
  const quiet = new QuietModeService(
    () => 1n,
    (s) => states.push(s),
    () => ({
      meetings: true,
      dnd: { enabled: false, from: '22:00', to: '07:00' },
      ...config
    }),
    {
      userNotificationState: () => env.notify,
      foreground: () => env.fg,
      now: () => env.now
    }
  )
  return { quiet, env, states }
}

const window = (over: Partial<Foreground> = {}): Foreground => ({
  pid: 999,
  fullscreen: false,
  monitor: 1n,
  isShell: false,
  exe: 'notepad.exe',
  title: 'Untitled',
  ...over
})

describe('QuietModeService', () => {
  it('ẩn khi đang ở cửa sổ họp, hiện lại sau 2 lần kiểm tra liên tiếp hết họp', () => {
    const { quiet, env, states } = setup()
    env.fg = window({ exe: 'zoom.exe', title: 'Zoom Meeting' })
    quiet.check()
    expect(quiet.current).toEqual({ quiet: true, reason: 'meeting' })

    env.fg = window()
    quiet.check()
    expect(quiet.current.quiet).toBe(true) // chưa đủ 2 lần
    quiet.check()
    expect(quiet.current.quiet).toBe(false)
    expect(states.map((s) => s.quiet)).toEqual([true, false])
  })

  it('tắt tuỳ chọn họp thì không ẩn', () => {
    const { quiet, env } = setup({ meetings: false })
    env.fg = window({ exe: 'chrome.exe', title: 'Meet - abc-defg-hij - Google Chrome' })
    quiet.check()
    expect(quiet.current.quiet).toBe(false)
  })

  it('giờ không làm phiền: ẩn trong khung, kể cả khi không có cửa sổ nào đặc biệt', () => {
    const { quiet, env } = setup({ dnd: { enabled: true, from: '22:00', to: '07:00' } })
    env.fg = window()
    env.now = new Date(2026, 9, 19, 23, 30)
    quiet.check()
    expect(quiet.current).toEqual({ quiet: true, reason: 'dnd' })
  })

  it('giờ không làm phiền chưa bật hoặc ngoài khung → không ẩn', () => {
    const { quiet, env } = setup({ dnd: { enabled: false, from: '22:00', to: '07:00' } })
    env.fg = window()
    env.now = new Date(2026, 9, 19, 23, 30)
    quiet.check()
    expect(quiet.current.quiet).toBe(false)
  })

  it('app toàn màn hình ở cùng màn hình thì ẩn, khác màn hình thì không', () => {
    const { quiet, env } = setup()
    env.fg = window({ fullscreen: true, monitor: 2n })
    quiet.check()
    expect(quiet.current.quiet).toBe(false)
    env.fg = window({ fullscreen: true, monitor: 1n })
    quiet.check()
    expect(quiet.current).toEqual({ quiet: true, reason: 'fullscreen' })
  })
})
