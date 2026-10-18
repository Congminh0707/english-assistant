import type { MascotWindow } from '../windows/MascotWindow'
import { handle, onSend } from './handle'

export function registerMascotIpc(mascot: MascotWindow, showContextMenu: () => void): void {
  // Chỉ nhận lệnh từ chính cửa sổ mascot
  const from = (): Electron.WebContents => mascot.win.webContents

  onSend('mascot:set-click-through', (enabled) => mascot.setClickThrough(enabled), { from })
  onSend('mascot:drag-start', () => mascot.startDrag(), { from })
  onSend('mascot:context-menu', () => showContextMenu(), { from })
  handle('mascot:drag-end', () => mascot.endDrag(), { from })
  handle('mascot:walk', (dx) => mascot.walk(dx), { from })
}
