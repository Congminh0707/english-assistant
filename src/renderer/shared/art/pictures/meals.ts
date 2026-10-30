// Đồ ăn & bữa cơm. Món ăn có mặt dễ thương (như apple); thìa/dĩa không mặt. Khung 256×256, xem kit.ts.
import {
  INK,
  LW,
  P,
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

/** Mặt nhỏ: hai mắt, má, miệng cười — tâm (x, y). */
function cute(c: CanvasRenderingContext2D, x: number, y: number, gap = 20, r = 8): void {
  eye(c, x - gap, y, r)
  eye(c, x + gap, y, r)
  cheek(c, x - gap - 12, y + 16, 0.85)
  cheek(c, x + gap + 12, y + 16, 0.85)
  smile(c, x, y + 14, 8)
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

/** Bát (cạnh trên y = top), chân bát, viền hoa văn — trả về path thân bát. */
function bowl(c: CanvasRenderingContext2D, top: number, color: string, band: string): Path2D {
  shape(c, rrect(98, top + 72, 60, 16, 6), color, { lw: 5 })
  const body = P(
    `M34 ${top} L 222 ${top} Q 218 ${top + 70} 150 ${top + 78} L 106 ${top + 78} Q 38 ${top + 70} 34 ${top} Z`
  )
  shape(c, body, color, { y0: top, y1: top + 78, gloss: [70, top + 18, 16, 8, -0.3] })
  c.save()
  c.clip(body)
  line(c, `M30 ${top + 12} L 226 ${top + 12}`, 5, band)
  c.restore()
  return body
}

export const PICTURES: Record<string, Painter> = {
  rice(c) {
    shadow(c, 228, 70)
    tube(c, 'M60 52 L 220 104', '#c98a4a', 7)
    const mound = P('M40 132 C 44 66, 104 54, 128 58 C 152 54, 212 66, 216 132 Z')
    shape(c, mound, '#fbfaf2', { y0: 58, y1: 132, gloss: [96, 80, 20, 8, -0.4] })
    c.save()
    c.clip(mound)
    c.fillStyle = '#e4dfcc'
    for (const [x, y, a] of [
      [84, 104, 0.6],
      [108, 86, 1.2],
      [150, 82, -0.5],
      [176, 106, 0.3],
      [128, 108, -1],
      [64, 124, 1],
      [194, 124, -0.8],
      [138, 70, 0.9]
    ]) {
      c.beginPath()
      c.ellipse(x, y, 6, 3, a, 0, TAU)
      c.fill()
    }
    c.restore()
    tube(c, 'M50 64 L 222 118', '#e0a35a', 7)
    bowl(c, 132, '#ffffff', '#5aa7e6')
    cute(c, 128, 168)
  },
  noodles(c) {
    shadow(c, 228, 70)
    // sợi mì được đũa gắp lên
    for (const x of [-14, -4, 6, 16]) {
      tube(
        c,
        `M${150 + x} 62 Q ${138 + x} 84 ${152 + x} 100 Q ${166 + x} 116 ${150 + x} 136`,
        '#ffd36b',
        6
      )
    }
    shape(c, ell(128, 132, 90, 16), '#f0a54a', { y0: 116, y1: 148, lw: 5 })
    c.save()
    c.clip(ell(128, 132, 90, 16))
    for (const [x, y] of [
      [70, 130],
      [98, 136],
      [182, 130]
    ])
      tube(c, `M${x - 14} ${y} Q ${x} ${y - 10} ${x + 14} ${y}`, '#ffd36b', 5)
    flat(c, ell(196, 136, 10, 5), '#5cc25b')
    flat(c, ell(80, 140, 8, 4, 0.4), '#5cc25b')
    c.restore()
    for (const x of [-14, -4, 6, 16])
      tube(c, `M${150 + x} 62 Q ${146 + x} 72 ${148 + x} 84`, '#ffd36b', 6)
    tube(c, 'M108 28 L 214 70', '#c98a4a', 7)
    tube(c, 'M104 46 L 216 80', '#c98a4a', 7)
    bowl(c, 132, '#f2554f', '#ffd36b')
    cute(c, 128, 172)
  },
  soup(c) {
    shadow(c, 230, 84)
    // hơi nóng
    for (const x of [92, 128, 164]) {
      line(c, `M${x} 70 Q ${x - 12} 54 ${x} 40 Q ${x + 12} 26 ${x} 12`, 12, INK)
      line(c, `M${x} 70 Q ${x - 12} 54 ${x} 40 Q ${x + 12} 26 ${x} 12`, 6, '#e4ecf6')
    }
    // muôi cắm trong nồi
    tube(c, 'M172 112 L 214 40', '#c9d2de', 10)
    shape(c, ell(40, 140, 18, 12), '#2f6fc0', { lw: 5 })
    shape(c, ell(216, 140, 18, 12), '#2f6fc0', { lw: 5 })
    const pot = P('M46 112 L 210 112 L 204 192 Q 200 216 176 216 L 80 216 Q 56 216 52 192 Z')
    shape(c, pot, '#3f8be0', { y0: 112, y1: 216, gloss: [74, 136, 10, 22, 0] })
    shape(c, ell(128, 110, 92, 18), '#2f6fc0', { y0: 92, y1: 128, lw: 5 })
    shape(c, ell(128, 108, 80, 12), '#ffa94a', { y0: 96, y1: 120, lw: 4 })
    flat(c, ell(100, 106, 9, 4), '#5cc25b')
    flat(c, ell(150, 110, 8, 4, 0.3), '#ff6b5b')
    flat(c, ell(124, 103, 7, 3), '#fff1c4')
    shape(c, ell(178, 108, 14, 6, -0.2), '#c9d2de', { lw: 4 })
    cute(c, 128, 160)
  },
  bread(c) {
    shadow(c, 208, 96)
    const loaf = P('M16 172 C 26 98, 150 58, 240 90 C 244 152, 120 218, 16 172 Z')
    shape(c, loaf, '#eaa04a', { y0: 80, y1: 200, gloss: [96, 120, 34, 8, -0.35] })
    for (const [x, y] of [
      [66, 138],
      [110, 118],
      [154, 104],
      [198, 100]
    ])
      tube(c, `M${x - 14} ${y + 10} Q ${x} ${y - 2} ${x + 14} ${y - 4}`, '#ffd894', 5)
    cute(c, 138, 150, 20, 8)
  },
  egg(c) {
    shadow(c, 222, 96)
    const white = P(
      'M44 128 C 30 82, 82 46, 124 58 C 160 40, 222 64, 218 112 C 238 150, 210 202, 160 196 C 128 220, 70 210, 60 180 C 30 170, 30 146, 44 128 Z'
    )
    shape(c, white, '#fffdf6', { y0: 46, y1: 214, gloss: [76, 86, 16, 8, -0.6] })
    shape(c, circle(132, 128, 50), '#ffc21a', { y0: 78, y1: 178, gloss: [112, 102, 16, 9, -0.6] })
    cute(c, 132, 132, 18, 8)
  },
  milk(c) {
    shadow(c, 230, 66)
    shape(c, rrect(88, 30, 80, 20, 5), '#f2f4f8', { lw: 5 })
    const roof = P('M68 104 L 92 48 L 164 48 L 188 104 Z')
    shape(c, roof, '#45a0f0', { y0: 48, y1: 104 })
    line(c, 'M128 50 L 128 102', 4, '#2f7cc8')
    const body = rrect(68, 100, 120, 124, 10)
    shape(c, body, '#ffffff', { y0: 100, y1: 224 })
    c.save()
    c.clip(body)
    flat(c, P('M60 186 Q 98 170 128 184 Q 160 198 196 180 L 196 230 L 60 230 Z'), '#45a0f0')
    flat(c, ell(74, 116, 18, 14, 0.4), '#3b2a3a')
    flat(c, ell(190, 132, 16, 20, -0.2), '#3b2a3a')
    flat(c, ell(176, 104, 7, 6), '#3b2a3a')
    flat(c, P('M78 104 L 106 104 L 78 150 Z'), 'rgba(255,255,255,.35)')
    c.restore()
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(body)
    shape(
      c,
      P('M128 180 Q 142 198 140 206 Q 136 216 128 216 Q 120 216 116 206 Q 114 198 128 180 Z'),
      '#ffffff',
      {
        lw: 4
      }
    )
    cute(c, 128, 148)
  },
  spoon(c) {
    shadow(c, 226, 60)
    turned(c, -0.55, 128, 128, () => {
      shape(
        c,
        P('M120 110 L 136 110 Q 146 196 144 222 Q 128 238 112 222 Q 110 196 120 110 Z'),
        '#c9d2de',
        {
          y0: 110,
          y1: 236,
          gloss: [124, 160, 3, 30, 0]
        }
      )
      shape(c, ell(128, 70, 38, 52), '#c9d2de', { y0: 18, y1: 122 })
      shape(c, ell(128, 72, 26, 38), '#aab4c4', {
        y0: 34,
        y1: 110,
        lw: 3,
        gloss: [116, 54, 9, 16, -0.2]
      })
    })
  },
  fork(c) {
    shadow(c, 226, 60)
    turned(c, 0.5, 128, 128, () => {
      shape(
        c,
        P('M118 124 L 138 124 Q 148 196 146 222 Q 128 238 110 222 Q 108 196 118 124 Z'),
        '#c9d2de',
        {
          y0: 124,
          y1: 236,
          gloss: [124, 170, 3, 26, 0]
        }
      )
      const tines = [86, 110, 134, 158]
      const p = new Path2D()
      p.moveTo(86, 32)
      tines.forEach((x, i) => {
        p.quadraticCurveTo(x + 6, 20, x + 12, 32)
        if (i < tines.length - 1) {
          p.lineTo(x + 12, 88)
          p.lineTo(tines[i + 1], 88)
          p.lineTo(tines[i + 1], 32)
        }
      })
      p.lineTo(170, 96)
      p.quadraticCurveTo(168, 130, 138, 134)
      p.lineTo(118, 134)
      p.quadraticCurveTo(88, 130, 86, 96)
      p.closePath()
      shape(c, p, '#c9d2de', { y0: 20, y1: 134, gloss: [100, 110, 10, 14, 0] })
    })
  },
  honey(c) {
    shadow(c, 230, 74)
    const jar = P('M70 102 Q 46 122 46 164 Q 46 224 128 224 Q 210 224 210 164 Q 210 122 186 102 Z')
    shape(c, jar, '#ffb21a', { y0: 102, y1: 224, gloss: [80, 150, 10, 26, 0.1] })
    c.save()
    c.clip(jar)
    flat(
      c,
      P(
        'M40 100 L 216 100 L 216 124 Q 200 124 196 136 Q 192 150 184 136 Q 176 122 150 126 Q 136 150 126 128 Q 110 120 90 126 Q 84 144 76 128 Q 66 120 40 124 Z'
      ),
      '#e88a10'
    )
    c.restore()
    shape(c, rrect(64, 90, 128, 22, 9), '#ffcf5a', { lw: 5 })
    // gáo múc mật
    tube(c, 'M96 22 L 160 62', '#c98a4a', 8)
    turned(c, 0.55, 174, 72, () => {
      shape(c, ell(174, 72, 24, 15), '#e0a35a', { y0: 57, y1: 87 })
      line(c, 'M162 58 L 162 86 M174 57 L 174 87 M186 58 L 186 86', 4, '#a86a30')
    })
    tube(c, 'M176 86 Q 178 92 178 98', '#ffb21a', 6)
    shape(
      c,
      P('M178 100 Q 172 104 172 108 Q 172 112 178 112 Q 184 112 184 108 Q 184 104 178 100 Z'),
      '#ffb21a',
      {
        lw: 3
      }
    )
    cute(c, 128, 166)
  },
  cookie(c) {
    shadow(c, 224, 80)
    const p = new Path2D()
    const n = 14
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU
      const r = 92 + (i % 2 === 0 ? 0 : -4)
      const x = 128 + Math.cos(a) * r
      const y = 124 + Math.sin(a) * r
      if (i === 0) p.moveTo(x, y)
      else {
        const am = ((i - 0.5) / n) * TAU
        p.quadraticCurveTo(128 + Math.cos(am) * 96, 124 + Math.sin(am) * 96, x, y)
      }
    }
    p.closePath()
    shape(c, p, '#e0a050', { y0: 32, y1: 216, gloss: [86, 66, 26, 10, -0.5] })
    for (const [x, y, r, a] of [
      [92, 74, 10, 0.3],
      [152, 62, 9, -0.6],
      [190, 104, 11, 0.8],
      [62, 118, 9, 1.2],
      [194, 160, 9, -0.2],
      [84, 182, 10, 0.5],
      [168, 196, 8, 1],
      [124, 92, 7, 0]
    ])
      shape(c, ell(x, y, r, r * 0.8, a), '#6b4430', { lw: 3, gloss: [x - 3, y - 3, 3, 2] })
    cute(c, 128, 138)
  }
}
