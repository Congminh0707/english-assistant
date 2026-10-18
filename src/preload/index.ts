import { contextBridge, ipcRenderer } from 'electron'
// Chỉ import file không có dependency: preload chạy trong sandbox, không require được node_modules
import { EVENT_NAMES, INVOKE_CHANNELS, SEND_CHANNELS } from '@shared/ipc-channels'
import type { AppApi } from '@shared/ipc-contract'

const invokeChannels = new Set<string>(INVOKE_CHANNELS)
const sendChannels = new Set<string>(SEND_CHANNELS)
const eventNames = new Set<string>(EVENT_NAMES)

// Chỉ cho phép các kênh trong hợp đồng — không bao giờ expose ipcRenderer thô cho renderer.
const api: AppApi = {
  invoke: (channel, ...args) => {
    if (!invokeChannels.has(channel)) throw new Error(`Unknown IPC channel: ${channel}`)
    return ipcRenderer.invoke(channel, ...args)
  },
  send: (channel, ...args) => {
    if (!sendChannels.has(channel)) throw new Error(`Unknown IPC channel: ${channel}`)
    ipcRenderer.send(channel, ...args)
  },
  on: (event, cb) => {
    if (!eventNames.has(event)) throw new Error(`Unknown IPC event: ${event}`)
    const listener = (_e: Electron.IpcRendererEvent, payload: unknown): void =>
      cb(payload as Parameters<typeof cb>[0])
    ipcRenderer.on(event, listener)
    return () => ipcRenderer.removeListener(event, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
