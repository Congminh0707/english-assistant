import { app, session } from 'electron'

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

/** Trang của chính app (bản đóng gói: file://, dev: máy chủ electron-vite) */
function isOwnPage(url: string): boolean {
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  return url.startsWith('file://') || (!!devUrl && url.startsWith(devUrl))
}

/**
 * Quyền thiết bị: CHỈ cho micro (không camera/màn hình) và CHỈ cho trang của app — phục vụ bài nói
 * (docs/16-privacy-and-security.md). Mọi quyền khác bị từ chối. Âm thanh ghi chỉ ở trong bộ nhớ, không lưu/không log.
 */
export function applyPermissionPolicy(): void {
  const ses = session.defaultSession
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    const types = (details as { mediaTypes?: string[] }).mediaTypes ?? []
    const audioOnly = types.length > 0 && types.every((t) => t === 'audio')
    callback(permission === 'media' && audioOnly && isOwnPage(contents.getURL()))
  })
  ses.setPermissionCheckHandler((contents, permission, origin, details) => {
    const type = (details as { mediaType?: string }).mediaType
    return permission === 'media' && type === 'audio' && (isOwnPage(origin) || !contents)
  })
}
