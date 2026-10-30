// Trái cây (kiểu "apple" ở trial.ts: mặt cười, điểm sáng, viền mực, bóng đổ). Khung 256×256, xem kit.ts.
import {
  P,
  TAU,
  cheek,
  ell,
  eye,
  flat,
  line,
  shadow,
  shape,
  smile,
  star,
  tube,
  type Painter
} from '../kit'

/** Mặt trái cây: 2 mắt, má, miệng cười (giống apple). */
function fruitFace(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  gap = 20,
  r = 9,
  s = 1
): void {
  eye(c, x - gap, y, r)
  eye(c, x + gap, y, r)
  cheek(c, x - gap - 16 * s, y + 20 * s, s)
  cheek(c, x + gap + 16 * s, y + 20 * s, s)
  smile(c, x, y + 20 * s, 9 * s)
}

/** Vệt sáng trắng đậm (như quả táo). */
function glint(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot = 0
): void {
  c.fillStyle = 'rgba(255,255,255,.75)'
  c.beginPath()
  c.ellipse(x, y, rx, ry, rot, 0, TAU)
  c.fill()
}

/** Vẽ bên trong khối `p` (vân, hạt, sọc…). */
function inside(c: CanvasRenderingContext2D, p: Path2D, draw: () => void): void {
  c.save()
  c.clip(p)
  draw()
  c.restore()
}

/** Lá nhọn hai đầu từ (x0,y0) tới (x1,y1), bề rộng w, có gân. */
function leaf(
  c: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
  color = '#5cc25b'
): void {
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * w
  const ny = (dx / len) * w
  shape(
    c,
    P(`M${x0} ${y0} Q ${mx + nx} ${my + ny} ${x1} ${y1} Q ${mx - nx} ${my - ny} ${x0} ${y0} Z`),
    color,
    {
      y0: Math.min(y0, y1) - w,
      y1: Math.max(y0, y1) + w,
      lw: 5
    }
  )
  line(
    c,
    `M${x0 + dx * 0.12} ${y0 + dy * 0.12} L ${x0 + dx * 0.78} ${y0 + dy * 0.78}`,
    3,
    '#3f9a3f'
  )
}

/** Ửng màu tròn mờ trong khối (má đào, vỏ xoài). */
function blush(
  c: CanvasRenderingContext2D,
  p: Path2D,
  x: number,
  y: number,
  r: number,
  rgb: string,
  a: number
): void {
  inside(c, p, () => {
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${rgb},${a})`)
    g.addColorStop(1, `rgba(${rgb},0)`)
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
  })
}

const BANANA =
  'M40 96 C 50 226, 206 226, 222 104 C 222 92, 208 90, 204 100 C 186 150, 80 150, 60 96 C 58 84, 42 84, 40 96 Z'

function banana(c: CanvasRenderingContext2D, color: string): void {
  tube(c, 'M48 92 L 36 66', '#9a7a3a', 12)
  shape(c, ell(35, 62, 7, 6, 0.4), '#5a3a2a', { lw: 4 })
  const p = P(BANANA)
  shape(c, p, color, { y0: 90, y1: 200 })
  inside(c, p, () => line(c, 'M50 118 C 80 196, 176 200, 214 118', 4, 'rgba(200,150,20,.45)'))
  shape(c, ell(214, 98, 7, 6, -0.6), '#5a3a2a', { lw: 4 })
}

export const PICTURES: Record<string, Painter> = {
  banana(c) {
    shadow(c, 224, 84)
    // cả nải thu nhỏ, dời vào giữa khung (cuống quả sau chìa sang trái)
    c.save()
    c.translate(128, 142)
    c.scale(0.88, 0.88)
    c.translate(-112, -122)
    c.save()
    c.translate(128, 124)
    c.rotate(-0.38)
    c.translate(-128, -150)
    banana(c, '#f2c832')
    c.restore()
    banana(c, '#ffe14d')
    glint(c, 66, 128, 6, 16, -0.6)
    fruitFace(c, 128, 160, 20, 8, 0.85)
    c.restore()
  },
  mango(c) {
    // nằm ngang, hình hạt đậu (lõm nhẹ ở bụng dưới) để không lẫn với quả lê
    shadow(c, 218, 86)
    const body = P(
      'M52 128 C 72 84, 160 80, 204 108 C 236 130, 226 194, 184 206 C 156 214, 140 198, 116 204 C 80 214, 42 196, 40 166 C 40 150, 44 138, 52 128 Z'
    )
    shape(c, body, '#ffb52e', { y0: 84, y1: 214 })
    blush(c, body, 196, 110, 96, '255,80,60', 0.5)
    blush(c, body, 56, 190, 64, '150,200,60', 0.3)
    glint(c, 92, 110, 24, 8, -0.3)
    tube(c, 'M56 124 L 46 104', '#7a5a3a', 8)
    leaf(c, 48, 106, 118, 70, 15)
    fruitFace(c, 142, 152)
  },
  watermelon(c) {
    shadow(c, 202, 96)
    c.save()
    c.translate(0, -6)
    shape(c, P('M18 94 L 238 94 A 110 110 0 0 1 18 94 Z'), '#3fa34d', { y0: 94, y1: 204 })
    flat(c, P('M30 97 L 226 97 A 98 98 0 0 1 30 97 Z'), '#d6f2a8')
    const flesh = P('M40 97 L 216 97 A 88 88 0 0 1 40 97 Z')
    shape(c, flesh, '#f2445a', { y0: 94, y1: 186, lw: 4 })
    glint(c, 70, 112, 20, 6, 0.2)
    for (const [x, y, rot] of [
      [70, 128, 0.5],
      [186, 128, -0.5],
      [92, 158, 0.3],
      [164, 158, -0.3],
      [128, 176, 0],
      [104, 112, 0.2],
      [152, 112, -0.2]
    ]) {
      c.fillStyle = '#3b2a3a'
      c.beginPath()
      c.ellipse(x, y, 3.5, 6, rot, 0, TAU)
      c.fill()
    }
    fruitFace(c, 128, 130, 20, 8, 0.9)
    c.restore()
  },
  coconut(c) {
    shadow(c, 230, 96)
    const whole = ell(112, 116, 80, 76)
    shape(c, whole, '#8a5a3a', { y0: 40, y1: 192 })
    inside(c, whole, () => {
      for (let i = 0; i < 46; i++) {
        const a = i * 2.39996
        const rr = 22 + ((i * 37) % 60)
        const x = 112 + Math.cos(a) * rr
        const y = 116 + Math.sin(a) * rr * 0.95
        if (Math.abs(x - 112) < 44 && y > 100 && y < 150) continue
        const col = i % 2 ? '#5e3b26' : '#b07a4f'
        line(c, `M${x} ${y} l ${Math.cos(a + 1.2) * 9} ${Math.sin(a + 1.2) * 9}`, 3, col)
      }
    })
    glint(c, 70, 78, 18, 8, -0.6)
    for (const [x, y] of [
      [98, 58],
      [116, 52],
      [130, 62]
    ])
      flat(c, ell(x, y, 5, 4), '#4a2e1e')
    fruitFace(c, 112, 118, 20, 9)
    // nửa quả bổ đôi phía trước
    shape(c, P('M128 184 A 52 46 0 0 0 232 184 Z'), '#7a4c30', { y0: 184, y1: 232 })
    line(c, 'M150 204 l 6 6 M176 214 l 4 8 M204 204 l -4 8', 3, '#5e3b26')
    shape(c, ell(180, 184, 52, 18), '#fffaf0', { y0: 166, y1: 202 })
    shape(c, ell(180, 185, 38, 11), '#f1e4c8', { lw: 3 })
  },
  pineapple(c) {
    shadow(c, 234, 60)
    leaf(c, 128, 104, 82, 40, 14, '#4caf50')
    leaf(c, 128, 104, 174, 40, 14, '#4caf50')
    leaf(c, 128, 104, 100, 26, 13, '#6ccf5a')
    leaf(c, 128, 104, 156, 26, 13, '#6ccf5a')
    leaf(c, 128, 104, 128, 14, 14, '#5cc25b')
    const body = ell(128, 164, 64, 70)
    shape(c, body, '#ffbf2e', { y0: 94, y1: 234 })
    inside(c, body, () => {
      for (let k = -6; k <= 6; k++) {
        const x = 128 + k * 26
        line(c, `M${x - 80} 84 L ${x + 80} 244`, 4, '#d9861a')
        line(c, `M${x + 80} 84 L ${x - 80} 244`, 4, '#d9861a')
      }
      // tâm mỗi ô thoi (giao điểm hai họ đường ở x = 168 + 13m, y = 124 + 13n với m + n chẵn)
      for (let m = -10; m <= 4; m++)
        for (let n = -4; n <= 10; n++) {
          if (Math.abs(m + n) % 2 === 0) continue
          flat(c, ell(168 + 13 * m, 124 + 13 * n, 2.6, 2.6), '#a85f12')
        }
      c.fillStyle = 'rgba(255,255,255,.5)'
      c.beginPath()
      c.ellipse(92, 132, 10, 24, -0.4, 0, TAU)
      c.fill()
    })
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.stroke(body)
    fruitFace(c, 128, 168)
  },
  orange(c) {
    shadow(c, 230, 66)
    const body = ell(128, 142, 82, 80)
    shape(c, body, '#ff9a1f', { y0: 62, y1: 222 })
    for (let i = 0; i < 40; i++) {
      const a = i * 2.39996
      const rr = 14 + ((i * 29) % 64)
      const x = 128 + Math.cos(a) * rr
      const y = 142 + Math.sin(a) * rr
      if (Math.abs(x - 128) < 50 && y > 134 && y < 184) continue
      flat(c, ell(x, y, 2.4, 2.4), 'rgba(200,90,0,.35)')
    }
    glint(c, 84, 112, 11, 22, -0.5)
    shape(c, star(128, 64, 9, 5, 5), '#7a9e3a', { lw: 3 })
    tube(c, 'M128 64 L 130 54', '#7a5a3a', 6)
    leaf(c, 132, 56, 186, 36, 14)
    fruitFace(c, 128, 150)
  },
  grapes(c) {
    shadow(c, 234, 52)
    tube(c, 'M128 76 Q 126 54 138 40', '#8a5a3a', 8)
    leaf(c, 130, 58, 66, 40, 18)
    for (const [x, y] of [
      [86, 92],
      [128, 86],
      [170, 92],
      [64, 132],
      [192, 132],
      [86, 172],
      [170, 172],
      [108, 208],
      [148, 208]
    ])
      shape(c, ell(x, y, 25, 25), '#8e5bd6', {
        y0: y - 25,
        y1: y + 25,
        lw: 5,
        gloss: [x - 9, y - 10, 7, 5, -0.5]
      })
    shape(c, ell(128, 148, 44, 42), '#9b6ae0', { y0: 106, y1: 190, gloss: [104, 124, 10, 6, -0.6] })
    fruitFace(c, 128, 146, 17, 8, 0.8)
  },
  lemon(c) {
    shadow(c, 216, 80)
    c.save()
    c.translate(128, 136)
    c.rotate(-0.22)
    c.translate(-128, -136)
    leaf(c, 206, 108, 238, 62, 12)
    const body = P(
      'M26 136 Q 38 124 54 118 C 78 66, 178 66, 202 118 Q 218 124 230 136 Q 218 148 202 154 C 178 206, 78 206, 54 154 Q 38 148 26 136 Z'
    )
    shape(c, body, '#ffe03a', { y0: 80, y1: 194 })
    for (const [x, y] of [
      [70, 116],
      [180, 112],
      [190, 156],
      [64, 160],
      [96, 178],
      [160, 178],
      [128, 96]
    ])
      flat(c, ell(x, y, 2.4, 2.4), 'rgba(200,150,0,.4)')
    glint(c, 86, 108, 24, 8, -0.3)
    c.restore()
    fruitFace(c, 128, 132, 20, 9, 0.9)
  },
  peach(c) {
    shadow(c, 230, 66)
    const body = P(
      'M128 76 C 112 58, 54 64, 48 128 C 42 186, 92 222, 128 222 C 164 222, 214 186, 208 128 C 202 64, 144 58, 128 76 Z'
    )
    shape(c, body, '#ffbd8a', { y0: 64, y1: 222 })
    blush(c, body, 176, 110, 100, '255,80,110', 0.55)
    inside(c, body, () => line(c, 'M126 78 C 94 102, 82 150, 94 200', 5, '#e8806a'))
    glint(c, 80, 112, 10, 20, -0.4)
    tube(c, 'M128 76 L 126 58', '#7a5a3a', 7)
    leaf(c, 128, 60, 74, 36, 14)
    leaf(c, 128, 60, 174, 40, 13, '#6ccf5a')
    fruitFace(c, 144, 148, 18)
  }
}
