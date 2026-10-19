import { app, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from 'electron'
import { t, type Language } from '@shared/i18n'
import icon from '../../../resources/icon.png?asset'
import type { MascotWindow } from '../windows/MascotWindow'

export interface AppTray {
  tray: Tray
  /** Vẽ lại menu & tooltip khi trạng thái mascot hoặc ngôn ngữ thay đổi */
  refresh(): void
}

export function createTray(
  mascot: MascotWindow,
  shortcutLabel: string,
  getLanguage: () => Language,
  openStudy: () => void
): AppTray {
  const tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))

  const refresh = (): void => {
    const lang = getLanguage()
    const snoozedUntil = mascot.snoozedUntil
    const quietNote = mascot.isQuiet && !mascot.isUserHidden && !snoozedUntil
    tray.setToolTip(t(lang, quietNote ? 'tray.tooltipQuiet' : 'tray.tooltip'))

    const status: MenuItemConstructorOptions[] = []
    if (snoozedUntil) {
      const time = new Date(snoozedUntil).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      status.push(
        { label: t(lang, 'tray.snoozedNote', { time }), enabled: false },
        { label: t(lang, 'tray.showNow'), click: () => mascot.show() },
        { type: 'separator' }
      )
    } else if (quietNote) {
      status.push({ label: t(lang, 'tray.quietNote'), enabled: false }, { type: 'separator' })
    }

    tray.setContextMenu(
      Menu.buildFromTemplate([
        ...status,
        { label: t(lang, 'tray.openStudy'), click: openStudy },
        {
          label: t(lang, mascot.isUserHidden ? 'tray.show' : 'tray.hide'),
          click: () => mascot.toggleVisible()
        },
        { label: t(lang, 'tray.resetPosition'), click: () => mascot.resetPosition() },
        { label: t(lang, 'tray.quickTranslate', { shortcut: shortcutLabel }), enabled: false },
        { type: 'separator' },
        { label: t(lang, 'tray.quit'), click: () => app.quit() }
      ])
    )
  }

  tray.on('click', () => mascot.toggleVisible())
  refresh()
  return { tray, refresh }
}
