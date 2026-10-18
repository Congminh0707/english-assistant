import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { IpcChannel, type DragEndResult, type WalkResult } from '@shared/ipc'
import type { MascotWindow } from '../windows/MascotWindow'

const MAX_STEP = 20

export function registerMascotIpc(mascot: MascotWindow): void {
  // Chỉ nhận lệnh từ chính cửa sổ mascot
  const fromMascot = (e: IpcMainEvent | IpcMainInvokeEvent): boolean =>
    e.sender === mascot.win.webContents

  ipcMain.on(IpcChannel.mascotSetClickThrough, (e, enabled: unknown) => {
    if (!fromMascot(e) || typeof enabled !== 'boolean') return
    mascot.setClickThrough(enabled)
  })

  ipcMain.on(IpcChannel.mascotDragStart, (e) => {
    if (!fromMascot(e)) return
    mascot.startDrag()
  })

  ipcMain.handle(IpcChannel.mascotDragEnd, (e): DragEndResult => {
    if (!fromMascot(e)) return { falling: false }
    return mascot.endDrag()
  })

  ipcMain.handle(IpcChannel.mascotWalk, (e, dx: unknown): WalkResult => {
    if (!fromMascot(e) || typeof dx !== 'number' || !Number.isFinite(dx)) return { blocked: null }
    return mascot.walk(Math.max(-MAX_STEP, Math.min(MAX_STEP, dx)))
  })
}
