import { BrowserWindow } from 'electron'
import { join } from 'path'
import { loadPage } from './loadPage'
import { forwardConsoleInDev } from './devConsole'

/**
 * Cửa sổ Học tập: cửa sổ thường (có khung, hiện trên thanh tác vụ) mở theo yêu cầu người dùng.
 * Tạo khi mở lần đầu, đóng thì huỷ để không tốn RAM khi không học (docs/03-architecture.md#3).
 */
export class StudyWindow {
  private win: BrowserWindow | null = null

  /** Mở cửa sổ; đã mở thì đưa lên trước */
  open(): void {
    if (this.win && !this.win.isDestroyed()) {
      if (this.win.isMinimized()) this.win.restore()
      this.win.show()
      this.win.focus()
      return
    }
    const win = new BrowserWindow({
      width: 900,
      height: 640,
      minWidth: 680,
      minHeight: 520,
      show: false,
      title: 'English Assistant',
      autoHideMenuBar: true,
      backgroundColor: '#fdf6e3',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    win.removeMenu()
    win.once('ready-to-show', () => win.show())
    win.on('closed', () => {
      if (this.win === win) this.win = null
    })
    forwardConsoleInDev(win, 'study')
    loadPage(win, 'study')
    this.win = win
  }

  destroy(): void {
    if (this.win && !this.win.isDestroyed()) this.win.destroy()
    this.win = null
  }
}
