// Gia đình & đồ trong nhà: dad, grandma, house, door, bed, chair, television. Khung 256×256, xem kit.ts.
import {
  INK,
  P,
  SKIN,
  TAU,
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

export const PICTURES: Record<string, Painter> = {
  dad(c) {
    shadow(c)
    shape(c, P('M72 238 Q 74 186 128 182 Q 182 186 184 238 Z'), '#4d8fe0', { y0: 182, y1: 238 })
    shape(c, P('M120 192 L 136 192 L 140 238 L 116 238 Z'), '#ef4444', { lw: 4, y0: 192, y1: 238 })
    shape(c, P('M128 186 L 98 180 L 108 212 Z'), '#ffffff', { lw: 4 })
    shape(c, P('M128 186 L 158 180 L 148 212 Z'), '#ffffff', { lw: 4 })
    shape(c, ell(68, 140, 12, 16), SKIN)
    shape(c, ell(188, 140, 12, 16), SKIN)
    shape(c, ell(128, 128, 60, 62), SKIN, { y0: 66, y1: 190 })
    shape(
      c,
      P(
        'M68 128 C 58 52, 198 52, 188 128 C 184 110, 178 100, 170 94 C 146 106, 112 104, 94 88 C 82 98, 72 110, 68 128 Z'
      ),
      '#3a2a24',
      { y0: 56, y1: 128, gloss: [110, 70, 26, 7, -0.2] }
    )
    line(c, 'M90 118 Q 104 110 118 116', 7)
    line(c, 'M138 116 Q 152 110 166 118', 7)
    eye(c, 104, 140)
    eye(c, 152, 140)
    cheek(c, 86, 160)
    cheek(c, 170, 160)
    smile(c, 128, 162, 12)
  },
  grandma(c) {
    shadow(c)
    shape(c, P('M72 238 Q 74 186 128 182 Q 182 186 184 238 Z'), '#b07cd8', { y0: 182, y1: 238 })
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.18 + (i / 6) * 0.64)
      shape(c, ell(128 - Math.cos(a) * 40, 182 + Math.sin(a) * 22, 6, 6), '#ffffff', { lw: 3 })
    }
    shape(c, ell(128, 58, 30, 26), '#d4d4de', { y0: 32, y1: 84, gloss: [118, 46, 10, 5, -0.3] })
    shape(c, ell(150, 70, 7, 7), '#ff7aa8', { lw: 3 })
    shape(c, ell(66, 142, 12, 16), SKIN)
    shape(c, ell(190, 142, 12, 16), SKIN)
    shape(c, ell(128, 132, 60, 60), SKIN, { y0: 72, y1: 192 })
    shape(
      c,
      P(
        'M62 142 C 52 64, 204 64, 194 142 C 188 118, 176 102, 158 96 C 146 104, 112 104, 98 96 C 80 102, 68 118, 62 142 Z'
      ),
      '#d4d4de',
      { y0: 70, y1: 142, gloss: [104, 84, 24, 7, -0.3] }
    )
    line(c, 'M128 76 Q 126 90 128 100', 3, '#a9a9b8')
    eye(c, 104, 144, 8)
    eye(c, 152, 144, 8)
    c.lineWidth = 4
    c.strokeStyle = INK
    for (const x of [104, 152]) {
      c.beginPath()
      c.arc(x, 142, 18, 0, TAU)
      c.stroke()
    }
    line(c, 'M122 140 Q 128 135 134 140', 4)
    cheek(c, 84, 168)
    cheek(c, 172, 168)
    smile(c, 128, 170, 10)
  },
  house(c) {
    shadow(c, 232, 92)
    shape(c, rrect(160, 50, 26, 48, 5), '#b5794a', { y0: 50, y1: 98 })
    shape(c, rrect(154, 42, 38, 14, 5), '#8a5a3a', { lw: 5 })
    shape(c, rrect(54, 116, 148, 112, 12), '#ffe3b3', { y0: 116, y1: 228 })
    shape(
      c,
      P('M34 122 L 128 38 L 222 122 Q 226 136 212 136 L 44 136 Q 30 136 34 122 Z'),
      '#ef5b4c',
      {
        y0: 38,
        y1: 136,
        gloss: [96, 84, 30, 8, -0.7]
      }
    )
    shape(c, P('M106 228 L 106 180 Q 106 160 128 160 Q 150 160 150 180 L 150 228 Z'), '#b5794a', {
      y0: 160,
      y1: 228
    })
    flat(c, circle(141, 198, 4), INK)
    for (const x of [64, 160]) {
      shape(c, rrect(x, 152, 34, 34, 7), '#8fd3ff', {
        lw: 5,
        y0: 152,
        y1: 186,
        gloss: [x + 10, 160, 8, 4, -0.5]
      })
      line(c, `M${x + 17} 154 L ${x + 17} 184 M${x + 2} 169 L ${x + 32} 169`, 4)
    }
    shape(c, circle(128, 102, 13), '#ffe066', { lw: 5 })
  },
  door(c) {
    shadow(c, 234, 80)
    const frame = P('M60 230 L 60 84 Q 60 20 128 20 Q 196 20 196 84 L 196 230 Z')
    shape(c, frame, '#8a5a3a', { y0: 20, y1: 230 })
    const leaf = P('M74 226 L 74 88 Q 74 36 128 36 Q 182 36 182 88 L 182 226 Z')
    shape(c, leaf, '#d98b4e', { y0: 36, y1: 226, gloss: [96, 70, 10, 26, 0.3] })
    shape(c, P('M96 102 L 96 86 Q 96 58 128 58 Q 160 58 160 86 L 160 102 Z'), '#8fd3ff', {
      lw: 5,
      y0: 58,
      y1: 102,
      gloss: [112, 72, 10, 5, -0.5]
    })
    c.save()
    c.clip(leaf)
    flat(c, rrect(96, 120, 64, 88, 10), 'rgba(140,80,40,.28)')
    c.restore()
    line(c, 'M96 208 L 96 130 Q 96 120 106 120 L 150 120 Q 160 120 160 130', 4, '#a8653a')
    shape(c, circle(164, 152, 10), '#ffd23f', { lw: 5, gloss: [161, 148, 4, 3] })
    shape(c, rrect(70, 222, 116, 14, 7), '#ff7aa8', { lw: 5 })
  },
  bed(c) {
    shadow(c, 234, 104)
    tube(c, 'M50 200 L 50 226 M206 200 L 206 226', '#8a5a3a', 8)
    shape(c, rrect(30, 88, 34, 132, 14), '#c98a52', { y0: 88, y1: 220, gloss: [40, 108, 5, 14] })
    shape(c, rrect(194, 140, 30, 80, 12), '#c98a52', { y0: 140, y1: 220 })
    shape(c, rrect(54, 150, 150, 52, 16), '#ffffff', { y0: 150, y1: 202 })
    shape(c, ell(94, 142, 34, 18, -0.08), '#ffffff', { lw: 5, gloss: [84, 134, 14, 5, -0.1] })
    shape(
      c,
      P('M118 134 Q 172 128 210 140 L 210 206 Q 160 214 112 206 Q 104 170 118 134 Z'),
      '#7cc7ff',
      {
        y0: 128,
        y1: 210,
        gloss: [156, 140, 30, 5, -0.05]
      }
    )
    line(c, 'M114 172 Q 162 166 208 174', 4, '#4fa3e0')
    for (const [x, y] of [
      [140, 154],
      [182, 152],
      [160, 190],
      [196, 192],
      [130, 192]
    ])
      flat(c, circle(x, y, 5), '#ffffff')
  },
  chair(c) {
    shadow(c, 232, 76)
    tube(c, 'M92 160 L 92 214 M164 160 L 164 214', '#b06a32', 12)
    tube(c, 'M86 140 L 86 50 M170 140 L 170 50', '#d98b4e', 14)
    shape(c, rrect(74, 36, 108, 44, 20), '#d98b4e', {
      y0: 36,
      y1: 80,
      gloss: [100, 48, 18, 5, -0.1]
    })
    shape(c, rrect(92, 86, 72, 14, 7), '#d98b4e', { lw: 5 })
    shape(c, rrect(60, 140, 136, 30, 12), '#d98b4e', { y0: 140, y1: 170 })
    shape(c, P('M70 144 Q 70 118 128 118 Q 186 118 186 144 Z'), '#ff7aa8', {
      lw: 5,
      y0: 118,
      y1: 144,
      gloss: [112, 126, 22, 5, -0.05]
    })
    tube(c, 'M74 170 L 70 228 M182 170 L 186 228', '#d98b4e', 14)
  },
  television(c) {
    shadow(c, 234, 80)
    tube(c, 'M128 72 L 88 26 M128 72 L 170 22', '#9aa3ad', 5)
    shape(c, circle(88, 26, 9), '#ff5b5b', { lw: 5 })
    shape(c, circle(170, 22, 9), '#ff5b5b', { lw: 5 })
    shape(c, ell(128, 74, 22, 12), '#6b7280', { lw: 5 })
    tube(c, 'M76 206 L 68 226 M180 206 L 188 226', '#6b4430', 10)
    shape(c, rrect(32, 78, 192, 132, 26), '#ff9f43', {
      y0: 78,
      y1: 210,
      gloss: [70, 92, 22, 6, -0.1]
    })
    const scr = rrect(50, 96, 120, 96, 20)
    shape(c, scr, '#5ab0ff', { y0: 96, y1: 192 })
    c.save()
    c.clip(scr)
    c.fillStyle = 'rgba(255,255,255,.45)'
    c.beginPath()
    c.moveTo(70, 96)
    c.lineTo(100, 96)
    c.lineTo(66, 192)
    c.lineTo(50, 192)
    c.closePath()
    c.fill()
    c.restore()
    for (const y of [118, 152]) {
      shape(c, circle(196, y, 12), '#ffe066', { lw: 5 })
      line(c, `M196 ${y} L 196 ${y - 8}`, 4)
    }
    line(c, 'M186 180 L 206 180 M186 192 L 206 192', 4)
  }
}
