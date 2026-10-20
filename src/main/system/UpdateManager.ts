import type { UpdateStatus } from '@shared/schemas/update'

/** Phần của electron-updater mà UpdateManager dùng (để test không cần Electron) */
export interface UpdaterLike {
  autoDownload: boolean
  autoInstallOnAppQuit: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- khớp chữ ký của EventEmitter/AppUpdater
  on(event: string, listener: (...args: any[]) => void): unknown
  checkForUpdates(): Promise<unknown>
  downloadUpdate(): Promise<unknown>
  quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void
}

interface UpdateInfoLike {
  version?: string
  files?: Array<{ size?: number }>
}

/**
 * Cập nhật tự động: kiểm tra (nền, có thể tắt), hỏi người dùng rồi mới tải, cài khi khởi động lại.
 * Không tải/cài gì mà người dùng chưa đồng ý; lỗi mạng chỉ hiện trạng thái "lỗi" trong Cài đặt, không làm phiền.
 * electron-updater tự kiểm tra chữ ký sha512 của file trong latest.yml. docs/15-packaging-and-release.md
 */
export class UpdateManager {
  private status: UpdateStatus

  constructor(
    private readonly deps: {
      updater: UpdaterLike
      currentVersion: string
      /** Chỉ bản đã đóng gói mới có cập nhật */
      enabled: boolean
      onStatus?: (status: UpdateStatus) => void
      now?: () => number
    }
  ) {
    const { updater } = deps
    this.status = {
      state: deps.enabled ? 'idle' : 'disabled',
      currentVersion: deps.currentVersion,
      version: null,
      percent: 0,
      sizeBytes: null,
      errorKey: null,
      checkedAt: null
    }
    // Người dùng quyết định tải và cài, không tự làm gì sau lưng họ
    updater.autoDownload = false
    updater.autoInstallOnAppQuit = false
    updater.on('checking-for-update', () => this.set({ state: 'checking', errorKey: null }))
    updater.on('update-available', (info: UpdateInfoLike) =>
      this.set({
        state: 'available',
        version: info.version ?? null,
        sizeBytes: info.files?.reduce((n, f) => n + (f.size ?? 0), 0) || null,
        percent: 0
      })
    )
    updater.on('update-not-available', () => this.set({ state: 'none', version: null }))
    updater.on('download-progress', (p: { percent?: number }) =>
      this.set({ state: 'downloading', percent: Math.round(p.percent ?? 0) })
    )
    updater.on('update-downloaded', (info: UpdateInfoLike) =>
      this.set({
        state: 'ready',
        percent: 100,
        version: info.version ?? this.status.version
      })
    )
    updater.on('error', () => this.set({ state: 'error', errorKey: 'errors.updateFailed' }))
  }

  get current(): UpdateStatus {
    return this.status
  }

  private set(patch: Partial<UpdateStatus>): void {
    const checked =
      patch.state === 'none' || patch.state === 'available'
        ? { checkedAt: (this.deps.now ?? Date.now)() }
        : {}
    this.status = { ...this.status, ...patch, ...checked }
    this.deps.onStatus?.(this.status)
  }

  /** Kiểm tra bản mới (bỏ qua nếu đang kiểm tra/đang tải hoặc bản chưa đóng gói) */
  async check(): Promise<UpdateStatus> {
    const busy = ['disabled', 'checking', 'downloading', 'ready'].includes(this.status.state)
    if (busy) return this.status
    try {
      await this.deps.updater.checkForUpdates()
    } catch {
      this.set({ state: 'error', errorKey: 'errors.updateFailed' })
    }
    return this.status
  }

  /** Người dùng đồng ý tải bản mới */
  async download(): Promise<UpdateStatus> {
    if (this.status.state !== 'available') return this.status
    this.set({ state: 'downloading', percent: 0, errorKey: null })
    try {
      await this.deps.updater.downloadUpdate()
    } catch {
      this.set({ state: 'error', errorKey: 'errors.updateFailed' })
    }
    return this.status
  }

  /** Khởi động lại để cài (chỉ khi đã tải xong) */
  install(): void {
    if (this.status.state === 'ready') this.deps.updater.quitAndInstall(false, true)
  }
}
