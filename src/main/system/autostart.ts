import { app } from 'electron'

/** Bật/tắt khởi động cùng Windows. Chỉ áp dụng cho bản đã cài (bản dev sẽ đăng ký nhầm electron.exe). */
export function applyLaunchAtLogin(enabled: boolean): void {
  if (!app.isPackaged) {
    console.info(`[autostart] Bỏ qua ở chế độ dev (openAtLogin=${enabled})`)
    return
  }
  app.setLoginItemSettings({ openAtLogin: enabled })
}
