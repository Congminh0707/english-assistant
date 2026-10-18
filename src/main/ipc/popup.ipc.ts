import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/ipc'
import type { PopupWindow } from '../windows/PopupWindow'

export function registerPopupIpc(popup: PopupWindow): void {
  ipcMain.on(IpcChannel.popupHide, (e) => {
    if (e.sender !== popup.win.webContents) return
    popup.hide()
  })
}
