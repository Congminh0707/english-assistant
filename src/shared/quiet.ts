// Quy tắc chế độ yên lặng thuần (không phụ thuộc electron/Win32) — dùng ở main và test.
// docs/05-mascot-system.md#8-chế-độ-yên-lặng-quiet-mode

/** App họp chuyên dụng: đang ở cửa sổ này thì mascot tạm ẩn (tên file .exe, chữ thường) */
const MEETING_EXES = new Set([
  'zoom.exe',
  'teams.exe',
  'ms-teams.exe',
  'msteams.exe',
  'skype.exe',
  'webex.exe',
  'webexhost.exe',
  'ciscocollabhost.exe',
  'bluejeans.exe'
])

/** Trình duyệt: chỉ coi là họp khi tiêu đề tab khớp dịch vụ họp trực tuyến */
const BROWSER_EXES = new Set([
  'chrome.exe',
  'msedge.exe',
  'firefox.exe',
  'brave.exe',
  'opera.exe',
  'vivaldi.exe',
  'arc.exe'
])

const MEETING_TITLE =
  /^Meet\s[-–]|Google Meet|Zoom Meeting|Zoom Workplace|Microsoft Teams|\bWebex\b|Whereby|Jitsi Meet/i

/** Cửa sổ đang ở trước có phải cuộc họp trực tuyến không */
export function isMeetingWindow(exe: string, title: string): boolean {
  const name = exe.toLowerCase()
  if (MEETING_EXES.has(name)) return true
  return BROWSER_EXES.has(name) && MEETING_TITLE.test(title)
}

/** 'HH:MM' → số phút từ 00:00, hoặc null nếu sai định dạng */
export function parseClock(text: string): number | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(text.trim())
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Giờ hiện tại có nằm trong khung không làm phiền không (khung có thể vắt qua nửa đêm, vd 22:00–07:00) */
export function isInQuietHours(minutesOfDay: number, from: string, to: string): boolean {
  const start = parseClock(from)
  const end = parseClock(to)
  if (start === null || end === null || start === end) return false
  return start < end
    ? minutesOfDay >= start && minutesOfDay < end
    : minutesOfDay >= start || minutesOfDay < end
}

export const minutesOfDay = (date: Date): number => date.getHours() * 60 + date.getMinutes()
