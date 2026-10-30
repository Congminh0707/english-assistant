// Bầu trời & thời tiết. Khung 256×256, xem kit.ts.
import {
  INK,
  P,
  TAU,
  cheek,
  circle,
  ell,
  eye,
  face,
  flat,
  line,
  shadow,
  shape,
  smile,
  star,
  tube,
  type Painter
} from '../kit'

/** Biến đổi từng cặp toạ độ (x, y) trong chuỗi path SVG chỉ có M/L/Q/C/Z. */
function tp(d: string, f: (x: number, y: number) => [number, number]): Path2D {
  const re = /-?\d+(?:\.\d+)?/g
  const nums = (d.match(re) ?? []).map(Number)
  const out: number[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) out.push(...f(nums[i], nums[i + 1]))
  let k = 0
  return P(d.replace(re, () => out[k++].toFixed(1)))
}

const CLOUD =
  'M-46 22 C -66 22, -66 -6, -44 -4 C -44 -32, -12 -38, -2 -18 C 8 -40, 46 -34, 42 -6 C 64 -8, 66 22, 46 22 Z'

/** Mây tâm (x, y), tỉ lệ s (s = 1 rộng ~132). */
const cloud = (x: number, y: number, s: number): Path2D =>
  tp(CLOUD, (a, b) => [x + a * s, y + b * s])

/** Ngôi sao bo tròn mũm mĩm: viền mực dày rồi lòng màu. */
function softStar(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  ink = 6
): void {
  const p = star(x, y, r, r * 0.5)
  const round = Math.max(4, r * 0.22)
  c.lineJoin = 'round'
  c.lineWidth = round + ink * 2
  c.strokeStyle = INK
  c.stroke(p)
  c.lineWidth = round
  c.strokeStyle = color
  c.stroke(p)
  shape(c, p, color, { line: false, y0: y - r, y1: y + r })
}

function sleepyEye(c: CanvasRenderingContext2D, x: number, y: number): void {
  line(c, `M${x - 8} ${y - 2} Q ${x} ${y + 6} ${x + 8} ${y - 2}`, 5)
}

export const PICTURES: Record<string, Painter> = {
  sun(c) {
    const g = c.createRadialGradient(128, 128, 20, 128, 128, 124)
    g.addColorStop(0, 'rgba(255,214,90,.45)')
    g.addColorStop(1, 'rgba(255,214,90,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * TAU
      const long = i % 2 === 0
      const r0 = 70
      const r1 = long ? 116 : 100
      const w = long ? 0.2 : 0.17
      const pt = (rr: number, da: number): string =>
        `${(128 + Math.cos(a + da) * rr).toFixed(1)} ${(128 + Math.sin(a + da) * rr).toFixed(1)}`
      shape(c, P(`M${pt(r0, -w)} L ${pt(r1, 0)} L ${pt(r0, w)} Z`), '#ff9f1a', { lw: 5 })
    }
    shape(c, circle(128, 128, 70), '#ffcf33', { y0: 58, y1: 198, gloss: [96, 92, 20, 11, -0.6] })
    face(c, 128, 132, 22, 10)
  },

  cloud(c) {
    shadow(c, 202, 84)
    shape(c, cloud(128, 134, 1.72), '#eef4ff', { y0: 68, y1: 174, gloss: [90, 94, 24, 11, -0.4] })
    face(c, 128, 138, 22, 10)
  },

  moon(c) {
    const g = c.createRadialGradient(100, 128, 20, 100, 128, 126)
    g.addColorStop(0, 'rgba(255,230,120,.4)')
    g.addColorStop(1, 'rgba(255,230,120,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
    softStar(c, 200, 70, 18, '#ffd23f', 5)
    softStar(c, 214, 150, 12, '#ffd23f', 4)
    softStar(c, 184, 204, 9, '#ffd23f', 4)
    // trăng lưỡi liềm: cung ngoài tâm (118,128) r 96, cung trong lệch phải
    const body = P('M152 38 A 96 96 0 1 0 152 218 A 104 104 0 0 1 152 38 Z')
    shape(c, body, '#ffe066', { y0: 32, y1: 224, gloss: [58, 82, 10, 26, 0.35] })
    sleepyEye(c, 54, 124)
    sleepyEye(c, 88, 124)
    cheek(c, 44, 144, 0.75)
    cheek(c, 98, 144, 0.75)
    smile(c, 71, 142, 7)
  },

  star(c) {
    shadow(c, 232, 60)
    softStar(c, 128, 128, 108, '#ffd23f')
    c.fillStyle = 'rgba(255,255,255,.55)'
    c.beginPath()
    c.ellipse(108, 80, 8, 18, 0.5, 0, TAU)
    c.fill()
    face(c, 128, 140, 20, 9)
  },

  raindrop(c) {
    shadow(c, 230, 58)
    const drop = P(
      'M128 22 C 148 64, 196 110, 196 156 C 196 198, 164 224, 128 224 C 92 224, 60 198, 60 156 C 60 110, 108 64, 128 22 Z'
    )
    shape(c, drop, '#4fa8ff', { y0: 22, y1: 224 })
    c.fillStyle = 'rgba(255,255,255,.7)'
    c.beginPath()
    c.ellipse(92, 140, 9, 22, 0.25, 0, TAU)
    c.fill()
    c.beginPath()
    c.arc(98, 108, 5, 0, TAU)
    c.fill()
    face(c, 128, 164, 22, 9)
  },

  lightning(c) {
    shadow(c, 236, 40, 132)
    const bolt = P('M128 96 L 88 162 L 122 162 L 100 236 L 178 140 L 142 140 L 166 96 Z')
    shape(c, bolt, '#facc15', { y0: 96, y1: 236, gloss: [110, 130, 8, 30, 0.5] })
    shape(c, cloud(128, 70, 1.5), '#9aa5b8', { y0: 14, y1: 104, gloss: [96, 40, 20, 8, -0.3] })
    eye(c, 110, 72, 8)
    eye(c, 146, 72, 8)
    cheek(c, 96, 90, 0.7)
    cheek(c, 160, 90, 0.7)
    shape(c, ell(128, 92, 6, 5), '#e0576b', { lw: 4 })
    // tia sáng nhỏ quanh tia sét
    line(c, 'M64 150 L 50 146 M70 176 L 58 186 M190 172 L 204 178 M196 146 L 212 140', 5, '#f5b400')
  },

  umbrella(c) {
    shadow(c, 236, 70)
    for (const [x, y] of [
      [40, 46],
      [214, 40],
      [226, 92]
    ]) {
      shape(
        c,
        P(
          `M${x} ${y - 12} C ${x + 3} ${y - 4}, ${x + 7} ${y}, ${x + 7} ${y + 4} C ${x + 7} ${y + 9}, ${x - 7} ${y + 9}, ${x - 7} ${y + 4} C ${x - 7} ${y}, ${x - 3} ${y - 4}, ${x} ${y - 12} Z`
        ),
        '#7cc7ff',
        { lw: 4 }
      )
    }
    // cán cong
    tube(c, 'M128 120 L 128 204 Q 128 226 110 226 Q 94 226 94 210', '#8a5a3a', 9)
    // tán: 4 múi màu, mép dưới vỏ sò
    const panels: [string, string][] = [
      ['M128 40 C 70 40, 28 84, 28 128 Q 51 112 74 128 C 76 88, 100 56, 128 40 Z', '#ef4444'],
      ['M128 40 C 100 56, 76 88, 74 128 Q 101 112 128 128 Z', '#facc15'],
      ['M128 40 C 156 56, 180 88, 182 128 Q 155 112 128 128 Z', '#3b82f6'],
      ['M128 40 C 186 40, 228 84, 228 128 Q 205 112 182 128 C 180 88, 156 56, 128 40 Z', '#22c55e']
    ]
    for (const [d, col] of panels) shape(c, P(d), col, { y0: 40, y1: 128 })
    c.fillStyle = 'rgba(255,255,255,.5)'
    c.beginPath()
    c.ellipse(70, 74, 18, 8, -0.7, 0, TAU)
    c.fill()
    shape(c, circle(128, 34, 8), '#8a5a3a', { lw: 4 })
  },

  bird(c) {
    shadow(c, 232, 60)
    line(c, 'M112 208 L 108 226 M108 226 L 98 230 M108 226 L 112 232', 5, '#ff9f1a')
    line(c, 'M144 208 L 148 226 M148 226 L 158 230 M148 226 L 144 232', 5, '#ff9f1a')
    // đuôi
    shape(c, P('M60 160 L 24 140 Q 26 170 46 186 Z'), '#2f86d6', { y0: 140, y1: 186 })
    // chỏm lông
    shape(c, P('M120 66 C 108 40, 122 28, 130 44 C 136 26, 156 34, 140 64 Z'), '#2f86d6', {
      y0: 28,
      y1: 66
    })
    shape(c, ell(128, 140, 80, 74), '#5ab8ff', { y0: 66, y1: 214, gloss: [94, 96, 24, 12, -0.5] })
    flat(c, ell(128, 168, 48, 40), '#e6f4ff')
    // cánh
    shape(c, P('M58 144 C 40 150, 42 186, 72 190 C 86 180, 84 152, 58 144 Z'), '#2f86d6', {
      y0: 144,
      y1: 190
    })
    shape(c, P('M198 144 C 216 150, 214 186, 184 190 C 170 180, 172 152, 198 144 Z'), '#2f86d6', {
      y0: 144,
      y1: 190
    })
    eye(c, 102, 124, 11)
    eye(c, 154, 124, 11)
    cheek(c, 84, 150)
    cheek(c, 172, 150)
    shape(c, P('M114 138 L 142 138 L 128 158 Z'), '#ff9f1a', { lw: 5 })
  },

  airplane(c) {
    shadow(c, 228, 90)
    for (const [x, y, r] of [
      [26, 168, 9],
      [42, 182, 7],
      [20, 192, 5]
    ]) {
      shape(c, circle(x, y, r), '#eef4ff', { lw: 4 })
    }
    // cánh phía xa
    shape(c, P('M142 112 L 168 66 Q 180 62 184 72 L 172 112 Z'), '#c62828', { y0: 62, y1: 112 })
    // đuôi đứng + ngang
    shape(c, P('M50 128 L 36 70 Q 46 62 58 68 L 94 120 Z'), '#ef4444', { y0: 62, y1: 128 })
    // thân
    shape(
      c,
      P(
        'M50 116 C 70 98, 160 92, 200 104 C 236 114, 236 160, 200 168 C 160 176, 72 170, 50 150 C 38 140, 38 126, 50 116 Z'
      ),
      '#f4f8ff',
      {
        y0: 94,
        y1: 172,
        gloss: [140, 104, 50, 6, -0.03]
      }
    )
    // cửa sổ
    for (const x of [96, 122, 148])
      shape(c, circle(x, 124, 9), '#7cc7ff', { lw: 4, y0: 115, y1: 133 })
    shape(c, P('M186 108 C 204 108, 220 116, 224 128 L 186 128 Z'), '#7cc7ff', {
      lw: 4,
      y0: 108,
      y1: 128
    })
    // sọc thân
    line(c, 'M60 148 C 100 156, 170 156, 222 146', 6, '#ef4444')
    // cánh gần
    shape(c, P('M120 144 L 156 144 L 122 214 Q 108 218 104 206 Z'), '#ef4444', { y0: 144, y1: 214 })
    shape(c, P('M40 132 L 76 132 L 64 146 L 34 146 Z'), '#ef4444', { lw: 5 })
  },

  kite(c) {
    // đuôi + nơ
    line(c, 'M128 160 C 100 176, 150 192, 138 210 C 128 226, 170 240, 200 228', 4)
    for (const [x, y, col] of [
      [120, 178, '#ef4444'],
      [140, 208, '#facc15'],
      [178, 232, '#3b82f6']
    ] as [number, number, string][]) {
      shape(c, P(`M${x} ${y} L ${x - 18} ${y - 13} L ${x - 18} ${y + 13} Z`), col, { lw: 4 })
      shape(c, P(`M${x} ${y} L ${x + 18} ${y - 13} L ${x + 18} ${y + 13} Z`), col, { lw: 4 })
      shape(c, circle(x, y, 5), col, { lw: 4 })
    }
    const T: [number, number] = [128, 14]
    const L: [number, number] = [60, 78]
    const R: [number, number] = [196, 78]
    const B: [number, number] = [128, 160]
    const M: [number, number] = [128, 78]
    const tri = (a: [number, number], b: [number, number]): Path2D =>
      P(`M${M[0]} ${M[1]} L ${a[0]} ${a[1]} L ${b[0]} ${b[1]} Z`)
    shape(c, tri(T, L), '#ef4444', { line: false, y0: 14, y1: 160 })
    shape(c, tri(T, R), '#facc15', { line: false, y0: 14, y1: 160 })
    shape(c, tri(L, B), '#3b82f6', { line: false, y0: 14, y1: 160 })
    shape(c, tri(R, B), '#22c55e', { line: false, y0: 14, y1: 160 })
    c.fillStyle = 'rgba(255,255,255,.4)'
    c.beginPath()
    c.ellipse(106, 50, 14, 5, -0.75, 0, TAU)
    c.fill()
    line(c, 'M128 14 L 128 160 M60 78 L 196 78', 4)
    c.lineWidth = 6
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(P('M128 14 L 196 78 L 128 160 L 60 78 Z'))
  }
}
