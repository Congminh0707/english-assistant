import type { IpcErrorInfo } from '@shared/ipc-contract'

/** Lỗi nghiệp vụ: có mã lỗi + khoá i18n để renderer hiển thị (docs/13-coding-conventions.md#2) */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly messageKey: string,
    readonly details?: unknown
  ) {
    super(`${code}: ${messageKey}`)
    this.name = 'AppError'
  }

  toIpc(): IpcErrorInfo {
    return { code: this.code, messageKey: this.messageKey }
  }
}
