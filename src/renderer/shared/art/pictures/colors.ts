// Màu sắc + hoa lá + cầu vồng. Khung 256×256, xem kit.ts.
import {
  INK,
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

/** Biến đổi từng cặp toạ độ (x, y) trong chuỗi path SVG chỉ có M/L/Q/C/Z. */
function tp(d: string, f: (x: number, y: number) => [number, number]): Path2D {
  const re = /-?\d+(?:\.\d+)?/g
  const nums = (d.match(re) ?? []).map(Number)
  const out: number[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) out.push(...f(nums[i], nums[i + 1]))
  let k = 0
  return P(d.replace(re, () => out[k++].toFixed(1)))
}

const flipX = (d: string): Path2D => tp(d, (x, y) => [256 - x, y])

/** Vệt sơn loang: khối tròn nhấp nhô. */
function splat(cx: number, cy: number, r: number): Path2D {
  const p = new Path2D()
  const n = 120
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU
    const rr = r * (1 + 0.11 * Math.sin(5 * a + 0.7) + 0.05 * Math.sin(9 * a + 1.3))
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr * 0.94
    if (i === 0) p.moveTo(x, y)
    else p.lineTo(x, y)
  }
  p.closePath()
  return p
}

/** Hình cho từ chỉ màu: vệt sơn có mặt + cọ vẽ nhúng màu. Chỉ màu khác nhau. */
function colorBlob(color: string): Painter {
  return (c) => {
    shadow(c, 226, 80, 118)
    for (const [x, y, r] of [
      [36, 58, 9],
      [214, 76, 7],
      [30, 190, 7],
      [200, 44, 5]
    ]) {
      shape(c, circle(x, y, r), color, { lw: 4, y0: y - r, y1: y + r })
    }
    shape(c, splat(112, 114, 84), color, { y0: 30, y1: 198, gloss: [74, 66, 24, 12, -0.6] })
    eye(c, 88, 112, 12)
    eye(c, 136, 112, 12)
    cheek(c, 68, 138)
    cheek(c, 156, 138)
    smile(c, 112, 136, 11)
    // cọ vẽ: đầu cọ chạm mép vệt sơn, cán chéo xuống góc phải dưới
    c.save()
    c.translate(166, 166)
    c.rotate(Math.PI / 4)
    shape(c, rrect(40, -8, 56, 16, 8), '#d9a066', { lw: 5, y0: -8, y1: 8 })
    shape(c, rrect(24, -10, 20, 20, 4), '#c9ced6', { lw: 5, y0: -10, y1: 10 })
    shape(c, P('M26 -10 C 12 -10, 2 -5, -4 0 C 2 5, 12 10, 26 10 Z'), color, {
      lw: 5,
      y0: -10,
      y1: 10
    })
    c.restore()
  }
}

export const PICTURES: Record<string, Painter> = {
  red: colorBlob('#ef4444'),
  blue: colorBlob('#3b82f6'),
  yellow: colorBlob('#facc15'),
  green: colorBlob('#22c55e'),
  pink: colorBlob('#f472b6'),

  flower(c) {
    shadow(c, 234, 50)
    tube(c, 'M128 150 Q 122 196 128 230', '#4caf50', 10)
    shape(c, P('M126 206 C 104 210, 80 196, 72 178 C 96 172, 118 184, 126 206 Z'), '#5cc25b', {
      y0: 172,
      y1: 210
    })
    shape(c, P('M128 192 C 146 196, 172 186, 184 166 C 160 160, 136 172, 128 192 Z'), '#5cc25b', {
      y0: 160,
      y1: 196
    })
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * TAU
      const x = 128 + Math.cos(a) * 46
      const y = 98 + Math.sin(a) * 46
      shape(c, circle(x, y, 32), '#ff7eb6', {
        y0: y - 32,
        y1: y + 32,
        gloss: [x - 10, y - 12, 9, 5, -0.5]
      })
    }
    shape(c, circle(128, 98, 34), '#ffd23f', { y0: 64, y1: 132 })
    eye(c, 114, 94, 7)
    eye(c, 142, 94, 7)
    cheek(c, 104, 110, 0.6)
    cheek(c, 152, 110, 0.6)
    smile(c, 128, 108, 7)
  },

  rose(c) {
    shadow(c, 234, 46)
    tube(c, 'M128 140 Q 120 190 128 232', '#3f9a3f', 10)
    for (const [x, y, s] of [
      [123, 172, -1],
      [127, 206, 1]
    ]) {
      shape(c, P(`M${x} ${y} L ${x + 10 * s} ${y - 6} L ${x + 2 * s} ${y + 6} Z`), '#3f9a3f', {
        lw: 3
      })
    }
    shape(c, P('M124 196 C 100 202, 74 190, 64 168 C 92 162, 116 174, 124 196 Z'), '#5cc25b', {
      y0: 162,
      y1: 202
    })
    line(c, 'M120 194 Q 96 180 72 170', 3, '#3f9a3f')
    shape(c, P('M130 178 C 150 184, 178 174, 190 152 C 162 146, 140 158, 130 178 Z'), '#5cc25b', {
      y0: 146,
      y1: 184
    })
    line(c, 'M134 176 Q 160 162 182 155', 3, '#3f9a3f')
    // đài hoa
    shape(c, P('M96 132 L 128 158 L 160 132 L 140 140 L 128 128 L 116 140 Z'), '#4caf50', { lw: 5 })
    // lớp cánh ngoài (sau)
    const bloom = P(
      'M72 84 C 66 46, 104 30, 128 42 C 152 30, 190 46, 184 84 C 184 124, 158 148, 128 148 C 98 148, 72 124, 72 84 Z'
    )
    shape(c, bloom, '#ef3b4a', { y0: 34, y1: 150 })
    // miệng hoa: lòng tối + xoắn
    shape(c, P('M90 70 C 94 44, 162 44, 166 70 C 150 82, 106 82, 90 70 Z'), '#b91c2c', {
      y0: 46,
      y1: 82,
      lw: 5
    })
    line(c, 'M130 58 Q 146 60 140 70 Q 128 78 116 70 Q 110 58 124 54', 4)
    // cánh trước trái/phải và giữa
    const side = 'M72 84 C 70 120, 96 148, 128 148 C 112 128, 104 96, 72 84 Z'
    shape(c, P(side), '#f25563', { y0: 84, y1: 148 })
    shape(c, flipX(side), '#f25563', { y0: 84, y1: 148 })
    shape(
      c,
      P('M94 92 C 108 76, 148 76, 162 92 C 160 124, 142 146, 128 148 C 114 146, 96 124, 94 92 Z'),
      '#ef3b4a',
      {
        y0: 78,
        y1: 148,
        gloss: [112, 98, 12, 6, -0.4]
      }
    )
    line(c, 'M108 94 Q 128 104 148 94', 4)
  },

  sunflower(c) {
    shadow(c, 236, 52)
    tube(c, 'M128 160 Q 134 200 128 234', '#4caf50', 12)
    shape(c, P('M130 214 C 108 220, 76 208, 66 184 C 96 176, 124 190, 130 214 Z'), '#5cc25b', {
      y0: 176,
      y1: 220
    })
    shape(c, P('M130 198 C 152 204, 184 192, 194 168 C 164 160, 136 174, 130 198 Z'), '#5cc25b', {
      y0: 160,
      y1: 204
    })
    const cx = 128
    const cy = 98
    for (let k = 0; k < 2; k++) {
      const n = 12
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (k ? Math.PI / n : 0)
        const r = k ? 52 : 58
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        shape(c, ell(x, y, 26, 12, a), k ? '#ffc21a' : '#ffd23f', { lw: 5, y0: y - 20, y1: y + 20 })
      }
    }
    shape(c, circle(cx, cy, 42), '#8a5a3a', { y0: 56, y1: 140 })
    c.save()
    c.clip(circle(cx, cy, 39))
    c.fillStyle = 'rgba(59,42,58,.35)'
    for (let y = cy - 40; y <= cy + 40; y += 10) {
      for (let x = cx - 40 + ((y / 10) % 2) * 5; x <= cx + 40; x += 10) {
        c.beginPath()
        c.arc(x, y, 2.2, 0, TAU)
        c.fill()
      }
    }
    c.restore()
    flat(c, ell(cx, cy + 4, 30, 24), '#a8724a')
    eye(c, 114, 96, 8)
    eye(c, 142, 96, 8)
    cheek(c, 102, 114, 0.7)
    cheek(c, 154, 114, 0.7)
    smile(c, 128, 110, 7)
  },

  butterfly(c) {
    for (const [x, y] of [
      [96, 40],
      [160, 40]
    ]) {
      line(c, `M128 76 Q ${x + (x < 128 ? 12 : -12)} 54 ${x} ${y}`, 5)
      shape(c, circle(x, y, 8), '#ff7eb6', { lw: 4 })
    }
    const upper = 'M122 112 C 96 52, 30 34, 24 82 C 20 126, 70 146, 122 134 Z'
    const lower = 'M122 138 C 82 140, 44 164, 56 200 C 68 232, 112 210, 124 156 Z'
    for (const f of [(d: string) => P(d), flipX]) {
      shape(c, f(lower), '#ff9f43', { y0: 138, y1: 216 })
      shape(c, f(upper), '#9b6cff', { y0: 40, y1: 140 })
    }
    for (const s of [1, -1]) {
      const x = (v: number): number => 128 + s * (v - 128)
      shape(c, ell(x(70), 92, 20, 18), '#ffd23f', { lw: 4 })
      shape(c, ell(x(102), 120, 8, 8), '#ffffff', { lw: 4 })
      shape(c, ell(x(84), 180, 13, 13), '#ffe066', { lw: 4 })
      c.fillStyle = 'rgba(255,255,255,.5)'
      c.beginPath()
      c.ellipse(x(52), 70, 10, 5, -0.6 * s, 0, TAU)
      c.fill()
    }
    shape(c, P('M128 96 C 144 96, 144 196, 128 204 C 112 196, 112 96, 128 96 Z'), '#5b4a6b', {
      y0: 96,
      y1: 204
    })
    line(c, 'M118 132 L 138 132 M117 152 L 139 152 M119 172 L 137 172', 3, '#3b2a3a')
    shape(c, circle(128, 84, 24), '#5b4a6b', { y0: 60, y1: 108, gloss: [118, 72, 8, 5, -0.4] })
    eye(c, 119, 84, 6)
    eye(c, 137, 84, 6)
    cheek(c, 110, 97, 0.45)
    cheek(c, 146, 97, 0.45)
    line(c, 'M123 96 Q 128 101 133 96', 3, '#ffffff')
  },

  rainbow(c) {
    shadow(c, 222, 100)
    const cx = 128
    const cy = 178
    const colors = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#3b82f6', '#a855f7']
    const outer = 100
    const band = 12
    for (let i = 0; i < colors.length; i++) {
      const r0 = outer - i * band
      const r1 = r0 - band
      const p = new Path2D()
      p.arc(cx, cy, r0, Math.PI, TAU)
      p.arc(cx, cy, r1, TAU, Math.PI, true)
      p.closePath()
      shape(c, p, colors[i], { y0: cy - r0, y1: cy, lw: 3 })
    }
    c.lineWidth = 6
    c.strokeStyle = INK
    c.beginPath()
    c.arc(cx, cy, outer, Math.PI, TAU)
    c.stroke()
    c.beginPath()
    c.arc(cx, cy, outer - colors.length * band, Math.PI, TAU)
    c.stroke()
    // điểm sáng chạy theo vòng cung
    c.lineCap = 'round'
    c.lineWidth = 5
    c.strokeStyle = 'rgba(255,255,255,.55)'
    c.beginPath()
    c.arc(cx, cy, outer - 6, Math.PI * 1.15, Math.PI * 1.4)
    c.stroke()
    // mây hai chân
    const cloud =
      'M-46 22 C -66 22, -66 -6, -44 -4 C -44 -32, -12 -38, -2 -18 C 8 -40, 46 -34, 42 -6 C 64 -8, 66 22, 46 22 Z'
    for (const [x, y] of [
      [62, 182],
      [194, 182]
    ]) {
      shape(
        c,
        tp(cloud, (a, b) => [x + a * 0.76, y + b * 0.76]),
        '#f4f8ff',
        { y0: y - 32, y1: y + 20 }
      )
      eye(c, x - 12, y - 2, 5)
      eye(c, x + 12, y - 2, 5)
      cheek(c, x - 22, y + 8, 0.45)
      cheek(c, x + 22, y + 8, 0.45)
      line(c, `M${x - 5} ${y + 6} Q ${x} ${y + 11} ${x + 5} ${y + 6}`, 3)
    }
  }
}
