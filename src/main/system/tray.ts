import { app, Menu, nativeImage, Tray } from 'electron'
import icon from '../../../resources/icon.png?asset'
import type { MascotWindow } from '../windows/MascotWindow'

export interface AppTray {
  tray: Tray
  /** Vẽ lại menu & tooltip khi trạng thái mascot thay đổi */
  refresh(): void
}

// Phase 0: chuỗi viết cứng tiếng Việt. Phase 1 chuyển sang i18n.
export function createTray(mascot: MascotWindow, shortcutLabel: string): AppTray {
  const tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))

  const refresh = (): void => {
    const quietNote = mascot.isQuiet && !mascot.isUserHidden
    tray.setToolTip(
      quietNote ? 'English Assistant — đang tạm ẩn (có app toàn màn hình)' : 'English Assistant'
    )
    tray.setContextMenu(
      Menu.buildFromTemplate([
        ...(quietNote
          ? [
              { label: 'Đang tạm ẩn vì có app toàn màn hình', enabled: false },
              { type: 'separator' as const }
            ]
          : []),
        {
          label: mascot.isUserHidden ? 'Hiện mascot' : 'Ẩn mascot',
          click: () => {
            mascot.toggleVisible()
            refresh()
          }
        },
        { label: 'Đưa mascot về góc màn hình', click: () => mascot.resetPosition() },
        { label: `Dịch nhanh: ${shortcutLabel}`, enabled: false },
        { type: 'separator' },
        { label: 'Thoát', click: () => app.quit() }
      ])
    )
  }

  tray.on('click', () => {
    mascot.toggleVisible()
    refresh()
  })
  refresh()
  return { tray, refresh }
}
