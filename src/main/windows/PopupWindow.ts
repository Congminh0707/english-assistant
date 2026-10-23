import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { loadPage } from './loadPage'
import { forwardConsoleInDev } from './devConsole'

const SIZE = { width: 400, height: 360 }
/** Khoảng cách từ con trỏ chuột tới góc popup */
const CURSOR_GAP = 12

/**
 * Popup dịch nhanh: nhỏ, không khung, hiện cạnh con trỏ, tự ẩn khi mất focus.
 * Tạo sẵn một lần lúc khởi động và chỉ ẩn/hiện để mở tức thì (docs/03-architecture.md#3-các-cửa-sổ-windows).
 * Phase 0: nội dung trống; Phase 1 gắn tra từ điển/dịch.
 */
export class PopupWindow {
  readonly win: BrowserWindow

  constructor() {
    this.win = new BrowserWindow({
      ...SIZE,
      show: false,
      frame: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      transparent: true,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    this.win.setAlwaysOnTop(true, 'pop-up-menu')
    this.win.on('blur', () => this.hide())
    forwardConsoleInDev(this.win, 'popup')
    loadPage(this.win, 'popup')
  }

  toggleAtCursor(): void {
    if (this.win.isVisible()) this.hide()
    else this.showAtCursor()
  }

  showAtCursor(): void {
    const cursor = screen.getCursorScreenPoint()
    const area = screen.getDisplayNearestPoint(cursor).workArea

    // Mặc định ở dưới-phải con trỏ; tràn mép thì lật sang trái/lên trên
    let x = cursor.x + CURSOR_GAP
    let y = cursor.y + CURSOR_GAP
    if (x + SIZE.width > area.x + area.width) x = cursor.x - CURSOR_GAP - SIZE.width
    if (y + SIZE.height > area.y + area.height) y = cursor.y - CURSOR_GAP - SIZE.height
    x = Math.min(Math.max(x, area.x), area.x + area.width - SIZE.width)
    y = Math.min(Math.max(y, area.y), area.y + area.height - SIZE.height)

    this.win.setBounds({ x: Math.round(x), y: Math.round(y), ...SIZE })
    this.win.show()
    this.win.focus()
  }

  hide(): void {
    if (!this.win.isDestroyed() && this.win.isVisible()) this.win.hide()
  }
}
