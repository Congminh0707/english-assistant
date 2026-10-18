import type { PopupWindow } from '../windows/PopupWindow'
import { onSend } from './handle'

export function registerPopupIpc(popup: PopupWindow): void {
  onSend('popup:hide', () => popup.hide(), { from: () => popup.win.webContents })
}
