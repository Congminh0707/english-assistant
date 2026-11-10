import { BrowserWindow, type WebContents } from 'electron'
import { join } from 'path'
import icon from '../../../resources/icon.png?asset'
import { sendTo } from '../ipc/broadcast'
import { loadPage } from './loadPage'
import { forwardConsoleInDev } from './devConsole'

/**
 * Cửa sổ Học tập: cửa sổ thường (có khung, hiện trên thanh tác vụ) mở theo yêu cầu người dùng.
 * Tạo khi mở lần đầu, đóng thì huỷ để không tốn RAM khi không học (docs/03-architecture.md#3). Luôn mở phóng to.
 */
export class StudyWindow {
  private win: BrowserWindow | null = null

  /** Mở cửa sổ; đã mở thì đưa lên trước. `page`: mở thẳng trang đó (sự kiện study:open-page) */
  open(page?: string): void {
    if (this.win && !this.win.isDestroyed()) {
      if (this.win.isMinimized()) this.win.restore()
      this.win.show()
      this.win.focus()
      if (page) this.sendPage(this.win, page)
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
      backgroundColor: '#fbefd8',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    win.removeMenu()
    // Mở phóng to kín màn hình làm việc (vẫn thấy thanh tác vụ); cỡ 900×640 là cỡ khi người dùng thu nhỏ lại
    win.maximize()
    win.once('ready-to-show', () => win.show())
    win.on('closed', () => {
      if (this.win === win) this.win = null
      this.onClosed?.()
    })
    forwardConsoleInDev(win, 'study')
    // Cửa sổ mới: chờ trang nạp xong (App.vue đã đăng ký lắng nghe) rồi mới gửi trang cần mở
    if (page)
      win.webContents.once('did-finish-load', () => sendTo(win, 'study:open-page', { page }))
    loadPage(win, 'study')
    this.win = win
  }

  /** Gửi study:open-page; cửa sổ đang nạp dở (vd vừa mở lần trước) thì chờ nạp xong mới gửi */
  private sendPage(win: BrowserWindow, page: string): void {
    if (win.webContents.isLoading())
      win.webContents.once('did-finish-load', () => sendTo(win, 'study:open-page', { page }))
    else sendTo(win, 'study:open-page', { page })
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
