// Nhóm thú hoang: voi, khỉ, gấu, cáo, ngựa vằn, sư tử, hổ, hươu cao cổ, gấu trúc, gấu túi, chuột túi, lạc đà.
// Khung 256×256, xem kit.ts.
import {
  INK,
  P,
  cheek,
  circle,
  ell,
  eye,
  flat,
  line,
  rrect,
  shadow,
  shape,
  smile,
  tube,
  type Painter
} from '../kit'

/** Vẽ `f` rồi vẽ lại bản soi gương qua trục x = 128 (tai, chân hai bên). */
function both(c: CanvasRenderingContext2D, f: () => void): void {
  f()
  c.save()
  c.translate(256, 0)
  c.scale(-1, 1)
  f()
  c.restore()
}

/** Vẽ `f` bị cắt trong khối `p` (vằn, đốm, mảng lông). */
function inside(c: CanvasRenderingContext2D, p: Path2D, f: () => void): void {
  c.save()
  c.clip(p)
  f()
  c.restore()
}

/** Khối lông xù (đám mây): `n` múi quanh elip tâm (cx, cy). */
function fluff(cx: number, cy: number, rx: number, ry: number, n: number, k = 0.55): Path2D {
  const pts = Array.from({ length: n + 1 }, (_, i) => (i / n) * Math.PI * 2)
  const at = (a: number, push: number): string =>
    `${cx + Math.cos(a) * (rx + push)} ${cy + Math.sin(a) * (ry + push)}`
  const b = ((Math.PI * 2 * (rx + ry)) / 2 / n) * k
  let d = `M${at(0, 0)}`
  for (let i = 0; i < n; i++)
    d += ` C ${at(pts[i] + 0.05, b)} ${at(pts[i + 1] - 0.05, b)} ${at(pts[i + 1], 0)}`
  return P(d + ' Z')
}

/** Mắt có viền trắng (đặt trên mảng lông tối: gấu trúc, ngựa vằn). */
function ringEye(c: CanvasRenderingContext2D, x: number, y: number, r = 8): void {
  flat(c, ell(x, y, r + 4, r * 1.2 + 4), '#ffffff')
  eye(c, x, y, r)
}

/** Hai chân tròn dưới thân. */
function feet(c: CanvasRenderingContext2D, color: string, gap = 22, y = 228): void {
  shape(c, ell(128 - gap, y, 14, 9), color, { lw: 4 })
  shape(c, ell(128 + gap, y, 14, 9), color, { lw: 4 })
}

export const PICTURES: Record<string, Painter> = {
  elephant(c) {
    shadow(c)
    const grey = '#9fa9c2'
    shape(c, ell(128, 200, 52, 32), grey, { y0: 168, y1: 232 })
    feet(c, '#8a93ad', 24)
    both(c, () => {
      shape(c, ell(54, 112, 40, 50, -0.2), grey, { y0: 62, y1: 162, gloss: [42, 84, 10, 16, -0.2] })
      flat(c, ell(58, 114, 25, 34, -0.2), '#f5b8c8')
    })
    shape(c, ell(128, 106, 58, 56), grey, { y0: 50, y1: 162, gloss: [100, 72, 18, 8, -0.4] })
    both(c, () =>
      shape(c, P('M108 146 Q 98 164 104 172 Q 112 160 116 146 Z'), '#fffaf0', { lw: 4 })
    )
    tube(c, 'M128 128 Q 126 170 142 182 Q 158 190 162 174', grey, 24)
    line(c, 'M120 154 L 136 154 M122 166 L 138 168', 3, '#7d86a0')
    eye(c, 104, 102)
    eye(c, 152, 102)
    cheek(c, 88, 128)
    cheek(c, 168, 128)
  },
  monkey(c) {
    shadow(c)
    const brown = '#9a6438'
    tube(c, 'M170 206 Q 222 204 220 162 Q 218 134 196 140 Q 182 148 196 160', brown, 10)
    shape(c, ell(128, 200, 44, 30), brown, { y0: 170, y1: 230 })
    flat(c, ell(128, 204, 26, 20), '#f5c9a0')
    feet(c, '#f0b98a', 22)
    both(c, () => {
      shape(c, circle(56, 116, 22), brown, { y0: 94, y1: 138 })
      flat(c, circle(57, 116, 13), '#f5c9a0')
    })
    shape(c, ell(128, 110, 66, 58), brown, { y0: 52, y1: 168, gloss: [94, 72, 18, 8, -0.4] })
    shape(
      c,
      P(
        'M128 96 C 112 72, 74 80, 78 114 C 80 142, 98 160, 128 162 C 158 160, 176 142, 178 114 C 182 80, 144 72, 128 96 Z'
      ),
      '#f5c9a0',
      { y0: 80, y1: 162, lw: 5 }
    )
    eye(c, 106, 110)
    eye(c, 150, 110)
    flat(c, ell(122, 134, 3, 4), '#8a5a3a')
    flat(c, ell(134, 134, 3, 4), '#8a5a3a')
    smile(c, 128, 142, 12)
    cheek(c, 92, 138, 0.8)
    cheek(c, 164, 138, 0.8)
  },
  bear(c) {
    shadow(c)
    const brown = '#a8703f'
    shape(c, ell(128, 202, 52, 32), brown, { y0: 170, y1: 234 })
    flat(c, ell(128, 206, 28, 20), '#e3b07c')
    feet(c, '#8a5a30', 24)
    both(c, () => {
      shape(c, circle(70, 62, 24), brown, { y0: 38, y1: 86 })
      flat(c, circle(72, 64, 13), '#e3b07c')
    })
    shape(c, ell(128, 116, 72, 62), brown, { y0: 54, y1: 178, gloss: [90, 80, 20, 9, -0.4] })
    shape(c, ell(128, 148, 34, 24), '#f0d2a8', { y0: 124, y1: 172, lw: 5 })
    shape(c, ell(128, 138, 13, 9), '#4a3330', { lw: 4, gloss: [124, 135, 5, 3] })
    line(c, 'M128 146 L 128 154', 4)
    smile(c, 128, 154, 9)
    eye(c, 98, 110)
    eye(c, 158, 110)
    cheek(c, 78, 138)
    cheek(c, 178, 138)
  },
  fox(c) {
    shadow(c)
    const orange = '#f0853a'
    const tail = P('M160 214 C 222 222, 240 160, 216 118 C 204 146, 190 170, 156 186 Z')
    shape(c, tail, orange, { y0: 118, y1: 222 })
    inside(c, tail, () => flat(c, ell(222, 132, 28, 26, 0.4), '#ffffff'))
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(tail)
    shape(c, ell(128, 204, 42, 28), orange, { y0: 176, y1: 232 })
    flat(c, ell(128, 208, 22, 18), '#ffffff')
    feet(c, '#4a3030', 20)
    both(c, () => {
      shape(c, P('M68 96 L 60 24 L 114 66 Z'), orange, { y0: 24, y1: 96 })
      flat(c, P('M74 82 L 70 42 L 100 66 Z'), '#5a3434')
    })
    const head = ell(128, 116, 72, 56)
    shape(c, head, orange, { y0: 60, y1: 172 })
    inside(c, head, () => {
      flat(
        c,
        P('M50 118 Q 90 124 128 112 Q 166 124 206 118 Q 196 176 128 176 Q 60 176 50 118 Z'),
        '#ffffff'
      )
      c.fillStyle = 'rgba(255,255,255,.5)'
      c.beginPath()
      c.ellipse(96, 80, 18, 8, -0.4, 0, Math.PI * 2)
      c.fill()
    })
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(head)
    shape(c, ell(128, 136, 10, 7), '#3b2a3a', { lw: 3, gloss: [125, 134, 4, 2] })
    line(c, 'M118 150 Q 123 156 128 148 Q 133 156 138 150', 4)
    eye(c, 100, 108)
    eye(c, 156, 108)
    cheek(c, 80, 136)
    cheek(c, 176, 136)
  },
  zebra(c) {
    shadow(c)
    const body = ell(128, 200, 50, 32)
    shape(c, body, '#ffffff', { y0: 168, y1: 232 })
    inside(c, body, () => {
      for (const x of [92, 118, 144, 170]) line(c, `M${x} 166 Q ${x + 8} 196 ${x - 2} 234`, 8)
    })
    feet(c, '#3b2a3a', 24)
    both(c, () => {
      shape(c, P('M80 80 Q 70 44 84 22 Q 108 40 112 66 Z'), '#ffffff', { y0: 22, y1: 80 })
      flat(c, P('M88 68 Q 84 50 90 36 Q 100 50 102 62 Z'), '#ffb3c1')
    })
    const mane = P(
      'M100 60 L 104 30 L 116 50 L 122 22 L 130 48 L 140 24 L 144 52 L 156 34 L 156 62 Z'
    )
    shape(c, mane, '#3b2a3a', { y0: 22, y1: 62 })
    const head = ell(128, 108, 56, 62)
    shape(c, head, '#ffffff', { y0: 46, y1: 170, gloss: [100, 72, 16, 8, -0.4] })
    inside(c, head, () => {
      line(c, 'M104 58 Q 128 72 152 58', 7)
      line(c, 'M100 74 Q 128 88 156 74', 7)
      for (const s of [1, -1]) {
        const x = 128 + s * 56
        line(c, `M${x} 96 Q ${x - s * 18} 104 ${x - s * 22} 112`, 7)
        line(c, `M${x} 122 Q ${x - s * 16} 128 ${x - s * 20} 136`, 7)
      }
    })
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(head)
    shape(c, ell(128, 154, 34, 22), '#8a8094', { lw: 5, y0: 132, y1: 176 })
    flat(c, ell(117, 150, 4, 6), '#2a1e2a')
    flat(c, ell(139, 150, 4, 6), '#2a1e2a')
    line(c, 'M120 162 Q 128 168 136 162', 4)
    eye(c, 104, 106)
    eye(c, 152, 106)
    cheek(c, 84, 130, 0.9)
    cheek(c, 172, 130, 0.9)
  },
  lion(c) {
    shadow(c)
    const gold = '#f5bf4a'
    tube(c, 'M170 214 Q 214 216 218 186', gold, 10)
    shape(c, fluff(220, 178, 12, 14, 6), '#c46a24', { lw: 5 })
    shape(c, ell(128, 212, 46, 24), gold, { y0: 188, y1: 236 })
    feet(c, '#e6a83a', 24, 230)
    shape(c, fluff(128, 110, 82, 76, 12), '#d9822b', {
      y0: 20,
      y1: 200,
      gloss: [70, 60, 18, 10, -0.6]
    })
    both(c, () => {
      shape(c, circle(84, 70, 15), gold, { y0: 55, y1: 85 })
      flat(c, circle(85, 71, 8), '#f0a28a')
    })
    shape(c, ell(128, 118, 60, 54), gold, { y0: 64, y1: 172, gloss: [100, 88, 16, 7, -0.4] })
    shape(c, ell(128, 150, 32, 20), '#fff0c8', { y0: 130, y1: 170, lw: 5 })
    shape(c, P('M118 136 L 138 136 L 128 148 Z'), '#a0523a', { lw: 3 })
    line(c, 'M128 148 L 128 152 M116 156 Q 122 162 128 152 Q 134 162 140 156', 4)
    eye(c, 104, 114)
    eye(c, 152, 114)
    cheek(c, 86, 138, 0.9)
    cheek(c, 170, 138, 0.9)
  },
  tiger(c) {
    shadow(c)
    const orange = '#f5953a'
    const tail = P('M172 212 Q 218 214 220 172')
    tube(c, tail, orange, 12)
    c.lineWidth = 12
    c.strokeStyle = INK
    c.setLineDash([6, 10])
    c.stroke(tail)
    c.setLineDash([])
    const body = ell(128, 204, 48, 30)
    shape(c, body, orange, { y0: 174, y1: 234 })
    inside(c, body, () => {
      flat(c, ell(128, 210, 24, 18), '#ffffff')
      for (const x of [86, 170]) line(c, `M${x} 180 L ${x + (x < 128 ? 14 : -14)} 196`, 7)
    })
    feet(c, '#ffffff', 22)
    both(c, () => {
      shape(c, circle(68, 66, 22), orange, { y0: 44, y1: 88 })
      flat(c, circle(70, 68, 12), '#ffffff')
    })
    const head = ell(128, 118, 74, 60)
    shape(c, head, orange, { y0: 58, y1: 178 })
    inside(c, head, () => {
      flat(
        c,
        P('M60 130 Q 96 126 128 136 Q 160 126 196 130 Q 190 182 128 182 Q 66 182 60 130 Z'),
        '#ffffff'
      )
      flat(c, P('M116 56 L 128 86 L 140 56 Z'), INK)
      flat(c, P('M98 60 L 108 80 L 114 58 Z'), INK)
      flat(c, P('M142 58 L 148 80 L 158 60 Z'), INK)
      for (const s of [1, -1]) {
        const x = 128 + s * 74
        flat(c, P(`M${x} 100 L ${x - s * 30} 108 L ${x} 116 Z`), INK)
        flat(c, P(`M${x} 124 L ${x - s * 26} 132 L ${x} 140 Z`), INK)
      }
      c.fillStyle = 'rgba(255,255,255,.5)'
      c.beginPath()
      c.ellipse(90, 86, 16, 7, -0.4, 0, Math.PI * 2)
      c.fill()
    })
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(head)
    shape(c, P('M118 138 L 138 138 L 128 150 Z'), '#e86a80', { lw: 3 })
    line(c, 'M128 150 L 128 154 M116 158 Q 122 164 128 154 Q 134 164 140 158', 4)
    eye(c, 100, 114)
    eye(c, 156, 114)
    cheek(c, 80, 140, 0.9)
    cheek(c, 176, 140, 0.9)
  },
  giraffe(c) {
    shadow(c, 236, 64)
    const yellow = '#f7c948'
    const patch = '#c97a3a'
    for (const x of [92, 116, 140, 164]) {
      shape(c, rrect(x - 8, 200, 16, 32, 7), yellow, { lw: 4, y0: 200, y1: 232 })
      shape(c, rrect(x - 8, 224, 16, 10, 4), '#6b4430', { lw: 4 })
    }
    const body = ell(128, 200, 54, 26)
    shape(c, body, yellow, { y0: 174, y1: 226 })
    inside(c, body, () => {
      flat(c, ell(98, 196, 12, 9, 0.3), patch)
      flat(c, ell(132, 208, 13, 8, -0.2), patch)
      flat(c, ell(164, 194, 11, 9, 0.4), patch)
    })
    tube(c, 'M178 196 Q 196 204 194 222', yellow, 6)
    const neck = P('M108 96 L 104 196 Q 128 204 152 196 L 148 96 Z')
    shape(c, neck, yellow, { y0: 96, y1: 200 })
    inside(c, neck, () => {
      flat(c, ell(116, 130, 10, 8, 0.4), patch)
      flat(c, ell(142, 150, 9, 8, -0.3), patch)
      flat(c, ell(118, 172, 11, 8), patch)
      flat(c, ell(144, 116, 7, 6), patch)
    })
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(neck)
    both(c, () => {
      tube(c, 'M112 44 L 106 22', '#e0a640', 7)
      shape(c, circle(106, 20, 8), '#8a5a3a', { lw: 4 })
      shape(c, ell(70, 64, 18, 9, -0.3), yellow, { y0: 55, y1: 73 })
      flat(c, ell(72, 64, 10, 4, -0.3), '#f0a28a')
    })
    const head = ell(128, 72, 46, 40)
    shape(c, head, yellow, { y0: 32, y1: 112, gloss: [106, 50, 12, 6, -0.4] })
    inside(c, head, () => flat(c, ell(128, 42, 8, 6), patch))
    shape(c, ell(128, 98, 32, 20), '#fae4b0', { lw: 5, y0: 78, y1: 118 })
    flat(c, ell(118, 94, 3, 4), '#8a5a3a')
    flat(c, ell(138, 94, 3, 4), '#8a5a3a')
    smile(c, 128, 104, 8)
    eye(c, 108, 68, 9)
    eye(c, 148, 68, 9)
    cheek(c, 92, 88, 0.7)
    cheek(c, 164, 88, 0.7)
  },
  panda(c) {
    shadow(c)
    const dark = '#3a3340'
    shape(c, ell(128, 202, 50, 32), '#ffffff', { y0: 170, y1: 234 })
    both(c, () => shape(c, ell(84, 200, 14, 24, 0.35), dark, { lw: 5 }))
    feet(c, dark, 24)
    both(c, () => shape(c, circle(68, 62, 24), dark, { y0: 38, y1: 86, gloss: [62, 52, 7, 4] }))
    shape(c, ell(128, 116, 74, 62), '#ffffff', { y0: 54, y1: 178, gloss: [90, 80, 20, 9, -0.4] })
    both(c, () => flat(c, ell(98, 114, 18, 24, 0.55), dark))
    ringEye(c, 100, 112, 7)
    ringEye(c, 156, 112, 7)
    shape(c, ell(128, 140, 12, 8), dark, { lw: 3, gloss: [124, 137, 4, 2] })
    line(c, 'M128 148 L 128 152 M116 156 Q 122 162 128 152 Q 134 162 140 156', 4)
    cheek(c, 76, 144)
    cheek(c, 180, 144)
  },
  koala(c) {
    shadow(c)
    const grey = '#a3abba'
    shape(c, ell(128, 206, 46, 28), grey, { y0: 178, y1: 234 })
    flat(c, ell(128, 210, 24, 16), '#f2f2f6')
    feet(c, '#8a93a6', 22)
    both(c, () => {
      shape(c, fluff(56, 84, 30, 30, 8), grey, { y0: 40, y1: 128, gloss: [46, 70, 8, 6] })
      flat(c, circle(58, 88, 17), '#f5e6ee')
    })
    shape(c, ell(128, 126, 66, 56), grey, { y0: 70, y1: 182, gloss: [96, 92, 18, 8, -0.4] })
    shape(
      c,
      P('M114 126 Q 112 100 128 100 Q 144 100 142 126 Q 142 150 128 152 Q 114 150 114 126 Z'),
      '#3d3646',
      {
        y0: 100,
        y1: 152,
        lw: 4,
        gloss: [122, 112, 5, 8]
      }
    )
    eye(c, 94, 120, 8)
    eye(c, 162, 120, 8)
    smile(c, 128, 162, 8)
    cheek(c, 82, 146)
    cheek(c, 174, 146)
  },
  kangaroo(c) {
    shadow(c, 236, 76)
    const tan = '#c98d5a'
    tube(c, 'M166 210 Q 214 222 234 198', tan, 16)
    both(c, () => shape(c, ell(98, 228, 32, 10), tan, { lw: 5, y0: 218, y1: 238 }))
    const body = ell(128, 176, 50, 54)
    shape(c, body, tan, { y0: 122, y1: 230 })
    flat(c, ell(128, 186, 34, 40), '#ecc89e')
    // Bé con ló đầu khỏi túi.
    both(c, () => shape(c, ell(116, 170, 5, 9, -0.3), tan, { lw: 3 }))
    shape(c, circle(128, 184, 14), tan, { lw: 4 })
    flat(c, circle(124, 182, 2.6), INK)
    flat(c, circle(132, 182, 2.6), INK)
    flat(c, circle(128, 188, 2), '#4a3330')
    shape(c, P('M98 188 Q 128 204 158 188 Q 156 216 128 218 Q 100 216 98 188 Z'), '#ecc89e', {
      y0: 188,
      y1: 218,
      lw: 5
    })
    both(c, () => shape(c, ell(90, 158, 9, 18, 0.5), tan, { lw: 4 }))
    both(c, () => {
      shape(c, ell(100, 42, 12, 30, -0.3), tan, { y0: 12, y1: 72 })
      flat(c, ell(101, 44, 6, 20, -0.3), '#f0a28a')
    })
    shape(c, ell(128, 88, 50, 44), tan, { y0: 44, y1: 132, gloss: [104, 64, 14, 7, -0.4] })
    shape(c, ell(128, 110, 22, 16), '#ecc89e', { lw: 4, y0: 94, y1: 126 })
    shape(c, ell(128, 102, 8, 5), '#4a3330', { lw: 3 })
    smile(c, 128, 112, 7)
    eye(c, 108, 84, 9)
    eye(c, 148, 84, 9)
    cheek(c, 92, 104, 0.7)
    cheek(c, 164, 104, 0.7)
  },
  camel(c) {
    shadow(c, 234, 92, 136)
    const tan = '#dba560'
    for (const x of [104, 128, 172, 196]) {
      shape(c, rrect(x - 8, 186, 16, 46, 7), tan, { lw: 4, y0: 186, y1: 232 })
      shape(c, rrect(x - 9, 222, 18, 10, 4), '#8a5a3a', { lw: 4 })
    }
    tube(c, 'M214 160 Q 228 176 222 196', '#a8703f', 6)
    shape(c, P('M104 146 Q 112 84 142 132 Q 166 86 192 146 Z'), tan, {
      y0: 96,
      y1: 146,
      gloss: [116, 108, 8, 10, -0.3]
    })
    shape(c, ell(150, 166, 70, 36), tan, { y0: 130, y1: 202, gloss: [128, 146, 22, 7, -0.1] })
    tube(c, 'M104 160 Q 70 150 70 104', tan, 30)
    shape(c, ell(38, 62, 9, 12, -0.5), tan, { lw: 4 })
    shape(c, ell(98, 62, 9, 12, 0.5), tan, { lw: 4 })
    shape(c, ell(68, 84, 40, 36), tan, { y0: 48, y1: 120, gloss: [52, 66, 12, 6, -0.4] })
    shape(c, ell(68, 104, 26, 16), '#f3d3a2', { lw: 4, y0: 88, y1: 120 })
    line(c, 'M60 100 L 62 104 M76 100 L 74 104', 4)
    smile(c, 68, 110, 6)
    eye(c, 52, 80, 8)
    eye(c, 84, 80, 8)
    line(c, 'M42 68 Q 52 64 60 68 M76 68 Q 84 64 94 68', 3)
    cheek(c, 40, 98, 0.6)
    cheek(c, 96, 98, 0.6)
  }
}
