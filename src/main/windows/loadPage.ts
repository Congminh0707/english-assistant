import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export type PageName = 'mascot' | 'popup'

/** Nạp trang của một cửa sổ: dev lấy từ Vite dev server (HMR), production lấy file đã build. */
export function loadPage(win: BrowserWindow, page: PageName): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${page}/index.html`)
  } else {
    win.loadFile(join(__dirname, `../renderer/${page}/index.html`))
  }
}
