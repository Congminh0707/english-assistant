import { app, globalShortcut } from 'electron'
import type { PopupWindow } from '../windows/PopupWindow'

/** Phím tắt mặc định. Phase 1 cho đổi trong Cài đặt (settings: hotkeys.translate). */
export const DEFAULT_SHORTCUTS = {
  quickTranslate: 'CommandOrControl+Alt+T'
} as const

/** Chuỗi hiển thị cho người dùng, vd "Ctrl+Alt+T" */
export function shortcutLabel(accelerator: string): string {
  return accelerator.replace('CommandOrControl', process.platform === 'darwin' ? 'Cmd' : 'Ctrl')
}

/** Đăng ký phím tắt toàn cục (hoạt động cả khi app không được focus). Trả về false nếu app khác đã chiếm. */
export function registerShortcuts(popup: PopupWindow): boolean {
  const ok = globalShortcut.register(DEFAULT_SHORTCUTS.quickTranslate, () => popup.toggleAtCursor())
  if (!ok) {
    console.warn(
      `[shortcuts] Không đăng ký được ${DEFAULT_SHORTCUTS.quickTranslate} — có thể app khác đang dùng phím này`
    )
  }
  app.on('will-quit', () => globalShortcut.unregisterAll())
  return ok
}
