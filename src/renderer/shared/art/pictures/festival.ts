// Hình lễ hội & đồ chơi (balloon, gift, drum, ball, bell, cake, candy, crown, guitar). Khung 256×256, xem kit.ts.
// Đồ chơi “có hồn” (balloon, cake, candy) có mặt cười nhỏ như apple/lantern; còn lại không mặt.
import {
  INK,
  P,
  TAU,
  circle,
  ell,
  face,
  flat,
  line,
  mix,
  rrect,
  shadow,
  shape,
  star,
  tube,
  type Painter
} from '../kit'

/** Lớp kem phủ: đỉnh bo tròn, mép dưới nhỏ giọt (n giọt). */
function frosting(x0: number, x1: number, y0: number, y1: number, n: number): Path2D {
  let d = `M${x0} ${y1} L ${x0} ${y0 + 12} Q ${x0} ${y0} ${x0 + 12} ${y0} L ${x1 - 12} ${y0} Q ${x1} ${y0} ${x1} ${y0 + 12} L ${x1} ${y1}`
  const w = (x1 - x0) / n
  for (let i = n - 1; i >= 0; i--) {
    const xa = x0 + (i + 1) * w
    const xb = x0 + i * w
    d += ` Q ${(xa + xb) / 2} ${y1 + (i % 2 ? 12 : 20)} ${xb} ${y1}`
  }
  return P(d + ' Z')
}

/** Nơ hai quai + nút giữa, tâm (x, y). */
function bow(c: CanvasRenderingContext2D, x: number, y: number, color: string, s = 1): void {
  shape(
    c,
    P(
      `M${x} ${y} C ${x - 20 * s} ${y - 30 * s}, ${x - 46 * s} ${y - 22 * s}, ${x - 40 * s} ${y - 4 * s} C ${x - 36 * s} ${y + 10 * s}, ${x - 16 * s} ${y + 8 * s}, ${x} ${y} Z`
    ),
    color,
    {
      y0: y - 26 * s,
      y1: y + 10 * s,
      lw: 5
    }
  )
  shape(
    c,
    P(
      `M${x} ${y} C ${x + 20 * s} ${y - 30 * s}, ${x + 46 * s} ${y - 22 * s}, ${x + 40 * s} ${y - 4 * s} C ${x + 36 * s} ${y + 10 * s}, ${x + 16 * s} ${y + 8 * s}, ${x} ${y} Z`
    ),
    color,
    {
      y0: y - 26 * s,
      y1: y + 10 * s,
      lw: 5
    }
  )
  shape(c, ell(x, y, 10 * s, 9 * s), color, { lw: 5 })
}

export const PICTURES: Record<string, Painter> = {
  balloon(c) {
    line(c, 'M128 186 C 110 202, 148 214, 128 230 C 116 240, 126 246, 134 246', 4)
    shape(c, P('M116 190 L 128 172 L 140 190 Q 128 196 116 190 Z'), '#ff5a7a', { lw: 5 })
    shape(
      c,
      P(
        'M128 178 C 76 172, 58 128, 62 92 C 66 50, 98 22, 128 22 C 158 22, 190 50, 194 92 C 198 128, 180 172, 128 178 Z'
      ),
      '#ff5a7a',
      { y0: 22, y1: 178 }
    )
    c.fillStyle = 'rgba(255,255,255,.75)'
    c.beginPath()
    c.ellipse(94, 70, 11, 24, 0.5, 0, TAU)
    c.fill()
    c.beginPath()
    c.arc(84, 100, 5, 0, TAU)
    c.fill()
    face(c, 128, 110, 22, 8)
  },
  gift(c) {
    shadow(c, 232, 86)
    shape(c, rrect(54, 124, 148, 100, 12), '#ff6b8a', { y0: 124, y1: 224 })
    flat(c, P('M60 130 L 196 130 L 196 140 L 60 140 Z'), 'rgba(120,20,60,.15)')
    shape(c, P('M114 127 L 142 127 L 142 221 L 114 221 Z'), '#ffd23f', { lw: 4, y0: 124, y1: 224 })
    shape(c, rrect(42, 94, 172, 38, 12), '#ff6b8a', { y0: 94, y1: 132, gloss: [76, 104, 22, 5] })
    shape(c, P('M112 96 L 144 96 L 144 130 L 112 130 Z'), '#ffd23f', { lw: 4, y0: 94, y1: 132 })
    tube(c, 'M120 92 Q 108 106 98 108', '#ffd23f', 10)
    tube(c, 'M136 92 Q 148 106 158 108', '#ffd23f', 10)
    bow(c, 128, 88, '#ffd23f', 1.15)
  },
  drum(c) {
    shadow(c, 230, 92)
    const body = P('M48 118 L 48 190 Q 128 236 208 190 L 208 118 Z')
    shape(c, body, '#ef4444', { y0: 118, y1: 214 })
    c.save()
    c.clip(body)
    line(c, 'M48 142 L 74 204 L 100 150 L 128 212 L 156 150 L 182 204 L 208 142', 6, '#fff3dc')
    c.restore()
    tube(c, 'M50 190 Q 128 236 206 190', '#ffd23f', 10)
    shape(c, ell(128, 118, 80, 26), '#ffd23f', { y0: 92, y1: 144 })
    shape(c, ell(128, 116, 68, 18), '#fff3dc', { lw: 4, y0: 98, y1: 134, gloss: [104, 110, 26, 5] })
    tube(c, 'M88 118 L 162 34', '#e0a060', 8)
    tube(c, 'M168 118 L 94 34', '#e0a060', 8)
    shape(c, circle(162, 34, 12), '#ff7aa8', { lw: 5, gloss: [158, 30, 4, 3] })
    shape(c, circle(94, 34, 12), '#ff7aa8', { lw: 5, gloss: [90, 30, 4, 3] })
  },
  ball(c) {
    shadow(c, 232, 70)
    const R = 90
    c.save()
    c.translate(128, 132)
    const disc = circle(0, 0, R)
    c.save()
    c.clip(disc)
    c.rotate(-0.4)
    // các múi: đường chia là cung bậc hai từ cực trên tới cực dưới
    const ctrl = [-266, -100, -32, 32, 100, 266]
    const colors = ['#ef4444', '#ffffff', '#ffd23f', '#ffffff', '#3b9cff']
    for (let i = 0; i < colors.length; i++) {
      const g = c.createLinearGradient(0, -R, 0, R)
      g.addColorStop(0, mix(colors[i], 0.2))
      g.addColorStop(1, mix(colors[i], -0.12))
      c.fillStyle = g
      c.fill(P(`M0 ${-R - 4} Q ${ctrl[i]} 0 0 ${R + 4} Q ${ctrl[i + 1]} 0 0 ${-R - 4} Z`))
    }
    for (let i = 1; i < ctrl.length - 1; i++) line(c, `M0 ${-R - 4} Q ${ctrl[i]} 0 0 ${R + 4}`, 3)
    shape(c, circle(0, -R + 2, 16), '#ffffff', { lw: 4 })
    c.restore()
    c.fillStyle = 'rgba(255,255,255,.7)'
    c.beginPath()
    c.ellipse(-44, -46, 22, 11, -0.7, 0, TAU)
    c.fill()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(disc)
    c.restore()
  },
  bell(c) {
    shadow(c, 234, 78)
    shape(c, circle(128, 206, 15), '#d99a22', { lw: 5 })
    shape(
      c,
      P(
        'M128 58 C 90 58, 78 90, 76 126 C 74 160, 64 174, 46 186 L 210 186 C 192 174, 182 160, 180 126 C 178 90, 166 58, 128 58 Z'
      ),
      '#f5c542',
      { y0: 58, y1: 200 }
    )
    c.fillStyle = 'rgba(255,255,255,.6)'
    c.beginPath()
    c.ellipse(100, 122, 9, 34, 0.12, 0, TAU)
    c.fill()
    line(c, 'M86 150 Q 128 160 170 150', 4, '#d99a22')
    shape(c, rrect(38, 180, 180, 20, 10), '#e8b030', { lw: 5, y0: 180, y1: 200 })
    tube(c, 'M118 62 L 108 84', '#ef4444', 9)
    tube(c, 'M138 62 L 148 84', '#ef4444', 9)
    bow(c, 128, 56, '#ef4444')
  },
  cake(c) {
    shadow(c, 236, 100)
    shape(c, ell(128, 214, 100, 16), '#e6eefa', { lw: 5, y0: 198, y1: 230 })
    // nến
    shape(c, rrect(119, 54, 18, 52, 5), '#7cc7ff', { lw: 5, y0: 54, y1: 106 })
    c.save()
    c.clip(rrect(119, 54, 18, 52, 5))
    line(c, 'M114 66 L 142 58 M114 82 L 142 74 M114 98 L 142 90', 5, '#ffffff')
    c.restore()
    c.lineWidth = 5
    c.strokeStyle = INK
    c.stroke(rrect(119, 54, 18, 52, 5))
    line(c, 'M128 54 L 128 46', 4)
    shape(
      c,
      P('M128 14 C 136 26, 142 34, 138 42 C 134 50, 122 50, 118 42 C 114 34, 120 26, 128 14 Z'),
      '#ffb02e',
      {
        lw: 4,
        y0: 14,
        y1: 50
      }
    )
    flat(c, ell(128, 40, 5, 7), '#fff3b0')
    // tầng trên
    shape(c, rrect(76, 100, 104, 58, 14), '#f7b27a', { y0: 100, y1: 158 })
    shape(c, frosting(76, 180, 100, 118, 5), '#fff4f8', { lw: 5, y0: 100, y1: 136 })
    for (const [x, y, col] of [
      [96, 108, '#ff5a7a'],
      [118, 112, '#3b9cff'],
      [150, 108, '#5cc25b'],
      [166, 113, '#ffd23f']
    ] as const)
      line(c, `M${x - 4} ${y} L ${x + 4} ${y - 2}`, 4, col)
    // tầng dưới
    shape(c, rrect(50, 146, 156, 70, 16), '#f7b27a', { y0: 146, y1: 216 })
    shape(c, frosting(50, 206, 146, 164, 7), '#ff9ec4', {
      lw: 5,
      y0: 146,
      y1: 184,
      gloss: [80, 152, 18, 4]
    })
    face(c, 128, 186, 24, 8)
  },
  candy(c) {
    shadow(c, 194, 72)
    const end = (s: number): string => {
      const x = (v: number): number => 128 + s * v
      return `M${x(40)} 128 C ${x(56)} 116, ${x(70)} 100, ${x(96)} 88 L ${x(88)} 104 L ${x(102)} 112 L ${x(90)} 122 L ${x(104)} 132 L ${x(90)} 142 L ${x(100)} 154 L ${x(86)} 158 L ${x(96)} 170 C ${x(70)} 158, ${x(56)} 142, ${x(40)} 128 Z`
    }
    shape(c, P(end(-1)), '#ffd23f', { lw: 5, y0: 88, y1: 170 })
    shape(c, P(end(1)), '#ffd23f', { lw: 5, y0: 88, y1: 170 })
    line(c, 'M60 112 Q 52 128 60 144', 3, '#d99a22')
    line(c, 'M196 112 Q 204 128 196 144', 3, '#d99a22')
    shape(c, ell(128, 128, 58, 46), '#ff5a9a', { y0: 82, y1: 174 })
    c.save()
    c.clip(ell(128, 128, 58, 46))
    for (const x of [74, 182])
      line(c, `M${x - 14} 90 Q ${x + 10} 128 ${x - 14} 170`, 10, 'rgba(255,255,255,.75)')
    c.fillStyle = 'rgba(255,255,255,.6)'
    c.beginPath()
    c.ellipse(104, 98, 18, 7, -0.3, 0, TAU)
    c.fill()
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(ell(128, 128, 58, 46))
    face(c, 128, 124, 18, 7)
  },
  crown(c) {
    shadow(c, 222, 92)
    shape(
      c,
      P(
        'M48 196 L 40 90 Q 40 82 48 88 L 86 126 L 122 70 Q 128 62 134 70 L 170 126 L 208 88 Q 216 82 216 90 L 208 196 Z'
      ),
      '#f5c542',
      { y0: 62, y1: 200, gloss: [70, 140, 8, 30, 0.1] }
    )
    for (const [x, y, r] of [
      [40, 80, 11],
      [128, 58, 13],
      [216, 80, 11]
    ])
      shape(c, circle(x, y, r), '#ffd23f', { lw: 5, gloss: [x - 4, y - 4, r * 0.4, r * 0.3] })
    shape(c, P('M128 104 L 144 128 L 128 152 L 112 128 Z'), '#3b9cff', {
      lw: 5,
      gloss: [122, 120, 5, 8]
    })
    shape(c, rrect(42, 166, 172, 36, 12), '#e8a92a', { y0: 166, y1: 202 })
    shape(c, ell(128, 184, 14, 12), '#ef4444', { lw: 4, gloss: [124, 179, 5, 4] })
    shape(c, ell(80, 184, 10, 9), '#5cc25b', { lw: 4, gloss: [77, 180, 4, 3] })
    shape(c, ell(176, 184, 10, 9), '#b06cff', { lw: 4, gloss: [173, 180, 4, 3] })
    shape(c, star(176, 132, 7, 3, 4), '#ffffff', { line: false })
  },
  guitar(c) {
    c.save()
    c.translate(116, 138)
    c.rotate(0.72)
    // cần + đầu đàn
    shape(c, rrect(-15, -146, 30, 40, 9), '#6b4430', { y0: -146, y1: -106 })
    for (const y of [-136, -124, -114]) {
      shape(c, circle(-21, y, 5), '#e6eefa', { lw: 3 })
      shape(c, circle(21, y, 5), '#e6eefa', { lw: 3 })
    }
    shape(c, rrect(-9, -112, 18, 90, 4), '#8a5a3a', { y0: -112, y1: -22 })
    for (const y of [-96, -80, -64, -48]) line(c, `M-8 ${y} L 8 ${y}`, 3, '#e8c7a0')
    // thân đàn
    const body = P(
      'M0 -36 C 24 -36, 34 -22, 31 -6 C 29 6, 28 12, 38 22 C 52 36, 50 90, 0 92 C -50 90, -52 36, -38 22 C -28 12, -29 6, -31 -6 C -34 -22, -24 -36, 0 -36 Z'
    )
    shape(c, body, '#f5a54a', { y0: -36, y1: 92, gloss: [-22, 40, 8, 20, 0] })
    c.save()
    c.clip(body)
    c.lineWidth = 8
    c.strokeStyle = '#d9822b'
    c.stroke(body)
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(body)
    shape(c, circle(0, 22, 21), '#ffd9a0', { lw: 4 })
    flat(c, circle(0, 22, 15), INK)
    shape(c, rrect(-22, 62, 44, 11, 4), '#6b4430', { lw: 4 })
    for (const x of [-5, 0, 5]) line(c, `M${x} -128 L ${x} 66`, 1.6, 'rgba(255,255,255,.85)')
    c.restore()
  }
}
