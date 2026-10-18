import { getForegroundInfo, getUserNotificationState, UserNotificationState } from '../system/win32'

export type QuietReason = 'fullscreen' | 'd3d-fullscreen' | 'presentation'

export interface QuietState {
  quiet: boolean
  reason: QuietReason | null
}

const CHECK_INTERVAL_MS = 2000
/** Số lần kiểm tra liên tiếp "hết fullscreen" mới hiện lại — tránh nhấp nháy khi Alt+Tab */
const CHECKS_BEFORE_SHOW = 2

/**
 * Chế độ yên lặng: tự ẩn mascot khi có app toàn màn hình trên cùng màn hình với mascot
 * (game, video, trình chiếu). docs/05-mascot-system.md#8-chế-độ-yên-lặng-quiet-mode
 * Phase 0 chỉ xử lý fullscreen; app họp, giờ không làm phiền, hẹn giờ ẩn làm ở Phase 1.
 */
export class QuietModeService {
  private state: QuietState = { quiet: false, reason: null }
  private notQuietStreak = 0
  private timer: NodeJS.Timeout | null = null

  constructor(
    /** Màn hình đang chứa mascot (để không ẩn khi app fullscreen ở màn hình khác) */
    private readonly getMascotMonitor: () => bigint | null,
    private readonly onChange: (state: QuietState) => void
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

  private check(): void {
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
    // Game DirectX độc quyền & chế độ trình chiếu: Windows tự báo, áp dụng cho mọi màn hình
    const notification = getUserNotificationState()
    if (notification === UserNotificationState.d3dFullscreen)
      return { quiet: true, reason: 'd3d-fullscreen' }
    if (notification === UserNotificationState.presentationMode)
      return { quiet: true, reason: 'presentation' }

    const fg = getForegroundInfo()
    // Đang thao tác trên chính cửa sổ của app (mascot, popup): giữ nguyên trạng thái
    if (!fg || fg.pid === process.pid) return 'unchanged'
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
