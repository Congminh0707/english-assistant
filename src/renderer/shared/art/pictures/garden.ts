// Rau củ trong vườn (kiểu "apple" ở trial.ts: mặt cười, điểm sáng, viền mực, bóng đổ). Khung 256×256, xem kit.ts.
import {
  INK,
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

/** Mặt rau củ: 2 mắt, má, miệng cười (giống apple). */
function veggieFace(
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

/** Nhiều hình tròn hợp thành một khối (chỉ viền ngoài): viền dày trước, tô đè sau. */
function blob(
  c: CanvasRenderingContext2D,
  circles: number[][],
  color: string,
  y0: number,
  y1: number
): void {
  c.lineWidth = 12
  c.strokeStyle = INK
  for (const [x, y, r] of circles) c.stroke(ell(x, y, r, r))
  for (const [x, y, r] of circles) shape(c, ell(x, y, r, r), color, { y0, y1, line: false })
}

export const PICTURES: Record<string, Painter> = {
  strawberry(c) {
    shadow(c, 232, 60)
    const body = P(
      'M128 76 C 84 66, 44 88, 48 132 C 52 178, 100 220, 128 228 C 156 220, 204 178, 208 132 C 212 88, 172 66, 128 76 Z'
    )
    shape(c, body, '#ef3b55', { y0: 70, y1: 228 })
    glint(c, 80, 116, 9, 18, -0.5)
    for (const [x, y] of [
      [92, 104],
      [164, 104],
      [128, 98],
      [68, 140],
      [188, 140],
      [82, 178],
      [174, 178],
      [106, 200],
      [150, 200],
      [128, 214]
    ]) {
      c.fillStyle = '#ffe9a0'
      c.beginPath()
      c.ellipse(x, y, 3.5, 5.5, 0, 0, TAU)
      c.fill()
      c.lineWidth = 2
      c.strokeStyle = 'rgba(59,42,58,.55)'
      c.stroke()
    }
    shape(c, star(128, 80, 52, 20, 6), '#4fb84e', { y0: 30, y1: 130, lw: 5 })
    tube(c, 'M128 78 Q 126 56 136 42', '#3f9a3f', 8)
    veggieFace(c, 128, 146)
  },
  carrot(c) {
    shadow(c, 234, 40)
    leaf(c, 120, 82, 82, 30, 13)
    leaf(c, 136, 82, 174, 30, 13)
    leaf(c, 128, 82, 128, 18, 14, '#6ccf5a')
    const body = P(
      'M78 92 C 76 70, 180 70, 178 92 C 178 132, 150 190, 134 222 C 130 230, 126 230, 122 222 C 106 190, 78 132, 78 92 Z'
    )
    shape(c, body, '#ff8c2a', { y0: 72, y1: 228 })
    glint(c, 96, 104, 7, 16, -0.2)
    line(c, 'M86 134 L 100 132', 4, '#d9661a')
    line(c, 'M168 150 L 154 148', 4, '#d9661a')
    line(c, 'M106 184 L 118 182', 4, '#d9661a')
    line(c, 'M150 120 L 162 118', 4, '#d9661a')
    eye(c, 112, 112, 8)
    eye(c, 144, 112, 8)
    cheek(c, 98, 130, 0.8)
    cheek(c, 158, 130, 0.8)
    smile(c, 128, 130, 8)
  },
  tomato(c) {
    shadow(c, 228, 72)
    const body = P(
      'M128 86 C 70 80, 38 114, 42 152 C 46 196, 94 216, 128 214 C 162 216, 210 196, 214 152 C 218 114, 186 80, 128 86 Z'
    )
    shape(c, body, '#f03e3e', { y0: 82, y1: 216 })
    inside(c, body, () => {
      line(c, 'M98 92 Q 84 150 104 210', 4, 'rgba(180,30,40,.35)')
      line(c, 'M158 92 Q 172 150 152 210', 4, 'rgba(180,30,40,.35)')
    })
    glint(c, 76, 132, 10, 18, -0.7)
    shape(c, star(128, 92, 46, 13, 5), '#4caf50', { y0: 46, y1: 136, lw: 5 })
    tube(c, 'M128 90 L 131 66', '#3f9a3f', 8)
    veggieFace(c, 128, 158, 22)
  },
  potato(c) {
    shadow(c, 220, 80)
    const body = P(
      'M56 126 C 50 86, 104 70, 138 80 C 178 70, 216 98, 208 140 C 214 184, 172 210, 128 202 C 84 212, 46 178, 56 126 Z'
    )
    shape(c, body, '#d4a160', { y0: 72, y1: 210 })
    glint(c, 94, 102, 18, 8, -0.4)
    for (const [x, y, rx] of [
      [78, 120, 5],
      [182, 108, 4],
      [168, 182, 5],
      [86, 176, 4],
      [196, 150, 3],
      [128, 92, 3]
    ]) {
      flat(c, ell(x, y, rx, rx * 0.7), '#a8763f')
      line(c, `M${x - rx - 2} ${y - rx} Q ${x} ${y - rx - 4} ${x + rx + 2} ${y - rx}`, 3, '#a8763f')
    }
    veggieFace(c, 132, 136)
  },
  broccoli(c) {
    shadow(c, 232, 52)
    shape(
      c,
      P('M104 230 Q 110 190 112 150 L 144 150 Q 146 190 152 230 Q 128 238 104 230 Z'),
      '#b9e27f',
      {
        y0: 150,
        y1: 232
      }
    )
    line(c, 'M118 196 Q 104 184 94 176', 6, INK)
    line(c, 'M140 190 Q 154 180 162 172', 6, INK)
    blob(
      c,
      [
        [72, 128, 30],
        [104, 92, 36],
        [154, 88, 36],
        [188, 128, 30],
        [128, 140, 50],
        [82, 168, 22],
        [174, 168, 22]
      ],
      '#3fa34d',
      44,
      190
    )
    for (const [x, y, r] of [
      [100, 80, 9],
      [150, 74, 9],
      [70, 122, 8],
      [188, 120, 8],
      [130, 104, 7]
    ])
      flat(c, ell(x, y, r, r * 0.8), 'rgba(255,255,255,.28)')
    for (const [x, y] of [
      [86, 104],
      [176, 106],
      [120, 70],
      [62, 146],
      [196, 148],
      [168, 82]
    ])
      line(c, `M${x - 6} ${y} Q ${x} ${y + 6} ${x + 6} ${y}`, 3, '#2a7a36')
    veggieFace(c, 128, 140, 19, 8)
  },
  mushroom(c) {
    shadow(c, 232, 58)
    const stem = P(
      'M94 228 C 88 196, 94 160, 102 138 L 154 138 C 162 160, 168 196, 162 228 Q 128 236 94 228 Z'
    )
    shape(c, stem, '#fff1d6', { y0: 138, y1: 232 })
    flat(c, ell(128, 140, 92, 12), '#e9d2b0')
    const cap = P('M24 134 C 24 46, 232 46, 232 134 C 200 154, 56 154, 24 134 Z')
    shape(c, cap, '#e8413c', { y0: 52, y1: 152, gloss: [80, 84, 24, 10, -0.5] })
    for (const [x, y, rx, ry] of [
      [128, 76, 15, 11],
      [78, 108, 13, 10],
      [178, 108, 13, 10],
      [128, 124, 9, 7],
      [204, 132, 6, 5],
      [52, 132, 6, 5]
    ])
      shape(c, ell(x, y, rx, ry), '#ffffff', { lw: 4 })
    eye(c, 112, 176, 8)
    eye(c, 144, 176, 8)
    cheek(c, 102, 196, 0.7)
    cheek(c, 154, 196, 0.7)
    smile(c, 128, 194, 7)
  },
  cucumber(c) {
    shadow(c, 210, 92)
    c.save()
    c.translate(128, 132)
    c.rotate(-0.42)
    shape(c, P('M100 -8 L 116 -10 L 116 10 L 100 8 Z'), '#7a9e3a', { y0: -10, y1: 10, lw: 5 })
    const body = P('M-66 -42 L 66 -42 A 42 42 0 0 1 66 42 L -66 42 A 42 42 0 0 1 -66 -42 Z')
    shape(c, body, '#4caf50', { y0: -42, y1: 42, gloss: [-30, -27, 58, 7] })
    inside(c, body, () => {
      line(c, 'M-96 14 L 96 14', 6, 'rgba(200,240,160,.35)')
      line(c, 'M-96 -2 L 96 -2', 4, 'rgba(46,125,50,.35)')
    })
    for (const [x, y] of [
      [-84, -10],
      [-62, 20],
      [-36, -20],
      [44, -22],
      [64, 18],
      [86, -6],
      [-90, 14],
      [24, 26]
    ]) {
      flat(c, ell(x, y, 3.5, 3), '#c5ec9a')
      flat(c, ell(x + 1, y + 2, 1.6, 1.4), '#2e6b2f')
    }
    c.restore()
    veggieFace(c, 128, 124, 20, 9, 0.9)
  },
  onion(c) {
    shadow(c, 230, 62)
    for (const d of [
      'M118 216 Q 110 230 102 236',
      'M128 218 L 128 240',
      'M138 216 Q 146 230 154 236'
    ])
      tube(c, d, '#ead6aa', 3)
    tube(c, 'M128 60 Q 124 38 136 22', '#c9a37a', 8)
    const body = P(
      'M128 54 C 136 84, 212 102, 208 160 C 204 206, 162 222, 128 222 C 94 222, 52 206, 48 160 C 44 102, 120 84, 128 54 Z'
    )
    shape(c, body, '#a24b8f', { y0: 54, y1: 222 })
    inside(c, body, () => {
      for (const d of [
        'M128 60 Q 94 130 104 224',
        'M128 60 Q 162 130 152 224',
        'M128 60 Q 64 120 70 214',
        'M128 60 Q 192 120 186 214'
      ])
        line(c, d, 4, '#c77bb6')
    })
    glint(c, 82, 136, 9, 20, -0.4)
    veggieFace(c, 128, 154)
  },
  garlic(c) {
    shadow(c, 230, 66)
    for (const d of [
      'M112 218 Q 104 230 96 234',
      'M122 220 L 120 238',
      'M134 220 L 136 238',
      'M144 218 Q 152 230 160 234'
    ])
      tube(c, d, '#e3d2ad', 3)
    tube(c, 'M128 90 Q 124 60 134 36', '#efe3cc', 12)
    const left = ell(92, 168, 44, 52, 0.25)
    const right = ell(164, 168, 44, 52, -0.25)
    shape(c, left, '#f3ebdf', { y0: 112, y1: 222 })
    shape(c, right, '#f3ebdf', { y0: 112, y1: 222 })
    line(c, 'M70 136 Q 62 168 74 200', 3, '#d9b8e3')
    line(c, 'M186 136 Q 194 168 182 200', 3, '#d9b8e3')
    const mid = P(
      'M128 74 C 140 104, 178 122, 176 172 C 174 206, 154 222, 128 222 C 102 222, 82 206, 80 172 C 78 122, 116 104, 128 74 Z'
    )
    shape(c, mid, '#fbf7f0', { y0: 74, y1: 222 })
    inside(c, mid, () => {
      line(c, 'M128 82 Q 106 140 112 220', 3, '#e3c9ec')
      line(c, 'M128 82 Q 150 140 144 220', 3, '#e3c9ec')
    })
    glint(c, 102, 138, 7, 16, -0.3)
    veggieFace(c, 128, 166, 18, 8, 0.85)
  },
  corn(c) {
    shadow(c, 234, 56)
    const cob = ell(128, 118, 50, 94)
    shape(c, cob, '#f2b928', { y0: 24, y1: 212 })
    inside(c, cob, () => {
      for (let row = 0; row < 13; row++) {
        const y = 30 + row * 15
        for (let col = 0; col < 8; col++) {
          const x = 77 + col * 15 + (row % 2 ? 7 : 0)
          c.fillStyle = '#ffd84a'
          c.beginPath()
          c.roundRect(x - 6, y - 6, 12, 12, 5)
          c.fill()
          c.fillStyle = 'rgba(255,255,255,.45)'
          c.beginPath()
          c.ellipse(x - 2, y - 2, 2.5, 2, 0, 0, TAU)
          c.fill()
        }
      }
      c.fillStyle = 'rgba(255,255,255,.35)'
      c.beginPath()
      c.ellipse(98, 70, 10, 30, -0.15, 0, TAU)
      c.fill()
    })
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(cob)
    veggieFace(c, 128, 108, 19, 10, 0.95)
    shape(c, P('M128 236 C 76 230, 42 168, 50 96 C 82 128, 112 172, 128 236 Z'), '#5cc25b', {
      y0: 96,
      y1: 236
    })
    shape(c, P('M128 236 C 180 230, 214 168, 206 96 C 174 128, 144 172, 128 236 Z'), '#4caf50', {
      y0: 96,
      y1: 236
    })
    line(c, 'M120 222 Q 84 180 64 120', 3, '#3f9a3f')
    line(c, 'M136 222 Q 172 180 192 120', 3, '#3f8a3a')
  }
}
