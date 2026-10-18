import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, IpcEvent, type AppApi, type IpcEventName } from '@shared/ipc'

const allowedEvents = new Set<string>(Object.values(IpcEvent))

// Chỉ expose các hàm có kiểu — không bao giờ expose ipcRenderer thô cho renderer.
const api: AppApi = {
  mascot: {
    setClickThrough: (enabled) => ipcRenderer.send(IpcChannel.mascotSetClickThrough, enabled),
    dragStart: () => ipcRenderer.send(IpcChannel.mascotDragStart),
    dragEnd: () => ipcRenderer.invoke(IpcChannel.mascotDragEnd),
    walk: (dx) => ipcRenderer.invoke(IpcChannel.mascotWalk, dx)
  },
  popup: {
    hide: () => ipcRenderer.send(IpcChannel.popupHide)
  },
  on: (event: IpcEventName, cb) => {
    if (!allowedEvents.has(event)) throw new Error(`Unknown event: ${event}`)
    const listener = (): void => cb()
    ipcRenderer.on(event, listener)
    return () => ipcRenderer.removeListener(event, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
