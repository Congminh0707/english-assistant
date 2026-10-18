import type { BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'

/** Dev: in console của renderer (lỗi Vue, warning...) ra terminal chạy `pnpm dev` để dễ debug */
export function forwardConsoleInDev(win: BrowserWindow, name: string): void {
  if (!is.dev) return
  win.webContents.on('console-message', (event) => {
    const { level, message, sourceId, lineNumber } = event
    if (level === 'debug') return
    const where = sourceId ? ` (${sourceId.split('/').pop()}:${lineNumber})` : ''
    console.log(`[${name}:${level}] ${message}${where}`)
  })
}
