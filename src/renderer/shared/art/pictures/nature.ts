// Thiên nhiên (tree, heart, mountain, volcano, snowflake, earth, cactus, tulip, snowman, fire).
// Khung 256×256, xem kit.ts. Hình "sống" (tim, núi, xương rồng, trái đất, người tuyết, lửa, bông tuyết) có mặt.
import {
  INK,
  LW,
  P,
  TAU,
  cheek,
  circle,
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

/** Khối hợp từ nhiều hình: viền mực chỉ bao quanh phần ngoài (vẽ viền dày trước, tô sau). */
function blob(
  c: CanvasRenderingContext2D,
  parts: Path2D[],
  color: string,
  y0: number,
  y1: number
): void {
  c.lineWidth = LW * 2
  c.strokeStyle = INK
  c.lineJoin = 'round'
  for (const p of parts) c.stroke(p)
  for (const p of parts) shape(c, p, color, { line: false, y0, y1 })
}

/** Mây khói tròn (khối hợp các hình tròn). */
function puff(c: CanvasRenderingContext2D, circles: number[][], color: string): void {
  const ys = circles.map(([, y, r]) => [y - r, y + r]).flat()
  blob(
    c,
    circles.map(([x, y, r]) => circle(x, y, r)),
    color,
    Math.min(...ys),
    Math.max(...ys)
  )
}

export const PICTURES: Record<string, Painter> = {
  tree(c) {
    shadow(c, 228, 80)
    shape(c, P('M110 140 L 146 140 Q 144 196 158 226 L 98 226 Q 112 196 110 140 Z'), '#9b6236', {
      y0: 140,
      y1: 226
    })
    line(c, 'M124 170 Q 128 186 122 204 M138 160 Q 134 176 140 188', 3, '#7a4a2e')
    puff(
      c,
      [
        [128, 74, 54],
        [78, 116, 44],
        [178, 116, 44],
        [128, 132, 44],
        [92, 76, 34],
        [166, 78, 34]
      ],
      '#4cbf56'
    )
    flat(c, ell(96, 62, 18, 9, -0.6), 'rgba(255,255,255,.45)')
    line(c, 'M92 128 Q 104 138 118 132 M146 108 Q 158 116 170 110', 4, '#2f9a3c')
    for (const [x, y] of [
      [70, 120],
      [150, 70],
      [184, 132],
      [116, 104]
    ]) {
      shape(c, circle(x, y, 10), '#ef4444', { lw: 4, y0: y - 10, y1: y + 10 })
      flat(c, circle(x - 3, y - 3, 3), 'rgba(255,255,255,.8)')
    }
  },

  heart(c) {
    shadow(c, 228, 64)
    const h = P(
      'M128 216 C 60 170, 24 132, 24 90 C 24 54, 50 32, 80 32 C 102 32, 118 44, 128 62 C 138 44, 154 32, 176 32 C 206 32, 232 54, 232 90 C 232 132, 196 170, 128 216 Z'
    )
    shape(c, h, '#ff4d6d', { y0: 32, y1: 216, gloss: [70, 70, 22, 12, -0.7] })
    flat(c, circle(98, 56, 5), 'rgba(255,255,255,.75)')
    face(c, 128, 120, 26, 11)
  },

  mountain(c) {
    shadow(c, 228, 104)
    // núi sau (phải)
    const back = P('M118 222 L 172 66 Q 180 52 188 66 L 238 222 Z')
    shape(c, back, '#6d7fbf', { y0: 52, y1: 222 })
    c.save()
    c.clip(back)
    flat(
      c,
      P('M140 120 L 180 40 L 220 120 L 206 112 L 194 124 L 180 110 L 166 124 L 154 112 Z'),
      '#ffffff'
    )
    flat(c, P('M110 204 Q 180 192 246 200 L 246 240 L 110 240 Z'), '#6cc05c')
    line(c, 'M110 204 Q 180 192 246 200', 5)
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(back)
    // núi trước (trái)
    const front = P('M18 224 L 98 76 Q 108 60 118 76 L 200 224 Z')
    shape(c, front, '#8fa3e0', { y0: 60, y1: 224 })
    c.save()
    c.clip(front)
    flat(
      c,
      P('M60 132 L 108 44 L 156 132 L 140 122 L 126 136 L 110 120 L 94 136 L 78 122 Z'),
      '#ffffff'
    )
    flat(c, P('M18 196 Q 110 176 210 200 L 210 240 L 18 240 Z'), '#7ccf6a')
    flat(c, ell(88, 104, 6, 16, 0.5), 'rgba(255,255,255,.8)')
    line(c, 'M60 132 L 78 122 L 94 136 L 110 120 L 126 136 L 140 122 L 156 132', 4, '#c9d6f5')
    line(c, 'M18 196 Q 110 176 210 200', 5)
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(front)
    face(c, 108, 160, 20, 8)
  },

  volcano(c) {
    shadow(c, 228, 108)
    puff(
      c,
      [
        [128, 58, 26],
        [98, 48, 20],
        [158, 44, 22],
        [138, 32, 14]
      ],
      '#b8bcc8'
    )
    const cone = P('M18 224 L 94 92 Q 98 84 108 84 L 148 84 Q 158 84 162 92 L 238 224 Z')
    shape(c, cone, '#a0643c', { y0: 84, y1: 224 })
    c.save()
    c.clip(cone)
    flat(c, P('M180 120 L 240 224 L 200 224 Z'), '#8a5230')
    // dòng dung nham
    const lava = P(
      'M100 84 L 156 84 Q 160 120 150 132 Q 140 142 140 160 Q 140 176 130 176 Q 120 176 122 150 Q 124 128 112 124 Q 100 132 96 150 Q 92 162 84 156 Q 78 148 88 120 Z'
    )
    shape(c, lava, '#ff6a1a', { y0: 84, y1: 176, line: false })
    flat(c, P('M106 92 Q 116 118 124 112 Q 130 98 146 94 Z'), '#ffd23f')
    c.lineWidth = 4
    c.strokeStyle = INK
    c.stroke(lava)
    flat(c, P('M18 204 Q 128 186 238 206 L 238 240 L 18 240 Z'), '#7ccf6a')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(cone)
    line(c, 'M24 204 Q 128 186 232 206', 5)
    shape(c, ell(128, 86, 26, 7), '#ff8a1a', { lw: 5 })
    // đá lửa bay
    for (const [x, y, r] of [
      [72, 74, 8],
      [190, 70, 7],
      [204, 100, 5]
    ])
      shape(c, circle(x, y, r), '#ff6a1a', { lw: 4, y0: y - r, y1: y + r })
  },

  snowflake(c) {
    const arms = new Path2D()
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * TAU
      const pt = (r: number, da = 0, rr = 0): [number, number] => [
        128 + Math.cos(a) * r + Math.cos(a + da) * rr,
        124 + Math.sin(a) * r + Math.sin(a + da) * rr
      ]
      const [x0, y0] = pt(30)
      const [x1, y1] = pt(102)
      arms.moveTo(x0, y0)
      arms.lineTo(x1, y1)
      for (const [r, len] of [
        [58, 26],
        [82, 18]
      ]) {
        const [bx, by] = pt(r)
        for (const s of [-1, 1]) {
          const [ex, ey] = pt(r, s * 0.9, len)
          arms.moveTo(bx, by)
          arms.lineTo(ex, ey)
        }
      }
    }
    tube(c, arms, '#9fdcff', 12)
    c.lineWidth = 3
    c.strokeStyle = 'rgba(255,255,255,.75)'
    c.stroke(arms)
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * TAU
      shape(c, circle(128 + Math.cos(a) * 104, 124 + Math.sin(a) * 104, 7), '#d6f0ff', { lw: 4 })
    }
    const hex = new Path2D()
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU
      const x = 128 + Math.cos(a) * 40
      const y = 124 + Math.sin(a) * 40
      if (i === 0) hex.moveTo(x, y)
      else hex.lineTo(x, y)
    }
    hex.closePath()
    shape(c, hex, '#c4ebff', { y0: 84, y1: 164, gloss: [112, 100, 12, 6, -0.5] })
    eye(c, 114, 120, 6)
    eye(c, 142, 120, 6)
    cheek(c, 102, 136, 0.5)
    cheek(c, 154, 136, 0.5)
    smile(c, 128, 134, 6)
  },

  earth(c) {
    shadow(c, 232, 80)
    const ball = circle(128, 124, 98)
    shape(c, ball, '#3b9cf0', { line: false, y0: 26, y1: 222 })
    c.save()
    c.clip(ball)
    // đất liền: các mảng xanh trừu tượng (không phải bản đồ thật)
    for (const [x, y, rx, ry, rot] of [
      [70, 70, 40, 24, -0.4],
      [52, 100, 22, 30, 0.3],
      [176, 84, 34, 22, 0.5],
      [196, 112, 20, 26, 0.2],
      [150, 196, 44, 22, -0.1],
      [64, 182, 18, 12, 0.4]
    ])
      shape(c, ell(x, y, rx, ry, rot), '#5cc25b', { lw: 4, y0: y - ry, y1: y + ry })
    flat(c, ell(178, 82, 10, 6, 0.5), '#8fdc7a')
    flat(c, ell(66, 64, 12, 6, -0.4), '#8fdc7a')
    // mây trắng
    line(
      c,
      'M150 46 Q 170 40 190 48 M40 146 Q 58 140 76 146 M178 156 Q 196 150 214 158',
      7,
      'rgba(255,255,255,.85)'
    )
    // bóng tối nhẹ bên phải dưới
    const g = c.createRadialGradient(96, 88, 40, 128, 124, 110)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(1, 'rgba(30,40,110,.25)')
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
    flat(c, ell(84, 58, 22, 10, -0.6), 'rgba(255,255,255,.5)')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(ball)
    face(c, 128, 126, 26, 11)
  },

  cactus(c) {
    shadow(c, 232, 70)
    const parts = [
      rrect(98, 44, 60, 150, 30),
      rrect(50, 118, 62, 28, 14),
      rrect(50, 80, 28, 60, 14),
      rrect(144, 104, 62, 28, 14),
      rrect(178, 64, 28, 62, 14)
    ]
    blob(c, parts, '#4cbf56', 44, 194)
    line(c, 'M112 64 L 112 180 M144 64 L 144 180', 3, '#2f9a3c')
    flat(c, rrect(106, 56, 8, 40, 4), 'rgba(255,255,255,.45)')
    for (const [x, y] of [
      [104, 70],
      [152, 84],
      [104, 170],
      [152, 160],
      [60, 96],
      [192, 80],
      [70, 130],
      [184, 118]
    ]) {
      line(c, `M${x} ${y} L ${x - 6} ${y - 5} M${x} ${y} L ${x + 6} ${y - 5}`, 2.5)
    }
    // hoa trên đỉnh
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * TAU
      shape(c, circle(128 + Math.cos(a) * 10, 40 + Math.sin(a) * 10, 9), '#ff7eb6', { lw: 4 })
    }
    shape(c, circle(128, 40, 6), '#ffd23f', { lw: 3 })
    // chậu
    shape(
      c,
      P('M84 186 L 172 186 L 162 228 Q 160 232 154 232 L 102 232 Q 96 232 94 228 Z'),
      '#e07a4a',
      {
        y0: 186,
        y1: 232
      }
    )
    shape(c, rrect(76, 176, 104, 22, 8), '#f08c5a', { y0: 176, y1: 198, gloss: [100, 182, 16, 3] })
    face(c, 128, 120, 16, 8)
  },

  tulip(c) {
    shadow(c, 232, 56)
    tube(c, 'M128 130 Q 124 186 128 228', '#4caf50', 10)
    shape(c, P('M124 228 C 96 220, 72 186, 76 140 C 104 158, 122 190, 124 228 Z'), '#5cc25b', {
      y0: 140,
      y1: 228,
      gloss: [92, 168, 4, 16, -0.5]
    })
    shape(c, P('M132 228 C 160 216, 184 180, 180 132 C 152 150, 134 186, 132 228 Z'), '#5cc25b', {
      y0: 132,
      y1: 228
    })
    line(c, 'M120 220 Q 100 190 84 154 M136 220 Q 156 186 172 146', 3, '#3f9a3f')
    // hoa: hai cánh sau + cánh giữa trước
    const cup = P(
      'M80 54 Q 104 70 108 80 L 128 40 L 148 80 Q 152 70 176 54 Q 186 130 128 142 Q 70 130 80 54 Z'
    )
    shape(c, cup, '#ff5a8a', { y0: 40, y1: 142 })
    shape(c, P('M100 76 Q 128 30 156 76 Q 160 126 128 140 Q 96 126 100 76 Z'), '#ff7aa4', {
      y0: 44,
      y1: 140,
      gloss: [114, 82, 6, 16, 0.2],
      lw: 5
    })
  },

  snowman(c) {
    shadow(c, 232, 70)
    // tay que
    line(c, 'M86 156 L 40 126 M54 135 L 44 116 M170 156 L 216 124 M202 134 L 214 116', 7, '#7a4a2e')
    shape(c, circle(128, 178, 52), '#f4f8ff', { y0: 126, y1: 230, gloss: [104, 156, 14, 8, -0.6] })
    for (const y of [162, 186, 210]) flat(c, circle(128, y, 6), INK)
    shape(c, circle(128, 94, 42), '#f4f8ff', { y0: 52, y1: 136, gloss: [108, 76, 12, 7, -0.6] })
    // khăn
    shape(c, P('M86 124 Q 128 144 170 124 L 172 140 Q 128 158 84 140 Z'), '#ef4444', {
      lw: 5,
      y0: 124,
      y1: 156
    })
    shape(c, P('M146 140 L 166 140 L 170 184 L 150 180 Z'), '#ef4444', { lw: 5, y0: 140, y1: 184 })
    line(c, 'M152 168 L 168 170 M150 156 L 166 158', 3, '#ffd23f')
    // mũ
    shape(c, ell(128, 58, 48, 9), '#3d3d4f', { lw: 5 })
    shape(c, rrect(96, 16, 64, 44, 8), '#3d3d4f', { y0: 16, y1: 60, gloss: [106, 26, 4, 10] })
    flat(c, P('M99 42 L 157 42 L 157 52 L 99 52 Z'), '#ef4444')
    // mặt
    eye(c, 112, 86, 7)
    eye(c, 144, 86, 7)
    cheek(c, 100, 104, 0.6)
    cheek(c, 156, 104, 0.6)
    shape(c, P('M126 96 L 160 104 L 126 108 Z'), '#ff8a1a', { lw: 4 })
    smile(c, 122, 114, 7)
  },

  fire(c) {
    shadow(c, 230, 72)
    // củi
    tube(c, 'M60 214 L 196 190', '#9b6236', 18)
    tube(c, 'M60 190 L 196 214', '#b07a44', 18)
    const outer = P(
      'M128 20 C 150 54, 196 80, 196 140 C 196 184, 166 210, 128 210 C 90 210, 60 184, 60 140 C 60 110, 76 96, 84 76 C 94 96, 100 104, 108 108 C 104 74, 112 46, 128 20 Z'
    )
    shape(c, outer, '#ff5a2a', { y0: 20, y1: 210 })
    const mid = P(
      'M128 74 C 146 98, 176 116, 176 152 C 176 182, 154 200, 128 200 C 102 200, 80 182, 80 152 C 80 132, 92 120, 98 108 C 106 122, 112 126, 116 128 C 114 106, 118 92, 128 74 Z'
    )
    shape(c, mid, '#ff9f1a', { y0: 74, y1: 200, line: false })
    shape(c, ell(128, 164, 34, 32), '#ffe066', { y0: 132, y1: 196, line: false })
    flat(c, ell(90, 130, 6, 18, 0.3), 'rgba(255,255,255,.5)')
    eye(c, 114, 158, 8)
    eye(c, 142, 158, 8)
    cheek(c, 100, 176, 0.6)
    cheek(c, 156, 176, 0.6)
    smile(c, 128, 172, 7)
  }
}
