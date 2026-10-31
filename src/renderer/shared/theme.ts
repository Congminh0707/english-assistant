import { ref } from 'vue'
import { invoke } from './ipc'

// Chủ đề sáng/tối: gán documentElement.dataset.theme theo setting `ui.theme` ('system' theo hệ điều hành).
export type ThemeSetting = 'light' | 'dark' | 'system'

/** Đang dùng nền tối (đã tính 'system') */
export const isDark = ref(false)

const query = window.matchMedia('(prefers-color-scheme: dark)')
let current: ThemeSetting = 'system'

export function applyTheme(setting: ThemeSetting): void {
  current = setting
  isDark.value = setting === 'dark' || (setting === 'system' && query.matches)
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
}

/** Gọi một lần ở mỗi cửa sổ (main.ts): đọc setting, nghe thay đổi từ cửa sổ khác và từ hệ điều hành */
export function initTheme(): void {
  void invoke('settings:get-all')
    .then((s) => applyTheme(s['ui.theme']))
    .catch(() => applyTheme('system'))
  window.api.on('settings:changed', (s) => applyTheme(s['ui.theme']))
  query.addEventListener('change', () => applyTheme(current))
}
