// Tên các kênh IPC — file này KHÔNG import thư viện nào để preload (sandbox) dùng được.
// Kiểu dữ liệu & validate nằm ở ipc-contract.ts. Thêm kênh: thêm tên ở đây + định nghĩa ở ipc-contract.ts.

/** renderer → main, chờ kết quả (ipcRenderer.invoke) */
export const INVOKE_CHANNELS = [
  'mascot:drag-end',
  'mascot:walk',
  'pet:get',
  'pet:pat',
  'pet:feed',
  'inventory:list',
  'settings:get-all',
  'settings:set',
  'dictionary:lookup',
  'vocab:save',
  'quiz:answer',
  'study:overview',
  'study:next',
  'study:rate',
  'vocab:list',
  'vocab:remove'
] as const

/** renderer → main, không chờ kết quả (ipcRenderer.send) */
export const SEND_CHANNELS = [
  'mascot:set-click-through',
  'mascot:drag-start',
  'mascot:context-menu',
  'popup:hide'
] as const

/** main → renderer (webContents.send) */
export const EVENT_NAMES = [
  'mascot:landed',
  'mascot:react',
  'pet:updated',
  'settings:changed',
  'popup:query',
  'mascot:quiz'
] as const

export type InvokeChannel = (typeof INVOKE_CHANNELS)[number]
export type SendChannel = (typeof SEND_CHANNELS)[number]
export type EventName = (typeof EVENT_NAMES)[number]
