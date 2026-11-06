import { protocol, session } from 'electron'
import { PLAYER_CSP, playerResource, VIDEO_REFERER, VIDEO_SCHEME } from './videoPlayerPage'

/** Phải gọi TRƯỚC khi app ready */
export function registerVideoScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: VIDEO_SCHEME, privileges: { standard: true, secure: true } }
  ])
}

/**
 * Phục vụ trang máy phát `eaplayer://player/*` và gắn Referer hợp lệ cho các yêu cầu nhúng YouTube.
 * Chỉ trang nhúng (embed) mới bị gắn Referer; không đụng tới mọi yêu cầu mạng khác.
 */
export function installVideoPlayer(): void {
  protocol.handle(VIDEO_SCHEME, (request) => {
    const url = new URL(request.url)
    const res = url.hostname === 'player' ? playerResource(url.pathname) : null
    if (!res) return new Response('Not found', { status: 404 })
    return new Response(res.body, {
      headers: { 'content-type': res.contentType, 'content-security-policy': PLAYER_CSP }
    })
  })
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://www.youtube-nocookie.com/embed/*', 'https://www.youtube.com/embed/*'] },
    (details, callback) => {
      callback({ requestHeaders: { ...details.requestHeaders, Referer: VIDEO_REFERER } })
    }
  )
}
