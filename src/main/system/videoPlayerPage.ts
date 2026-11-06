/**
 * Trang máy phát video nhúng YouTube, phục vụ qua giao thức riêng `eaplayer://` (docs/11 §8).
 * Cửa sổ Học tập chạy từ file:// nên YouTube từ chối phát; trang này có origin hợp lệ và được nhúng
 * vào cửa sổ Học tập bằng iframe. Hai bên nói chuyện bằng postMessage (chỉ thời gian/trạng thái phát).
 * File này không import electron để test được bằng Vitest.
 */

export const VIDEO_SCHEME = 'eaplayer'
export const VIDEO_PLAYER_ORIGIN = `${VIDEO_SCHEME}://player`
/** Referer gửi tới YouTube khi nhúng (YouTube từ chối player không có Referer hợp lệ — lỗi 153) */
export const VIDEO_REFERER = 'https://english-assistant.app/'

export const PLAYER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      html, body, #p { margin: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="p"></div>
    <script src="./player.js"></script>
  </body>
</html>
`

export const PLAYER_JS = `(function () {
  var params = new URLSearchParams(location.search)
  var videoId = params.get('v') || ''
  var start = parseInt(params.get('start') || '0', 10) || 0
  var end = parseInt(params.get('end') || '0', 10) || 0
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return
  var player = null
  var timer = 0

  function send(message) {
    parent.postMessage(message, '*')
  }

  function poll() {
    if (!player || !player.getCurrentTime) return
    send({
      source: 'ea-player',
      type: 'time',
      t: player.getCurrentTime(),
      d: player.getDuration ? player.getDuration() : 0
    })
  }

  window.onYouTubeIframeAPIReady = function () {
    var vars = { rel: 0, playsinline: 1, modestbranding: 1, cc_load_policy: 0 }
    if (start) vars.start = start
    if (end) vars.end = end
    player = new YT.Player('p', {
      host: 'https://www.youtube-nocookie.com',
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: vars,
      events: {
        onReady: function () {
          send({ source: 'ea-player', type: 'ready' })
          timer = setInterval(poll, 250)
        },
        onStateChange: function (e) {
          send({ source: 'ea-player', type: 'state', state: e.data })
        },
        onError: function (e) {
          send({ source: 'ea-player', type: 'error', code: e.data })
        }
      }
    })
  }

  window.addEventListener('message', function (e) {
    if (e.source !== parent || !e.data || e.data.target !== 'ea-player' || !player) return
    if (e.data.type === 'play') player.playVideo()
    else if (e.data.type === 'pause') player.pauseVideo()
    else if (e.data.type === 'seek' && typeof e.data.t === 'number') player.seekTo(e.data.t, true)
  })
  window.addEventListener('unload', function () {
    clearInterval(timer)
  })

  var tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
})()
`

/** CSP của trang máy phát: chỉ script của chính nó + API YouTube, chỉ khung YouTube nhúng */
export const PLAYER_CSP = [
  "default-src 'none'",
  "script-src 'self' https://www.youtube.com https://s.ytimg.com",
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
  "style-src 'unsafe-inline'",
  'img-src https://i.ytimg.com data:',
  'connect-src https://www.youtube.com'
].join('; ')

export interface PlayerResource {
  body: string
  contentType: string
}

/** Tài nguyên theo đường dẫn; null nếu không phải trang của máy phát */
export function playerResource(pathname: string): PlayerResource | null {
  if (pathname === '/' || pathname === '/index.html') {
    return { body: PLAYER_HTML, contentType: 'text/html; charset=utf-8' }
  }
  if (pathname === '/player.js') {
    return { body: PLAYER_JS, contentType: 'text/javascript; charset=utf-8' }
  }
  return null
}
