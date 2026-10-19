import { app, Menu, type MenuItemConstructorOptions } from 'electron'
import { FOODS, isFoodId, itemI18nKey } from '@shared/pet'
import { t } from '@shared/i18n'
import type { LevelCode } from '@shared/schemas/content'
import type { Container } from '../container'
import type { MascotWindow } from '../windows/MascotWindow'

const MINUTE_MS = 60_000

/** Các mốc trình độ cho người dùng tự chọn (tạm thời, trước khi có bài kiểm tra đầu vào) */
const LEVEL_CHOICES: Array<{ level: LevelCode; label: string }> = [
  { level: 'PA1_2', label: 'Pre-A1' },
  { level: 'A1_1', label: 'A1' },
  { level: 'A2_1', label: 'A2' },
  { level: 'B1_1', label: 'B1' },
  { level: 'B2_1', label: 'B2' },
  { level: 'C1', label: 'C1' }
]

/** Menu chuột phải trên mascot (docs/01-features.md A5). Dùng menu gốc của Windows cho quen thuộc. */
export function showMascotMenu(
  c: Container,
  mascot: MascotWindow,
  actions: { quizNow: () => void }
): void {
  const lang = c.settings.get('ui.language')
  const scale = c.settings.get('mascot.scale')
  const food = c.inventory.list().filter((item) => isFoodId(item.itemId))

  const feedItems: MenuItemConstructorOptions[] = food.length
    ? food.map((item) => ({
        label: `${FOODS[item.itemId as keyof typeof FOODS].emoji}  ${t(lang, itemI18nKey(item.itemId))} ×${item.quantity}`,
        click: () => safely(() => c.pet.feed(item.itemId))
      }))
    : [{ label: t(lang, 'menu.bagEmpty'), enabled: false }]

  const sizeItem = (value: 1 | 2 | 3, key: string): MenuItemConstructorOptions => ({
    label: t(lang, key),
    type: 'radio',
    checked: scale === value,
    click: () => c.settings.set('mascot.scale', value)
  })

  const dueCount = safeCount(() => c.srs.dueCount())
  const quizMinutes = c.settings.get('mascot.quizMinutes')
  const level = c.settings.get('learning.level')
  const intervalItem = (value: 0 | 15 | 25 | 45): MenuItemConstructorOptions => ({
    label: value ? t(lang, 'menu.everyMinutes', { minutes: value }) : t(lang, 'menu.off'),
    type: 'radio',
    checked: quizMinutes === value,
    click: () => c.settings.set('mascot.quizMinutes', value)
  })

  const menu = Menu.buildFromTemplate([
    {
      label: dueCount
        ? t(lang, 'menu.reviewNowDue', { count: dueCount })
        : t(lang, 'menu.reviewNow'),
      click: actions.quizNow
    },
    { label: t(lang, 'menu.studyNow'), enabled: false },
    { label: t(lang, 'menu.feed'), submenu: feedItems },
    { type: 'separator' },
    {
      label: t(lang, 'menu.quizInterval'),
      submenu: [intervalItem(15), intervalItem(25), intervalItem(45), intervalItem(0)]
    },
    {
      label: t(lang, 'menu.level'),
      submenu: LEVEL_CHOICES.map((choice) => ({
        label: choice.label,
        type: 'radio' as const,
        checked: level.startsWith(choice.level.split('_')[0]),
        click: () => c.settings.set('learning.level', choice.level)
      }))
    },
    { type: 'separator' },
    { label: t(lang, 'menu.hideFor30'), click: () => mascot.snooze(30 * MINUTE_MS) },
    { label: t(lang, 'menu.hideFor60'), click: () => mascot.snooze(60 * MINUTE_MS) },
    { type: 'separator' },
    {
      label: t(lang, 'menu.size'),
      submenu: [
        sizeItem(1, 'menu.sizeSmall'),
        sizeItem(2, 'menu.sizeMedium'),
        sizeItem(3, 'menu.sizeLarge')
      ]
    },
    {
      label: t(lang, 'menu.language'),
      submenu: [
        {
          label: 'Tiếng Việt',
          type: 'radio',
          checked: lang === 'vi',
          click: () => c.settings.set('ui.language', 'vi')
        },
        {
          label: 'English',
          type: 'radio',
          checked: lang === 'en',
          click: () => c.settings.set('ui.language', 'en')
        }
      ]
    },
    {
      label: t(lang, 'menu.launchAtLogin'),
      type: 'checkbox',
      checked: c.settings.get('app.launchAtLogin'),
      click: (item) => c.settings.set('app.launchAtLogin', item.checked)
    },
    { type: 'separator' },
    { label: t(lang, 'menu.quit'), click: () => app.quit() }
  ])

  // Cửa sổ mascot không nhận focus (focusable: false); menu bật lên cần cửa sổ có focus
  // để đóng đúng khi click ra ngoài → tạm cho phép focus trong lúc mở menu.
  mascot.win.setFocusable(true)
  mascot.win.focus()
  menu.popup({
    window: mascot.win,
    callback: () => mascot.win.setFocusable(false)
  })
}

function safely(fn: () => void): void {
  try {
    fn()
  } catch (err) {
    console.warn('[mascot-menu]', err)
  }
}

function safeCount(fn: () => number): number {
  try {
    return fn()
  } catch {
    return 0
  }
}
