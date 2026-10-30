// Nhóm nông trại: ngựa, bò, heo, gà, vịt, dê, cừu, thỏ. Khung 256×256, xem kit.ts.
import {
  P,
  cheek,
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

/** Vẽ `f` rồi vẽ lại bản soi gương qua trục x = 128 (tai, sừng, chân hai bên). */
function both(c: CanvasRenderingContext2D, f: () => void): void {
  f()
  c.save()
  c.translate(256, 0)
  c.scale(-1, 1)
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

/** Mõm có hai lỗ mũi. */
function nostrils(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  gap: number,
  color: string
): void {
  flat(c, ell(x - gap, y, 5, 7), color)
  flat(c, ell(x + gap, y, 5, 7), color)
}

export const PICTURES: Record<string, Painter> = {
  horse(c) {
    shadow(c)
    tube(c, 'M176 204 Q 214 198 214 160', '#6b4430', 16)
    shape(c, ell(128, 198, 50, 34), '#c4813f', { y0: 164, y1: 232 })
    shape(c, ell(106, 228, 14, 9), '#5a4a5a', { lw: 4 })
    shape(c, ell(150, 228, 14, 9), '#5a4a5a', { lw: 4 })
    both(c, () => {
      shape(c, P('M78 82 Q 70 46 84 20 Q 108 40 112 66 Z'), '#c4813f', { y0: 20, y1: 82 })
      flat(c, P('M86 70 Q 82 50 88 36 Q 100 50 102 64 Z'), '#e9b48a')
    })
    shape(
      c,
      P(
        'M118 52 C 160 30, 202 52, 206 90 Q 220 104 206 120 Q 218 136 202 148 Q 208 168 184 174 C 184 134, 172 96, 150 74 Z'
      ),
      '#6b4430',
      {
        y0: 40,
        y1: 176
      }
    )
    shape(c, ell(128, 108, 56, 62), '#c4813f', { y0: 46, y1: 170, gloss: [98, 76, 16, 9, -0.4] })
    shape(
      c,
      P('M92 64 Q 128 30 166 64 Q 152 70 148 90 Q 138 76 128 92 Q 118 76 108 90 Q 104 70 92 64 Z'),
      '#6b4430',
      {
        y0: 36,
        y1: 92,
        gloss: [116, 54, 12, 5, -0.3]
      }
    )
    shape(c, ell(128, 158, 44, 30), '#f0d2a8', { lw: 5, y0: 128, y1: 188 })
    nostrils(c, 128, 154, 15, '#8a5a3a')
    smile(c, 128, 168, 10)
    eye(c, 104, 110)
    eye(c, 152, 110)
    cheek(c, 84, 134)
    cheek(c, 172, 134)
  },
  cow(c) {
    shadow(c)
    tube(c, 'M176 206 Q 206 200 208 172', '#ffffff', 8)
    shape(c, ell(208, 166, 8, 10), '#3b2a3a', { lw: 4 })
    const body = ell(128, 198, 52, 34)
    shape(c, body, '#ffffff', { y0: 164, y1: 232 })
    c.save()
    c.clip(body)
    flat(c, ell(166, 196, 22, 16, 0.3), '#3b2a3a')
    flat(c, ell(88, 214, 16, 12), '#3b2a3a')
    c.restore()
    shape(c, ell(106, 228, 14, 9), '#5a4a5a', { lw: 4 })
    shape(c, ell(150, 228, 14, 9), '#5a4a5a', { lw: 4 })
    both(c, () => {
      shape(c, P('M90 68 Q 72 52 76 26 Q 96 42 104 60 Z'), '#f5e6c8', { y0: 26, y1: 68 })
      shape(c, ell(54, 104, 26, 13, -0.35), '#ffffff', { y0: 90, y1: 118 })
      flat(c, ell(56, 104, 15, 6, -0.35), '#ffb3c1')
    })
    const head = ell(128, 110, 72, 60)
    shape(c, head, '#ffffff', { y0: 50, y1: 170 })
    c.save()
    c.clip(head)
    flat(c, ell(178, 70, 26, 20, 0.4), '#3b2a3a')
    flat(c, ell(70, 132, 14, 18, 0.2), '#3b2a3a')
    flat(c, ell(100, 60, 12, 8), '#3b2a3a')
    c.restore()
    c.save()
    c.clip(head)
    c.fillStyle = 'rgba(255,255,255,.5)'
    c.beginPath()
    c.ellipse(98, 78, 18, 8, -0.4, 0, Math.PI * 2)
    c.fill()
    c.restore()
    shape(c, ell(128, 180, 11, 11), '#ffd23f', { lw: 4, gloss: [124, 176, 4, 3] })
    shape(c, ell(128, 152, 46, 26), '#ffb3c1', { lw: 5, y0: 126, y1: 178 })
    nostrils(c, 128, 148, 16, '#d96a86')
    smile(c, 128, 162, 8)
    eye(c, 98, 106)
    eye(c, 158, 106)
    cheek(c, 72, 128, 0.9)
    cheek(c, 184, 128, 0.9)
  },
  pig(c) {
    shadow(c)
    tube(c, 'M178 202 Q 206 204 202 186 Q 198 172 212 172', '#ffa8c0', 8)
    shape(c, ell(128, 198, 54, 34), '#ffa8c0', { y0: 164, y1: 232 })
    shape(c, ell(106, 228, 14, 9), '#f07ea0', { lw: 4 })
    shape(c, ell(150, 228, 14, 9), '#f07ea0', { lw: 4 })
    both(c, () => {
      shape(c, P('M60 90 C 44 64, 46 38, 62 30 C 82 36, 100 50, 110 66 Z'), '#ffa8c0', {
        y0: 30,
        y1: 90
      })
      flat(c, P('M68 76 C 60 62, 60 48, 66 42 C 78 48, 88 56, 94 66 Z'), '#f07ea0')
    })
    shape(c, ell(128, 122, 80, 64), '#ffa8c0', { y0: 58, y1: 186, gloss: [92, 84, 22, 10, -0.4] })
    shape(c, ell(128, 148, 30, 20), '#ff8fb0', { lw: 5, y0: 128, y1: 168, gloss: [118, 138, 8, 4] })
    flat(c, ell(118, 148, 5, 8), '#b8486e')
    flat(c, ell(138, 148, 5, 8), '#b8486e')
    eye(c, 94, 116)
    eye(c, 162, 116)
    cheek(c, 74, 146)
    cheek(c, 182, 146)
    smile(c, 128, 174, 9)
  },
  chicken(c) {
    shadow(c, 234, 64)
    both(c, () => {
      tube(c, 'M110 214 L 108 232', '#ff922b', 6)
      tube(c, 'M108 232 L 96 236 M108 232 L 110 240', '#ff922b', 5)
      shape(c, ell(58, 162, 18, 32, 0.45), '#f2f2f2', { y0: 130, y1: 194 })
    })
    shape(
      c,
      P('M102 60 C 88 44, 102 26, 116 38 C 116 18, 142 18, 142 38 C 156 26, 170 44, 154 60 Z'),
      '#ef4444',
      {
        y0: 20,
        y1: 60,
        gloss: [120, 30, 6, 4]
      }
    )
    shape(
      c,
      P(
        'M128 46 C 196 46, 204 118, 204 152 C 204 202, 170 220, 128 220 C 86 220, 52 202, 52 152 C 52 118, 60 46, 128 46 Z'
      ),
      '#ffffff',
      { y0: 46, y1: 220, gloss: [94, 80, 20, 10, -0.5] }
    )
    line(c, 'M104 182 Q 116 192 128 182 Q 140 192 152 182', 3, '#d6d6de')
    shape(c, ell(128, 152, 8, 12), '#ef4444', { lw: 4 })
    shape(c, P('M112 126 Q 128 118 144 126 L 128 146 Z'), '#ffb02e', { lw: 4 })
    eye(c, 102, 110)
    eye(c, 154, 110)
    cheek(c, 82, 136)
    cheek(c, 174, 136)
  },
  duck(c) {
    shadow(c)
    both(c, () => {
      shape(c, P('M92 220 L 124 220 Q 122 236 106 236 Q 90 236 92 220 Z'), '#ff922b', { lw: 4 })
    })
    shape(c, P('M182 178 L 216 160 Q 212 188 190 198 Z'), '#ffd23f', { y0: 160, y1: 198 })
    shape(c, ell(128, 186, 64, 42), '#ffd23f', { y0: 144, y1: 228 })
    both(c, () => shape(c, ell(72, 186, 16, 28, 0.35), '#f5c116', { y0: 158, y1: 214 }))
    tube(c, 'M128 54 Q 122 34 140 30', '#ffd23f', 8)
    shape(c, ell(128, 106, 64, 56), '#ffd23f', { y0: 50, y1: 162, gloss: [94, 74, 20, 9, -0.4] })
    shape(
      c,
      P('M94 134 Q 94 120 128 122 Q 162 120 162 134 Q 160 152 128 150 Q 96 152 94 134 Z'),
      '#ff922b',
      {
        y0: 120,
        y1: 152,
        gloss: [116, 128, 10, 3]
      }
    )
    line(c, 'M100 136 Q 128 142 156 136', 3)
    eye(c, 100, 98)
    eye(c, 156, 98)
    cheek(c, 78, 126)
    cheek(c, 178, 126)
  },
  goat(c) {
    shadow(c)
    shape(c, P('M170 194 L 190 172 L 186 196 Z'), '#e0bf96', { lw: 4 })
    shape(c, ell(128, 200, 48, 32), '#e0bf96', { y0: 168, y1: 232 })
    shape(c, ell(108, 228, 13, 9), '#5a4a5a', { lw: 4 })
    shape(c, ell(148, 228, 13, 9), '#5a4a5a', { lw: 4 })
    both(c, () => {
      tube(c, 'M104 66 Q 96 34 64 32', '#a89a8c', 14)
      line(c, 'M90 44 L 98 38 M80 38 L 86 30', 3, '#7d7064')
      shape(c, ell(54, 102, 28, 12, 0.3), '#e0bf96', { y0: 90, y1: 114 })
      flat(c, ell(56, 102, 17, 5, 0.3), '#c99a6e')
    })
    shape(c, ell(128, 112, 60, 62), '#e0bf96', { y0: 50, y1: 174, gloss: [98, 78, 18, 9, -0.4] })
    shape(c, P('M110 168 Q 118 210 128 214 Q 138 210 146 168 Z'), '#f4f4f4', {
      y0: 168,
      y1: 214,
      lw: 5
    })
    shape(c, ell(128, 154, 34, 22), '#f6e3c8', { lw: 5, y0: 132, y1: 176 })
    nostrils(c, 128, 150, 11, '#9a7350')
    smile(c, 128, 162, 7)
    eye(c, 102, 112)
    eye(c, 154, 112)
    cheek(c, 82, 136, 0.9)
    cheek(c, 174, 136, 0.9)
  },
  sheep(c) {
    shadow(c)
    shape(c, rrect(94, 206, 20, 28, 9), '#5a4a5a', { lw: 4 })
    shape(c, rrect(142, 206, 20, 28, 9), '#5a4a5a', { lw: 4 })
    shape(c, fluff(128, 186, 62, 30, 10), '#ffffff', {
      y0: 136,
      y1: 232,
      gloss: [176, 168, 14, 7, -0.3]
    })
    both(c, () => shape(c, ell(72, 124, 24, 11, 0.3), '#f2c9ad', { y0: 112, y1: 136 }))
    shape(c, ell(128, 128, 50, 50), '#f7d4bd', { y0: 78, y1: 178 })
    shape(c, fluff(128, 90, 44, 16, 7), '#ffffff', {
      y0: 50,
      y1: 112,
      gloss: [108, 70, 12, 5, -0.3]
    })
    eye(c, 108, 128, 9)
    eye(c, 148, 128, 9)
    cheek(c, 92, 150, 0.9)
    cheek(c, 164, 150, 0.9)
    shape(c, P('M120 146 L 136 146 L 128 154 Z'), '#c98a8a', { lw: 3 })
    line(c, 'M118 160 Q 123 166 128 158 Q 133 166 138 160', 4)
  },
  rabbit(c) {
    shadow(c)
    shape(c, ell(178, 206, 15, 14), '#ffffff', { lw: 5 })
    shape(c, ell(128, 202, 46, 30), '#f3ece4', { y0: 172, y1: 232 })
    shape(c, ell(108, 228, 14, 9), '#ffffff', { lw: 4 })
    shape(c, ell(148, 228, 14, 9), '#ffffff', { lw: 4 })
    both(c, () => {
      shape(c, ell(98, 66, 18, 50, -0.18), '#f3ece4', {
        y0: 16,
        y1: 116,
        gloss: [92, 44, 5, 14, -0.18]
      })
      flat(c, ell(99, 72, 8, 36, -0.18), '#ffb3c1')
    })
    shape(c, ell(128, 142, 68, 56), '#f3ece4', { y0: 86, y1: 198, gloss: [96, 110, 20, 9, -0.4] })
    eye(c, 100, 140)
    eye(c, 156, 140)
    cheek(c, 82, 164)
    cheek(c, 174, 164)
    shape(c, rrect(120, 168, 16, 13, 4), '#ffffff', { lw: 3 })
    line(c, 'M128 169 L 128 180', 2)
    shape(c, P('M121 154 L 135 154 L 128 162 Z'), '#ff8aa0', { lw: 3 })
    line(c, 'M128 162 L 128 168 M116 170 Q 122 174 128 168 Q 134 174 140 170', 4)
  }
}
