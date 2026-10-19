import { isInQuietHours, isMeetingWindow, minutesOfDay } from '@shared/quiet'

export type QuietReason = 'fullscreen' | 'd3d-fullscreen' | 'presentation' | 'meeting' | 'dnd'

export interface QuietState {
  quiet: boolean
  reason: QuietReason | null
}

/** Cấu hình người dùng (đọc từ settings mỗi lần kiểm tra nên đổi là có hiệu lực ngay) */
export interface QuietConfig {
  /** Tạm ẩn khi đang ở cửa sổ họp trực tuyến (Zoom, Teams, Meet...) */
  meetings: boolean
  /** Khung giờ không làm phiền */
  dnd: { enabled: boolean; from: string; to: string }
}

/** Phần "nhìn ra hệ điều hành" — tách riêng để test không cần Win32 */
export interface QuietEnv {
  /** SHQueryUserNotificationState */
  userNotificationState(): number
  foreground(): {
    pid: number
    fullscreen: boolean
    monitor: bigint
    isShell: boolean
    exe: string
    title: string
  } | null
  now(): Date
}

/** Giá trị của SHQueryUserNotificationState */
const NOTIFY_D3D_FULLSCREEN = 3
const NOTIFY_PRESENTATION = 4

const CHECK_INTERVAL_MS = 2000
/** Số lần kiểm tra liên tiếp "hết yên lặng" mới hiện lại — tránh nhấp nháy khi Alt+Tab */
const CHECKS_BEFORE_SHOW = 2

/**
 * Chế độ yên lặng: tự ẩn mascot khi có app toàn màn hình (game, video, trình chiếu), khi đang họp trực tuyến
 * hoặc trong khung giờ không làm phiền. docs/05-mascot-system.md#8-chế-độ-yên-lặng-quiet-mode
 */
export class QuietModeService {
  private state: QuietState = { quiet: false, reason: null }
  private notQuietStreak = 0
  private timer: NodeJS.Timeout | null = null

  constructor(
    /** Màn hình đang chứa mascot (để không ẩn khi app fullscreen ở màn hình khác) */
    private readonly getMascotMonitor: () => bigint | null,
    private readonly onChange: (state: QuietState) => void,
    private readonly getConfig: () => QuietConfig,
    private readonly env: QuietEnv
  ) {}

  start(): void {
    if (process.platform !== 'win32' || this.timer) return
    this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS)
    this.check()
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  get current(): QuietState {
    return this.state
  }

  /** Kiểm tra một lần (start() gọi định kỳ; test gọi trực tiếp) */
  check(): void {
    let next: QuietState | 'unchanged'
    try {
      next = this.detect()
    } catch (err) {
      console.warn('[quiet-mode] Không đọc được trạng thái cửa sổ, tắt chế độ yên lặng:', err)
      this.stop()
      next = { quiet: false, reason: null }
    }
    if (next === 'unchanged') return

    if (next.quiet) {
      this.notQuietStreak = 0
      this.apply(next)
    } else if (this.state.quiet && ++this.notQuietStreak < CHECKS_BEFORE_SHOW) {
      return
    } else {
      this.notQuietStreak = 0
      this.apply(next)
    }
  }

  private detect(): QuietState | 'unchanged' {
    const config = this.getConfig()

    // Khung giờ không làm phiền: theo đồng hồ, không phụ thuộc cửa sổ nào đang mở
    if (config.dnd.enabled) {
      const minutes = minutesOfDay(this.env.now())
      if (isInQuietHours(minutes, config.dnd.from, config.dnd.to))
        return { quiet: true, reason: 'dnd' }
    }

    // Game DirectX độc quyền & chế độ trình chiếu: Windows tự báo, áp dụng cho mọi màn hình
    const notification = this.env.userNotificationState()
    if (notification === NOTIFY_D3D_FULLSCREEN) return { quiet: true, reason: 'd3d-fullscreen' }
    if (notification === NOTIFY_PRESENTATION) return { quiet: true, reason: 'presentation' }

    const fg = this.env.foreground()
    // Đang thao tác trên chính cửa sổ của app (mascot, popup): giữ nguyên trạng thái
    if (!fg || fg.pid === process.pid) return 'unchanged'

    if (config.meetings && isMeetingWindow(fg.exe, fg.title))
      return { quiet: true, reason: 'meeting' }

    if (fg.isShell || !fg.fullscreen) return { quiet: false, reason: null }

    const mascotMonitor = this.getMascotMonitor()
    if (mascotMonitor !== null && mascotMonitor !== fg.monitor)
      return { quiet: false, reason: null }
    return { quiet: true, reason: 'fullscreen' }
  }

  private apply(next: QuietState): void {
    if (next.quiet === this.state.quiet && next.reason === this.state.reason) return
    this.state = next
    this.onChange(next)
  }
}
