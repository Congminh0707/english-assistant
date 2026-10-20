import { EventEmitter } from 'node:events'
import { describe, expect, it } from 'vitest'
import type { UpdateStatus } from '@shared/schemas/update'
import { UpdateManager, type UpdaterLike } from './UpdateManager'

class FakeUpdater extends EventEmitter implements UpdaterLike {
  autoDownload = true
  autoInstallOnAppQuit = true
  checks = 0
  downloads = 0
  installed = false
  failCheck = false
  failDownload = false
  checkForUpdates(): Promise<unknown> {
    this.checks++
    if (this.failCheck) return Promise.reject(new Error('offline'))
    this.emit('checking-for-update')
    return Promise.resolve()
  }
  downloadUpdate(): Promise<unknown> {
    this.downloads++
    return this.failDownload ? Promise.reject(new Error('fail')) : Promise.resolve()
  }
  quitAndInstall(): void {
    this.installed = true
  }
}

function setup(enabled = true): {
  updater: FakeUpdater
  manager: UpdateManager
  seen: UpdateStatus[]
} {
  const updater = new FakeUpdater()
  const seen: UpdateStatus[] = []
  const manager = new UpdateManager({
    updater,
    currentVersion: '1.0.0',
    enabled,
    onStatus: (s) => seen.push(s),
    now: () => 1234
  })
  return { updater, manager, seen }
}

describe('UpdateManager', () => {
  it('tắt tự tải/tự cài; bản dev (chưa đóng gói) thì vô hiệu và không kiểm tra', async () => {
    const dev = setup(false)
    expect(dev.updater.autoDownload).toBe(false)
    expect(dev.updater.autoInstallOnAppQuit).toBe(false)
    expect(dev.manager.current.state).toBe('disabled')
    await dev.manager.check()
    expect(dev.updater.checks).toBe(0)
  })

  it('kiểm tra → có bản mới → chờ người dùng đồng ý → tải → sẵn sàng → cài', async () => {
    const { updater, manager } = setup()
    expect(manager.current).toMatchObject({ state: 'idle', currentVersion: '1.0.0' })
    await manager.check()
    expect(manager.current.state).toBe('checking')
    updater.emit('update-available', { version: '1.1.0', files: [{ size: 1000 }, { size: 500 }] })
    expect(manager.current).toMatchObject({
      state: 'available',
      version: '1.1.0',
      sizeBytes: 1500,
      checkedAt: 1234
    })
    // Chưa tải gì cho đến khi người dùng đồng ý
    expect(updater.downloads).toBe(0)
    await manager.download()
    expect(updater.downloads).toBe(1)
    updater.emit('download-progress', { percent: 41.6 })
    expect(manager.current).toMatchObject({ state: 'downloading', percent: 42 })
    updater.emit('update-downloaded', { version: '1.1.0' })
    expect(manager.current).toMatchObject({ state: 'ready', percent: 100 })
    manager.install()
    expect(updater.installed).toBe(true)
  })

  it('đã là bản mới nhất; chỉ cài được khi đã tải xong', async () => {
    const { updater, manager } = setup()
    await manager.check()
    updater.emit('update-not-available')
    expect(manager.current).toMatchObject({ state: 'none', version: null, checkedAt: 1234 })
    manager.install()
    expect(updater.installed).toBe(false)
    await manager.download() // không có bản mới → bỏ qua
    expect(updater.downloads).toBe(0)
  })

  it('lỗi mạng khi kiểm tra/tải → trạng thái lỗi kèm khoá i18n, thử lại được', async () => {
    const { updater, manager } = setup()
    updater.failCheck = true
    await manager.check()
    expect(manager.current).toMatchObject({ state: 'error', errorKey: 'errors.updateFailed' })
    updater.failCheck = false
    await manager.check()
    expect(manager.current.state).toBe('checking')

    updater.emit('update-available', { version: '1.2.0' })
    updater.failDownload = true
    await manager.download()
    expect(manager.current.state).toBe('error')
  })

  it('không kiểm tra chồng khi đang kiểm tra hoặc đang tải', async () => {
    const { updater, manager } = setup()
    await manager.check()
    await manager.check()
    expect(updater.checks).toBe(1)
    updater.emit('update-available', { version: '1.1.0' })
    await manager.download()
    await manager.check()
    expect(updater.checks).toBe(1)
  })
})
