// Nhóm biển: thuyền, cua, bạch tuộc, cá heo, cá voi, cá mập, rùa, sóng, vỏ sò. Khung 256×256, xem kit.ts.
import {
  P,
  TAU,
  cheek,
  ell,
  eye,
  face,
  flat,
  line,
  rrect,
  shadow,
  shape,
  smile,
  tube,
  type Painter
} from '../kit'

/** Vẽ `f` rồi vẽ lại bản soi gương qua trục x = 128 (chân, càng, xúc tu hai bên). */
function both(c: CanvasRenderingContext2D, f: () => void): void {
  f()
  c.save()
  c.translate(256, 0)
  c.scale(-1, 1)
  f()
  c.restore()
}

/** Giọt nước nhỏ (đầu nhọn hướng lên). */
function drop(c: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  shape(
    c,
    P(
      `M${x} ${y - 12 * s} Q ${x + 9 * s} ${y + 2 * s} ${x} ${y + 6 * s} Q ${x - 9 * s} ${y + 2 * s} ${x} ${y - 12 * s} Z`
    ),
    '#8fd3ff',
    { lw: 3 }
  )
}

/** Dải nước gợn sóng ở đáy hình. */
function water(c: CanvasRenderingContext2D, top: number, x0 = 18, x1 = 238): void {
  const n = 5
  const w = (x1 - x0) / n
  let d = `M${x0} ${top + 6}`
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w
    d += ` Q ${a + w / 4} ${top - 8} ${a + w / 2} ${top + 4} Q ${a + (w * 3) / 4} ${top + 14} ${a + w} ${top + 4}`
  }
  d += ` L ${x1} ${top + 26} Q 128 ${top + 38} ${x0} ${top + 26} Z`
  shape(c, P(d), '#45b3f7', { y0: top - 8, y1: top + 34, gloss: [80, top + 8, 30, 4] })
}

export const PICTURES: Record<string, Painter> = {
  boat(c) {
    tube(c, 'M128 166 L 128 34', '#8a5a3a', 8)
    shape(c, P('M136 40 Q 196 92 210 156 L 136 156 Z'), '#fff6e0', {
      y0: 40,
      y1: 156,
      gloss: [160, 96, 8, 26, -0.5]
    })
    shape(c, P('M120 64 Q 72 108 58 156 L 120 156 Z'), '#ffd23f', { y0: 64, y1: 156 })
    line(c, 'M150 120 L 190 120', 4, '#ff7a7a')
    shape(c, P('M132 26 L 162 34 L 132 44 Z'), '#ef4444', { lw: 4 })
    shape(c, P('M30 164 L 226 164 Q 214 212 170 216 L 86 216 Q 42 212 30 164 Z'), '#ef6b4a', {
      y0: 164,
      y1: 216
    })
    shape(c, rrect(24, 156, 208, 16, 8), '#a8673f', { lw: 5, y0: 156, y1: 172 })
    face(c, 128, 184, 26, 8)
    water(c, 206)
  },
  crab(c) {
    shadow(c, 232, 84)
    both(c, () => {
      tube(c, 'M74 158 Q 46 158 32 182', '#f2553a', 11)
      tube(c, 'M78 176 Q 54 190 48 212', '#f2553a', 11)
      tube(c, 'M92 190 Q 78 206 80 224', '#f2553a', 11)
      tube(c, 'M90 128 Q 62 120 56 96', '#f2553a', 14)
      shape(
        c,
        P('M58 104 C 26 104, 16 62, 38 44 L 56 72 L 74 52 C 88 72, 86 104, 58 104 Z'),
        '#ff6b4a',
        {
          y0: 44,
          y1: 104,
          gloss: [42, 72, 6, 12, 0.3]
        }
      )
      tube(c, 'M110 116 L 106 86', '#f2553a', 8)
    })
    shape(c, ell(128, 158, 78, 52), '#ff6b4a', { y0: 106, y1: 210, gloss: [96, 128, 24, 9, -0.3] })
    both(c, () => shape(c, ell(104, 76, 17, 18), '#ffffff', { lw: 5 }))
    eye(c, 105, 78, 9)
    eye(c, 151, 78, 9)
    for (const [x, y] of [
      [150, 124],
      [166, 134],
      [108, 120]
    ])
      flat(c, ell(x, y, 5, 4), '#d9452e')
    cheek(c, 86, 168)
    cheek(c, 170, 168)
    smile(c, 128, 164, 12)
  },
  octopus(c) {
    shadow(c, 232, 86)
    both(c, () => {
      tube(c, 'M84 156 C 64 196, 44 204, 34 188', '#b07cf2', 22)
      tube(c, 'M102 168 C 96 206, 78 226, 62 218', '#b07cf2', 22)
      tube(c, 'M120 174 C 120 210, 112 228, 96 230', '#b07cf2', 22)
      flat(c, ell(40, 196, 4, 4), '#e6d2ff')
      flat(c, ell(70, 220, 4, 4), '#e6d2ff')
    })
    shape(c, ell(128, 110, 76, 72), '#b07cf2', { y0: 38, y1: 182, gloss: [92, 70, 22, 11, -0.5] })
    flat(c, ell(168, 72, 9, 7), '#9a66de')
    flat(c, ell(184, 96, 6, 5), '#9a66de')
    flat(c, ell(76, 98, 6, 5), '#9a66de')
    eye(c, 104, 120, 11)
    eye(c, 152, 120, 11)
    cheek(c, 82, 146)
    cheek(c, 174, 146)
    smile(c, 128, 144, 10)
  },
  dolphin(c) {
    water(c, 214, 24, 232)
    shape(c, P('M116 132 Q 108 162 90 174 Q 128 170 140 134 Z'), '#5f93bf')
    shape(c, P('M126 72 Q 136 36 166 38 Q 154 54 160 76 Z'), '#5f93bf', { y0: 36, y1: 76 })
    shape(
      c,
      P(
        'M194 178 C 180 194, 162 202, 154 216 C 174 220, 188 210, 194 200 C 200 212, 214 222, 234 218 C 228 200, 212 190, 194 178 Z'
      ),
      '#5f93bf',
      { y0: 178, y1: 222 }
    )
    const body = P(
      'M28 120 Q 34 104 58 100 C 64 70, 110 52, 150 58 C 202 66, 224 128, 208 182 L 180 186 C 178 156, 160 138, 124 138 C 98 138, 80 142, 60 136 Q 32 134 28 120 Z'
    )
    shape(c, body, '#7fb0d8', { y0: 60, y1: 190, gloss: [116, 78, 30, 7, 0.1] })
    c.save()
    c.clip(body)
    flat(c, ell(122, 150, 84, 26, 0.2), '#e8f3fb')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.lineJoin = 'round'
    c.stroke(body)
    eye(c, 84, 96, 10)
    cheek(c, 76, 120, 0.8)
    line(c, 'M36 122 Q 50 128 64 122', 4)
    drop(c, 38, 196)
    drop(c, 224, 168, 0.8)
    drop(c, 26, 168, 0.7)
  },
  whale(c) {
    shape(c, P('M90 98 Q 96 72 100 62 Q 104 72 110 98 Z'), '#8fd3ff', { lw: 4 })
    shape(
      c,
      P(
        'M100 68 C 88 42, 62 40, 56 58 C 70 52, 84 56, 100 72 C 116 56, 130 52, 144 58 C 138 40, 112 42, 100 68 Z'
      ),
      '#8fd3ff',
      { lw: 4 }
    )
    tube(c, 'M186 176 Q 212 166 214 132', '#3d8bdb', 22)
    shape(
      c,
      P(
        'M214 136 C 198 132, 186 116, 188 100 C 200 104, 210 112, 214 120 C 218 110, 228 102, 240 100 C 242 116, 230 132, 214 136 Z'
      ),
      '#3d8bdb',
      { y0: 100, y1: 136 }
    )
    const body = P(
      'M24 170 C 22 120, 70 100, 120 100 C 168 100, 196 132, 200 166 C 202 198, 178 216, 128 216 L 72 216 C 40 214, 26 196, 24 170 Z'
    )
    shape(c, body, '#3d8bdb', { y0: 100, y1: 216, gloss: [86, 120, 34, 9, -0.15] })
    c.save()
    c.clip(body)
    flat(c, ell(104, 218, 92, 30), '#cfe8ff')
    for (const x of [64, 90, 116, 142]) line(c, `M${x} 196 L ${x + 4} 214`, 3, '#9cc7ef')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.lineJoin = 'round'
    c.stroke(body)
    shape(c, P('M126 186 Q 150 206 168 196 Q 154 180 136 178 Z'), '#2f74bd', { lw: 4 })
    eye(c, 62, 150, 9)
    eye(c, 108, 150, 9)
    cheek(c, 48, 170)
    cheek(c, 124, 170)
    smile(c, 85, 166, 9)
  },
  shark(c) {
    shape(c, P('M186 124 L 232 76 Q 222 118 204 130 Q 222 144 228 180 Z'), '#5f7d99', {
      y0: 76,
      y1: 180
    })
    shape(c, P('M96 98 Q 110 46 140 40 Q 130 70 140 98 Z'), '#5f7d99', { y0: 40, y1: 98 })
    const body = P('M24 138 C 32 86, 128 74, 196 126 C 154 184, 52 192, 24 138 Z')
    shape(c, body, '#7a9bbb', { y0: 90, y1: 176, gloss: [92, 104, 40, 8, -0.1] })
    c.save()
    c.clip(body)
    flat(c, ell(96, 180, 90, 34), '#eef6ff')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.lineJoin = 'round'
    c.stroke(body)
    shape(c, P('M104 152 Q 100 180 84 194 Q 118 184 128 150 Z'), '#5f7d99', { y0: 150, y1: 194 })
    for (const x of [120, 132, 144]) line(c, `M${x} 116 Q ${x + 5} 128 ${x} 140`, 4, '#4c6680')
    eye(c, 66, 116, 10)
    cheek(c, 84, 140)
    shape(c, P('M34 146 Q 52 166 74 148 Z'), '#ff7b8f', { lw: 4 })
    shape(c, P('M42 149 L 50 149 L 46 156 Z'), '#ffffff', { lw: 2, line: false })
    shape(c, P('M56 150 L 64 149 L 60 157 Z'), '#ffffff', { lw: 2, line: false })
    for (const [x, y, r] of [
      [46, 72, 9],
      [30, 50, 6],
      [56, 40, 4]
    ]) {
      c.lineWidth = 4
      c.strokeStyle = '#8fd3ff'
      c.beginPath()
      c.arc(x, y, r, 0, TAU)
      c.stroke()
    }
  },
  turtle(c) {
    shadow(c, 228, 100)
    shape(c, P('M30 168 L 14 178 L 34 182 Z'), '#8fd46e', { lw: 4 })
    for (const x of [56, 92, 132, 162])
      shape(c, ell(x, 196, 17, 20), '#8fd46e', { y0: 180, y1: 216 })
    tube(c, 'M170 160 Q 184 150 192 138', '#8fd46e', 26)
    const shell = P('M28 172 C 30 86, 184 82, 190 172 Z')
    shape(c, shell, '#4fae4a', { y0: 88, y1: 172, gloss: [76, 110, 22, 10, -0.5] })
    c.save()
    c.clip(shell)
    shape(c, P('M86 104 L 132 104 L 148 136 L 132 166 L 86 166 L 70 136 Z'), '#7ccf5e', {
      lw: 4,
      y0: 104,
      y1: 166
    })
    line(c, 'M86 104 L 70 82 M132 104 L 150 82 M70 136 L 30 136 M148 136 L 190 136', 4)
    c.restore()
    shape(c, rrect(20, 164, 180, 18, 9), '#e3b85c', { lw: 5, y0: 164, y1: 182 })
    shape(c, ell(198, 126, 40, 36), '#8fd46e', { y0: 90, y1: 162, gloss: [184, 104, 12, 6, -0.4] })
    eye(c, 184, 122, 8)
    eye(c, 216, 122, 8)
    cheek(c, 174, 142, 0.8)
    cheek(c, 226, 142, 0.8)
    smile(c, 200, 140, 8)
  },
  wave(c) {
    const body = P(
      'M18 226 C 22 150, 60 64, 144 46 C 200 36, 240 72, 232 114 C 226 142, 196 150, 182 132 C 172 118, 180 100, 196 104 C 190 86, 158 82, 140 104 C 116 136, 134 196, 238 226 Z'
    )
    shape(c, body, '#2f86d6', { y0: 46, y1: 226, gloss: [70, 120, 12, 34, 0.5] })
    c.save()
    c.clip(body)
    flat(
      c,
      P('M140 104 C 116 136, 134 196, 238 226 L 238 160 C 200 150, 170 130, 182 132 Z'),
      '#45b3f7'
    )
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.stroke(body)
    for (const [x, y, r] of [
      [118, 54, 13],
      [146, 46, 12],
      [174, 46, 11],
      [200, 54, 11],
      [220, 72, 10],
      [92, 70, 11]
    ])
      shape(c, ell(x, y, r, r), '#ffffff', { lw: 4 })
    eye(c, 66, 160, 9)
    eye(c, 106, 160, 9)
    cheek(c, 52, 182)
    cheek(c, 120, 182)
    smile(c, 86, 178, 9)
    drop(c, 226, 160, 0.8)
  },
  shell(c) {
    shadow(c, 230, 76)
    const hx = 128
    const hy = 210
    const R = 118
    const n = 7
    const a0 = -Math.PI + 0.55
    const a1 = -0.55
    const pt = (a: number, r: number): [number, number] => [
      hx + Math.cos(a) * r,
      hy + Math.sin(a) * r
    ]
    const [sx, sy] = pt(a0, R)
    let d = `M${hx} ${hy} L ${sx} ${sy}`
    const ribs: string[] = []
    for (let i = 0; i < n; i++) {
      const aa = a0 + ((a1 - a0) * i) / n
      const ab = a0 + ((a1 - a0) * (i + 1)) / n
      const [cx, cy] = pt((aa + ab) / 2, R + 20)
      const [ex, ey] = pt(ab, R)
      d += ` Q ${cx} ${cy} ${ex} ${ey}`
      if (i < n - 1) ribs.push(`M${hx} ${hy - 10} L ${ex} ${ey}`)
    }
    d += ' Z'
    const fan = P(d)
    shape(c, fan, '#ffa98f', { y0: 80, y1: 212, gloss: [98, 112, 22, 10, -0.5] })
    c.save()
    c.clip(fan)
    for (const r of ribs) line(c, r, 4, '#e8806a')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.stroke(fan)
    shape(c, P('M104 222 L 110 196 L 146 196 L 152 222 Z'), '#f08f74', { lw: 5, y0: 196, y1: 222 })
    face(c, 128, 150, 22, 8)
  }
}
