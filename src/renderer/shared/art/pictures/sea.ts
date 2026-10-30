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
    // con sóng nhỏ phía sau
    shape(c, P('M150 210 C 170 186, 196 160, 222 164 C 238 168, 244 186, 246 210 Z'), '#7cc8f5', {
      y0: 160,
      y1: 210,
      gloss: [206, 174, 12, 4, -0.3]
    })
    tube(c, 'M196 170 Q 214 158 232 168', '#ffffff', 6)
    // con sóng lớn cuộn ngọn
    const body = P(
      'M12 214 C 18 140, 62 62, 142 44 C 198 34, 238 64, 234 100 C 232 126, 206 136, 192 122 C 182 110, 188 94, 204 98 C 198 80, 170 76, 152 96 C 128 124, 132 180, 172 214 Z'
    )
    shape(c, body, '#2f86d6', { y0: 40, y1: 214, gloss: [62, 120, 10, 34, 0.5] })
    c.save()
    c.clip(body)
    flat(
      c,
      P('M152 96 C 128 124, 132 180, 172 214 L 196 214 C 156 176, 150 128, 176 104 Z'),
      '#6cc6f7'
    )
    flat(c, P('M204 98 C 198 80, 170 76, 152 96 L 160 100 C 176 88, 194 90, 204 104 Z'), '#a8e0fb')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.lineJoin = 'round'
    c.stroke(body)
    // bọt trắng dọc mép sóng
    tube(
      c,
      'M54 104 C 84 66, 116 50, 146 46 C 196 40, 230 64, 230 98 Q 228 120 208 122',
      '#ffffff',
      14
    )
    for (const [x, y, r] of [
      [64, 94, 9],
      [86, 72, 12],
      [114, 54, 13],
      [146, 44, 14],
      [178, 42, 13],
      [206, 52, 12],
      [226, 74, 11],
      [230, 98, 9],
      [214, 116, 8]
    ])
      shape(c, ell(x, y, r, r), '#ffffff', { lw: 4, gloss: [x - 3, y - 3, r * 0.4, r * 0.3] })
    // mặt biển ngang đáy hình
    let d = 'M10 206'
    for (let i = 0; i < 6; i++) {
      const a = 10 + i * 39.3
      d += ` Q ${a + 10} ${198} ${a + 20} ${206} Q ${a + 30} ${214} ${a + 39.3} ${206}`
    }
    d += ' L 246 236 Q 246 244 238 244 L 18 244 Q 10 244 10 236 Z'
    shape(c, P(d), '#1f6fc0', { y0: 198, y1: 244, gloss: [70, 214, 30, 3] })
    line(
      c,
      'M40 226 Q 56 220 72 226 M120 230 Q 136 224 152 230 M188 224 Q 204 218 220 224',
      4,
      '#5aa7e6'
    )
    eye(c, 62, 150, 9)
    eye(c, 102, 150, 9)
    cheek(c, 48, 172)
    cheek(c, 116, 172)
    smile(c, 82, 168, 9)
    drop(c, 236, 140, 0.7)
    drop(c, 30, 70, 0.8)
  },
  shell(c) {
    // gò cát nhỏ
    const sand = P(
      'M12 232 Q 22 190 128 186 Q 234 190 244 232 Q 244 240 236 240 L 20 240 Q 12 240 12 232 Z'
    )
    shape(c, sand, '#f5d58a', { y0: 186, y1: 240 })
    for (const [x, y] of [
      [40, 222],
      [70, 206],
      [196, 208],
      [222, 224],
      [150, 228],
      [96, 230]
    ])
      flat(c, ell(x, y, 3, 2), '#d9b066')
    // tai bản lề hai bên
    shape(c, P('M88 184 L 168 184 L 160 214 Q 128 222 96 214 Z'), '#f6a48a', {
      lw: 5,
      y0: 184,
      y1: 220
    })
    // vỏ sò điệp: viền tròn lượn sóng, gân xen kẽ sáng/sẫm toả từ bản lề
    const hx = 128
    const hy = 204
    const ex = (t: number, k = 1): [number, number] => [
      128 + Math.cos(t) * 100 * k,
      128 + Math.sin(t) * 80 * k
    ]
    const n = 9
    const t0 = Math.PI - 0.5
    const t1 = 2 * Math.PI + 0.5
    const ts = Array.from({ length: n + 1 }, (_, i) => t0 + ((t1 - t0) * i) / n)
    const [lx, ly] = ex(t0)
    let d = `M${hx - 18} ${hy} L ${lx} ${ly}`
    for (let i = 0; i < n; i++) {
      const [qx, qy] = ex((ts[i] + ts[i + 1]) / 2, 1.12)
      const [px, py] = ex(ts[i + 1])
      d += ` Q ${qx} ${qy} ${px} ${py}`
    }
    d += ` L ${hx + 18} ${hy} Z`
    const shell = P(d)
    shape(c, shell, '#ffc7ae', { y0: 40, y1: 206 })
    c.save()
    c.clip(shell)
    for (let i = 0; i < n; i += 2) {
      const [ax, ay] = ex(ts[i], 1.3)
      const [bx, by] = ex(ts[i + 1], 1.3)
      flat(c, P(`M${hx} ${hy} L ${ax} ${ay} L ${bx} ${by} Z`), '#f59a80')
    }
    // ánh ngọc trai
    c.fillStyle = 'rgba(255,255,255,.5)'
    c.beginPath()
    c.ellipse(84, 82, 26, 10, -0.6, 0, TAU)
    c.fill()
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.lineJoin = 'round'
    c.stroke(shell)
    face(c, 128, 136, 22, 8)
    // ốc xoắn nhỏ bên cạnh
    shape(c, P('M196 226 Q 194 200 216 196 Q 238 196 238 214 Q 238 228 222 230 Z'), '#ffe2c4', {
      lw: 4,
      y0: 194,
      y1: 230
    })
    line(c, 'M222 230 Q 208 222 212 210 Q 218 202 226 208 Q 230 216 222 218', 3, '#d98a6a')
  }
}
