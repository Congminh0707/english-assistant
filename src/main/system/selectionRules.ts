// Luật thuần (không import electron) cho việc lấy chữ đang bôi đen — có test ở selectionRules.test.ts
import { looksSensitive } from './sensitive'

const MAX_LENGTH = 500

/**
 * Chương trình mà Ctrl+C KHÔNG phải "sao chép" (terminal: Ctrl+C = ngắt lệnh đang chạy) — tuyệt đối không gửi phím
 * giả lập vào đây. Với các cửa sổ này người dùng vẫn bôi đen → chuột phải/Ctrl+Shift+C rồi bấm phím tắt như cũ.
 */
export const TERMINAL_EXES = new Set([
  'cmd.exe',
  'powershell.exe',
  'pwsh.exe',
  'conhost.exe',
  'openconsole.exe',
  'windowsterminal.exe',
  'wt.exe',
  'mintty.exe',
  'putty.exe',
  'alacritty.exe',
  'wezterm-gui.exe',
  'kitty.exe',
  'hyper.exe',
  'bash.exe',
  'wsl.exe',
  'wslhost.exe'
])
const TERMINAL_CLASSES = new Set([
  'ConsoleWindowClass',
  'CASCADIA_HOSTING_WINDOW_CLASS',
  'mintty',
  'PuTTY'
])

/** Có an toàn để gửi Ctrl+C giả lập tới cửa sổ này không (không phải terminal, không phải cửa sổ của app) */
export function canSimulateCopy(info: { exe: string; className: string } | null): boolean {
  if (!info) return false
  if (TERMINAL_EXES.has(info.exe.toLowerCase())) return false
  if (TERMINAL_CLASSES.has(info.className)) return false
  return true
}

/** Chuẩn hoá chữ lấy được: bỏ khoảng trắng thừa, chặn dữ liệu nhạy cảm, giới hạn độ dài */
export function cleanSelection(text: string): string {
  const t = text.trim()
  if (!t || looksSensitive(t)) return ''
  return t.slice(0, MAX_LENGTH)
}
