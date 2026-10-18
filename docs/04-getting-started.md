# 04 — Bắt đầu: cài môi trường & cửa sổ mascot đầu tiên

Mục tiêu của tài liệu này: sau khoảng 1–2 giờ, bạn có một app Electron + Vue chạy trên Windows với **một nhân vật trong suốt nổi trên desktop,
kéo thả được, click xuyên qua phần trống** — tức là "Phase 0" trong [14-roadmap.md](14-roadmap.md).

> Lệnh dưới đây chạy trong **PowerShell** hoặc **Git Bash**. Mỗi khối lệnh là một bước.

---

## Bước 1 — Cài công cụ

> **Môi trường chuẩn của dự án** (máy dev chính, kiểm tra 2026-10-18): Node **22.20.0** (qua Volta) · pnpm **12.14** · Python 3.10 · VS Build Tools 2022 (MSVC 14.44) · Git 2.49 · LibreSprite · DB Browser for SQLite.

1. **Node.js LTS** — quản lý phiên bản bằng **Volta** (giống phpbrew/Herd cho PHP: mỗi project tự dùng đúng phiên bản Node của nó):
   ```powershell
   winget install Volta.Volta
   ```
   Mở lại terminal rồi:
   ```powershell
   volta install node@22
   ```
   Kiểm tra: `node -v`, `npm -v`.

   Sau khi tạo project (Bước 2), **ghim phiên bản** để mọi máy/AI agent dùng cùng Node và pnpm — Volta ghi vào `package.json`:
   ```powershell
   volta pin node@22
   ```
   Volta 1.x chỉ ghim được pnpm khi bật cờ tính năng `VOLTA_FEATURE_PNPM` (PowerShell):
   ```powershell
   $env:VOLTA_FEATURE_PNPM = 1; volta pin pnpm@12
   ```
   Kết quả trong `package.json`: `"volta": { "node": "22.23.3", "pnpm": "12.14.0" }` (đã ghim). Vào thư mục project là Volta tự đổi đúng phiên bản.
   > Lưu ý: Electron dùng **Node riêng tích hợp sẵn** khi chạy app. Node của Volta chỉ dùng cho công cụ (Vite, pnpm, script, test). Native module kiểu cũ phải build lại cho Electron; `better-sqlite3` v13 và `koffi` dùng N-API nên một binary chạy được cả Node lẫn Electron (Bước 9).
2. **pnpm** — cài qua Volta (không dùng `npm install -g`, để Volta quản lý):
   ```powershell
   volta install pnpm
   ```
3. **Build tools cho native module** (cần cho `better-sqlite3`): cài **Visual Studio Build Tools** và chọn workload *Desktop development with C++*, cài thêm **Python 3** (3.10+).
   ```powershell
   winget install Microsoft.VisualStudio.2022.BuildTools
   ```
   ```powershell
   winget install Python.Python.3.12
   ```
4. **Git**, **VS Code** + extension: *Vue - Official*, *ESLint*, *Prettier*, *Tailwind CSS IntelliSense*, *SQLite Viewer* (tuỳ chọn — đã có DB Browser for SQLite thì không cần).
5. **LibreSprite** (vẽ pixel art, miễn phí) và **DB Browser for SQLite** (xem database).

## Bước 2 — Tạo project bằng electron-vite

Trong thư mục dự án (đã có `docs/`), tạo project vào thư mục tạm rồi chuyển file vào, hoặc tạo trực tiếp nếu thư mục trống:

```powershell
pnpm create @quick-start/electron@latest
```

Chọn: Project name `english-assistant` · Framework **vue** · TypeScript **Yes** · Electron updater plugin **Yes**.

(Không cần trả lời câu hỏi: thêm `--template vue-ts --skip` sẽ bỏ qua prompt, nhưng khi đó phải tự thêm `.npmrc` chứa `shamefully-hoist=true` và cài `electron-updater`.)

```powershell
pnpm install
```

pnpm 10+ **chặn build script** của dependency chưa được duyệt. Nếu báo `ERR_PNPM_IGNORED_BUILDS` cho `electron-winstaller` (installer Squirrel — dự án dùng NSIS nên không cần), từ chối nó; lựa chọn được lưu vào `pnpm-workspace.yaml` (`allowBuilds`):

```powershell
pnpm approve-builds '!electron-winstaller'
```

`koffi` (dùng cho Win32 API, Phase 0) **cần** chạy install script để giải nén binary dựng sẵn — đã được duyệt sẵn (`koffi: true` trong `pnpm-workspace.yaml`).

```powershell
pnpm dev
```

Một cửa sổ Electron mặc định hiện ra = môi trường đã OK. (`pnpm dev` giống `npm run dev` + `php artisan serve` gộp lại: có hot reload cho Vue, tự khởi động lại khi sửa main.)

Template sinh ra cấu trúc `src/main`, `src/preload`, `src/renderer`. Ta sẽ sắp xếp lại theo [03-architecture.md](03-architecture.md#4-cấu-trúc-thư-mục).

> ✅ **Bước 3–7 đã được hiện thực trong repo (Phase 0).** Code mẫu bên dưới là bản giản lược để hiểu ý tưởng; code thật (đầy đủ hơn: rơi có trọng lực, kiểm tra người gửi IPC, tray, nhiều màn hình) nằm ở:
> `electron.vite.config.ts` · `src/main/index.ts` · `src/main/windows/MascotWindow.ts` · `src/main/ipc/mascot.ipc.ts` · `src/main/system/tray.ts` · `src/preload/index.ts` · `src/shared/ipc.ts` · `src/renderer/mascot/App.vue` · `src/renderer/mascot/engine/{SpriteAnimator,MascotBrain}.ts`.
> Sprite tạm sinh bằng `pnpm sprites:placeholder`. Mở DevTools cho cửa sổ mascot khi dev: đặt biến môi trường `MASCOT_DEVTOOLS=1` trước `pnpm dev`.

## Bước 3 — Cấu hình nhiều cửa sổ (multi-page)

`electron.vite.config.ts` — khai báo mỗi cửa sổ là một entry HTML:

```ts
import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared'),
      },
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          mascot: resolve(__dirname, 'src/renderer/mascot/index.html'),
          study: resolve(__dirname, 'src/renderer/study/index.html'),
          popup: resolve(__dirname, 'src/renderer/popup/index.html'),
        },
      },
    },
  },
})
```

Helper load trang cho từng cửa sổ — `src/main/windows/loadPage.ts`:

```ts
import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

export function loadPage(win: BrowserWindow, page: 'mascot' | 'study' | 'popup') {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // Dev: lấy từ Vite dev server (có hot reload)
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${page}/index.html`)
  } else {
    // Production: file đã build
    win.loadFile(join(__dirname, `../renderer/${page}/index.html`))
  }
}
```

## Bước 4 — Cửa sổ mascot trong suốt

`src/main/windows/mascotWindow.ts`:

```ts
import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { loadPage } from './loadPage'

const SIZE = { width: 320, height: 320 }

export function createMascotWindow(): BrowserWindow {
  const { workArea } = screen.getPrimaryDisplay()

  const win = new BrowserWindow({
    ...SIZE,
    x: workArea.x + workArea.width - SIZE.width - 40,
    y: workArea.y + workArea.height - SIZE.height, // đứng ngay trên taskbar
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false, // không cướp focus khi người dùng đang gõ
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true)
  // Mặc định: chuột đi xuyên qua, nhưng vẫn "forward" mousemove cho renderer
  win.setIgnoreMouseEvents(true, { forward: true })

  win.once('ready-to-show', () => win.showInactive()) // hiện mà không lấy focus
  loadPage(win, 'mascot')
  return win
}
```

## Bước 5 — Preload: mở "cánh cửa" an toàn

`src/preload/index.ts`:

```ts
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  mascot: {
    setClickThrough: (enabled: boolean) => ipcRenderer.send('mascot:set-click-through', enabled),
    dragStart: () => ipcRenderer.send('mascot:drag-start'),
    dragEnd: () => ipcRenderer.send('mascot:drag-end'),
    moveBy: (dx: number, dy: number) => ipcRenderer.send('mascot:move-by', dx, dy),
  },
  // Lắng nghe sự kiện main đẩy xuống. Trả về hàm huỷ đăng ký.
  on: (channel: string, cb: (...args: unknown[]) => void) => {
    const listener = (_e: Electron.IpcRendererEvent, ...args: unknown[]) => cb(...args)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
}

contextBridge.exposeInMainWorld('api', api)
export type Api = typeof api
```

> Về sau, `api` sẽ được sinh có kiểu đầy đủ từ `src/shared/ipc-contract.ts` (xem [13](13-coding-conventions.md#3-ipc)). Đây là bản tối giản để chạy thử.

Khai báo kiểu cho renderer — `src/renderer/env.d.ts`:

```ts
import type { Api } from '../preload'
declare global {
  interface Window { api: Api }
}
```

## Bước 6 — IPC handlers trong main

`src/main/ipc/mascot.ipc.ts`:

```ts
import { BrowserWindow, ipcMain, screen } from 'electron'

export function registerMascotIpc(win: BrowserWindow) {
  ipcMain.on('mascot:set-click-through', (_e, enabled: boolean) => {
    win.setIgnoreMouseEvents(enabled, { forward: true })
  })

  // Kéo thả: main theo vị trí con trỏ thật trên màn hình (mượt hơn tính trong renderer)
  let dragTimer: NodeJS.Timeout | null = null
  let offset = { x: 0, y: 0 }

  ipcMain.on('mascot:drag-start', () => {
    const cursor = screen.getCursorScreenPoint()
    const [wx, wy] = win.getPosition()
    offset = { x: cursor.x - wx, y: cursor.y - wy }
    dragTimer = setInterval(() => {
      const c = screen.getCursorScreenPoint()
      win.setPosition(c.x - offset.x, c.y - offset.y)
    }, 16)
  })

  ipcMain.on('mascot:drag-end', () => {
    if (dragTimer) clearInterval(dragTimer)
    dragTimer = null
    // TODO (Phase 1): animation rơi xuống mép workArea
  })

  ipcMain.on('mascot:move-by', (_e, dx: number, dy: number) => {
    const [x, y] = win.getPosition()
    const { workArea } = screen.getDisplayMatching(win.getBounds())
    const [w, h] = win.getSize()
    const nx = Math.min(Math.max(x + dx, workArea.x), workArea.x + workArea.width - w)
    const ny = Math.min(Math.max(y + dy, workArea.y), workArea.y + workArea.height - h)
    win.setPosition(Math.round(nx), Math.round(ny))
  })
}
```

`src/main/index.ts` (rút gọn):

```ts
import { app } from 'electron'
import { createMascotWindow } from './windows/mascotWindow'
import { registerMascotIpc } from './ipc/mascot.ipc'

// Chỉ cho chạy 1 instance (mở lần 2 thì không tạo mascot thứ hai)
if (!app.requestSingleInstanceLock()) app.quit()

app.whenReady().then(() => {
  const mascot = createMascotWindow()
  registerMascotIpc(mascot)
})

// App mascot không thoát khi đóng hết cửa sổ — thoát qua tray/menu
app.on('window-all-closed', () => { /* giữ app chạy */ })
```

## Bước 7 — Renderer mascot: vẽ sprite & nhận biết chuột trên pixel

`src/renderer/mascot/index.html`:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'" />
    <style>html, body, #app { margin: 0; background: transparent; overflow: hidden; user-select: none; }</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

`src/renderer/mascot/App.vue` (bản tối giản — dùng tạm 1 ảnh PNG, Phase 1 thay bằng sprite sheet theo [05](05-mascot-system.md)):

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import spriteUrl from './assets/idle.png' // ảnh PNG nền trong suốt, ví dụ 64x64

const canvas = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D
let clickThrough = true
let dragging = false
const SCALE = 3

onMounted(() => {
  const img = new Image()
  img.src = spriteUrl
  img.onload = () => {
    const c = canvas.value!
    c.width = img.width * SCALE
    c.height = img.height * SCALE
    ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.imageSmoothingEnabled = false // giữ pixel sắc nét
    ctx.drawImage(img, 0, 0, c.width, c.height)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onUp)
})

// Con trỏ có đang nằm trên pixel không trong suốt?
function isOverSprite(e: MouseEvent): boolean {
  const c = canvas.value
  if (!c || !ctx) return false
  const r = c.getBoundingClientRect()
  const x = Math.floor(e.clientX - r.left)
  const y = Math.floor(e.clientY - r.top)
  if (x < 0 || y < 0 || x >= c.width || y >= c.height) return false
  return ctx.getImageData(x, y, 1, 1).data[3] > 10 // alpha
}

function onMove(e: MouseEvent) {
  if (dragging) return
  const over = isOverSprite(e)
  if (over === clickThrough) {      // trạng thái cần đổi
    clickThrough = !over
    window.api.mascot.setClickThrough(clickThrough)
  }
}
function onDown(e: MouseEvent) {
  if (e.button !== 0) return
  dragging = true
  window.api.mascot.dragStart()
}
function onUp() {
  if (!dragging) return
  dragging = false
  window.api.mascot.dragEnd()
}
</script>

<template>
  <div class="stage">
    <canvas ref="canvas" class="sprite" @mousedown="onDown" />
  </div>
</template>

<style scoped>
.stage { width: 100vw; height: 100vh; display: flex; align-items: flex-end; justify-content: center; }
.sprite { image-rendering: pixelated; cursor: grab; }
</style>
```

Chạy `pnpm dev` → nhân vật nổi trên desktop, click vào khoảng trống quanh nhân vật thì trúng app bên dưới, kéo nhân vật đi được. 🎉

## Bước 8 — Các lệnh thường dùng (thêm vào `package.json`)

| Lệnh | Việc làm | Tương đương Laravel |
|---|---|---|
| `pnpm dev` | Chạy app chế độ dev, hot reload | `composer dev` / `npm run dev` + `artisan serve` |
| `pnpm build` | Build code | `npm run build` |
| `pnpm build:win` | Build installer `.exe` | (deploy) |
| `pnpm db:generate` | Sinh migration từ schema (drizzle-kit) | `make:migration` (tự động) |
| `pnpm test` | Chạy vitest | `php artisan test` |
| `pnpm lint` / `pnpm format` | ESLint / Prettier | `pint` |
| `pnpm content:build` | Chạy pipeline đóng gói nội dung (xem [09](09-content-pipeline.md)) | `artisan db:seed` (gần giống) |

## Bước 9 — SQLite (✅ đã làm ở Phase 1)

Đã cài `better-sqlite3` (v13) + `drizzle-orm`, dev: `drizzle-kit`, `vitest`. **better-sqlite3 v13 dùng N-API và kèm binary dựng sẵn** → cùng một file `.node` chạy được trong Node (Vitest) lẫn Electron, không cần `electron-rebuild`. `postinstall` (`electron-builder install-app-deps`) vẫn giữ để lo các native module khác.

- Sửa schema ở `src/main/db/schema/index.ts` → chạy `pnpm db:generate` → file SQL mới trong `src/main/db/migrations/` (commit cả thư mục `meta/`).
- App tự chạy migration lúc khởi động (`openUserDb` trong `src/main/db/client.ts`); bản đóng gói đọc migration từ `resources/migrations` (khai báo `extraResources` trong `electron-builder.yml`).
- Không sửa migration đã phát hành — luôn tạo migration mới.
- Nếu một native module kiểu cũ báo *"was compiled against a different Node.js version"* → `pnpm exec electron-rebuild -f -w <tên-module>`.

Vị trí file DB của người dùng: `app.getPath('userData')` → thường là `C:\Users\<tên>\AppData\Roaming\english-assistant\user.db`.

## Debug

| Cần | Cách làm |
|---|---|
| Xem lỗi/console của renderer | Bản dev tự in console của mọi cửa sổ ra terminal chạy `pnpm dev`, dạng `[mascot:error] ...` (`src/main/windows/devConsole.ts`). |
| Mở DevTools cửa sổ mascot | `$env:MASCOT_DEVTOOLS=1; pnpm dev` |
| Kiểm tra renderer từ bên ngoài (script, AI agent) | `$env:REMOTE_DEBUG_PORT=9222; pnpm dev` → Chrome DevTools Protocol ở `http://127.0.0.1:9222/json` (chỉ bản dev). Dùng `Runtime.evaluate` để gọi `window.api.invoke('pet:get')`... |
| Xem dữ liệu | Mở `%APPDATA%\english-assistant\user.db` bằng DB Browser for SQLite (đóng app trước khi sửa tay). |
| Sửa main/preload | `pnpm dev` **không** tự khởi động lại khi sửa main — tắt rồi chạy lại. Sửa Vue thì có hot reload. |

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân & cách sửa |
|---|---|
| Nền cửa sổ màu đen/trắng thay vì trong suốt | Thiếu `transparent:true` hoặc CSS `background: transparent` ở `html, body, #app`. Tắt `hasShadow`. Một số máy cần tắt hardware acceleration: `app.disableHardwareAcceleration()` (thử cuối cùng). |
| Không click được nhân vật | Quên gọi `setClickThrough(false)` khi hover; kiểm tra `forward: true`. |
| Click xuyên qua không hoạt động | `setIgnoreMouseEvents(true, { forward: true })` phải gọi **sau** khi tạo cửa sổ. |
| Mascot bị taskbar che | Dùng `setAlwaysOnTop(true, 'screen-saver')`. |
| Sprite bị mờ | `imageSmoothingEnabled = false` + CSS `image-rendering: pixelated` + scale số nguyên. |
| `window.api` undefined | Sai đường dẫn preload, hoặc preload lỗi. Mở DevTools của cửa sổ: tạm thêm `win.webContents.openDevTools({ mode: 'detach' })`. |
| Lỗi native module | Xem Bước 9. |

## Tiếp theo

1. Đọc [05-mascot-system.md](05-mascot-system.md) để làm sprite sheet + state machine.
2. Đọc [13-coding-conventions.md](13-coding-conventions.md) trước khi viết code thật.
3. Làm theo checklist Phase 1 trong [14-roadmap.md](14-roadmap.md).
