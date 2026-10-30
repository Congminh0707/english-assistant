// Phần Electron của vector-sheet.mjs: mở trang bảng tổng hợp ẩn, chụp ra PNG rồi thoát.
//   electron vector-sheet-capture.cjs <sheet.html> <out.png> <userDataTmp>
/* eslint-disable @typescript-eslint/no-require-imports -- Electron chạy file CommonJS này trực tiếp */
const { app, BrowserWindow } = require('electron')
const { writeFileSync } = require('node:fs')

const [page, out, userData] = process.argv.slice(-3)
app.setPath('userData', userData)
app.disableHardwareAcceleration()

const fail = (e) => {
  console.error(e)
  app.exit(1)
}
setTimeout(() => fail(new Error('Quá 60 s')), 60_000)

app
  .whenReady()
  .then(async () => {
    const win = new BrowserWindow({ show: false, width: 1300, height: 800 })
    await win.loadFile(page)
    const size = await win.webContents.executeJavaScript(
      '({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, n: window.__count, err: window.__err })'
    )
    if (size.err) console.error(size.err)
    win.setContentSize(Math.max(size.w, 300), Math.max(size.h, 200))
    await new Promise((r) => setTimeout(r, 500))
    const img = await win.webContents.capturePage()
    writeFileSync(out, img.toPNG())
    console.log(`${size.n} hình → ${out}`)
    app.exit(0)
  })
  .catch(fail)
