// Gọi Win32 API trực tiếp qua koffi (FFI, có binary dựng sẵn — không cần biên dịch).
// Chỉ dùng trên Windows; nơi gọi phải kiểm tra process.platform === 'win32' trước.
import koffi from 'koffi'

const RECT = koffi.struct('RECT', { left: 'long', top: 'long', right: 'long', bottom: 'long' })
const MONITORINFO = koffi.struct('MONITORINFO', {
  cbSize: 'uint32',
  rcMonitor: RECT,
  rcWork: RECT,
  dwFlags: 'uint32'
})

interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

const user32 = koffi.load('user32.dll')
const shell32 = koffi.load('shell32.dll')
const kernel32 = koffi.load('kernel32.dll')

const GetForegroundWindow = user32.func('void* __stdcall GetForegroundWindow()')
const GetWindowRect = user32.func('bool __stdcall GetWindowRect(void* hWnd, _Out_ RECT* lpRect)')
const GetClassNameW = user32.func(
  'int __stdcall GetClassNameW(void* hWnd, void* lpClassName, int nMaxCount)'
)
const GetWindowThreadProcessId = user32.func(
  'uint32 __stdcall GetWindowThreadProcessId(void* hWnd, _Out_ uint32* lpdwProcessId)'
)
const GetWindowTextW = user32.func(
  'int __stdcall GetWindowTextW(void* hWnd, void* lpString, int nMaxCount)'
)
const OpenProcess = kernel32.func(
  'void* __stdcall OpenProcess(uint32 dwDesiredAccess, bool bInheritHandle, uint32 dwProcessId)'
)
const QueryFullProcessImageNameW = kernel32.func(
  'bool __stdcall QueryFullProcessImageNameW(void* hProcess, uint32 dwFlags, void* lpExeName, _Inout_ uint32* lpdwSize)'
)
const CloseHandle = kernel32.func('bool __stdcall CloseHandle(void* hObject)')
const MonitorFromWindow = user32.func(
  'void* __stdcall MonitorFromWindow(void* hWnd, uint32 dwFlags)'
)
const MonitorFromWindowByAddress = user32.func(
  'void* __stdcall MonitorFromWindow(intptr_t hWnd, uint32 dwFlags)'
)
const GetMonitorInfoW = user32.func(
  'bool __stdcall GetMonitorInfoW(void* hMonitor, _Inout_ MONITORINFO* lpmi)'
)
const SHQueryUserNotificationState = shell32.func(
  'long __stdcall SHQueryUserNotificationState(_Out_ int* pquns)'
)

const MONITOR_DEFAULTTONEAREST = 2
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000

/** Giá trị trả về của SHQueryUserNotificationState */
export const UserNotificationState = {
  notPresent: 1, // màn hình khoá / screensaver
  busy: 2, // app toàn màn hình
  d3dFullscreen: 3, // game DirectX độc quyền toàn màn hình
  presentationMode: 4, // chế độ trình chiếu
  acceptsNotifications: 5,
  quietTime: 6,
  app: 7
} as const

/** Cửa sổ của shell Windows: desktop, taskbar, Alt+Tab, Start... — không coi là app toàn màn hình */
const SHELL_CLASSES = new Set([
  'Progman',
  'WorkerW',
  'Shell_TrayWnd',
  'Shell_SecondaryTrayWnd',
  'Windows.UI.Core.CoreWindow',
  'XamlExplorerHostIslandWindow',
  'MultitaskingViewFrame',
  'TaskSwitcherWnd',
  'ForegroundStaging',
  'LockScreenBackstopFrame'
])

export interface ForegroundInfo {
  /** Cửa sổ phủ kín toàn bộ màn hình (kể cả vùng taskbar) */
  fullscreen: boolean
  /** Định danh màn hình chứa cửa sổ, để so với màn hình của mascot */
  monitor: bigint
  pid: number
  className: string
  isShell: boolean
  /** Tên file chương trình của cửa sổ (chữ thường, vd 'zoom.exe'); rỗng nếu không đọc được */
  exe: string
  title: string
}

export function getForegroundInfo(): ForegroundInfo | null {
  const hwnd = GetForegroundWindow()
  if (!hwnd) return null

  const buf = Buffer.alloc(512)
  const len = GetClassNameW(hwnd, buf, 256)
  const className = buf.toString('utf16le', 0, len * 2)

  const pid = [0]
  GetWindowThreadProcessId(hwnd, pid)

  const rect = {} as Rect
  if (!GetWindowRect(hwnd, rect)) return null
  const hMonitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST)
  const monitorRect = getMonitorRect(hMonitor)
  if (!monitorRect) return null

  const fullscreen =
    rect.left <= monitorRect.left &&
    rect.top <= monitorRect.top &&
    rect.right >= monitorRect.right &&
    rect.bottom >= monitorRect.bottom

  return {
    fullscreen,
    monitor: koffi.address(hMonitor),
    pid: pid[0],
    className,
    isShell: SHELL_CLASSES.has(className),
    exe: exeNameOf(pid[0]),
    title: windowTitle(hwnd)
  }
}

function windowTitle(hwnd: unknown): string {
  const buf = Buffer.alloc(1024)
  const len = GetWindowTextW(hwnd, buf, 512)
  return len > 0 ? buf.toString('utf16le', 0, len * 2) : ''
}

/** Tên file .exe của tiến trình (chữ thường). Không đọc được (quyền) → '' */
function exeNameOf(pid: number): string {
  const handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
  if (!handle) return ''
  try {
    const buf = Buffer.alloc(1040)
    const size = [520]
    if (!QueryFullProcessImageNameW(handle, 0, buf, size)) return ''
    const path = buf.toString('utf16le', 0, size[0] * 2)
    return path.slice(path.lastIndexOf('\\') + 1).toLowerCase()
  } finally {
    CloseHandle(handle)
  }
}

/** Màn hình chứa một cửa sổ Electron (từ BrowserWindow.getNativeWindowHandle()) */
export function monitorOfNativeHandle(handle: Buffer): bigint {
  const address = handle.length >= 8 ? handle.readBigUInt64LE(0) : BigInt(handle.readUInt32LE(0))
  return koffi.address(MonitorFromWindowByAddress(address, MONITOR_DEFAULTTONEAREST))
}

export function getUserNotificationState(): number {
  const state = [0]
  return SHQueryUserNotificationState(state) === 0
    ? state[0]
    : UserNotificationState.acceptsNotifications
}

function getMonitorRect(hMonitor: unknown): Rect | null {
  const zero = { left: 0, top: 0, right: 0, bottom: 0 }
  const info = { cbSize: koffi.sizeof(MONITORINFO), rcMonitor: zero, rcWork: zero, dwFlags: 0 }
  return GetMonitorInfoW(hMonitor, info) ? info.rcMonitor : null
}
