// Đồ ăn vặt & món quen thuộc (pizza, hamburger, đồ uống, trái cây cắt…). Món ăn có mặt dễ thương (như apple).
// Khung 256×256, xem kit.ts.
import {
  INK,
  LW,
  P,
  TAU,
  cheek,
  circle,
  ell,
  eye,
  flat,
  line,
  mix,
  rrect,
  shadow,
  shape,
  smile,
  star,
  tube,
  type Painter
} from '../kit'

/** Mặt nhỏ: hai mắt, má, miệng cười — tâm (x, y). */
function cute(c: CanvasRenderingContext2D, x: number, y: number, gap = 20, r = 8, s = 0.85): void {
  eye(c, x - gap, y, r)
  eye(c, x + gap, y, r)
  cheek(c, x - gap - 12, y + 16, s)
  cheek(c, x + gap + 12, y + 16, s)
  smile(c, x, y + 14, 8)
}

/** Vẽ trong hệ trục xoay góc `a` quanh (cx, cy). */
function turned(
  c: CanvasRenderingContext2D,
  a: number,
  cx: number,
  cy: number,
  draw: () => void
): void {
  c.save()
  c.translate(cx, cy)
  c.rotate(a)
  c.translate(-cx, -cy)
  draw()
  c.restore()
}

/** Vẽ bên trong khối `p` (vân, sọc, hạt…). */
function inside(c: CanvasRenderingContext2D, p: Path2D, draw: () => void): void {
  c.save()
  c.clip(p)
  draw()
  c.restore()
}

/** Vệt sáng trắng đậm. */
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

/** Khối gộp từ nhiều hình tròn [x, y, r] — chỉ viền ngoài (lá rau, bỏng ngô). */
function blob(c: CanvasRenderingContext2D, dots: number[][], color: string, lw = LW): Path2D {
  const p = new Path2D()
  let top = 256
  let bottom = 0
  for (const [x, y, r] of dots) {
    p.moveTo(x + r, y)
    p.arc(x, y, r, 0, TAU)
    top = Math.min(top, y - r)
    bottom = Math.max(bottom, y + r)
  }
  c.lineJoin = 'round'
  c.lineWidth = lw * 2
  c.strokeStyle = INK
  c.stroke(p)
  const g = c.createLinearGradient(0, top, 0, bottom)
  g.addColorStop(0, mix(color, 0.25))
  g.addColorStop(0.5, color)
  g.addColorStop(1, mix(color, -0.15))
  c.fillStyle = g
  c.fill(p)
  return p
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
    { y0: Math.min(y0, y1) - w, y1: Math.max(y0, y1) + w, lw: 5 }
  )
  line(
    c,
    `M${x0 + dx * 0.12} ${y0 + dy * 0.12} L ${x0 + dx * 0.78} ${y0 + dy * 0.78}`,
    3,
    '#3f9a3f'
  )
}

/** Hơi nóng bốc lên (nét lượn). */
function steam(c: CanvasRenderingContext2D, xs: number[], y0: number, y1: number): void {
  const m = (y0 + y1) / 2
  for (const x of xs) {
    const d = `M${x} ${y0} Q ${x - 11} ${(y0 + m) / 2} ${x} ${m} Q ${x + 11} ${(m + y1) / 2} ${x} ${y1}`
    line(c, d, 12, INK)
    line(c, d, 6, '#eef3f9')
  }
}

/** Cốm rắc nhiều màu (que nhỏ bo tròn) tại [x, y, góc]. */
function sprinkles(c: CanvasRenderingContext2D, list: number[][]): void {
  const colors = ['#ff6b8a', '#5ab0f0', '#ffd36b', '#7cd05a', '#ffffff', '#b98cf0']
  list.forEach(([x, y, a], i) =>
    turned(c, a, x, y, () =>
      shape(c, rrect(x - 7, y - 3, 14, 6, 3), colors[i % colors.length], { lw: 2.5 })
    )
  )
}

/** Hình elip có lỗ (bánh donut) — viền ngoài gợn sóng biên độ `amp`, `k` gợn. */
function ring(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  hcy: number,
  hx: number,
  hy: number,
  amp = 0,
  k = 0
): Path2D {
  const p = new Path2D()
  const n = 96
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU
    const w = 1 + amp * Math.sin(a * k)
    const x = cx + Math.cos(a) * rx * w
    const y = cy + Math.sin(a) * ry * w
    if (i === 0) p.moveTo(x, y)
    else p.lineTo(x, y)
  }
  p.closePath()
  p.moveTo(cx + hx, hcy)
  p.ellipse(cx, hcy, hx, hy, 0, TAU, 0, true)
  p.closePath()
  return p
}

export const PICTURES: Record<string, Painter> = {
  pizza(c) {
    shadow(c, 234, 44)
    const cheese = P('M44 74 Q 128 56 212 74 L 134 222 Q 128 232 122 222 Z')
    shape(c, cheese, '#ffd24a', { y0: 60, y1: 226, gloss: [96, 104, 22, 8, -0.4] })
    for (const [x, y, r] of [
      [84, 96, 14],
      [174, 98, 13],
      [128, 170, 13]
    ]) {
      shape(c, circle(x, y, r), '#e2463e', { lw: 4, gloss: [x - 4, y - 5, 4, 3] })
      flat(c, circle(x + 4, y + 3, 2.5), '#b02a2a')
      flat(c, circle(x - 5, y + 4, 2), '#b02a2a')
    }
    flat(c, ell(150, 140, 5, 3, 0.4), '#5cc25b')
    flat(c, ell(106, 140, 5, 3, -0.6), '#5cc25b')
    // vỏ bánh
    shape(
      c,
      P('M30 72 Q 128 30 226 72 Q 234 90 216 94 Q 128 64 40 94 Q 22 90 30 72 Z'),
      '#e39a48',
      { y0: 40, y1: 96, gloss: [80, 62, 22, 5, -0.25] }
    )
    cute(c, 128, 118, 17, 7)
  },
  hamburger(c) {
    shadow(c, 224, 98)
    shape(c, P('M40 172 L 216 172 Q 220 214 180 214 L 76 214 Q 36 214 40 172 Z'), '#e89a48', {
      y0: 172,
      y1: 214
    })
    shape(c, rrect(30, 146, 196, 32, 16), '#7a4a2e', {
      y0: 146,
      y1: 178,
      gloss: [80, 154, 26, 4, 0]
    })
    shape(
      c,
      P(
        'M32 138 L 224 138 L 224 150 L 200 150 L 188 172 L 176 150 L 96 150 L 82 174 L 68 150 L 32 150 Z'
      ),
      '#ffcf3a',
      { y0: 138, y1: 174, lw: 4 }
    )
    let d = 'M28 124 L 228 124 Q 238 132 228 142'
    for (let x = 228; x > 28; x -= 25) d += ` Q ${x - 12.5} 156 ${x - 25} 142`
    d += ' Q 18 132 28 124 Z'
    shape(c, P(d), '#6cc24a', { y0: 124, y1: 154, lw: 5 })
    const bun = P(
      'M30 126 Q 26 38 128 36 Q 230 38 226 126 Q 226 134 218 134 L 38 134 Q 30 134 30 126 Z'
    )
    shape(c, bun, '#f0a24e', { y0: 36, y1: 134, gloss: [84, 62, 28, 10, -0.35] })
    for (const [x, y, a] of [
      [92, 58, -0.5],
      [120, 48, 0.2],
      [150, 50, -0.2],
      [178, 62, 0.5],
      [64, 88, -0.9],
      [196, 90, 0.9],
      [136, 70, 0.1]
    ])
      shape(c, ell(x, y, 6, 3.5, a), '#fff3d0', { lw: 2.5 })
    cute(c, 128, 100, 22, 8)
  },
  coffee(c) {
    shadow(c, 222, 100)
    steam(c, [100, 128, 156], 82, 22)
    shape(c, ell(128, 200, 106, 20), '#ffffff', { y0: 180, y1: 220 })
    shape(c, ell(128, 196, 64, 10), '#e4ebf4', { lw: 3 })
    tube(c, 'M192 122 Q 234 118 230 148 Q 226 178 186 172', '#f2645a', 12)
    const cup = P('M54 104 L 202 104 Q 200 176 160 192 Q 128 200 96 192 Q 56 176 54 104 Z')
    shape(c, cup, '#f2645a', { y0: 104, y1: 198, gloss: [80, 142, 8, 24, 0] })
    shape(c, ell(128, 104, 74, 15), '#f2645a', { y0: 88, y1: 120, lw: 5 })
    shape(c, ell(128, 106, 64, 10), '#7a4a2e', { y0: 96, y1: 116, lw: 3 })
    flat(
      c,
      P(
        'M128 113 C 114 106, 116 98, 123 99 Q 128 100 128 104 Q 128 100 133 99 C 140 98, 142 106, 128 113 Z'
      ),
      '#e8c49a'
    )
    cute(c, 128, 144)
  },
  tea(c) {
    shadow(c, 228, 84)
    steam(c, [110, 146], 76, 26)
    tube(c, 'M66 120 Q 22 116 26 148 Q 30 178 72 172', '#d6e8f4', 11)
    const glass = P('M56 92 L 200 92 L 190 202 Q 186 222 166 222 L 90 222 Q 70 222 66 202 Z')
    c.fillStyle = 'rgba(214,236,252,.55)'
    c.fill(glass)
    inside(c, glass, () => {
      shape(c, P('M40 118 L 216 118 L 216 232 L 40 232 Z'), '#e88a2a', {
        y0: 118,
        y1: 222,
        line: false
      })
      flat(c, ell(128, 118, 72, 8), '#f6b45a')
      flat(c, rrect(70, 100, 12, 110, 6), 'rgba(255,255,255,.5)')
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(glass)
    flat(c, ell(128, 92, 72, 11), 'rgba(235,246,255,.8)')
    c.lineWidth = 5
    c.stroke(ell(128, 92, 72, 11))
    // dây túi trà + nhãn
    line(c, 'M156 118 L 172 92 Q 180 82 188 94 L 206 130', 3, INK)
    shape(c, rrect(192, 128, 32, 36, 5), '#ffffff', { lw: 4 })
    flat(c, ell(208, 146, 9, 5, -0.7), '#5cc25b')
    // lát chanh trên miệng cốc
    shape(c, circle(70, 88, 20), '#ffe14d', { lw: 5 })
    flat(c, circle(70, 88, 14), '#fff6a8')
    line(c, 'M70 75 L 70 101 M57 88 L 83 88 M61 79 L 79 97 M79 79 L 61 97', 2.5, '#f2c832')
    cute(c, 128, 166, 18, 8)
  },
  cheese(c) {
    shadow(c, 220, 104)
    const top = P('M28 132 L 172 54 Q 188 46 200 58 L 230 122 Z')
    shape(c, top, '#ffe16b', { y0: 50, y1: 132, gloss: [120, 96, 30, 6, -0.45] })
    inside(c, top, () => {
      flat(c, ell(150, 92, 11, 5, -0.2), '#e8a51a')
      flat(c, ell(104, 112, 8, 4, -0.2), '#e8a51a')
      flat(c, ell(196, 74, 7, 3.5, 0), '#e8a51a')
    })
    const front = P('M28 132 L 230 122 L 230 196 Q 230 206 220 206 L 38 210 Q 28 210 28 200 Z')
    shape(c, front, '#ffc93a', { y0: 122, y1: 210 })
    inside(c, front, () => {
      for (const [x, y, r] of [
        [56, 186, 11],
        [198, 152, 14],
        [186, 192, 8],
        [36, 150, 9],
        [230, 186, 12],
        [150, 202, 7]
      ]) {
        flat(c, ell(x, y, r, r * 0.9), '#d98e12')
        flat(c, ell(x + 1, y + 2, r * 0.8, r * 0.65), '#e8a51a')
      }
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(front)
    cute(c, 116, 158, 18, 8)
  },
  icecream(c) {
    shadow(c, 236, 30)
    const cone = P('M70 136 L 186 136 L 134 226 Q 128 234 122 226 Z')
    shape(c, cone, '#eaa75a', { y0: 136, y1: 230 })
    inside(c, cone, () => {
      for (let i = -6; i <= 6; i++) {
        line(c, `M${70 + i * 22} 130 L ${150 + i * 22} 240`, 3, '#c07a34')
        line(c, `M${186 - i * 22} 130 L ${106 - i * 22} 240`, 3, '#c07a34')
      }
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(cone)
    shape(c, circle(128, 78, 46), '#9a623e', { y0: 32, y1: 124, gloss: [108, 56, 14, 8, -0.5] })
    sprinkles(c, [
      [104, 58, 0.6],
      [130, 44, -0.3],
      [154, 58, 1],
      [94, 80, -0.9],
      [162, 80, 0.4],
      [138, 66, 0.2],
      [116, 72, 1.3]
    ])
    const scoop = P(
      'M58 134 Q 54 88 128 86 Q 202 88 198 134 Q 192 150 180 140 Q 172 162 156 144 Q 142 160 128 146 Q 114 162 100 144 Q 86 162 76 140 Q 64 150 58 134 Z'
    )
    shape(c, scoop, '#ff8fb1', { y0: 86, y1: 160, gloss: [82, 104, 14, 7, -0.4] })
    cute(c, 128, 112, 20, 8)
  },
  jam(c) {
    shadow(c, 230, 92)
    const jar = P(
      'M66 100 L 190 100 Q 206 100 206 120 L 206 198 Q 206 224 180 224 L 76 224 Q 50 224 50 198 L 50 120 Q 50 100 66 100 Z'
    )
    shape(c, jar, '#e2334a', { y0: 100, y1: 224, gloss: [70, 150, 8, 26, 0] })
    glint(c, 70, 186, 5, 7)
    // khăn vải kẻ ô trùm nắp
    const cloth = P(
      'M48 96 Q 40 80 58 70 Q 90 44 128 44 Q 166 44 198 70 Q 216 80 208 96 Q 204 112 192 104 Q 184 118 172 106 Q 162 120 150 108 Q 140 122 128 110 Q 116 122 106 108 Q 94 120 84 106 Q 72 118 64 104 Q 52 112 48 96 Z'
    )
    shape(c, cloth, '#ffffff', { line: false })
    inside(c, cloth, () => {
      for (let v = 20; v < 240; v += 18) {
        flat(c, P(`M${v} 30 L ${v + 9} 30 L ${v + 9} 130 L ${v} 130 Z`), 'rgba(226,51,74,.5)')
        flat(c, P(`M30 ${v} L 230 ${v} L 230 ${v + 9} L 30 ${v + 9} Z`), 'rgba(226,51,74,.5)')
      }
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(cloth)
    tube(c, 'M60 92 Q 128 104 196 92', '#c98a4a', 5)
    // quả dâu bên cạnh
    shape(
      c,
      P('M206 230 C 180 216, 178 186, 192 180 Q 206 174 220 180 C 234 186, 232 216, 206 230 Z'),
      '#ff4a5a',
      {
        y0: 176,
        y1: 230
      }
    )
    for (const [x, y] of [
      [196, 194],
      [214, 192],
      [205, 206],
      [194, 212],
      [216, 210],
      [205, 220]
    ])
      flat(c, ell(x, y, 2, 3), '#ffe680')
    shape(c, star(206, 180, 13, 5, 5), '#5cc25b', { lw: 4 })
    cute(c, 118, 152, 20, 8)
  },
  cherry(c) {
    shadow(c, 228, 94)
    tube(c, 'M92 132 Q 100 82 134 46', '#7a9a3a', 6)
    tube(c, 'M168 142 Q 158 94 134 46', '#7a9a3a', 6)
    leaf(c, 136, 46, 200, 52, 16)
    shape(c, ell(134, 46, 7, 6), '#5a7a2a', { lw: 4 })
    for (const [x, y] of [
      [86, 170],
      [170, 178]
    ]) {
      shape(c, circle(x, y, 42), '#e5263f', { y0: y - 42, y1: y + 42 })
      glint(c, x - 22, y - 18, 9, 6, -0.6)
      eye(c, x - 14, y - 2, 7)
      eye(c, x + 14, y - 2, 7)
      cheek(c, x - 24, y + 12, 0.6)
      cheek(c, x + 24, y + 12, 0.6)
      smile(c, x, y + 11, 6)
    }
  },
  pear(c) {
    shadow(c, 230, 76)
    const body = P(
      'M128 50 C 150 50, 156 76, 160 100 C 164 128, 208 142, 206 184 C 204 216, 170 226, 128 226 C 86 226, 52 216, 50 184 C 48 142, 92 128, 96 100 C 100 76, 106 50, 128 50 Z'
    )
    shape(c, body, '#cfe04a', { y0: 50, y1: 226 })
    inside(c, body, () => {
      const g = c.createRadialGradient(186, 196, 0, 186, 196, 70)
      g.addColorStop(0, 'rgba(255,170,60,.45)')
      g.addColorStop(1, 'rgba(255,170,60,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 256, 256)
      for (const [x, y] of [
        [110, 120],
        [150, 140],
        [80, 196],
        [176, 206],
        [128, 90]
      ])
        flat(c, circle(x, y, 2), 'rgba(120,140,40,.5)')
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(body)
    glint(c, 84, 160, 8, 18, 0.3)
    tube(c, 'M128 54 Q 124 38 134 22', '#8a5a3a', 7)
    leaf(c, 134, 32, 186, 24, 14)
    cute(c, 128, 172, 20, 8)
  },
  kiwi(c) {
    shadow(c, 224, 104)
    // quả nguyên phía sau
    const whole = ell(80, 160, 62, 50, -0.3)
    shape(c, whole, '#9a6a3e', { y0: 108, y1: 212, gloss: [58, 136, 16, 7, -0.6] })
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU
      const x = 80 + Math.cos(a) * 64 * Math.cos(-0.3) - Math.sin(a) * 52 * Math.sin(-0.3)
      const y = 160 + Math.cos(a) * 64 * Math.sin(-0.3) + Math.sin(a) * 52 * Math.cos(-0.3)
      line(c, `M${x} ${y} l ${Math.cos(a) * 5} ${Math.sin(a) * 5}`, 2.5, '#6a4428')
    }
    // nửa quả bổ đôi
    const cx = 154
    const cy = 120
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * TAU
      const x = cx + Math.cos(a) * 82
      const y = cy + Math.sin(a) * 78
      line(c, `M${x} ${y} l ${Math.cos(a) * 5} ${Math.sin(a) * 5}`, 2.5, '#6a4428')
    }
    shape(c, ell(cx, cy, 80, 76), '#8a5a34', { y0: 44, y1: 196 })
    const flesh = ell(cx, cy, 70, 66)
    shape(c, flesh, '#6cbf34', { y0: 54, y1: 186, lw: 3 })
    inside(c, flesh, () => {
      const g = c.createRadialGradient(cx, cy, 10, cx, cy, 70)
      g.addColorStop(0, 'rgba(240,250,190,.9)')
      g.addColorStop(0.5, 'rgba(200,236,120,.35)')
      g.addColorStop(1, 'rgba(200,236,120,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU
        line(
          c,
          `M${cx + Math.cos(a) * 30} ${cy + Math.sin(a) * 27} L ${cx + Math.cos(a) * 64} ${cy + Math.sin(a) * 60}`,
          2,
          'rgba(255,255,255,.35)'
        )
      }
    })
    flat(c, ell(cx, cy, 27, 24), '#f4f6d8')
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU + 0.15
      c.fillStyle = INK
      c.beginPath()
      c.ellipse(cx + Math.cos(a) * 40, cy + Math.sin(a) * 37, 2.8, 5, a + Math.PI / 2, 0, TAU)
      c.fill()
    }
    glint(c, 104, 82, 10, 5, -0.7)
    eye(c, cx - 12, cy - 4, 6.5)
    eye(c, cx + 12, cy - 4, 6.5)
    cheek(c, cx - 26, cy + 12, 0.7)
    cheek(c, cx + 26, cy + 12, 0.7)
    smile(c, cx, cy + 9, 6)
  },
  avocado(c) {
    shadow(c, 230, 80)
    const d =
      'M128 28 C 164 28, 172 64, 178 92 C 186 124, 214 146, 212 182 C 210 216, 170 228, 128 228 C 86 228, 46 216, 44 182 C 42 146, 70 124, 78 92 C 84 64, 92 28, 128 28 Z'
    shape(c, P(d), '#3d7a2e', { y0: 28, y1: 228 })
    c.save()
    c.translate(128, 140)
    c.scale(0.86, 0.88)
    c.translate(-128, -140)
    const flesh = P(d)
    shape(c, flesh, '#cfe878', { y0: 28, y1: 228, line: false })
    inside(c, flesh, () => {
      const g = c.createRadialGradient(128, 168, 30, 128, 168, 110)
      g.addColorStop(0, 'rgba(255,246,170,.9)')
      g.addColorStop(1, 'rgba(255,246,170,0)')
      c.fillStyle = g
      c.fillRect(0, 0, 256, 256)
    })
    c.restore()
    glint(c, 92, 90, 7, 16, 0.35)
    shape(c, circle(128, 168, 40), '#9a5a32', { y0: 128, y1: 208, gloss: [112, 148, 12, 8, -0.6] })
    eye(c, 115, 166, 7)
    eye(c, 141, 166, 7)
    cheek(c, 102, 182, 0.65)
    cheek(c, 154, 182, 0.65)
    smile(c, 128, 178, 7)
  },
  sandwich(c) {
    shadow(c, 210, 106)
    const front = P('M24 112 L 232 128 L 232 194 Q 232 200 226 200 L 30 184 Q 24 184 24 178 Z')
    shape(c, front, '#fff1cf', { line: false })
    const band = (t0: number, t1: number, color: string): void =>
      flat(c, P(`M18 ${112 + t0} L 238 ${129 + t0} L 238 ${129 + t1} L 18 ${112 + t1} Z`), color)
    inside(c, front, () => {
      band(0, 5, '#e0a35a')
      band(17, 30, '#6cc24a')
      band(30, 40, '#f2554f')
      band(40, 49, '#ffcf3a')
      band(49, 59, '#ff9aa8')
      band(66, 80, '#e0a35a')
      for (const t of [17, 30, 40, 49, 59])
        line(c, `M18 ${112 + t} L 238 ${129 + t}`, 2.5, 'rgba(59,42,58,.55)')
      for (let x = 30; x < 232; x += 26)
        flat(c, ell(x + 13, 112 + 30 + (x + 13 - 24) * 0.077, 9, 4), '#8ad85e')
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(front)
    // rau xoăn thò ra mép
    shape(c, P('M24 128 Q 10 130 14 138 Q 6 146 20 146 L 26 142 Z'), '#6cc24a', { lw: 4 })
    shape(c, P('M232 144 Q 246 146 242 154 Q 248 162 234 160 L 230 158 Z'), '#6cc24a', { lw: 4 })
    const top = P('M24 112 L 196 40 L 232 128 Z')
    shape(c, top, '#fff1cf', { y0: 40, y1: 128 })
    inside(c, top, () => {
      c.lineWidth = 20
      c.strokeStyle = '#e0a35a'
      c.lineJoin = 'round'
      c.stroke(top)
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(top)
    cute(c, 152, 92, 16, 7, 0.7)
  },
  hotdog(c) {
    shadow(c, 216, 104)
    shape(c, rrect(30, 96, 196, 60, 30), '#f2b462', { y0: 96, y1: 156 })
    shape(c, rrect(14, 116, 228, 42, 21), '#d9583c', {
      y0: 116,
      y1: 158,
      gloss: [60, 124, 26, 4, 0]
    })
    let d = 'M40 130'
    for (let x = 52, i = 0; x <= 216; x += 12, i++) d += ` L ${x} ${i % 2 ? 130 : 120}`
    tube(c, d, '#ffd21a', 5)
    const bun = P(
      'M26 138 Q 28 204 82 206 L 174 206 Q 228 204 230 138 Q 200 156 128 156 Q 56 156 26 138 Z'
    )
    shape(c, bun, '#eaa04a', { y0: 138, y1: 206, gloss: [70, 170, 18, 6, 0.3] })
    cute(c, 128, 176, 20, 7)
  },
  donut(c) {
    shadow(c, 224, 96)
    shape(c, ring(128, 132, 102, 86, 122, 30, 22), '#e8a65a', {
      y0: 46,
      y1: 218,
      gloss: [64, 176, 14, 7, 0.6]
    })
    shape(c, ring(128, 126, 88, 72, 120, 36, 27, 0.045, 9), '#ff8fc0', {
      y0: 50,
      y1: 200,
      gloss: [74, 92, 18, 8, -0.7]
    })
    sprinkles(c, [
      [70, 104, 0.5],
      [96, 72, -0.8],
      [150, 66, 0.3],
      [186, 92, 1.1],
      [200, 132, -0.4],
      [56, 138, 1.2],
      [182, 160, 0.7],
      [76, 162, -1],
      [126, 78, 0],
      [170, 182, 1.4]
    ])
    cute(c, 128, 168, 20, 8)
  },
  chocolate(c) {
    shadow(c, 230, 66)
    c.save()
    c.translate(128, 124)
    c.scale(0.9, 0.9)
    c.rotate(-0.18)
    c.translate(-128, -128)
    shape(c, rrect(72, 34, 112, 120, 12), '#6e4128', { y0: 34, y1: 154 })
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 2; i++)
        shape(c, rrect(82 + i * 48, 44 + j * 44, 44, 38, 6), '#8f5a38', {
          y0: 44 + j * 44,
          y1: 82 + j * 44,
          lw: 3,
          gloss: [92 + i * 48, 52 + j * 44, 8, 4, -0.3]
        })
    shape(
      c,
      P(
        'M68 128 L 80 118 L 92 130 L 104 116 L 118 128 L 132 114 L 146 128 L 160 116 L 174 130 L 188 120 L 188 150 L 68 150 Z'
      ),
      '#c9d2de',
      { y0: 114, y1: 150, lw: 4 }
    )
    const wrap = P('M64 140 L 192 140 L 192 212 Q 192 224 180 224 L 76 224 Q 64 224 64 212 Z')
    shape(c, wrap, '#e2334a', { y0: 140, y1: 224, gloss: [80, 182, 6, 26, 0] })
    inside(c, wrap, () => {
      line(c, 'M60 154 L 196 154', 6, '#ffd36b')
      line(c, 'M60 212 L 196 212', 6, '#ffd36b')
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(wrap)
    cute(c, 128, 180, 18, 7, 0.75)
    c.restore()
  },
  popcorn(c) {
    shadow(c, 228, 80)
    const puff = (x: number, y: number, r: number): void => {
      blob(
        c,
        [
          [x, y, r],
          [x - r * 0.7, y + r * 0.35, r * 0.7],
          [x + r * 0.7, y + r * 0.3, r * 0.7],
          [x + r * 0.1, y + r * 0.7, r * 0.6]
        ],
        '#fff3d6',
        4
      )
      flat(c, ell(x + r * 0.15, y + r * 0.55, r * 0.35, r * 0.22), 'rgba(255,200,80,.7)')
    }
    for (const [x, y, r] of [
      [70, 92, 22],
      [104, 66, 24],
      [140, 56, 25],
      [176, 70, 23],
      [196, 96, 20],
      [120, 92, 22],
      [160, 94, 22]
    ])
      puff(x, y, r)
    const box = P('M58 116 L 198 116 L 180 214 Q 179 220 172 220 L 84 220 Q 77 220 76 214 Z')
    shape(c, box, '#ffffff', { line: false })
    inside(c, box, () => {
      for (let i = -3; i <= 3; i++) {
        const t = 128 + i * 40
        const b = 128 + i * 30
        flat(c, P(`M${t - 10} 100 L ${t + 10} 100 L ${b + 7.5} 230 L ${b - 7.5} 230 Z`), '#ef3b3b')
      }
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(box)
    shape(c, rrect(50, 108, 156, 18, 7), '#ef3b3b', { y0: 108, y1: 126, lw: 5 })
    for (const [x, y, r] of [
      [70, 106, 15],
      [108, 104, 17],
      [150, 106, 16],
      [188, 106, 15]
    ])
      puff(x, y, r)
    puff(30, 204, 11)
    puff(224, 208, 10)
    cute(c, 128, 160, 20, 8)
  },
  pancake(c) {
    shadow(c, 228, 104)
    shape(c, ell(128, 208, 110, 22), '#ffffff', { y0: 186, y1: 230 })
    shape(c, ell(128, 204, 78, 12), '#e4ebf4', { lw: 3 })
    for (const y of [162, 128, 94])
      shape(c, rrect(32, y, 192, 36, 18), '#e8a14a', {
        y0: y,
        y1: y + 36,
        gloss: [64, y + 10, 12, 3, 0]
      })
    shape(c, ell(128, 96, 94, 14), '#f6c27a', { y0: 82, y1: 110, lw: 4 })
    const syrup = P(
      'M44 100 Q 40 82 128 80 Q 216 82 212 100 Q 212 114 204 112 L 204 140 Q 204 150 196 150 Q 188 150 188 140 L 188 116 Q 140 124 62 114 L 62 166 Q 62 174 55 174 Q 48 174 48 166 L 48 110 Q 44 108 44 100 Z'
    )
    shape(c, syrup, '#c8641a', { y0: 80, y1: 174, gloss: [82, 92, 18, 4, -0.1] })
    shape(c, rrect(106, 64, 44, 24, 6), '#ffe27a', { y0: 64, y1: 88, lw: 5 })
    flat(c, rrect(111, 67, 34, 7, 3), '#fff6c4')
    cute(c, 128, 142, 20, 8, 0.75)
  },
  sushi(c) {
    shadow(c, 222, 104)
    // cuộn maki phía sau
    const roll = P('M30 84 L 122 84 L 122 146 Q 122 164 76 164 Q 30 164 30 146 Z')
    shape(c, roll, '#2f4a3a', { y0: 84, y1: 164, gloss: [44, 120, 5, 22, 0] })
    shape(c, ell(76, 84, 46, 18), '#fbfaf2', { y0: 66, y1: 102, lw: 5 })
    flat(c, ell(76, 84, 20, 8), '#ff8a5a')
    flat(c, ell(66, 85, 7, 4), '#7cd05a')
    flat(c, ell(87, 83, 6, 3), '#ffd36b')
    for (const [x, y] of [
      [46, 82],
      [106, 86],
      [76, 70],
      [60, 96],
      [94, 96]
    ])
      flat(c, ell(x, y, 4, 2, 0.4), '#e4dfcc')
    // nigiri cá hồi
    const rice = rrect(84, 150, 148, 56, 28)
    shape(c, rice, '#fbfaf2', { y0: 150, y1: 206 })
    inside(c, rice, () => {
      for (const [x, y, a] of [
        [104, 192, 0.5],
        [134, 196, -0.4],
        [168, 194, 0.8],
        [200, 190, -0.6],
        [120, 182, 1],
        [186, 182, 0.2]
      ])
        flat(c, ell(x, y, 6, 3, a), '#e4dfcc')
    })
    const fish = P(
      'M74 158 Q 70 120 120 116 L 200 112 Q 240 112 234 150 Q 230 168 204 164 L 110 172 Q 78 176 74 158 Z'
    )
    shape(c, fish, '#ff8a5a', { y0: 112, y1: 174 })
    inside(c, fish, () => {
      for (let x = 98; x < 240; x += 24)
        line(c, `M${x} 108 Q ${x + 12} 140 ${x - 4} 180`, 5, 'rgba(255,240,225,.7)')
      glint(c, 110, 128, 14, 5, -0.1)
    })
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(fish)
    cute(c, 156, 136, 18, 7, 0.75)
  },
  fries(c) {
    shadow(c, 232, 70)
    shape(c, P('M48 122 Q 128 96 208 122 L 200 150 L 56 150 Z'), '#a8202a', { line: false })
    for (const [x, top, a] of [
      [80, 70, -0.26],
      [100, 44, -0.12],
      [122, 32, -0.02],
      [144, 46, 0.07],
      [164, 34, 0.15],
      [182, 64, 0.27],
      [110, 76, -0.06],
      [154, 76, 0.1],
      [90, 92, -0.2],
      [170, 88, 0.2],
      [132, 64, 0.03]
    ])
      turned(c, a, x, 150, () =>
        shape(c, rrect(x - 9, top, 18, 160 - top, 5), '#ffd34a', {
          y0: top,
          y1: 160,
          lw: 5,
          gloss: [x - 3, top + 30, 2.5, 18, 0]
        })
      )
    const carton = P(
      'M44 118 Q 128 150 212 118 L 188 222 Q 186 228 180 228 L 76 228 Q 70 228 68 222 Z'
    )
    shape(c, carton, '#e8323c', { y0: 118, y1: 228, gloss: [70, 160, 7, 22, -0.2] })
    cute(c, 128, 174, 20, 8)
  },
  salad(c) {
    shadow(c, 228, 90)
    blob(
      c,
      [
        [56, 114, 26],
        [90, 90, 30],
        [128, 80, 32],
        [166, 90, 30],
        [200, 114, 26],
        [108, 110, 26],
        [150, 110, 26]
      ],
      '#5bb83e'
    )
    blob(
      c,
      [
        [72, 124, 18],
        [128, 112, 20],
        [184, 124, 18]
      ],
      '#8fd85a',
      5
    )
    line(c, 'M90 70 Q 94 90 88 108 M166 70 Q 160 90 168 108 M128 58 L 128 92', 3, '#3f9a3f')
    // dưa chuột
    for (const [x, y] of [
      [128, 92],
      [62, 112]
    ]) {
      shape(c, ell(x, y, 19, 15), '#3f9a3f', { lw: 5 })
      flat(c, ell(x, y, 14, 11), '#e2f5b4')
      for (const a of [0, 1.6, 3.1, 4.7])
        flat(c, ell(x + Math.cos(a) * 6, y + Math.sin(a) * 5, 2, 1.5), '#a8cf6a')
    }
    // cà chua bi
    for (const [x, y, r] of [
      [94, 94, 17],
      [176, 98, 16],
      [196, 122, 13]
    ]) {
      shape(c, circle(x, y, r), '#f2443e', { y0: y - r, y1: y + r, lw: 5 })
      glint(c, x - r * 0.4, y - r * 0.4, r * 0.3, r * 0.2, -0.6)
      flat(c, star(x + 2, y - r + 3, 6, 2.5, 5), '#4fa83a')
    }
    // bát
    const top = 126
    shape(c, rrect(98, top + 72, 60, 16, 6), '#ffffff', { lw: 5 })
    const body = P(
      `M30 ${top} L 226 ${top} Q 222 ${top + 70} 152 ${top + 78} L 104 ${top + 78} Q 34 ${top + 70} 30 ${top} Z`
    )
    shape(c, body, '#ffffff', { y0: top, y1: top + 78, gloss: [68, top + 20, 16, 8, -0.3] })
    inside(c, body, () => line(c, `M26 ${top + 12} L 230 ${top + 12}`, 6, '#3fb0a0'))
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(body)
    cute(c, 128, 164)
  }
}
