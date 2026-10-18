import { BrowserWindow } from 'electron'
import type { EventName } from '@shared/ipc-channels'
import type { EventPayload } from '@shared/ipc-contract'

/** Main chủ động đẩy sự kiện xuống mọi cửa sổ đang mở (~ broadcasting) */
export function broadcast<E extends EventName>(event: E, payload: EventPayload<E>): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(event, payload)
  }
}

/** Gửi sự kiện tới một cửa sổ */
export function sendTo<E extends EventName>(
  win: BrowserWindow,
  event: E,
  payload: EventPayload<E>
): void {
  if (!win.isDestroyed()) win.webContents.send(event, payload)
}
