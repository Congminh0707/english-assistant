import { BrowserWindow, type WebContents } from 'electron'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'
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
      icon,
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
      this.onClosed?.()
    })
    forwardConsoleInDev(win, 'study')
    loadPage(win, 'study')
    this.win = win
  }

  /** Gọi khi cửa sổ đóng (vd đóng giữa lúc chơi game → hiện lại mascot) */
  onClosed: (() => void) | null = null

  get webContents(): WebContents[] {
    return this.win && !this.win.isDestroyed() ? [this.win.webContents] : []
  }

  /** Toàn màn hình theo yêu cầu của trang (màn game của bé); trả về trạng thái sau khi đổi */
  setFullScreen(on: boolean): boolean {
    const win = this.win
    if (!win || win.isDestroyed()) return false
    if (win.isFullScreen() !== on) win.setFullScreen(on)
    return on
  }

  destroy(): void {
    if (this.win && !this.win.isDestroyed()) this.win.destroy()
    this.win = null
  }
}
