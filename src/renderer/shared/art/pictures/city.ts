// Xe cộ & đồ dùng trong thành phố (nhìn ngang, không mặt — giống motorbike). Khung 256×256, xem kit.ts.
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
  tube,
  type Painter
} from '../kit'

/** Bánh xe: lốp tối + mâm bạc. */
function wheel(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  shape(c, ell(x, y, r, r), '#3d3d4f', { y0: y - r, y1: y + r })
  shape(c, ell(x, y, r * 0.42, r * 0.42), '#c9ced6', { lw: 4 })
}

/** Ô cửa kính xanh nhạt có vệt sáng. */
function glass(c: CanvasRenderingContext2D, p: Path2D, y0: number, y1: number, gx: number): void {
  shape(c, p, '#bfe6ff', { y0, y1, lw: 4 })
  c.save()
  c.clip(p)
  line(c, `M${gx} ${y1 + 4} L ${gx + 18} ${y0 - 4}`, 7, 'rgba(255,255,255,.7)')
  c.restore()
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

export const PICTURES: Record<string, Painter> = {
  car(c) {
    shadow(c, 228, 104)
    const body = P(
      'M32 186 L 32 152 Q 32 134 52 132 L 72 130 Q 88 82 128 80 Q 168 80 186 128 L 206 132 Q 226 136 226 158 L 226 186 Q 226 198 214 198 L 44 198 Q 32 198 32 186 Z'
    )
    shape(c, body, '#f2554f', { y0: 80, y1: 198, gloss: [96, 146, 46, 7, -0.03] })
    glass(c, P('M136 94 Q 162 96 174 128 L 136 128 Z'), 94, 128, 144)
    glass(c, P('M120 94 Q 96 96 84 128 L 120 128 Z'), 94, 128, 92)
    line(c, 'M128 136 L 128 180', 4)
    line(c, 'M140 146 L 154 146', 5)
    shape(c, ell(218, 150, 7, 9), '#ffe066', { lw: 4 })
    shape(c, rrect(28, 146, 12, 16, 5), '#ffb03a', { lw: 4 })
    shape(c, rrect(24, 180, 210, 14, 7), '#c9ced6', { lw: 5 })
    wheel(c, 78, 194, 25)
    wheel(c, 182, 194, 25)
  },
  van(c) {
    shadow(c, 230, 106)
    const body = P(
      'M28 192 L 28 76 Q 28 60 44 60 L 166 60 Q 180 60 186 72 L 206 118 L 218 122 Q 230 126 230 144 L 230 192 Q 230 202 220 202 L 38 202 Q 28 202 28 192 Z'
    )
    shape(c, body, '#4fb3e8', { y0: 60, y1: 202, gloss: [80, 74, 40, 6, 0] })
    c.save()
    c.clip(body)
    flat(c, P('M20 150 L 240 150 L 240 166 L 20 166 Z'), '#ffffff')
    c.restore()
    glass(c, P('M162 74 Q 174 74 178 82 L 194 118 L 162 118 Z'), 74, 118, 168)
    line(c, 'M152 66 L 152 192', 4)
    // cửa lùa: ray trên + tấm cửa + tay nắm dọc
    line(c, 'M50 80 L 140 80', 4)
    shape(c, rrect(58, 88, 76, 98, 8), '#3d9fd6', { y0: 88, y1: 186, lw: 4 })
    glass(c, rrect(66, 96, 60, 34, 7), 96, 130, 74)
    line(c, 'M68 140 L 82 140', 5)
    line(c, 'M40 96 L 40 144', 4, '#2b84b8')
    shape(c, ell(224, 146, 6, 9), '#ffe066', { lw: 4 })
    shape(c, rrect(22, 182, 214, 14, 7), '#c9ced6', { lw: 5 })
    wheel(c, 72, 200, 24)
    wheel(c, 190, 200, 24)
  },
  bus(c) {
    shadow(c, 228, 112)
    const body = P(
      'M18 70 Q 18 58 32 58 L 214 58 Q 238 58 238 90 L 238 186 Q 238 198 226 198 L 30 198 Q 18 198 18 186 Z'
    )
    shape(c, body, '#ffc83d', { y0: 58, y1: 198, gloss: [90, 66, 60, 4, 0] })
    c.save()
    c.clip(body)
    flat(c, P('M10 140 L 246 140 L 246 152 L 10 152 Z'), '#ef6a3a')
    c.restore()
    for (const x of [30, 72, 114]) glass(c, rrect(x, 76, 34, 44, 8), 76, 120, x + 4)
    glass(c, P('M200 76 L 216 76 Q 230 78 230 96 L 230 124 L 200 124 Z'), 76, 124, 206)
    shape(c, rrect(158, 76, 34, 108, 6), '#ffb21a', { y0: 76, y1: 184, lw: 4 })
    glass(c, rrect(164, 82, 22, 50, 5), 82, 132, 166)
    line(c, 'M175 136 L 175 180', 4)
    shape(c, ell(230, 168, 6, 8), '#ffffff', { lw: 4 })
    shape(c, rrect(14, 184, 228, 12, 6), '#c9ced6', { lw: 5 })
    wheel(c, 66, 196, 23)
    wheel(c, 200, 196, 23)
  },
  bicycle(c) {
    shadow(c, 226, 104)
    for (const x of [64, 192]) {
      const rim = new Path2D()
      rim.arc(x, 172, 40, 0, TAU)
      tube(c, rim, '#4a4a60', 6)
      c.lineWidth = 2.5
      c.strokeStyle = '#a8b0bc'
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI
        c.beginPath()
        c.moveTo(x - Math.cos(a) * 32, 172 - Math.sin(a) * 32)
        c.lineTo(x + Math.cos(a) * 32, 172 + Math.sin(a) * 32)
        c.stroke()
      }
      shape(c, circle(x, 172, 7), '#c9ced6', { lw: 4 })
    }
    tube(
      c,
      'M64 172 L 106 112 L 124 176 L 64 172 M106 112 L 172 108 L 124 176 M172 108 L 192 172',
      '#ff6b8a',
      8
    )
    tube(c, 'M106 112 L 102 96', '#5a5a70', 6)
    tube(c, 'M172 108 L 166 82 Q 168 72 184 74', '#5a5a70', 6)
    shape(c, P('M84 94 Q 100 82 124 90 Q 122 102 104 102 Q 88 102 84 94 Z'), '#5a3a2a', {
      y0: 84,
      y1: 102,
      gloss: [100, 89, 10, 3, -0.1]
    })
    shape(c, rrect(178, 68, 18, 12, 6), '#3d3d4f', { lw: 4 })
    shape(c, circle(124, 176, 12), '#c9ced6', { lw: 4 })
    line(c, 'M124 176 L 136 196', 6)
    shape(c, rrect(128, 194, 18, 7, 3), '#3d3d4f', { lw: 3 })
  },
  train(c) {
    // ray
    for (let x = 24; x <= 232; x += 26) shape(c, rrect(x - 9, 214, 18, 12, 3), '#a0714a', { lw: 3 })
    line(c, 'M12 216 L 244 216', 8, INK)
    line(c, 'M14 216 L 242 216', 3, '#c9ced6')
    // khói
    for (const [x, y, r] of [
      [184, 40, 16],
      [208, 26, 12],
      [230, 18, 9]
    ])
      shape(c, circle(x, y, r), '#f2f4f8', { lw: 4 })
    // nồi hơi + ống khói
    shape(c, rrect(166, 58, 24, 52, 5), '#3d3d4f', { y0: 58, y1: 110 })
    shape(c, rrect(158, 52, 40, 14, 6), '#3d3d4f', { lw: 5 })
    const boiler = P('M96 112 L 204 112 Q 226 112 226 148 Q 226 184 204 184 L 96 184 Z')
    shape(c, boiler, '#3f8be0', { y0: 112, y1: 184, gloss: [160, 124, 40, 6, 0] })
    line(c, 'M140 114 L 140 182', 6, '#f5c542')
    line(c, 'M180 114 L 180 182', 6, '#f5c542')
    shape(c, ell(226, 148, 9, 13), '#ffe066', { lw: 4 })
    shape(c, P('M206 184 L 236 184 L 244 206 L 200 206 Z'), '#f2554f', { y0: 184, y1: 206, lw: 5 })
    // buồng lái
    shape(c, rrect(30, 70, 76, 128, 10), '#f2554f', { y0: 70, y1: 198, gloss: [56, 92, 12, 18, 0] })
    shape(c, rrect(22, 56, 92, 20, 8), '#3d3d4f', { lw: 5 })
    glass(c, rrect(46, 88, 44, 40, 8), 88, 128, 52)
    shape(c, rrect(24, 186, 210, 14, 7), '#3d3d4f', { lw: 5 })
    for (const [x, r] of [
      [66, 26],
      [142, 18],
      [188, 18]
    ]) {
      shape(c, ell(x, 202 - r + 12, r, r), '#f2554f', { y0: 190 - r, y1: 214 })
      shape(c, ell(x, 202 - r + 12, r * 0.4, r * 0.4), '#f5c542', { lw: 4 })
    }
    line(c, 'M66 188 L 188 196', 6)
  },
  phone(c) {
    shadow(c, 232, 62)
    const body = rrect(74, 22, 108, 204, 24)
    shape(c, body, '#4a4a66', { y0: 22, y1: 226 })
    const screen = rrect(84, 42, 88, 162, 10)
    const g = c.createLinearGradient(0, 42, 0, 204)
    g.addColorStop(0, '#9fd8ff')
    g.addColorStop(1, '#b9a8ff')
    c.fillStyle = g
    c.fill(screen)
    const colors = [
      '#ff6b6b',
      '#ffc83d',
      '#5cc25b',
      '#45b3f7',
      '#9b6cff',
      '#ff8ac0',
      '#ff9f43',
      '#38c6a8',
      '#f2f4f8'
    ]
    colors.forEach((col, i) => {
      const x = 94 + (i % 3) * 24
      const y = 58 + Math.floor(i / 3) * 28
      shape(c, rrect(x, y, 20, 20, 6), col, { y0: y, y1: y + 20, lw: 3 })
    })
    shape(c, rrect(94, 160, 68, 28, 9), '#ffffff', { lw: 3 })
    line(c, 'M104 170 L 136 170', 4, '#9fb3cc')
    line(c, 'M104 179 L 124 179', 4, '#c9d3e0')
    c.lineWidth = 4
    c.strokeStyle = INK
    c.stroke(screen)
    line(c, 'M116 32 L 140 32', 4, '#2a2a3c')
    flat(c, circle(150, 32, 3), '#2a2a3c')
    line(c, 'M114 215 L 142 215', 4, '#8a8aa6')
    c.save()
    c.clip(body)
    flat(c, P('M74 22 L 120 22 L 74 96 Z'), 'rgba(255,255,255,.18)')
    c.restore()
  },
  laptop(c) {
    shadow(c, 222, 104)
    // màn hình
    shape(c, rrect(52, 34, 152, 116, 14), '#5b6478', { y0: 34, y1: 150 })
    const scr = rrect(64, 46, 128, 92, 6)
    const g = c.createLinearGradient(0, 46, 0, 138)
    g.addColorStop(0, '#8fd3ff')
    g.addColorStop(1, '#5aa0f0')
    c.fillStyle = g
    c.fill(scr)
    c.save()
    c.clip(scr)
    flat(c, P('M64 138 L 98 108 L 122 126 L 150 96 L 192 138 Z'), '#7ed36b')
    flat(c, circle(166, 70, 11), '#ffe066')
    flat(c, P('M64 46 L 112 46 L 64 96 Z'), 'rgba(255,255,255,.22)')
    c.restore()
    c.lineWidth = 4
    c.strokeStyle = INK
    c.stroke(scr)
    flat(c, circle(128, 41, 2.5), '#2a2a3c')
    // đế + bàn phím
    shape(c, P('M30 202 L 48 154 L 208 154 L 226 202 Z'), '#c9ced6', { y0: 154, y1: 202 })
    for (let r = 0; r < 3; r++) {
      const y = 160 + r * 10
      const inset = 52 - r * 4
      const n = 9
      const w = (256 - inset * 2) / n
      for (let i = 0; i < n; i++) flat(c, rrect(inset + i * w + 1.5, y, w - 3, 7, 2), '#5b6478')
    }
    shape(c, rrect(108, 190, 40, 8, 3), '#aeb5c0', { lw: 3 })
    shape(c, rrect(24, 198, 208, 14, 7), '#aeb5c0', { lw: 5 })
  },
  clock(c) {
    shadow(c, 230, 64)
    tube(c, 'M90 214 L 80 226', '#3d3d4f', 8)
    tube(c, 'M166 214 L 176 226', '#3d3d4f', 8)
    for (const [x, rot] of [
      [72, -0.45],
      [184, 0.45]
    ])
      turned(c, rot, x, 60, () =>
        shape(
          c,
          P(`M${x - 28} 74 Q ${x - 26} 36 ${x} 36 Q ${x + 26} 36 ${x + 28} 74 Z`),
          '#f5c542',
          {
            y0: 36,
            y1: 74,
            gloss: [x - 10, 50, 7, 5, -0.5]
          }
        )
      )
    line(c, 'M90 44 Q 128 14 166 44', 8)
    shape(c, circle(128, 28, 8), '#f5c542', { lw: 4 })
    shape(c, circle(128, 134, 80), '#ff7a59', { y0: 54, y1: 214, gloss: [84, 84, 20, 10, -0.6] })
    shape(c, circle(128, 134, 62), '#fffaf0', { y0: 72, y1: 196, lw: 5 })
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU
      const big = i % 3 === 0
      const r0 = big ? 44 : 49
      line(
        c,
        `M${128 + Math.cos(a) * r0} ${134 + Math.sin(a) * r0} L ${128 + Math.cos(a) * 54} ${134 + Math.sin(a) * 54}`,
        big ? 6 : 4,
        big ? INK : '#8a7a88'
      )
    }
    line(c, 'M128 134 L 102 118', 9)
    line(c, 'M128 134 L 160 104', 7)
    line(c, 'M128 134 L 128 172', 3, '#ef4444')
    shape(c, circle(128, 134, 8), '#ff7a59', { lw: 4 })
  },
  key(c) {
    shadow(c, 210, 84)
    turned(c, -0.35, 128, 146, () => {
      c.translate(0, 14)
      const blade = P(
        'M112 118 L 214 118 Q 228 118 228 132 L 228 172 L 212 172 L 212 156 L 200 156 L 200 172 L 182 172 L 182 146 L 112 146 Z'
      )
      shape(c, blade, '#f5c542', { y0: 118, y1: 172, gloss: [160, 124, 44, 4, 0] })
      const bow = new Path2D()
      bow.arc(74, 132, 46, 0, TAU)
      bow.moveTo(94, 132)
      bow.arc(74, 132, 20, 0, TAU, true)
      shape(c, bow, '#f5c542', { y0: 86, y1: 178, gloss: [52, 104, 18, 9, -0.7] })
      line(c, 'M120 128 L 170 128', 4, '#d9a521')
      shape(c, rrect(114, 112, 14, 40, 6), '#e0ad2a', { lw: 4 })
    })
  }
}
