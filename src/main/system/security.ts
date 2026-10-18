import { app } from 'electron'

/** Chặn mở cửa sổ mới và điều hướng ra ngoài app cho mọi cửa sổ (docs/16-privacy-and-security.md#4) */
export function applySecurityDefaults(): void {
  app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
    contents.on('will-navigate', (event, url) => {
      const devUrl = process.env['ELECTRON_RENDERER_URL']
      if (devUrl && url.startsWith(devUrl)) return
      event.preventDefault()
    })
  })
}
