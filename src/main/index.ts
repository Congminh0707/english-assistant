import { app, screen } from 'electron'
import { join } from 'path'
import { electronApp } from '@electron-toolkit/utils'
import { MascotWindow } from './windows/MascotWindow'
import { PopupWindow } from './windows/PopupWindow'
import { registerMascotIpc } from './ipc/mascot.ipc'
import { registerPopupIpc } from './ipc/popup.ipc'
import { createTray, type AppTray } from './system/tray'
import { DEFAULT_SHORTCUTS, registerShortcuts, shortcutLabel } from './system/shortcuts'
import { applySecurityDefaults } from './system/security'
import { monitorOfNativeHandle } from './system/win32'
import { QuietModeService } from './services/QuietModeService'

const APP_ID = 'net.gonbi.englishassistant'

// Cố định thư mục dữ liệu là %APPDATA%\english-assistant (productName khi đóng gói có dấu cách sẽ đổi đường dẫn mặc định)
app.setPath('userData', join(app.getPath('appData'), 'english-assistant'))

// Giữ tham chiếu ở cấp module để không bị garbage collect
let mascot: MascotWindow | null = null
let popup: PopupWindow | null = null
let tray: AppTray | null = null
let quietMode: QuietModeService | null = null

// Chỉ cho chạy 1 instance: mở lần 2 thì hiện lại mascot đang có
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  applySecurityDefaults()

  app.on('second-instance', () => {
    mascot?.show()
    tray?.refresh()
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId(APP_ID)

    const m = new MascotWindow()
    const p = new PopupWindow()
    mascot = m
    popup = p
    registerMascotIpc(m)
    registerPopupIpc(p)
    registerShortcuts(p)
    tray = createTray(m, shortcutLabel(DEFAULT_SHORTCUTS.quickTranslate))

    quietMode = new QuietModeService(
      () => (m.win.isDestroyed() ? null : monitorOfNativeHandle(m.win.getNativeWindowHandle())),
      ({ quiet, reason }) => {
        console.info(`[quiet-mode] ${quiet ? `tạm ẩn mascot (${reason})` : 'hiện lại mascot'}`)
        m.setQuiet(quiet)
        tray?.refresh()
      }
    )
    quietMode.start()

    const keepOnScreen = (): void => m.ensureOnScreen()
    screen.on('display-metrics-changed', keepOnScreen)
    screen.on('display-added', keepOnScreen)
    screen.on('display-removed', keepOnScreen)
  })

  // App mascot sống ở tray: không thoát khi đóng hết cửa sổ, chỉ thoát qua menu tray
  app.on('window-all-closed', () => {})

  app.on('before-quit', () => {
    quietMode?.stop()
    popup?.win.destroy()
    tray?.tray.destroy()
    tray = null
  })
}
