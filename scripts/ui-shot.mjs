// pnpm ui:shot <ảnh.png> [--w 1100] [--h 720] [--page mascot|popup|study] [--js "<mã chạy trong trang>"] [--js2 "<mã chạy sau khi trang nạp lại>"] [--wait2 ms] [--wait 1500] [--no-build]
// Chụp app thật qua Chrome DevTools Protocol, không cần thư viện. Dữ liệu người dùng riêng ở .ui-shot/profile.
// Có khoá .ui-shot/lock nên nhiều phiên chạy cùng lúc sẽ xếp hàng (cùng dùng thư mục out/).
// Trong --js có sẵn: nav(tênTrang) bấm mục thanh bên, sleep(ms), click(văn bản nút), api = window.api. --js2 chạy sau --js khi --js làm trang nạp lại (ví dụ đổi hồ sơ), cùng bộ hàm trên.
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const WORK = join(ROOT, '.ui-shot')
const LOCK = join(WORK, 'lock')
const args = process.argv.slice(2)
const out = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`)
  return i >= 0 ? args[i + 1] : d
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
if (!out) {
  console.error('Thiếu đường dẫn ảnh')
  process.exit(2)
}
mkdirSync(WORK, { recursive: true })

async function lock() {
  for (let i = 0; i < 1200; i++) {
    try {
      mkdirSync(LOCK)
      return
    } catch {
      // Khoá của phiên đã chết quá 10 phút thì bỏ
      if (Date.now() - statSync(LOCK).mtimeMs > 600000) rmSync(LOCK, { recursive: true, force: true })
      await sleep(1000)
    }
  }
  throw new Error('Chờ khoá quá lâu')
}

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.wait = new Map()
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data)
      if (m.id && this.wait.has(m.id)) {
        this.wait.get(m.id)(m)
        this.wait.delete(m.id)
      }
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    return new Promise((r) => {
      this.wait.set(id, r)
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  static async connect(url) {
    const ws = new WebSocket(url)
    await new Promise((r, j) => {
      ws.addEventListener('open', r)
      ws.addEventListener('error', j)
    })
    return new Cdp(ws)
  }
}

const PORT = 9333
async function targets() {
  try {
    return await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
  } catch {
    return []
  }
}
async function find(name, ms = 30000) {
  for (let t = 0; t < ms; t += 300) {
    const hit = (await targets()).find((x) => x.type === 'page' && x.url.includes(`/${name}/`))
    if (hit) return hit
    await sleep(300)
  }
  return null
}

const HELPERS = `
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const api = window.api;
  const click = async (text) => {
    const el = [...document.querySelectorAll('button,a,[role=button]')].find((b) => b.textContent.trim().includes(text));
    if (!el) throw new Error('Không thấy nút: ' + text);
    el.click(); await sleep(400);
  };
  const nav = async (name) => {
    const el = document.querySelector('[data-nav="' + name + '"]') ?? [...document.querySelectorAll('.nav-item')].find((b) => b.textContent.trim().includes(name));
    if (!el) throw new Error('Không thấy mục: ' + name);
    el.click(); await sleep(600);
  };
`

await lock()
let app
try {
  if (!args.includes('--no-build')) {
    const b = spawnSync(process.execPath, [join(ROOT, 'node_modules/electron-vite/bin/electron-vite.js'), 'build'], { cwd: ROOT, stdio: 'pipe' })
    if (b.status !== 0) throw new Error('Build lỗi:\n' + b.stdout + b.stderr)
  }
  const electron = join(ROOT, 'node_modules/electron/dist/electron.exe')
  app = spawn(electron, [ROOT, '--open-study', `--remote-debugging-port=${PORT}`], {
    cwd: ROOT,
    stdio: 'ignore',
    env: { ...process.env, EA_USER_DATA: join(WORK, 'profile') }
  })
  const which = opt('page', 'study')
  const target = await find(which)
  if (!target) throw new Error('Không thấy cửa sổ ' + which)
  const c = await Cdp.connect(target.webSocketDebuggerUrl)
  await c.send('Page.enable')
  await c.send('Runtime.enable')
  await c.send('Emulation.setDeviceMetricsOverride', { width: +opt('w', 1100), height: +opt('h', 720), deviceScaleFactor: 1, mobile: false })
  await sleep(+opt('wait', 1500))
  const js = opt('js', '')
  if (js) {
    const r = await c.send('Runtime.evaluate', { expression: `(async()=>{${HELPERS}\n${js}\n})()`, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'Lỗi --js')
    if (r.result?.result?.value !== undefined) console.log(JSON.stringify(r.result.result.value))
  }
  // --js2: chạy sau js khi js làm trang nạp lại (ví dụ đổi hồ sơ); --wait2 là thời gian chờ giữa hai bước
  const js2 = opt('js2', '')
  if (js2) {
    await sleep(+opt('wait2', 3000))
    const r2 = await c.send('Runtime.evaluate', { expression: `(async()=>{${HELPERS}\n${js2}\n})()`, awaitPromise: true, returnByValue: true })
    if (r2.result?.exceptionDetails) throw new Error(r2.result.exceptionDetails.exception?.description ?? 'Lỗi --js2')
    if (r2.result?.result?.value !== undefined) console.log(JSON.stringify(r2.result.result.value))
  }
  await sleep(600)
  const shot = await c.send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(resolve(out), Buffer.from(shot.result.data, 'base64'))
  console.log(resolve(out))
} finally {
  app?.kill()
  await sleep(500)
  rmSync(LOCK, { recursive: true, force: true })
}
