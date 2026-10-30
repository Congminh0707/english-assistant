// 10 hình đầu tiên (bản thử đã duyệt 2026-10-30). Khung 256×256, xem kit.ts.
import {
  INK,
  P,
  SKIN,
  TAU,
  cheek,
  ell,
  eye,
  flat,
  happyEye,
  line,
  rrect,
  shadow,
  shape,
  smile,
  tube,
  type Painter
} from '../kit'

export const PICTURES: Record<string, Painter> = {
  mom(c) {
    shadow(c)
    shape(c, P('M58 138 C 44 50, 212 50, 198 138 L 206 214 Q 128 230 50 214 Z'), '#6b4430', {
      y0: 50,
      y1: 220
    })
    shape(c, P('M74 238 Q 76 184 128 180 Q 180 184 182 238 Z'), '#ff7aa8', { y0: 180, y1: 238 })
    shape(c, ell(128, 128, 60, 58), SKIN, { y0: 70, y1: 186 })
    shape(
      c,
      P('M66 126 C 62 60, 194 60, 190 126 C 172 100, 152 88, 130 100 C 108 86, 82 100, 66 126 Z'),
      '#6b4430',
      { y0: 60, y1: 126, gloss: [100, 78, 26, 7, -0.3] }
    )
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU
      shape(c, ell(180 + Math.cos(a) * 10, 84 + Math.sin(a) * 10, 8, 8), '#ffd23f', { lw: 3 })
    }
    shape(c, ell(180, 84, 6, 6), '#ff922b', { lw: 3 })
    eye(c, 104, 138)
    eye(c, 152, 138)
    line(c, 'M93 136 L 86 133', 4)
    line(c, 'M163 136 L 170 133', 4)
    cheek(c, 88, 158)
    cheek(c, 168, 158)
    smile(c, 128, 162, 11)
  },
  baby(c) {
    shadow(c)
    shape(c, P('M82 238 Q 82 192 128 188 Q 174 192 174 238 Z'), '#7cc7ff', { y0: 188, y1: 238 })
    shape(c, ell(56, 134, 13, 17), SKIN)
    shape(c, ell(200, 134, 13, 17), SKIN)
    shape(c, ell(128, 126, 74, 68), SKIN, { y0: 58, y1: 194, gloss: [94, 84, 20, 10, -0.5] })
    line(c, 'M126 60 C 112 42, 140 30, 148 44 C 152 56, 134 60, 134 50', 6, '#8a5a3a')
    shape(c, ell(128, 196, 30, 10), '#ffffff', { lw: 4 })
    eye(c, 100, 140, 12)
    eye(c, 156, 140, 12)
    cheek(c, 80, 164, 1.2)
    cheek(c, 176, 164, 1.2)
    shape(c, ell(128, 168, 7, 6), '#e0576b', { lw: 4 })
  },
  grandpa(c) {
    shadow(c)
    shape(c, P('M74 238 Q 76 186 128 182 Q 180 186 182 238 Z'), '#7a9e5a', { y0: 182, y1: 238 })
    shape(c, ell(70, 126, 20, 28, 0.2), '#eeeeee')
    shape(c, ell(186, 126, 20, 28, -0.2), '#eeeeee')
    shape(c, ell(66, 144, 12, 16), SKIN)
    shape(c, ell(190, 144, 12, 16), SKIN)
    shape(c, ell(128, 126, 62, 64), SKIN, { y0: 62, y1: 190, gloss: [104, 80, 24, 12, -0.4] })
    tube(c, 'M90 110 Q 104 100 118 108', '#f4f4f4', 6)
    tube(c, 'M138 108 Q 152 100 166 110', '#f4f4f4', 6)
    happyEye(c, 104, 136)
    happyEye(c, 152, 136)
    c.lineWidth = 4
    c.strokeStyle = INK
    c.beginPath()
    c.arc(104, 134, 19, 0, TAU)
    c.stroke()
    c.beginPath()
    c.arc(152, 134, 19, 0, TAU)
    c.stroke()
    line(c, 'M123 132 Q 128 127 133 132', 4)
    cheek(c, 84, 162)
    cheek(c, 172, 162)
    shape(c, ell(128, 152, 9, 8), '#f2c4a2', { lw: 4 })
    shape(
      c,
      P('M98 166 Q 112 150 128 160 Q 144 150 158 166 Q 142 178 128 168 Q 114 178 98 166 Z'),
      '#f4f4f4',
      {
        lw: 4
      }
    )
  },
  cat(c) {
    shadow(c)
    tube(c, 'M172 208 C 214 202, 224 162, 202 146', '#f5a54a', 14)
    shape(c, ell(128, 198, 54, 34), '#f5a54a', { y0: 164, y1: 232 })
    flat(c, ell(128, 208, 28, 18), '#ffe6c7')
    shape(c, ell(106, 228, 14, 9), '#ffe6c7', { lw: 4 })
    shape(c, ell(150, 228, 14, 9), '#ffe6c7', { lw: 4 })
    shape(c, P('M58 100 L 64 30 L 116 66 Z'), '#f5a54a')
    shape(c, P('M198 100 L 192 30 L 140 66 Z'), '#f5a54a')
    flat(c, P('M72 84 L 74 48 L 102 68 Z'), '#ffb3c1')
    flat(c, P('M184 84 L 182 48 L 154 68 Z'), '#ffb3c1')
    shape(c, ell(128, 122, 80, 64), '#f5a54a', { y0: 58, y1: 186, gloss: [90, 84, 22, 10, -0.4] })
    line(c, 'M128 62 L 128 80', 6, '#d9822b')
    line(c, 'M112 64 L 114 78', 6, '#d9822b')
    line(c, 'M144 64 L 142 78', 6, '#d9822b')
    flat(c, ell(128, 148, 28, 19), '#ffe6c7')
    eye(c, 98, 124)
    eye(c, 158, 124)
    cheek(c, 80, 148)
    cheek(c, 176, 148)
    shape(c, P('M120 138 L 136 138 L 128 147 Z'), '#ff8aa0', { lw: 4 })
    line(c, 'M114 152 Q 121 160 128 151 Q 135 160 142 152', 4)
    line(c, 'M56 138 L 88 144', 3)
    line(c, 'M58 156 L 88 152', 3)
    line(c, 'M200 138 L 168 144', 3)
    line(c, 'M198 156 L 168 152', 3)
  },
  dog(c) {
    shadow(c)
    tube(c, 'M176 202 Q 208 190 206 160', '#d9a066', 14)
    shape(c, ell(128, 198, 52, 34), '#d9a066', { y0: 164, y1: 232 })
    shape(c, ell(106, 228, 14, 9), '#f8e6cc', { lw: 4 })
    shape(c, ell(150, 228, 14, 9), '#f8e6cc', { lw: 4 })
    shape(c, ell(128, 120, 74, 64), '#d9a066', { y0: 56, y1: 184, gloss: [96, 80, 20, 9, -0.4] })
    flat(c, ell(158, 108, 22, 20), '#b5794a')
    shape(c, ell(58, 124, 22, 44, 0.35), '#8a5a3a', { y0: 80, y1: 168 })
    shape(c, ell(198, 124, 22, 44, -0.35), '#8a5a3a', { y0: 80, y1: 168 })
    shape(c, ell(128, 150, 36, 24), '#f8e6cc', { lw: 4 })
    shape(c, P('M121 158 Q 128 178 135 158 Z'), '#ff7b8f', { lw: 3 })
    line(c, 'M128 144 L 128 154 M114 156 Q 121 163 128 154 Q 135 163 142 156', 4)
    shape(c, P('M114 134 Q 128 126 142 134 Q 140 148 128 150 Q 116 148 114 134 Z'), '#3b2a3a', {
      line: false,
      gloss: [122, 134, 5, 3]
    })
    eye(c, 100, 112)
    eye(c, 156, 112)
    cheek(c, 82, 140)
    cheek(c, 174, 140)
  },
  apple(c) {
    shadow(c, 230, 64)
    tube(c, 'M128 82 Q 124 60 138 42', '#8a5a3a', 8)
    shape(c, P('M138 60 C 150 36, 182 34, 194 44 C 182 66, 154 70, 138 60 Z'), '#5cc25b', {
      y0: 36,
      y1: 70
    })
    line(c, 'M144 58 Q 166 48 184 46', 3, '#3f9a3f')
    shape(
      c,
      P(
        'M128 82 C 100 62, 48 70, 46 126 C 44 182, 90 226, 128 212 C 166 226, 212 182, 210 126 C 208 70, 156 62, 128 82 Z'
      ),
      '#ef4444',
      { y0: 66, y1: 220 }
    )
    c.fillStyle = 'rgba(255,255,255,.75)'
    c.beginPath()
    c.ellipse(86, 116, 11, 22, -0.4, 0, TAU)
    c.fill()
    eye(c, 108, 148, 9)
    eye(c, 148, 148, 9)
    cheek(c, 92, 168)
    cheek(c, 164, 168)
    smile(c, 128, 168, 9)
  },
  fish(c) {
    c.lineWidth = 4
    c.strokeStyle = '#8fd3ff'
    for (const [x, y, r] of [
      [46, 76, 10],
      [62, 46, 7],
      [34, 44, 5]
    ]) {
      c.beginPath()
      c.arc(x, y, r, 0, TAU)
      c.stroke()
    }
    shape(c, P('M184 128 L 234 86 Q 222 128 234 170 Z'), '#2f86d6')
    shape(c, P('M100 90 Q 128 46 162 90 Z'), '#2f86d6')
    shape(c, P('M118 166 Q 136 198 154 164 Z'), '#2f86d6')
    shape(c, P('M50 128 C 70 70, 168 66, 196 128 C 168 190, 70 186, 50 128 Z'), '#45b3f7', {
      y0: 74,
      y1: 184,
      gloss: [104, 96, 40, 10, -0.15]
    })
    line(c, 'M128 106 Q 140 128 128 150', 4, '#2f86d6')
    line(c, 'M152 106 Q 164 128 152 150', 4, '#2f86d6')
    shape(c, ell(92, 118, 16, 16), '#ffffff', { lw: 4 })
    eye(c, 95, 120, 8)
    cheek(c, 106, 146)
    line(c, 'M66 142 Q 76 150 86 143', 4)
  },
  three(c) {
    tube(
      c,
      'M88 52 Q 128 20 164 48 Q 184 76 136 94 Q 188 110 166 150 Q 138 184 84 158',
      '#9b6cff',
      38
    )
    line(c, 'M95 40 Q 123 22 149 40', 8, 'rgba(255,255,255,.55)')
    for (const x of [84, 128, 172])
      shape(c, ell(x, 222, 17, 17), '#ffd23f', { lw: 5, gloss: [x - 6, 215, 6, 4] })
  },
  lantern(c) {
    const g = c.createRadialGradient(128, 136, 10, 128, 136, 126)
    g.addColorStop(0, 'rgba(255,214,90,.55)')
    g.addColorStop(1, 'rgba(255,214,90,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
    line(c, 'M128 10 L 128 52', 4)
    tube(c, 'M128 214 L 128 244', '#f5c542', 8)
    const body = P(
      'M128 64 C 198 64, 208 110, 208 136 C 208 162, 198 206, 128 206 C 58 206, 48 162, 48 136 C 48 110, 58 64, 128 64 Z'
    )
    shape(c, body, '#ef4444', { y0: 64, y1: 206, gloss: [86, 104, 14, 30, -0.3] })
    c.save()
    c.clip(body)
    line(c, 'M100 66 Q 70 136 100 204', 4, '#c62828')
    line(c, 'M156 66 Q 186 136 156 204', 4, '#c62828')
    c.restore()
    shape(c, rrect(98, 48, 60, 20, 7), '#f5c542', { lw: 5 })
    shape(c, rrect(98, 198, 60, 18, 7), '#f5c542', { lw: 5 })
    eye(c, 110, 138, 8)
    eye(c, 146, 138, 8)
    cheek(c, 96, 156)
    cheek(c, 160, 156)
    smile(c, 128, 154, 8)
  },
  motorbike(c) {
    shadow(c, 230, 100)
    for (const x of [70, 186]) {
      shape(c, ell(x, 194, 30, 30), '#3d3d4f')
      shape(c, ell(x, 194, 11, 11), '#c9ced6', { lw: 4 })
    }
    shape(c, P('M40 186 Q 70 146 100 184 Z'), '#38c6a8', { y0: 150, y1: 186 })
    shape(c, P('M112 178 C 108 132, 146 112, 196 116 C 224 120, 232 158, 216 180 Z'), '#38c6a8', {
      y0: 114,
      y1: 182,
      gloss: [168, 126, 34, 7, -0.05]
    })
    shape(c, rrect(84, 168, 64, 14, 7), '#2a9c84', { lw: 5 })
    shape(c, P('M74 184 L 98 184 L 118 88 L 100 82 Z'), '#38c6a8', { y0: 82, y1: 184 })
    shape(c, P('M134 120 C 136 96, 202 94, 212 114 C 188 110, 160 112, 134 120 Z'), '#5a3a2a', {
      y0: 94,
      y1: 122
    })
    line(c, 'M96 78 L 128 70', 9)
    shape(c, ell(112, 100, 10, 9), '#ffe066', { lw: 4 })
  }
}
