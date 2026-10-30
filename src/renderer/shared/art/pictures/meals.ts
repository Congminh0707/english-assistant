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
  star,
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

/** Chiếc đũa thon: đầu to (x0, y0) → đầu nhỏ (x1, y1); gỗ sáng, đầu đũa sẫm, viền mực mảnh. */
function chopstick(
  c: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w0 = 9,
  w1 = 5
): void {
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy)
  const nx = -dy / len
  const ny = dx / len
  const at = (t: number, s: number): string => {
    const h = (w0 + (w1 - w0) * t) / 2
    return `${x0 + dx * t + nx * h * s} ${y0 + dy * t + ny * h * s}`
  }
  const p = P(`M${at(0, 1)} L ${at(1, 1)} L ${at(1, -1)} L ${at(0, -1)} Z`)
  shape(c, p, '#f0cf98', { line: false, y0: Math.min(y0, y1) - 6, y1: Math.max(y0, y1) + 6 })
  c.save()
  c.clip(p)
  flat(c, P(`M${at(0.78, 2)} L ${at(1.1, 2)} L ${at(1.1, -2)} L ${at(0.78, -2)} Z`), '#a8683a')
  c.restore()
  c.lineWidth = 4
  c.strokeStyle = INK
  c.lineJoin = 'round'
  c.stroke(p)
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
    bowl(c, 132, '#ffffff', '#5aa7e6')
    cute(c, 128, 168)
    // đôi đũa gác ngang miệng bát (không cắm vào cơm)
    chopstick(c, 244, 116, 24, 124)
    chopstick(c, 244, 128, 28, 138)
  },
  noodles(c) {
    shadow(c, 228, 70)
    // sợi mì được đũa gắp lên
    for (const x of [-12, 0, 12]) {
      tube(
        c,
        `M${140 + x} 70 Q ${128 + x} 88 ${140 + x} 104 Q ${152 + x} 120 ${140 + x} 136`,
        '#ffd36b',
        5
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
    bowl(c, 132, '#f2554f', '#ffd36b')
    cute(c, 128, 172)
    // đôi đũa cầm chéo, kẹp sợi mì
    chopstick(c, 236, 22, 122, 66)
    chopstick(c, 240, 40, 126, 80)
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
    shadow(c, 226, 106)
    // ổ bánh mì gối: thân thẳng, nóc vồng vàng nâu
    const loaf = P(
      'M34 206 L 34 124 C 18 112, 24 70, 64 64 C 90 56, 146 56, 172 64 C 212 70, 218 112, 202 124 L 202 206 Q 202 214 194 214 L 42 214 Q 34 214 34 206 Z'
    )
    shape(c, loaf, '#e39a48', { y0: 56, y1: 214, gloss: [76, 80, 28, 9, -0.25] })
    c.save()
    c.clip(loaf)
    flat(
      c,
      P('M20 128 C 60 116, 176 116, 216 128 L 216 136 C 176 124, 60 124, 20 136 Z'),
      '#c97a34'
    )
    c.restore()
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(loaf)
    for (const x of [70, 108, 146]) line(c, `M${x} 90 Q ${x + 12} 78 ${x + 24} 84`, 5, '#ffd894')
    cute(c, 86, 160, 18, 8)
    // lát bánh cắt dựng phía trước: vỏ nâu, ruột trắng kem
    const slice = P(
      'M144 222 L 144 162 C 132 154, 134 126, 158 122 C 172 116, 198 116, 212 122 C 236 126, 238 154, 226 162 L 226 222 Q 226 228 220 228 L 150 228 Q 144 228 144 222 Z'
    )
    shape(c, slice, '#c97a34', { y0: 116, y1: 228 })
    const crumb = P(
      'M153 218 L 153 157 C 143 151, 146 133, 162 130 C 174 125, 196 125, 208 130 C 224 133, 227 151, 217 157 L 217 218 Z'
    )
    shape(c, crumb, '#fff4da', { line: false, y0: 124, y1: 220, gloss: [170, 140, 14, 7, -0.3] })
    for (const [x, y, r] of [
      [170, 168, 3],
      [196, 156, 2.5],
      [184, 192, 3],
      [204, 204, 2.5],
      [166, 204, 2]
    ])
      flat(c, ell(x, y, r * 1.4, r), '#efd9a8')
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
    shadow(c, 230, 104)
    // chai thuỷ tinh đựng sữa, nắp xanh, dải đốm bò
    const bottle = P(
      'M70 64 L 106 64 L 106 92 Q 106 104 120 114 Q 132 124 132 144 L 132 214 Q 132 228 118 228 L 58 228 Q 44 228 44 214 L 44 144 Q 44 124 56 114 Q 70 104 70 92 Z'
    )
    shape(c, bottle, '#dff1fd', { line: false })
    c.save()
    c.clip(bottle)
    shape(c, P('M30 104 Q 88 96 146 104 L 146 240 L 30 240 Z'), '#fbfbf7', {
      line: false,
      y0: 100,
      y1: 232
    })
    flat(c, P('M34 178 L 142 178 L 142 204 L 34 204 Z'), '#ffffff')
    for (const [x, y, rx, ry] of [
      [58, 186, 11, 8],
      [92, 196, 9, 6],
      [120, 184, 10, 7]
    ])
      flat(c, ell(x, y, rx, ry, 0.3), INK)
    line(c, 'M30 178 L 146 178 M30 204 L 146 204', 3)
    flat(c, rrect(52, 120, 9, 50, 5), 'rgba(255,255,255,.85)')
    c.restore()
    c.lineWidth = LW
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(bottle)
    shape(c, rrect(64, 46, 48, 22, 7), '#3f8be0', { lw: 5, gloss: [78, 52, 10, 4] })
    cute(c, 88, 142, 17, 7)
    // cốc sữa đầy
    const glass = P('M146 126 L 226 126 L 216 220 Q 215 228 207 228 L 165 228 Q 157 228 156 220 Z')
    shape(c, glass, '#dff1fd', { line: false })
    c.save()
    c.clip(glass)
    shape(c, P('M140 140 L 232 140 L 232 240 L 140 240 Z'), '#fbfbf7', {
      line: false,
      y0: 136,
      y1: 232
    })
    flat(c, ell(186, 140, 40, 7), '#ffffff')
    flat(c, rrect(160, 146, 8, 62, 4), 'rgba(255,255,255,.85)')
    c.restore()
    line(c, 'M148 140 Q 186 150 224 140', 3, '#c9d6e2')
    c.lineWidth = LW
    c.strokeStyle = INK
    c.stroke(glass)
    // giọt sữa bắn lên
    shape(
      c,
      P(
        'M162 136 Q 166 120 158 106 Q 172 112 176 124 Q 180 104 186 92 Q 194 106 196 124 Q 202 112 216 106 Q 208 120 210 136 Z'
      ),
      '#ffffff',
      { lw: 4 }
    )
    shape(c, ell(154, 90, 5, 6), '#ffffff', { lw: 4 })
    shape(c, ell(186, 72, 6, 7), '#ffffff', { lw: 4 })
    shape(c, ell(220, 88, 5, 6), '#ffffff', { lw: 4 })
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
    shadow(c, 230, 100)
    // vũng mật dưới gáo
    shape(c, ell(206, 224, 26, 7), '#f5a623', { lw: 4 })
    // hũ thuỷ tinh tròn đầy mật
    const jar = P(
      'M84 96 L 148 96 L 148 108 Q 148 114 158 120 Q 184 136 184 168 Q 184 226 116 226 Q 48 226 48 168 Q 48 136 74 120 Q 84 114 84 108 Z'
    )
    shape(c, jar, '#e8f4fb', { line: false })
    c.save()
    c.clip(jar)
    shape(c, P('M40 120 Q 116 112 192 120 L 192 236 L 40 236 Z'), '#f5a623', {
      line: false,
      y0: 116,
      y1: 228
    })
    flat(c, rrect(60, 134, 10, 64, 5), 'rgba(255,255,255,.6)')
    // nhãn tổ ong (không chữ)
    shape(c, rrect(78, 168, 76, 40, 10), '#fff3c4', { lw: 4, y0: 168, y1: 208 })
    for (const [x, y] of [
      [104, 180],
      [116, 187],
      [128, 180],
      [104, 194],
      [128, 194],
      [116, 201],
      [92, 187],
      [140, 187]
    ]) {
      c.fillStyle = '#ffc93a'
      c.fill(star(x, y, 7, 7, 6, 0))
      c.lineWidth = 2.5
      c.strokeStyle = '#d98a10'
      c.stroke(star(x, y, 7, 7, 6, 0))
    }
    c.restore()
    c.lineWidth = LW
    c.strokeStyle = INK
    c.lineJoin = 'round'
    c.stroke(jar)
    // mật chảy tràn qua miệng hũ
    shape(
      c,
      P(
        'M142 106 L 156 106 Q 160 112 160 122 L 160 134 Q 160 142 154 142 Q 148 142 148 134 L 146 120 Q 142 114 142 106 Z'
      ),
      '#ffb21a',
      { lw: 4, y0: 104, y1: 144 }
    )
    shape(
      c,
      P('M78 106 L 90 106 Q 90 112 88 118 L 86 124 Q 84 130 80 128 Q 76 126 76 118 Z'),
      '#ffb21a',
      { lw: 4, y0: 104, y1: 130 }
    )
    // khăn vải đậy nắp, buộc dây
    const cloth = P(
      'M72 100 C 70 78, 92 68, 116 68 C 140 68, 162 78, 160 100 L 166 112 Q 156 118 148 110 Q 140 120 130 111 Q 122 120 112 111 Q 102 120 94 111 Q 84 118 66 112 Z'
    )
    shape(c, cloth, '#ef5350', { y0: 68, y1: 118, gloss: [96, 80, 14, 5, -0.2] })
    c.save()
    c.clip(cloth)
    for (const [x, y] of [
      [92, 86],
      [116, 78],
      [140, 86],
      [104, 102],
      [128, 102],
      [152, 102],
      [80, 104]
    ])
      flat(c, circle(x, y, 4), '#ffffff')
    c.restore()
    tube(c, 'M76 100 Q 116 106 156 100', '#c98a4a', 4)
    tube(c, 'M76 100 Q 64 92 62 82 M76 100 Q 62 104 58 112', '#c98a4a', 4)
    cute(c, 116, 144, 18, 8)
    // gáo múc mật bằng gỗ
    tube(c, 'M232 30 L 212 150', '#c98a4a', 8)
    const dip = ell(210, 170, 17, 24, 0.17)
    shape(c, dip, '#e0a35a', { y0: 146, y1: 194 })
    c.save()
    c.clip(dip)
    for (const y of [156, 168, 180]) line(c, `M188 ${y - 4} L 232 ${y + 4}`, 4, '#a86a30')
    c.restore()
    shape(c, P('M204 192 Q 212 194 212 200 L 210 214 Q 206 220 204 214 Z'), '#ffb21a', {
      lw: 3
    })
    // chú ong nhỏ
    c.save()
    c.translate(46, 50)
    shape(c, ell(-4, -12, 9, 12, -0.5), '#dff3ff', { lw: 3 })
    shape(c, ell(6, -12, 9, 12, 0.5), '#dff3ff', { lw: 3 })
    const bee = ell(0, 4, 18, 13)
    shape(c, bee, '#ffd23f', { lw: 4, y0: -10, y1: 18 })
    c.save()
    c.clip(bee)
    flat(c, rrect(2, -12, 6, 30, 2), INK)
    flat(c, rrect(12, -12, 6, 30, 2), INK)
    c.restore()
    c.lineWidth = 4
    c.strokeStyle = INK
    c.stroke(bee)
    eye(c, -10, 2, 3.5)
    eye(c, -2, 2, 3.5)
    c.restore()
    line(c, 'M70 58 Q 82 70 76 80 Q 70 88 82 92', 3, '#c9b48a')
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
