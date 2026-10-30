// Hình quần áo & đồ dùng (hat, glasses, tshirt, dress, shoe, socks, backpack, watch, headphones, camera).
// Khung 256×256, xem kit.ts. Đồ vật không có mặt.
import {
  INK,
  P,
  TAU,
  circle,
  ell,
  flat,
  line,
  rrect,
  shadow,
  shape,
  star,
  tube,
  type Painter
} from '../kit'

/** Một chiếc tất (cổ trên, bàn chân quay phải), dời (dx, dy). */
function sock(
  c: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  color: string,
  dark: string
): void {
  c.save()
  c.translate(dx, dy)
  const body = P(
    'M62 50 L 116 50 L 116 140 Q 116 154 128 160 L 156 174 Q 178 186 170 206 Q 160 226 136 216 L 80 190 Q 62 180 62 160 Z'
  )
  shape(c, body, color, { y0: 50, y1: 220 })
  c.save()
  c.clip(body)
  flat(c, ell(160, 204, 26, 24), dark)
  flat(c, ell(66, 186, 24, 24), dark)
  for (const y of [86, 106, 126])
    flat(c, P(`M50 ${y} L 130 ${y} L 130 ${y + 9} L 50 ${y + 9} Z`), '#ffffff')
  c.restore()
  c.lineWidth = 6
  c.strokeStyle = INK
  c.lineJoin = 'round'
  c.stroke(body)
  shape(c, rrect(56, 36, 66, 28, 9), '#ffffff', { lw: 5, y0: 36, y1: 64 })
  line(c, 'M70 42 L 70 58 M82 42 L 82 58 M94 42 L 94 58 M106 42 L 106 58', 3, '#d6dbe4')
  c.restore()
}

export const PICTURES: Record<string, Painter> = {
  hat(c) {
    shadow(c, 222, 98)
    c.save()
    c.translate(0, 14)
    shape(c, ell(128, 164, 112, 36), '#f2c66d', { y0: 128, y1: 200, gloss: [70, 156, 26, 6, -0.1] })
    line(c, 'M40 172 Q 128 206 216 172', 3, '#d9a54a')
    const crown = P('M66 162 C 60 74, 196 74, 190 162 Q 128 180 66 162 Z')
    shape(c, crown, '#f2c66d', { y0: 84, y1: 178, gloss: [100, 108, 20, 9, -0.4] })
    c.save()
    c.clip(crown)
    shape(c, P('M60 130 Q 128 118 196 130 L 196 156 Q 128 168 60 156 Z'), '#ff6b8a', {
      y0: 120,
      y1: 166,
      line: false
    })
    line(c, 'M60 130 Q 128 118 196 130', 5)
    line(c, 'M60 156 Q 128 168 196 156', 5)
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(crown)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU
      shape(c, ell(174 + Math.cos(a) * 9, 142 + Math.sin(a) * 9, 8, 8), '#ffffff', { lw: 3 })
    }
    shape(c, ell(174, 142, 6, 6), '#ffd23f', { lw: 3 })
    c.restore()
  },
  glasses(c) {
    shadow(c, 192, 84)
    tube(c, 'M44 114 Q 28 100 18 106', '#9b6cff', 9)
    tube(c, 'M212 114 Q 228 100 238 106', '#9b6cff', 9)
    for (const x of [80, 176]) {
      shape(c, circle(x, 130, 40), '#d6f0ff', { line: false, y0: 90, y1: 170 })
      c.fillStyle = 'rgba(255,255,255,.8)'
      c.save()
      c.clip(circle(x, 130, 40))
      c.beginPath()
      c.ellipse(x - 14, 116, 9, 26, 0.6, 0, TAU)
      c.fill()
      c.beginPath()
      c.ellipse(x + 8, 108, 4, 12, 0.6, 0, TAU)
      c.fill()
      c.restore()
      tube(c, circle(x, 130, 40), '#9b6cff', 12)
    }
    tube(c, 'M114 124 Q 128 110 142 124', '#9b6cff', 9)
  },
  tshirt(c) {
    shadow(c, 234, 84)
    const shirt = P(
      'M94 50 Q 128 72 162 50 L 214 74 Q 226 80 222 92 L 206 126 Q 200 136 190 132 L 180 128 L 180 212 Q 180 222 170 222 L 86 222 Q 76 222 76 212 L 76 128 L 66 132 Q 56 136 50 126 L 34 92 Q 30 80 42 74 Z'
    )
    shape(c, shirt, '#45b3f7', { y0: 50, y1: 222, gloss: [96, 92, 18, 8, -0.3] })
    line(c, 'M180 128 L 186 104', 4, '#2f86d6')
    line(c, 'M76 128 L 70 104', 4, '#2f86d6')
    tube(c, 'M96 52 Q 128 78 160 52', '#ffd23f', 8)
    shape(c, star(128, 150, 30, 14), '#ffd23f', { lw: 5, y0: 120, y1: 180 })
  },
  dress(c) {
    shadow(c, 234, 92)
    shape(c, ell(84, 78, 22, 17, -0.3), '#ff9ec4', { y0: 60, y1: 96 })
    shape(c, ell(172, 78, 22, 17, 0.3), '#ff9ec4', { y0: 60, y1: 96 })
    const skirt = P(
      'M94 120 L 162 120 Q 194 168 216 210 Q 222 220 210 222 Q 128 236 46 222 Q 34 220 40 210 Q 62 168 94 120 Z'
    )
    shape(c, skirt, '#ff7aa8', { y0: 120, y1: 230 })
    c.save()
    c.clip(skirt)
    for (const [x, y] of [
      [100, 150],
      [150, 156],
      [76, 196],
      [124, 190],
      [176, 196]
    ])
      flat(c, circle(x, y, 7), 'rgba(255,255,255,.75)')
    flat(c, P('M30 206 Q 128 222 226 206 L 226 240 L 30 240 Z'), '#ffffff')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(skirt)
    line(c, 'M40 208 Q 128 224 216 208', 4)
    shape(c, P('M92 66 Q 128 92 164 66 L 164 124 L 92 124 Z'), '#ff7aa8', {
      y0: 66,
      y1: 124,
      gloss: [108, 96, 8, 14]
    })
    shape(c, rrect(86, 114, 84, 16, 8), '#ffffff', { lw: 5 })
    shape(c, P('M128 122 L 104 108 Q 98 122 104 136 Z'), '#ffd23f', { lw: 4 })
    shape(c, P('M128 122 L 152 108 Q 158 122 152 136 Z'), '#ffd23f', { lw: 4 })
    shape(c, circle(128, 122, 7), '#ffd23f', { lw: 4 })
  },
  shoe(c) {
    shadow(c, 216, 104)
    const upper = P(
      'M36 180 L 40 110 Q 42 94 58 94 L 92 96 Q 104 120 130 122 L 172 128 Q 222 140 226 180 Z'
    )
    shape(c, upper, '#ef4444', { y0: 94, y1: 180, gloss: [176, 140, 26, 6, 0.15] })
    c.save()
    c.clip(upper)
    flat(c, P('M180 110 Q 196 150 182 190 L 240 190 L 240 110 Z'), '#ff8a8a')
    shape(c, star(90, 150, 16, 7), '#ffd23f', { lw: 4 })
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(upper)
    shape(c, P('M92 100 Q 96 84 110 84 Q 120 94 118 118 Q 102 116 92 100 Z'), '#ff8a8a', {
      lw: 5,
      y0: 74,
      y1: 120
    })
    flat(c, ell(64, 102, 22, 7), 'rgba(59,42,58,.85)')
    for (const [x, y] of [
      [114, 130],
      [136, 136],
      [158, 142]
    ])
      tube(c, `M${x - 6} ${y + 8} L ${x + 6} ${y - 8}`, '#ffffff', 5)
    shape(
      c,
      P(
        'M28 178 L 230 178 Q 234 178 232 188 Q 230 200 220 200 L 38 200 Q 26 200 26 188 Q 26 178 28 178 Z'
      ),
      '#f4f4f4',
      {
        lw: 6,
        y0: 178,
        y1: 200
      }
    )
    line(c, 'M44 190 L 214 190', 3, '#c9ced6')
  },
  socks(c) {
    shadow(c, 230, 92)
    sock(c, 54, -10, '#45b3f7', '#2f86d6')
    sock(c, 4, 4, '#45b3f7', '#2f86d6')
  },
  backpack(c) {
    shadow(c, 234, 86)
    tube(c, 'M104 62 Q 104 34 128 34 Q 152 34 152 62', '#2f86d6', 10)
    tube(c, 'M66 92 Q 42 146 62 206', '#2f86d6', 12)
    tube(c, 'M190 92 Q 214 146 194 206', '#2f86d6', 12)
    shape(c, rrect(58, 56, 140, 170, 42), '#45b3f7', {
      y0: 56,
      y1: 226,
      gloss: [92, 80, 20, 8, -0.4]
    })
    shape(c, P('M58 112 Q 58 64 128 62 Q 198 64 198 112 Q 128 126 58 112 Z'), '#ffd23f', {
      y0: 62,
      y1: 124
    })
    shape(c, rrect(118, 104, 20, 26, 6), '#f4f4f4', { lw: 4 })
    shape(c, rrect(80, 148, 96, 66, 22), '#2f86d6', { y0: 148, y1: 214 })
    line(c, 'M92 166 L 164 166', 4, '#1d5fa0')
    shape(c, rrect(150, 160, 10, 22, 5), '#ffd23f', { lw: 3 })
  },
  watch(c) {
    shape(c, rrect(98, 14, 60, 228, 22), '#38c6a8', { y0: 14, y1: 242 })
    for (const y of [32, 216, 228]) flat(c, circle(128, y, 4), INK)
    shape(c, rrect(92, 188, 72, 14, 6), '#2a9c84', { lw: 4 })
    shape(c, rrect(188, 116, 18, 24, 6), '#ffd23f', { lw: 5 })
    shape(c, circle(128, 128, 64), '#ffd23f', { y0: 64, y1: 192, gloss: [96, 86, 14, 8, -0.6] })
    shape(c, circle(128, 128, 48), '#ffffff', { lw: 5, y0: 80, y1: 176 })
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU
      const r0 = i % 3 === 0 ? 34 : 38
      line(
        c,
        `M${128 + Math.cos(a) * r0} ${128 + Math.sin(a) * r0} L ${128 + Math.cos(a) * 42} ${128 + Math.sin(a) * 42}`,
        i % 3 === 0 ? 5 : 3
      )
    }
    line(c, 'M128 128 L 108 112', 7)
    line(c, 'M128 128 L 156 106', 5)
    shape(c, circle(128, 128, 6), '#ef4444', { lw: 3 })
  },
  headphones(c) {
    shadow(c, 228, 92)
    tube(c, 'M62 150 C 50 40, 206 40, 194 150', '#9b6cff', 18)
    line(c, 'M78 78 Q 128 42 178 78', 4, 'rgba(255,255,255,.55)')
    for (const s of [-1, 1]) {
      const x = 128 + s * 76
      shape(c, rrect(x - 8 - s * 6 - 9, 140, 18, 66, 9), '#ffb3d1', { lw: 5, y0: 140, y1: 206 })
      shape(c, rrect(x - 22 + s * 8, 126, 44, 92, 22), '#9b6cff', {
        y0: 126,
        y1: 218,
        gloss: [x - 8 + s * 8, 146, 6, 14]
      })
      shape(c, ell(x + s * 8, 172, 10, 22), '#ffd23f', { lw: 4 })
    }
  },
  camera(c) {
    shadow(c, 228, 100)
    shape(c, rrect(72, 62, 66, 34, 10), '#3d3d4f', { y0: 62, y1: 96 })
    shape(c, rrect(160, 68, 32, 20, 7), '#ef4444', { lw: 5 })
    shape(c, rrect(32, 84, 192, 132, 26), '#7cc7ff', {
      y0: 84,
      y1: 216,
      gloss: [72, 100, 26, 7, -0.1]
    })
    flat(c, P('M35 130 L 221 130 L 221 172 L 35 172 Z'), '#3d3d4f')
    line(c, 'M32 130 L 224 130 M32 172 L 224 172', 5)
    shape(c, rrect(180, 98, 28, 20, 6), '#fff3b0', { lw: 4 })
    shape(c, circle(128, 150, 52), '#c9ced6', { y0: 98, y1: 202 })
    shape(c, circle(128, 150, 36), '#3d3d4f', { lw: 5, y0: 114, y1: 186 })
    flat(c, circle(128, 150, 22), '#5a6b8c')
    flat(c, ell(116, 138, 10, 7, -0.6), 'rgba(255,255,255,.85)')
    flat(c, circle(140, 162, 4), 'rgba(255,255,255,.7)')
  }
}
