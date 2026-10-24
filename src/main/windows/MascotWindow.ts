import { BrowserWindow, screen, type Rectangle } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import type { DragEndResult, WalkResult } from '@shared/ipc-contract'
import { sendTo } from '../ipc/broadcast'
import { loadPage } from './loadPage'
import { forwardConsoleInDev } from './devConsole'

// Đủ cao/rộng cho thẻ hỏi ôn có nghĩa dài (bong bóng nằm phía trên nhân vật)
const SIZE = { width: 360, height: 440 }
/** Kích thước khung sprite gốc (px); hiển thị = FRAME_PX × scale */
const FRAME_PX = 48
const FRAME_MS = 16
const GRAVITY = 2600 // px/s²

/**
 * Cửa sổ mascot: trong suốt, không khung, luôn trên cùng, click xuyên qua vùng trống.
 * Main giữ vị trí cửa sổ; renderer chỉ yêu cầu đi/kéo/thả (docs/03-architecture.md#3-các-cửa-sổ-windows).
 */
export class MascotWindow {
  readonly win: BrowserWindow
  private dragTimer: NodeJS.Timeout | null = null
  private fallTimer: NodeJS.Timeout | null = null
  private dragOffset = { x: 0, y: 0 }
  /** Người dùng tự ẩn qua tray */
  private userHidden = false
  /** Tạm ẩn do chế độ yên lặng (app toàn màn hình...) */
  private quiet = false
  /** Người dùng chọn "Ẩn 30 phút / 1 giờ" */
  private snoozeUntil: number | null = null
  private snoozeTimer: NodeJS.Timeout | null = null
  /** Phần trong suốt hai bên nhân vật được thò ra ngoài mép màn hình, để nhân vật đi sát mép */
  private edgeOverhang = 0
  /** Gọi mỗi khi trạng thái hiện/ẩn thay đổi (để tray vẽ lại menu) */
  onVisibilityChanged: (() => void) | null = null

  constructor(scale: number) {
    this.setScale(scale)
    const start = this.homePosition()
    this.win = new BrowserWindow({
      ...SIZE,
      ...start,
      transparent: true,
      backgroundColor: '#00000000',
      frame: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      hasShadow: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      focusable: false, // không cướp focus khi người dùng đang gõ phím
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })

    this.win.setAlwaysOnTop(true, 'screen-saver')
    this.win.setVisibleOnAllWorkspaces(true)
    // Mặc định chuột đi xuyên qua, nhưng vẫn forward mousemove để renderer biết khi nào trỏ vào nhân vật
    this.setClickThrough(true)

    this.win.once('ready-to-show', () => {
      this.applyVisibility()
      if (is.dev && process.env['MASCOT_DEVTOOLS'])
        this.win.webContents.openDevTools({ mode: 'detach' })
    })
    this.win.on('closed', () => this.stopTimers())

    forwardConsoleInDev(this.win, 'mascot')
    loadPage(this.win, 'mascot')
  }

  setClickThrough(enabled: boolean): void {
    this.win.setIgnoreMouseEvents(enabled, { forward: true })
  }

  startDrag(): void {
    this.stopFall()
    if (this.dragTimer) return
    const cursor = screen.getCursorScreenPoint()
    const { x, y } = this.win.getBounds()
    this.dragOffset = { x: cursor.x - x, y: cursor.y - y }
    // Theo con trỏ thật trên màn hình — mượt hơn tính toán trong renderer
    this.dragTimer = setInterval(() => {
      const c = screen.getCursorScreenPoint()
      this.moveTo(c.x - this.dragOffset.x, c.y - this.dragOffset.y)
    }, FRAME_MS)
  }

  endDrag(): DragEndResult {
    this.stopDrag()
    const area = this.workArea()
    const { x, y } = this.win.getBounds()
    const clampedX = this.clampX(x, area)
    const groundY = this.groundY(area)

    if (y >= groundY - 2) {
      // Thả trên/dưới mặt đất (vd đè lên taskbar) → đặt lại lên mặt đất, không rơi
      this.moveTo(clampedX, groundY)
      return { falling: false }
    }
    this.moveTo(clampedX, y)
    this.startFall(groundY)
    return { falling: true }
  }

  walk(dx: number): WalkResult {
    if (this.dragTimer || this.fallTimer) return { blocked: null }
    const area = this.workArea()
    const { x } = this.win.getBounds()
    const target = x + dx
    const nx = this.clampX(target, area)
    this.moveTo(nx, this.groundY(area))
    if (nx > target) return { blocked: 'left' }
    if (nx < target) return { blocked: 'right' }
    return { blocked: null }
  }

  /** Đưa về góc phải dưới màn hình chính */
  resetPosition(): void {
    this.stopTimers()
    const { x, y } = this.homePosition()
    this.moveTo(x, y)
  }

  /** Gọi khi màn hình thay đổi (cắm/rút màn hình, đổi độ phân giải, di chuyển taskbar) */
  ensureOnScreen(): void {
    if (this.dragTimer || this.fallTimer) return
    const b = this.win.getBounds()
    const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
    const onSomeDisplay = screen
      .getAllDisplays()
      .some(
        ({ bounds: d }) =>
          center.x >= d.x &&
          center.x < d.x + d.width &&
          center.y >= d.y &&
          center.y < d.y + d.height
      )
    if (!onSomeDisplay) {
      this.resetPosition()
      return
    }
    const area = this.workArea()
    this.moveTo(this.clampX(b.x, area), this.groundY(area))
  }

  get isUserHidden(): boolean {
    return this.userHidden
  }

  get isQuiet(): boolean {
    return this.quiet
  }

  get snoozedUntil(): number | null {
    return this.snoozeUntil
  }

  /** Đổi kích thước hiển thị của sprite → tính lại phần được thò ra mép màn hình */
  setScale(scale: number): void {
    const spriteWidth = FRAME_PX * scale
    this.edgeOverhang = Math.max(0, (SIZE.width - spriteWidth) / 2 - 8)
  }

  /** Ẩn trong một khoảng thời gian rồi tự hiện lại */
  snooze(ms: number): void {
    if (this.snoozeTimer) clearTimeout(this.snoozeTimer)
    this.snoozeUntil = Date.now() + ms
    this.snoozeTimer = setTimeout(() => this.unsnooze(), ms)
    this.applyVisibility()
  }

  unsnooze(): void {
    if (this.snoozeTimer) clearTimeout(this.snoozeTimer)
    this.snoozeTimer = null
    this.snoozeUntil = null
    this.applyVisibility()
  }

  toggleVisible(): void {
    if (this.snoozeUntil) {
      this.show()
      return
    }
    this.userHidden = !this.userHidden
    this.applyVisibility()
  }

  /** Người dùng yêu cầu hiện (vd mở app lần 2). Chế độ yên lặng vẫn được tôn trọng. */
  show(): void {
    this.userHidden = false
    if (this.snoozeUntil) this.unsnooze()
    else this.applyVisibility()
  }

  setQuiet(quiet: boolean): void {
    this.quiet = quiet
    this.applyVisibility()
  }

  private applyVisibility(): void {
    if (this.win.isDestroyed()) return
    const shouldShow = !this.userHidden && !this.quiet && !this.snoozeUntil
    if (shouldShow && !this.win.isVisible()) {
      this.win.showInactive() // hiện mà không lấy focus
    } else if (!shouldShow && this.win.isVisible()) {
      // Đang kéo mà bị ẩn thì renderer không nhận được mouseup → tự thả để dừng timer kéo
      if (this.dragTimer) this.endDrag()
      this.win.hide()
    }
    this.onVisibilityChanged?.()
  }

  private startFall(groundY: number): void {
    let velocity = 0
    let last = Date.now()
    this.fallTimer = setInterval(() => {
      const now = Date.now()
      const dt = (now - last) / 1000
      last = now
      velocity += GRAVITY * dt
      const { x, y } = this.win.getBounds()
      const ny = y + velocity * dt
      if (ny >= groundY) {
        this.moveTo(x, groundY)
        this.stopFall()
        sendTo(this.win, 'mascot:landed', undefined)
      } else {
        this.moveTo(x, ny)
      }
    }, FRAME_MS)
  }

  private homePosition(): { x: number; y: number } {
    const area = screen.getPrimaryDisplay().workArea
    return { x: area.x + area.width - SIZE.width - 40, y: this.groundY(area) }
  }

  /** Vùng làm việc (trừ taskbar) của màn hình đang chứa nhân vật */
  private workArea(): Rectangle {
    const b = this.win.getBounds()
    return screen.getDisplayNearestPoint({
      x: Math.round(b.x + b.width / 2),
      y: Math.round(b.y + b.height / 2)
    }).workArea
  }

  /** Cửa sổ có đáy trùng mép trên taskbar → nhân vật "đứng" trên taskbar */
  private groundY(area: Rectangle): number {
    return area.y + area.height - SIZE.height
  }

  private clampX(x: number, area: Rectangle): number {
    const min = area.x - this.edgeOverhang
    const max = area.x + area.width - SIZE.width + this.edgeOverhang
    return Math.min(Math.max(x, min), max)
  }

  private moveTo(x: number, y: number): void {
    if (this.win.isDestroyed()) return
    // Dùng setBounds (giữ nguyên kích thước) thay vì setPosition: tránh lỗi đổi kích thước khi qua màn hình khác DPI
    this.win.setBounds({ x: Math.round(x), y: Math.round(y), ...SIZE })
  }

  private stopDrag(): void {
    if (this.dragTimer) clearInterval(this.dragTimer)
    this.dragTimer = null
  }

  private stopFall(): void {
    if (this.fallTimer) clearInterval(this.fallTimer)
    this.fallTimer = null
  }

  private stopTimers(): void {
    this.stopDrag()
    this.stopFall()
    if (this.snoozeTimer) clearTimeout(this.snoozeTimer)
  }
}
