// Đồ vật quanh bé (books, pencil, scissors, rocket, flag, lightbulb, toothbrush, hammer, piano, trophy).
// Khung 256×256, xem kit.ts. Đồ vật không có mặt.
import {
  INK,
  P,
  circle,
  ell,
  flat,
  line,
  rrect,
  shadow,
  shape,
  star,
  tube,
  type Painter
} from '../kit'

/** Một quyển sách nằm ngang: bìa màu, gáy sọc, mép giấy bên phải. */
function book(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  stripe: string
): void {
  shape(c, rrect(x, y, w, h, 8), color, { y0: y, y1: y + h, gloss: [x + 40, y + 8, 26, 3] })
  shape(c, rrect(x + w - 34, y + 7, 28, h - 14, 4), '#fff8e6', { lw: 4, y0: y, y1: y + h })
  line(c, `M${x + w - 30} ${y + h / 2 - 4} L ${x + w - 10} ${y + h / 2 - 4}`, 2, '#d9cdb0')
  line(c, `M${x + w - 30} ${y + h / 2 + 4} L ${x + w - 10} ${y + h / 2 + 4}`, 2, '#d9cdb0')
  flat(
    c,
    P(
      `M${x + 18} ${y + 3} L ${x + 26} ${y + 3} L ${x + 26} ${y + h - 3} L ${x + 18} ${y + h - 3} Z`
    ),
    stripe
  )
  flat(
    c,
    P(
      `M${x + 34} ${y + 3} L ${x + 40} ${y + 3} L ${x + 40} ${y + h - 3} L ${x + 34} ${y + h - 3} Z`
    ),
    stripe
  )
}

/** Ngôi sao lấp lánh 4 cánh nhỏ. */
function sparkle(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  shape(c, star(x, y, r, r * 0.35, 4), color, { lw: 4, y0: y - r, y1: y + r })
}

export const PICTURES: Record<string, Painter> = {
  books(c) {
    shadow(c, 220, 100)
    book(c, 30, 170, 196, 42, '#ef4444', '#ffd23f')
    book(c, 46, 128, 176, 42, '#3b82f6', '#9fd3ff')
    c.save()
    c.translate(128, 108)
    c.rotate(-0.07)
    book(c, -86, -22, 164, 40, '#22c55e', '#ffffff')
    c.restore()
    // dải đánh dấu trang
    shape(c, P('M100 88 L 112 86 L 116 64 L 108 70 L 98 64 Z'), '#ff6b8a', {
      lw: 4,
      y0: 64,
      y1: 90
    })
    sparkle(c, 200, 52, 14, '#ffd23f')
  },

  pencil(c) {
    shadow(c, 222, 84)
    c.save()
    c.translate(128, 124)
    c.rotate(-Math.PI / 4)
    c.translate(-128, -128)
    // gỗ vót + ngòi chì
    const cone = P('M178 106 L 226 128 L 178 150 Z')
    shape(c, cone, '#f2c99a', { y0: 106, y1: 150 })
    c.save()
    c.clip(cone)
    flat(c, P('M206 100 L 240 100 L 240 156 L 206 156 Z'), '#4a4458')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(cone)
    // thân vàng ba mặt
    const body = P('M76 106 L 180 106 Q 186 128 180 150 L 76 150 Z')
    shape(c, body, '#ffcc33', { y0: 106, y1: 150 })
    c.save()
    c.clip(body)
    flat(c, P('M70 106 L 190 106 L 190 118 L 70 118 Z'), '#ffe58a')
    flat(c, P('M70 138 L 190 138 L 190 150 L 70 150 Z'), '#f2a91c')
    c.restore()
    c.stroke(body)
    line(c, 'M78 118 L 182 118 M78 138 L 182 138', 3, '#d9901a')
    // tẩy + đai kim loại
    shape(c, rrect(28, 106, 44, 44, 14), '#ff8fb1', { y0: 106, y1: 150, gloss: [42, 114, 8, 4] })
    shape(c, rrect(60, 102, 24, 52, 5), '#c9ced6', { y0: 102, y1: 154, lw: 5 })
    line(c, 'M68 106 L 68 150 M76 106 L 76 150', 3, '#8d96a6')
    c.restore()
  },

  scissors(c) {
    shadow(c, 226, 70)
    const arm = (a: number, color: string): void => {
      c.save()
      c.translate(128, 120)
      c.rotate(a)
      tube(c, 'M0 4 L 0 34', color, 16)
      const ring = ell(0, 64, 22, 28)
      tube(c, ring, color, 15)
      c.strokeStyle = 'rgba(255,255,255,.5)'
      c.lineWidth = 4
      c.beginPath()
      c.ellipse(0, 64, 22, 28, 0, Math.PI * 1.1, Math.PI * 1.45)
      c.stroke()
      shape(c, P('M-11 8 C -13 -30, -8 -74, 0 -100 C 6 -70, 12 -30, 11 8 Z'), '#d6dde8', {
        y0: -100,
        y1: 10,
        gloss: [-4, -50, 3, 34]
      })
      c.restore()
    }
    arm(-0.38, '#ef4444')
    arm(0.38, '#3b82f6')
    shape(c, circle(128, 120, 9), '#ffd23f', { lw: 4 })
    flat(c, circle(126, 118, 3), 'rgba(255,255,255,.8)')
  },

  rocket(c) {
    for (const [x, y, r] of [
      [38, 56, 13],
      [214, 72, 10],
      [206, 196, 12],
      [56, 156, 8]
    ])
      sparkle(c, x, y, r, '#ffd23f')
    c.save()
    c.translate(128, 128)
    c.rotate(0.4)
    c.translate(-128, -128)
    // lửa
    shape(c, P('M100 170 Q 96 206 128 236 Q 160 206 156 170 Z'), '#ff7a1a', { y0: 170, y1: 236 })
    shape(c, P('M112 170 Q 110 196 128 216 Q 146 196 144 170 Z'), '#ffd23f', {
      y0: 170,
      y1: 216,
      line: false
    })
    // cánh
    shape(c, P('M92 120 Q 62 136 60 180 L 96 162 Z'), '#ef4444', { y0: 120, y1: 180 })
    shape(c, P('M164 120 Q 194 136 196 180 L 160 162 Z'), '#ef4444', { y0: 120, y1: 180 })
    shape(c, rrect(104, 158, 48, 16, 6), '#8d96a6', { lw: 5 })
    // thân
    const body = P('M128 20 C 168 48, 176 110, 164 166 L 92 166 C 80 110, 88 48, 128 20 Z')
    shape(c, body, '#f4f6fb', { y0: 20, y1: 166 })
    c.save()
    c.clip(body)
    flat(c, P('M60 0 L 200 0 L 200 58 Q 128 70 60 58 Z'), '#ef4444')
    flat(c, P('M60 150 L 200 150 L 200 170 L 60 170 Z'), '#ef4444')
    flat(c, ell(104, 110, 6, 40), 'rgba(255,255,255,.7)')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.stroke(body)
    line(c, 'M94 58 Q 128 70 162 58', 5)
    line(c, 'M90 150 L 166 150', 5)
    shape(c, ell(128, 152, 6, 22), '#ef4444', { lw: 5, y0: 130, y1: 174 })
    // cửa sổ
    shape(c, circle(128, 100, 22), '#c9ced6', { lw: 5, y0: 78, y1: 122 })
    shape(c, circle(128, 100, 14), '#6ec6ff', { lw: 4, y0: 86, y1: 114 })
    flat(c, ell(123, 95, 5, 3, -0.6), 'rgba(255,255,255,.9)')
    c.restore()
  },

  flag(c) {
    shadow(c, 228, 60, 80)
    shape(c, P('M50 228 Q 50 208 80 208 Q 110 208 110 228 Z'), '#8a5a3a', { y0: 208, y1: 228 })
    tube(c, 'M80 40 L 80 210', '#c9ced6', 9)
    line(c, 'M78 46 L 78 204', 3, 'rgba(255,255,255,.7)')
    // lá cờ gợn sóng, một màu tím với dải vàng (không phải cờ nước nào)
    const cloth = P('M84 44 C 120 28, 160 64, 222 46 L 222 140 C 160 158, 120 122, 84 138 Z')
    shape(c, cloth, '#9b6cff', { y0: 36, y1: 150 })
    c.save()
    c.clip(cloth)
    flat(c, P('M70 80 C 120 64, 160 100, 240 82 L 240 106 C 160 124, 120 88, 70 104 Z'), '#ffd23f')
    flat(c, ell(112, 56, 22, 6, -0.3), 'rgba(255,255,255,.45)')
    c.restore()
    c.lineWidth = 6
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(cloth)
    line(c, 'M86 92 C 124 76, 160 112, 222 94', 3, '#e0a800')
    shape(c, circle(80, 32, 12), '#ffd23f', { lw: 5, gloss: [76, 28, 4, 3] })
  },

  lightbulb(c) {
    const g = c.createRadialGradient(128, 96, 20, 128, 96, 126)
    g.addColorStop(0, 'rgba(255,224,90,.55)')
    g.addColorStop(1, 'rgba(255,224,90,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
    for (const deg of [180, 212, 238, 302, 328, 360]) {
      const a = (deg / 180) * Math.PI
      const p = (r: number): string =>
        `${(128 + Math.cos(a) * r).toFixed(1)} ${(96 + Math.sin(a) * r).toFixed(1)}`
      line(c, `M${p(78)} L ${p(96)}`, 7, '#f5b400')
    }
    // đuôi xoáy
    shape(c, rrect(96, 166, 64, 46, 8), '#b8c0cc', { y0: 166, y1: 212 })
    line(c, 'M98 180 L 158 176 M98 194 L 158 190', 4, '#7d8696')
    shape(c, P('M108 210 L 148 210 Q 146 228 128 228 Q 110 228 108 210 Z'), '#4a4458', { lw: 5 })
    // bóng thuỷ tinh
    const bulb = P(
      'M100 170 C 100 146, 62 132, 62 96 C 62 58, 92 30, 128 30 C 164 30, 194 58, 194 96 C 194 132, 156 146, 156 170 Z'
    )
    shape(c, bulb, '#fff1a0', { y0: 30, y1: 170 })
    // dây tóc
    line(c, 'M116 168 L 112 116 M140 168 L 144 116', 4, '#8d96a6')
    line(
      c,
      'M112 116 Q 116 100 120 116 Q 124 100 128 116 Q 132 100 136 116 Q 140 100 144 116',
      5,
      '#ff8a1a'
    )
    flat(c, ell(92, 80, 10, 22, 0.4), 'rgba(255,255,255,.75)')
    flat(c, circle(102, 52, 5), 'rgba(255,255,255,.75)')
  },

  toothbrush(c) {
    shadow(c, 226, 96)
    c.save()
    c.translate(128, 140)
    c.rotate(-0.32)
    c.translate(-128, -140)
    // tay cầm
    shape(c, P('M30 150 Q 22 162 30 174 L 150 170 L 172 160 L 150 152 Z'), '#45b3f7', {
      y0: 150,
      y1: 176,
      gloss: [80, 156, 40, 3]
    })
    shape(c, rrect(60, 152, 52, 18, 9), '#9fe0c7', { lw: 4, y0: 152, y1: 170 })
    shape(c, rrect(160, 150, 74, 24, 10), '#45b3f7', { y0: 150, y1: 174 })
    // lông bàn chải
    shape(c, rrect(166, 118, 62, 34, 5), '#ffffff', { lw: 5, y0: 118, y1: 152 })
    line(
      c,
      'M178 122 L 178 148 M190 122 L 190 148 M202 122 L 202 148 M214 122 L 214 148',
      3,
      '#a8d8ff'
    )
    // kem đánh răng
    const paste = P(
      'M168 118 C 160 106, 172 96, 184 100 C 182 84, 206 80, 210 94 C 224 90, 234 104, 226 118 Z'
    )
    shape(c, paste, '#ffffff', { y0: 84, y1: 118 })
    c.save()
    c.clip(paste)
    line(c, 'M166 112 C 180 100, 200 112, 230 98', 6, '#5cd6b0')
    c.restore()
    shape(c, P('M190 92 Q 196 72 210 70 Q 204 82 206 94 Z'), '#ffffff', { lw: 5, y0: 70, y1: 94 })
    c.restore()
    for (const [x, y, r] of [
      [64, 74, 10],
      [92, 50, 7],
      [44, 112, 6]
    ])
      shape(c, circle(x, y, r), '#d6f0ff', { lw: 4, gloss: [x - r / 3, y - r / 3, r / 3, r / 4] })
  },

  hammer(c) {
    shadow(c, 232, 70)
    c.save()
    c.translate(128, 128)
    c.rotate(0.3)
    c.translate(-128, -128)
    // cán gỗ
    shape(c, rrect(114, 84, 28, 146, 12), '#d9a066', { y0: 84, y1: 230, gloss: [120, 140, 3, 40] })
    line(c, 'M130 104 Q 134 130 128 150 M124 160 Q 120 176 126 190', 3, '#b07a44')
    shape(c, rrect(110, 186, 36, 46, 12), '#ef4444', { y0: 186, y1: 232 })
    line(c, 'M112 200 L 144 200 M112 214 L 144 214', 3, '#b91c1c')
    // đầu búa
    shape(c, P('M170 56 Q 206 56 212 96 Q 196 80 170 88 Z'), '#8d96a6', { y0: 56, y1: 96 })
    shape(c, rrect(76, 50, 100, 40, 10), '#b8c0cc', { y0: 50, y1: 90, gloss: [110, 58, 28, 4] })
    shape(c, rrect(52, 42, 32, 56, 8), '#8d96a6', { y0: 42, y1: 98 })
    flat(c, rrect(58, 48, 6, 44, 3), 'rgba(255,255,255,.45)')
    c.restore()
  },

  piano(c) {
    shadow(c, 232, 100)
    // chân + bàn đạp
    shape(c, rrect(50, 206, 20, 22, 6), '#7a4a2e', { lw: 5 })
    shape(c, rrect(186, 206, 20, 22, 6), '#7a4a2e', { lw: 5 })
    // thân dưới
    shape(c, rrect(46, 164, 164, 48, 10), '#9b5a3a', { y0: 164, y1: 212 })
    shape(c, rrect(64, 176, 128, 26, 8), '#b06a44', { lw: 4, y0: 176, y1: 202 })
    shape(c, ell(116, 210, 7, 4), '#ffd23f', { lw: 3 })
    shape(c, ell(140, 210, 7, 4), '#ffd23f', { lw: 3 })
    // thân trên + nắp
    shape(c, rrect(42, 54, 172, 82, 14), '#9b5a3a', { y0: 54, y1: 136, gloss: [72, 66, 22, 5] })
    shape(c, rrect(32, 38, 192, 24, 10), '#7a4a2e', { y0: 38, y1: 62 })
    // giá nhạc + tờ nhạc
    shape(c, rrect(84, 72, 88, 44, 6), '#fff8e6', { lw: 4, y0: 72, y1: 116 })
    line(c, 'M94 86 L 162 86 M94 94 L 162 94 M94 102 L 162 102', 2, '#c9b98f')
    for (const [x, y] of [
      [104, 98],
      [124, 90],
      [144, 94]
    ]) {
      flat(c, ell(x, y, 4, 3, -0.4), INK)
      line(c, `M${x + 3} ${y} L ${x + 3} ${y - 14}`, 2)
    }
    // bàn phím
    shape(c, rrect(28, 130, 200, 40, 8), '#7a4a2e', { y0: 130, y1: 170 })
    const n = 10
    const kx = 36
    const kw = 184 / n
    shape(c, rrect(kx, 136, 184, 28, 4), '#ffffff', { lw: 4, y0: 136, y1: 164 })
    for (let i = 1; i < n; i++) line(c, `M${kx + i * kw} 136 L ${kx + i * kw} 164`, 3)
    for (const i of [1, 2, 4, 5, 6, 8, 9]) {
      const x = kx + i * kw
      shape(c, rrect(x - 5.5, 134, 11, 18, 3), '#3d3d4f', { lw: 3, y0: 134, y1: 152 })
    }
  },

  trophy(c) {
    shadow(c, 228, 80)
    sparkle(c, 40, 52, 14, '#ffe066')
    sparkle(c, 220, 84, 11, '#ffe066')
    sparkle(c, 206, 34, 8, '#ffe066')
    // quai
    tube(c, 'M78 58 C 34 56, 36 116, 92 118', '#f5b400', 12)
    tube(c, 'M178 58 C 222 56, 220 116, 164 118', '#f5b400', 12)
    // đế
    shape(c, rrect(68, 184, 120, 38, 10), '#7b4fd6', { y0: 184, y1: 222, gloss: [94, 192, 18, 4] })
    shape(c, rrect(98, 194, 60, 18, 4), '#ffd23f', { lw: 4 })
    shape(c, rrect(88, 166, 80, 22, 8), '#ffcc33', { y0: 166, y1: 188 })
    shape(c, P('M114 134 L 142 134 L 146 168 L 110 168 Z'), '#f5b400', { y0: 134, y1: 168 })
    // cốc
    const cup = P('M70 40 L 186 40 Q 188 124 128 142 Q 68 124 70 40 Z')
    shape(c, cup, '#ffcc33', { y0: 30, y1: 142 })
    c.save()
    c.clip(cup)
    flat(c, ell(92, 80, 9, 32, -0.15), 'rgba(255,255,255,.55)')
    c.restore()
    shape(c, ell(128, 40, 58, 10), '#ffe066', { lw: 5 })
    shape(c, star(128, 88, 24, 11), '#fff3b0', { lw: 4, y0: 64, y1: 112 })
  }
}
