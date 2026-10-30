// Nhóm động vật nhỏ & hoang dã: ếch, rắn, ong, cú, cánh cụt, chuột, nai, ốc sên, kiến, sói, thiên nga.
// Kiểu chibi đầu to như farm.ts. Khung 256×256, xem kit.ts.
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

/** Vẽ `f` rồi vẽ lại bản soi gương qua trục x = 128. */
function both(c: CanvasRenderingContext2D, f: () => void): void {
  f()
  c.save()
  c.translate(256, 0)
  c.scale(-1, 1)
  f()
  c.restore()
}

/** Tô khối rồi tô thêm `inner` bên trong (cắt theo khối), cuối cùng viền mực. */
function patched(
  c: CanvasRenderingContext2D,
  p: Path2D,
  color: string,
  y0: number,
  y1: number,
  inner: () => void,
  gloss?: [number, number, number, number, number?]
): void {
  shape(c, p, color, { line: false, y0, y1, gloss })
  c.save()
  c.clip(p)
  inner()
  c.restore()
  c.lineWidth = 6
  c.strokeStyle = INK
  c.lineJoin = 'round'
  c.stroke(p)
}

/** Dải nước gợn ở đáy hình. */
function water(c: CanvasRenderingContext2D, top: number): void {
  let d = `M14 ${top + 6}`
  for (let i = 0; i < 6; i++) {
    const a = 14 + i * 38
    d += ` Q ${a + 9} ${top - 4} ${a + 19} ${top + 6} Q ${a + 28} ${top + 14} ${a + 38} ${top + 6}`
  }
  d += ` L 242 ${top + 30} Q 128 ${top + 40} 14 ${top + 30} Z`
  shape(c, P(d), '#45b3f7', { y0: top - 6, y1: top + 36, gloss: [80, top + 12, 30, 4] })
}

export const PICTURES: Record<string, Painter> = {
  frog(c) {
    // lá súng
    shape(c, P('M128 214 L 30 206 C 26 238, 230 238, 226 206 L 128 214 L 150 196 Z'), '#3fa34d', {
      y0: 196,
      y1: 236
    })
    shape(c, ell(128, 196, 54, 30), '#6cc644', { y0: 166, y1: 226 })
    flat(c, ell(128, 202, 34, 20), '#d8f5a0')
    both(c, () => {
      shape(c, P('M76 214 Q 70 198 84 194 Q 98 196 96 214 Z'), '#6cc644', { lw: 5 })
      line(c, 'M80 214 L 80 208 M88 214 L 88 208', 3)
    })
    const head = ell(128, 138, 92, 58)
    shape(c, head, '#6cc644', { y0: 80, y1: 196, gloss: [88, 110, 20, 8, -0.3] })
    both(c, () => {
      shape(c, circle(84, 86, 32), '#6cc644', { y0: 54, y1: 118 })
      shape(c, circle(84, 88, 21), '#ffffff', { lw: 4 })
    })
    eye(c, 86, 90, 11)
    eye(c, 170, 90, 11)
    cheek(c, 62, 152, 1.1)
    cheek(c, 194, 152, 1.1)
    line(c, 'M78 150 Q 128 186 178 150', 6)
    flat(c, ell(116, 124, 3, 2), '#3f8a2f')
    flat(c, ell(140, 124, 3, 2), '#3f8a2f')
  },
  snake(c) {
    shadow(c, 232, 92)
    tube(c, 'M200 214 Q 236 212 234 190', '#7ccf4f', 12)
    const stripes = (x0: number, x1: number): void => {
      for (let x = x0; x <= x1; x += 26) flat(c, rrect(x, 100, 10, 140, 4), '#4e9e34')
    }
    patched(c, ell(128, 204, 88, 26), '#7ccf4f', 178, 230, () => stripes(54, 200), [80, 194, 20, 5])
    patched(c, ell(128, 176, 70, 22), '#7ccf4f', 154, 198, () => stripes(66, 190), [92, 166, 16, 4])
    // cổ vươn lên
    const neck = 'M150 168 C 150 146, 128 140, 128 112'
    tube(c, neck, '#7ccf4f', 34)
    c.save()
    c.setLineDash([10, 16])
    c.lineCap = 'butt'
    c.lineWidth = 32
    c.strokeStyle = '#4e9e34'
    c.stroke(P(neck))
    c.restore()
    // lưỡi chẻ đôi
    tube(c, 'M128 120 L 128 140 L 120 150 M128 140 L 136 150', '#ff4d6d', 3)
    shape(c, ell(128, 84, 58, 44), '#7ccf4f', { y0: 40, y1: 128, gloss: [98, 62, 18, 8, -0.3] })
    flat(c, ell(128, 104, 34, 14), '#c8f08a')
    eye(c, 104, 80, 10)
    eye(c, 152, 80, 10)
    cheek(c, 86, 100)
    cheek(c, 170, 100)
    smile(c, 128, 104, 10)
  },
  bee(c) {
    shadow(c, 232, 70)
    // cánh
    shape(c, ell(116, 70, 26, 40, -0.35), '#e3f5ff', { lw: 5, gloss: [108, 56, 8, 16, -0.35] })
    shape(c, ell(164, 66, 26, 40, 0.35), '#e3f5ff', { lw: 5, gloss: [156, 52, 8, 16, 0.35] })
    // ngòi
    shape(c, P('M206 140 L 236 150 L 206 162 Z'), '#4a3a48', { lw: 5 })
    const body = ell(134, 150, 82, 64)
    patched(
      c,
      body,
      '#ffd23f',
      86,
      214,
      () => {
        flat(c, rrect(126, 70, 22, 170, 8), INK)
        flat(c, rrect(170, 70, 20, 170, 8), INK)
      },
      [84, 112, 20, 9, -0.4]
    )
    // râu
    tube(c, 'M86 100 Q 70 70 52 60', INK, 2)
    tube(c, 'M104 92 Q 100 60 88 44', INK, 2)
    shape(c, circle(50, 58, 8), '#ffd23f', { lw: 4 })
    shape(c, circle(86, 42, 8), '#ffd23f', { lw: 4 })
    eye(c, 76, 144, 9)
    eye(c, 112, 144, 9)
    cheek(c, 64, 166)
    cheek(c, 120, 168, 0.8)
    smile(c, 94, 162, 8)
    // chân nhỏ
    for (const x of [100, 130, 160]) tube(c, `M${x} 210 L ${x - 4} 226`, INK, 2)
  },
  owl(c) {
    // cành cây
    tube(c, 'M16 216 Q 128 206 240 220', '#8a5a3a', 14)
    both(c, () => {
      // túm lông tai
      shape(c, P('M52 66 L 46 18 L 92 50 Z'), '#a0703f', { y0: 18, y1: 66 })
      // cánh
      shape(c, ell(52, 150, 24, 50, 0.15), '#8a5a33', { y0: 100, y1: 200 })
    })
    const body = P(
      'M128 30 C 198 30, 210 90, 206 138 C 202 196, 170 214, 128 214 C 86 214, 54 196, 50 138 C 46 90, 58 30, 128 30 Z'
    )
    shape(c, body, '#a0703f', { y0: 30, y1: 214, gloss: [80, 60, 18, 8, -0.4] })
    // bụng có vảy chữ V
    flat(c, ell(128, 170, 50, 40), '#f3dcb8')
    for (const [x, y] of [
      [108, 158],
      [128, 166],
      [148, 158],
      [118, 182],
      [138, 182]
    ])
      line(c, `M${x - 6} ${y - 4} L ${x} ${y + 2} L ${x + 6} ${y - 4}`, 3, '#c49a6a')
    // đĩa mặt + mắt to
    both(c, () => {
      shape(c, circle(98, 98, 32), '#f3dcb8', { lw: 5, y0: 66, y1: 130 })
      shape(c, circle(98, 98, 22), '#ffffff', { lw: 4 })
    })
    eye(c, 100, 100, 14)
    eye(c, 156, 100, 14)
    shape(c, P('M118 124 L 138 124 L 128 144 Z'), '#ff9f2b', { lw: 4 })
    cheek(c, 72, 138)
    cheek(c, 184, 138)
    // chân
    both(c, () => {
      line(c, 'M100 210 L 96 222 M108 210 L 108 224 M116 210 L 120 222', 7, INK)
      line(c, 'M100 210 L 96 222 M108 210 L 108 224 M116 210 L 120 222', 3, '#ff9f2b')
    })
  },
  penguin(c) {
    shadow(c, 232, 76)
    both(c, () => {
      shape(c, ell(106, 222, 20, 10), '#ff9f2b', { lw: 5 })
      shape(c, ell(54, 156, 16, 40, 0.35), '#2f3550', { y0: 116, y1: 196 })
    })
    const body = P(
      'M128 28 C 190 28, 204 90, 202 140 C 200 196, 170 222, 128 222 C 86 222, 56 196, 54 140 C 52 90, 66 28, 128 28 Z'
    )
    shape(c, body, '#3a4160', { y0: 28, y1: 222, gloss: [86, 60, 18, 8, -0.4] })
    // mặt trắng hình trái tim + bụng
    flat(c, ell(128, 168, 56, 52), '#ffffff')
    flat(
      c,
      P(
        'M128 82 C 112 60, 72 70, 76 110 C 78 136, 104 146, 128 140 C 152 146, 178 136, 180 110 C 184 70, 144 60, 128 82 Z'
      ),
      '#ffffff'
    )
    line(c, 'M90 184 Q 128 204 166 184', 3, '#dfe4ee')
    eye(c, 104, 106, 10)
    eye(c, 152, 106, 10)
    cheek(c, 88, 130)
    cheek(c, 168, 130)
    shape(c, P('M112 122 Q 128 114 144 122 L 128 140 Z'), '#ff9f2b', { lw: 4 })
  },
  mouse(c) {
    shadow(c, 232, 72)
    // đuôi dài
    tube(c, 'M170 210 C 222 216, 240 176, 218 158 C 200 144, 206 122, 230 118', '#f5a3b5', 6)
    shape(c, ell(128, 202, 50, 30), '#a9a9bb', { y0: 172, y1: 232 })
    flat(c, ell(128, 210, 28, 16), '#e6e6ee')
    both(c, () => {
      shape(c, ell(106, 228, 13, 8), '#f5a3b5', { lw: 4 })
      shape(c, circle(62, 74, 40), '#a9a9bb', { y0: 34, y1: 114, gloss: [50, 56, 10, 6, -0.4] })
      flat(c, circle(64, 76, 26), '#ffbccb')
    })
    shape(c, ell(128, 136, 70, 58), '#a9a9bb', { y0: 78, y1: 194, gloss: [96, 104, 18, 8, -0.4] })
    flat(c, ell(128, 158, 34, 22), '#e6e6ee')
    eye(c, 102, 130)
    eye(c, 154, 130)
    cheek(c, 84, 156)
    cheek(c, 172, 156)
    shape(c, ell(128, 150, 9, 7), '#ff7b9a', { lw: 4, gloss: [125, 147, 3, 2] })
    line(c, 'M128 157 L 128 163 M118 166 Q 123 170 128 163 Q 133 170 138 166', 4)
    line(c, 'M60 150 L 92 154 M62 168 L 92 162 M196 150 L 164 154 M194 168 L 164 162', 3)
  },
  deer(c) {
    shadow(c, 234, 70)
    // gạc
    both(c, () => {
      tube(c, 'M98 70 Q 84 42 70 22', '#8a5a3a', 8)
      tube(c, 'M86 46 Q 66 44 54 32', '#8a5a3a', 7)
      tube(c, 'M78 32 Q 86 20 92 14', '#8a5a3a', 6)
    })
    const body = ell(128, 204, 48, 30)
    patched(c, body, '#c98a4f', 174, 234, () => {
      for (const [x, y] of [
        [100, 194],
        [120, 186],
        [150, 196],
        [164, 210],
        [134, 210]
      ])
        flat(c, circle(x, y, 5), '#fff4e0')
    })
    both(c, () => {
      shape(c, ell(108, 230, 12, 7), '#6b4430', { lw: 4 })
      shape(c, ell(54, 104, 30, 13, -0.4), '#c98a4f', { y0: 90, y1: 118 })
      flat(c, ell(56, 104, 18, 6, -0.4), '#f3c9a8')
    })
    shape(c, ell(128, 122, 62, 60), '#c98a4f', { y0: 62, y1: 182, gloss: [100, 88, 18, 8, -0.4] })
    flat(c, circle(128, 90, 4), '#fff4e0')
    flat(c, circle(116, 80, 3), '#fff4e0')
    flat(c, circle(140, 80, 3), '#fff4e0')
    shape(c, ell(128, 158, 34, 24), '#f6e3c8', { lw: 5, y0: 134, y1: 182 })
    shape(c, ell(128, 148, 10, 7), '#4a3a48', { lw: 3, gloss: [125, 145, 3, 2] })
    smile(c, 128, 162, 8)
    eye(c, 102, 120)
    eye(c, 154, 120)
    cheek(c, 84, 144)
    cheek(c, 172, 144)
  },
  snail(c) {
    shadow(c, 228, 100)
    // thân mềm
    const foot = P(
      'M40 222 Q 30 222 32 210 L 46 128 Q 50 96 74 96 Q 98 96 100 128 L 104 190 L 214 196 Q 236 200 232 214 Q 228 224 208 222 Z'
    )
    // râu mắt
    tube(c, 'M62 104 Q 54 78 44 60', '#ffd9a0', 6)
    tube(c, 'M86 104 Q 90 76 98 56', '#ffd9a0', 6)
    shape(c, foot, '#ffd9a0', { y0: 96, y1: 224, gloss: [62, 116, 6, 12, 0] })
    // vỏ xoắn
    const shellPath = circle(158, 132, 64)
    shape(c, shellPath, '#f0a050', { y0: 68, y1: 196, gloss: [128, 92, 20, 9, -0.5] })
    let d = 'M158 132'
    for (let i = 1; i <= 60; i++) {
      const a = (i / 60) * TAU * 2.6
      const r = (i / 60) * 56
      d += ` L ${158 + Math.cos(a) * r} ${132 + Math.sin(a) * r}`
    }
    line(c, d, 6, '#b8642a')
    shape(c, circle(44, 56, 10), '#ffffff', { lw: 4 })
    shape(c, circle(98, 52, 10), '#ffffff', { lw: 4 })
    eye(c, 45, 57, 6)
    eye(c, 99, 53, 6)
    cheek(c, 52, 156, 0.8)
    cheek(c, 92, 156, 0.8)
    smile(c, 72, 146, 8)
  },
  ant(c) {
    shadow(c, 228, 92)
    const legs = (color: string, w: number, dx: number): void => {
      for (const [x0, x1, x2] of [
        [120, 92, 80],
        [132, 132, 126],
        [144, 172, 184]
      ])
        tube(c, `M${x0 + dx} 156 L ${x1 + dx} 184 L ${x2 + dx} 222`, color, w)
    }
    legs('#9a3f2a', 5, 10)
    // bụng sau, ngực, đầu
    shape(c, ell(192, 158, 46, 38, -0.2), '#d2603f', {
      y0: 120,
      y1: 196,
      gloss: [178, 136, 14, 7, -0.4]
    })
    shape(c, ell(136, 156, 26, 20), '#d2603f', { y0: 136, y1: 176 })
    legs('#d2603f', 5, 0)
    // râu
    tube(c, 'M66 76 Q 52 44 70 28', '#d2603f', 4)
    tube(c, 'M98 72 Q 100 40 122 32', '#d2603f', 4)
    shape(c, circle(70, 28, 7), '#d2603f', { lw: 4 })
    shape(c, circle(122, 32, 7), '#d2603f', { lw: 4 })
    shape(c, ell(82, 118, 52, 48), '#d2603f', { y0: 70, y1: 166, gloss: [62, 92, 14, 7, -0.4] })
    eye(c, 66, 116, 10)
    eye(c, 104, 116, 10)
    cheek(c, 52, 138)
    cheek(c, 116, 140, 0.8)
    smile(c, 85, 136, 8)
  },
  wolf(c) {
    shadow(c, 232, 90)
    // đuôi xù to, chóp trắng
    const tail = P(
      'M170 210 C 214 214, 244 180, 236 128 C 230 108, 212 104, 206 124 C 202 160, 190 186, 162 192 Z'
    )
    patched(c, tail, '#8d96a8', 104, 214, () => {
      flat(c, P('M200 100 L 250 100 L 250 140 Q 226 150 204 136 Z'), '#f2f4f8')
    })
    shape(c, ell(126, 202, 48, 30), '#8d96a8', { y0: 172, y1: 232 })
    flat(c, ell(126, 210, 26, 16), '#f2f4f8')
    both(c, () => {
      shape(c, ell(106, 228, 13, 8), '#6f7889', { lw: 4 })
      // tai nhọn dựng
      shape(c, P('M56 96 L 62 18 L 112 64 Z'), '#8d96a8', { y0: 18, y1: 96 })
      flat(c, P('M70 80 L 72 40 L 98 64 Z'), '#ffc6d0')
      flat(c, P('M60 30 L 62 18 L 74 30 Z'), '#4f5768')
    })
    // đầu có lông má xù hai bên
    const head = P(
      'M128 54 C 182 54, 206 92, 204 120 L 222 136 L 202 144 L 212 160 L 190 160 C 176 182, 150 190, 128 190 C 106 190, 80 182, 66 160 L 44 160 L 54 144 L 34 136 L 52 120 C 50 92, 74 54, 128 54 Z'
    )
    patched(
      c,
      head,
      '#8d96a8',
      54,
      190,
      () => {
        flat(
          c,
          P(
            'M128 104 C 104 104, 92 130, 60 140 C 80 186, 176 186, 196 140 C 164 130, 152 104, 128 104 Z'
          ),
          '#f2f4f8'
        )
        flat(c, P('M116 64 L 128 92 L 140 64 Z'), '#6f7889')
      },
      [96, 80, 18, 8, -0.4]
    )
    shape(c, ell(128, 152, 26, 18), '#ffffff', { lw: 4 })
    shape(c, P('M116 138 Q 128 132 140 138 Q 138 150 128 150 Q 118 150 116 138 Z'), INK, {
      line: false,
      gloss: [124, 139, 4, 2]
    })
    line(c, 'M128 150 L 128 158 M116 160 Q 122 166 128 158 Q 134 166 140 160', 4)
    eye(c, 100, 118, 9)
    eye(c, 156, 118, 9)
    cheek(c, 84, 146)
    cheek(c, 172, 146)
  },
  swan(c) {
    // cổ cong dài
    tube(c, 'M104 178 C 70 150, 60 120, 78 94 C 90 74, 92 64, 82 56', '#ffffff', 30)
    shape(c, P('M50 56 L 18 70 L 52 74 Z'), '#ff8a3d', { lw: 4 })
    shape(c, circle(80, 56, 32), '#ffffff', { y0: 24, y1: 88, gloss: [70, 40, 10, 6, -0.3] })
    flat(c, P('M50 54 Q 58 48 62 58 Q 60 70 50 68 Z'), INK)
    eye(c, 84, 52, 8)
    cheek(c, 98, 72, 0.8)
    smile(c, 72, 74, 6)
    // thân & cánh xếp
    const body = P(
      'M70 196 C 64 160, 98 146, 140 150 C 176 152, 196 132, 214 116 C 232 150, 230 196, 196 206 L 90 210 Z'
    )
    shape(c, body, '#ffffff', { y0: 116, y1: 210, gloss: [108, 164, 22, 6, -0.1] })
    shape(c, P('M120 182 C 138 150, 180 146, 210 128 C 208 160, 196 186, 160 194 Z'), '#eef2f8', {
      lw: 5,
      y0: 128,
      y1: 194
    })
    line(c, 'M150 176 Q 170 166 188 158 M156 188 Q 178 180 196 170', 3, '#c9d2de')
    water(c, 196)
  }
}
