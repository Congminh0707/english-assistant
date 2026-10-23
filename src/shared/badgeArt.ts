// Pixel art cho huy hiệu thành tựu: huy chương tròn 32×32 (viền vát theo hạng, nền chấm dither) + biểu tượng 20×20.
// Biểu tượng được "vẽ" bằng các hình cơ bản (đa giác, tròn, đoạn thẳng) rồi tự động đổ sáng/tối ở mép và viền ngoài,
// nên chi tiết hơn tự gõ từng ô. Thuần dữ liệu → renderer chỉ việc vẽ các ô vuông (SVG), test được ở Node.

import { darken, Grid, INK, lighten, mix } from './pixelGrid'

export const BADGE_SIZE = 32
export const GLYPH_SIZE = 20
/** Hệ số của bản nét dùng cho ảnh PNG đóng gói sẵn (32 × 8 = 256px) */
export const BADGE_HIRES_SCALE = 8

// --- Biểu tượng (toạ độ trong lưới 20×20, chừa 1 ô viền) ---

type Painter = (g: Grid) => void

const starPoints = (
  cx: number,
  cy: number,
  outer: number,
  inner: number
): Array<[number, number]> =>
  Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })

const PAINTERS: Record<string, Painter> = {
  flame: (g) => {
    g.poly(
      [
        [10, 1],
        [13, 5],
        [16, 9],
        [17, 13],
        [15, 17],
        [10, 19],
        [5, 17],
        [3, 13],
        [4, 9],
        [7, 11],
        [8, 6]
      ],
      '#e8432e'
    )
    g.poly(
      [
        [10, 6],
        [13, 10],
        [14, 14],
        [12, 17],
        [10, 18],
        [8, 17],
        [6, 14],
        [7, 11],
        [9, 9]
      ],
      '#ff9a2e'
    )
    g.poly(
      [
        [10, 11],
        [12, 14],
        [11, 17],
        [10, 17.5],
        [8, 16],
        [8, 14]
      ],
      '#ffe066'
    )
    g.circle(10, 15.5, 1.5, '#fff7c2')
  },
  cards: (g) => {
    g.rect(6, 2, 10, 13, '#4a78d6')
    g.rect(3, 5, 12, 13, '#fdfdfd')
    g.rect(5, 8, 8, 1, '#9aa5c4')
    g.rect(5, 11, 8, 1, '#9aa5c4')
    g.rect(5, 14, 4, 1, '#9aa5c4')
    g.line(10.5, 14, 12, 15.8, 0.7, '#2fae4e')
    g.line(12, 15.8, 15.5, 10.8, 0.7, '#2fae4e')
  },
  book: (g) => {
    g.poly(
      [
        [1, 6],
        [10, 9],
        [19, 6],
        [19, 17],
        [10, 19],
        [1, 17]
      ],
      '#3a66d0'
    )
    g.poly(
      [
        [3, 4],
        [9, 6.5],
        [9, 16],
        [3, 13.5]
      ],
      '#fff4d6'
    )
    g.poly(
      [
        [17, 4],
        [11, 6.5],
        [11, 16],
        [17, 13.5]
      ],
      '#fff4d6'
    )
    g.rect(9, 6.5, 2, 12, '#27479a')
    for (const y of [7.5, 10, 12.5]) {
      g.line(4.5, y - 0.5, 7.8, y + 0.8, 0.35, '#b8a98a')
      g.line(15.5, y - 0.5, 12.2, y + 0.8, 0.35, '#b8a98a')
    }
  },
  target: (g) => {
    g.circle(9.5, 11, 8, '#e8432e')
    g.circle(9.5, 11, 6.2, '#fdfdfd')
    g.circle(9.5, 11, 4.4, '#e8432e')
    g.circle(9.5, 11, 2.6, '#fdfdfd')
    g.circle(9.5, 11, 1.3, '#ffd23f')
    g.line(9.5, 11, 16.5, 4, 0.6, '#7a5230')
    g.poly(
      [
        [14.5, 5.5],
        [17, 1.5],
        [18.7, 3.2],
        [15, 6.6]
      ],
      '#ffd23f'
    )
    g.poly(
      [
        [13, 4.4],
        [15.6, 1.4],
        [16.4, 2.2],
        [13.8, 5.2]
      ],
      '#fff3a0'
    )
  },
  cap: (g) => {
    g.poly(
      [
        [5, 11],
        [10, 13.5],
        [15, 11],
        [15, 15.5],
        [10, 18],
        [5, 15.5]
      ],
      '#2d4fa8'
    )
    g.poly(
      [
        [10, 3],
        [19, 8],
        [10, 13],
        [1, 8]
      ],
      '#4b78e0'
    )
    g.poly(
      [
        [10, 3],
        [19, 8],
        [10, 8]
      ],
      '#8fb0ff'
    )
    g.circle(10, 8, 1, '#ffd23f')
    g.line(10, 8, 17.5, 9.2, 0.35, '#ffd23f')
    g.line(17.5, 9.2, 17.5, 15, 0.45, '#ffd23f')
    g.circle(17.5, 16, 1.4, '#ffd23f')
  },
  star: (g) => {
    g.poly(starPoints(10, 10.6, 9.2, 4), '#ffd23f')
    g.poly(starPoints(9.6, 10.2, 5.6, 2.4), '#fff1a0')
    g.circle(8.5, 8.5, 1, '#ffffff')
  },
  calendar: (g) => {
    g.rect(3, 4, 14, 14, '#fdfdfd')
    g.rect(3, 4, 14, 4, '#e8432e')
    g.rect(6, 2, 2, 4, '#7a7f94')
    g.rect(12, 2, 2, 4, '#7a7f94')
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        g.rect(5.5 + c * 3.5, 9.5 + r * 2.8, 2, 1.8, r === 1 && c === 1 ? '#2fae4e' : '#4a78d6')
      }
    }
  },
  bolt: (g) => {
    g.poly(
      [
        [12, 1],
        [4, 11],
        [9, 11],
        [7, 19],
        [16, 8],
        [10.5, 8]
      ],
      '#ffd23f'
    )
    g.poly(
      [
        [12, 2.5],
        [7, 10],
        [10, 10]
      ],
      '#fff3a0'
    )
  },
  heart: (g) => {
    g.circle(6.4, 7, 4.6, '#e8432e')
    g.circle(13.6, 7, 4.6, '#e8432e')
    g.poly(
      [
        [1.6, 8.2],
        [10, 18.6],
        [18.4, 8.2]
      ],
      '#e8432e'
    )
    g.circle(5.6, 5.6, 1.6, '#ff9aa5')
    g.circle(12.4, 4.9, 0.8, '#ffc2c9')
  },
  lock: (g) => {
    g.circle(10, 7.5, 5.2, '#a4abc0')
    g.circle(10, 7.5, 3, null)
    g.rect(3, 8.5, 14, 10, '#7a7f94')
    g.rect(3, 8.5, 14, 2, '#9aa0b4')
    g.circle(10, 12.8, 1.7, '#2b2b3a')
    g.rect(9.2, 12.8, 1.6, 3.4, '#2b2b3a')
  }
}

// --- Biểu tượng chi tiết cho bản nét (scale ≥ 2): đường cong mượt, nhiều lớp tô bóng, chi tiết nhỏ ---

/** Điểm (dx, dy) tính từ tâm (cx, cy) sau khi xoay `rot` rad */
const rotPt = (cx: number, cy: number, dx: number, dy: number, rot: number): [number, number] => [
  cx + dx * Math.cos(rot) - dy * Math.sin(rot),
  cy + dx * Math.sin(rot) + dy * Math.cos(rot)
]

/** Hình chữ nhật bo góc (w×h, bán kính góc r) xoay `rot` rad quanh tâm, dạng đa giác */
function rotRect(
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot: number,
  r: number
): Array<[number, number]> {
  const out: Array<[number, number]> = []
  const hw = w / 2 - r
  const hh = h / 2 - r
  const corners: Array<[number, number, number]> = [
    [hw, -hh, -Math.PI / 2],
    [hw, hh, 0],
    [-hw, hh, Math.PI / 2],
    [-hw, -hh, Math.PI]
  ]
  for (const [ox, oy, a0] of corners) {
    for (let k = 0; k <= 5; k++) {
      const a = a0 + (k / 5) * (Math.PI / 2)
      out.push(rotPt(cx, cy, ox + r * Math.cos(a), oy + r * Math.sin(a), rot))
    }
  }
  return out
}

/** Làm mượt đường viền kín bằng Catmull-Rom → đa giác dày điểm */
function smoothClosed(points: Array<[number, number]>, per = 8): Array<[number, number]> {
  const n = points.length
  const out: Array<[number, number]> = []
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    for (let k = 0; k < per; k++) {
      const t = k / per
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number): number =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  return out
}

/** Thu nhỏ một đường viền về phía điểm neo (đáy ngọn lửa) để tạo các lớp lồng nhau */
const shrink = (
  pts: Array<[number, number]>,
  k: number,
  ax: number,
  ay: number,
  skew = 0
): Array<[number, number]> =>
  pts.map(([x, y]) => [ax + (x - ax) * k + skew * (1 - k) * ((ay - y) / 18), ay + (y - ay) * k])

const FLAME_OUTER: Array<[number, number]> = [
  [10, 0.8],
  [12.2, 3.5],
  [14.1, 6.2],
  [16.3, 8.9],
  [17.3, 12.1],
  [16.4, 15.4],
  [14.1, 17.8],
  [10.9, 19],
  [8, 18.9],
  [5.3, 17.4],
  [3.5, 14.7],
  [3.1, 11.7],
  [4.2, 8.9],
  [5.5, 7.2],
  [6.1, 9.8],
  [7.3, 10.7],
  [8.3, 8.1],
  [8.5, 5.1],
  [9.2, 2.7]
]

/** Biểu tượng chi tiết (chỉ dùng khi scale ≥ 2); thiếu thì dùng bản thường */
const PAINTERS_HD: Record<string, Painter> = {
  flame: (g) => {
    const outer = smoothClosed(FLAME_OUTER)
    // thân ngọn lửa nhiều lớp lồng nhau
    g.poly(outer, '#c7261f')
    g.poly(shrink(outer, 0.88, 10, 18.6, 0.3), '#e8432e')
    g.poly(shrink(outer, 0.74, 10, 18.4, 0.9), '#f9632c')
    g.poly(shrink(outer, 0.6, 10.2, 18.2, 1.4), '#ff9a2e')
    g.poly(shrink(outer, 0.46, 10.2, 18, 1.6), '#ffc23a')
    g.poly(shrink(outer, 0.3, 10.3, 17.8, 1.2), '#ffe27a')
    g.poly(shrink(outer, 0.15, 10.3, 17.6, 0.6), '#fff8d2')
    // vệt sáng bên trái từng lớp
    g.line(6, 11.5, 6.8, 14.8, 0.35, '#ff8f7a')
    g.line(8.6, 8.4, 9, 6.4, 0.3, '#ff8f7a')
  },
  cards: (g) => {
    // ba thẻ xếp quạt; mỗi thẻ có cạnh dày (lớp tối lệch xuống-phải) và vạch sáng ở mép trên
    const card = (
      cx: number,
      cy: number,
      rot: number,
      face: string,
      edge: string,
      shine: string
    ): void => {
      g.poly(rotRect(cx + 0.45, cy + 0.6, 10.4, 13.6, rot, 1.3), edge)
      g.poly(rotRect(cx, cy, 10.4, 13.6, rot, 1.3), face)
      g.poly(
        rotRect(cx - 0.1, cy - 0.35, 9.4, 12.4, rot, 1.1).map(
          ([x, y]) => [x, y] as [number, number]
        ),
        face
      )
      g.line(...rotPt(cx, cy, -4.4, -6.2, rot), ...rotPt(cx, cy, 3.2, -6.4, rot), 0.3, shine)
    }
    card(8, 10.4, -0.32, '#3a5fc4', '#223a85', '#7a9bf0')
    card(10, 10.2, 0.14, '#5b86e8', '#2f4fa8', '#a8c2ff')
    card(10.6, 10.6, -0.05, '#fdfdfd', '#9aa5c4', '#ffffff')
    // dòng chữ giả và dấu tích hai tông
    for (const [y, w] of [
      [6.2, 6.6],
      [8.2, 6.6],
      [10.2, 4.2]
    ] as const) {
      g.line(6.6, y, 6.6 + w, y, 0.32, '#b4bdd6')
    }
    g.line(10.4, 14.4, 12.6, 16.7, 0.95, '#1f8a3a')
    g.line(12.6, 16.7, 16.4, 10.9, 0.95, '#1f8a3a')
    g.line(10.4, 14.1, 12.6, 16.3, 0.7, '#3ddc63')
    g.line(12.6, 16.3, 16.3, 10.7, 0.7, '#3ddc63')
    g.line(11.2, 13.7, 12.5, 15.2, 0.22, '#c9ffd6')
  },
  book: (g) => {
    // bìa xanh, hai trang kem cong nhẹ, gáy, dải đánh dấu đỏ, dòng chữ giả nhiều dòng
    g.poly(
      smoothClosed(
        [
          [0.8, 6.4],
          [5, 5.9],
          [10, 8],
          [15, 5.9],
          [19.2, 6.4],
          [19.2, 16.6],
          [15, 17.6],
          [10, 19.2],
          [5, 17.6],
          [0.8, 16.6]
        ],
        6
      ),
      '#2a4fb4'
    )
    g.poly(
      smoothClosed(
        [
          [1.4, 6.6],
          [5, 6.2],
          [10, 8.4],
          [10, 17.8],
          [5, 16.6],
          [1.4, 15.8]
        ],
        6
      ),
      '#3a66d0'
    )
    const page = (sx: number): void => {
      const m = (x: number): number => 10 + (x - 10) * sx
      g.poly(
        smoothClosed(
          [
            [m(2.8), 3.9],
            [m(6), 3.6],
            [m(9.4), 5.8],
            [m(9.4), 16.2],
            [m(6), 14.4],
            [m(2.8), 13.9]
          ],
          6
        ),
        '#fff4d6'
      )
      g.poly(
        smoothClosed(
          [
            [m(7.4), 4.7],
            [m(9.4), 5.8],
            [m(9.4), 16.2],
            [m(7.4), 15]
          ],
          4
        ),
        '#e8d6aa'
      )
      for (const y of [6, 8, 10, 12]) {
        g.line(m(4), y - 0.3, m(7.6), y + 0.7, 0.28, '#b4a47e')
      }
      g.line(m(3.6), 4.7, m(6), 4.5, 0.2, '#ffffff')
    }
    page(1)
    page(-1)
    g.poly(
      [
        [9.3, 5.4],
        [10.7, 5.4],
        [10.7, 17.4],
        [9.3, 17.4]
      ],
      '#1f3a86'
    )
    g.poly(
      [
        [9.7, 15],
        [10.5, 15],
        [10.5, 19.2],
        [10.1, 18.4],
        [9.7, 19.2]
      ],
      '#e8432e'
    )
  },
  target: (g) => {
    // đĩa 5 vòng, mỗi vòng có mép tối bên dưới-phải; mũi tên cắm lệch với lông vũ 2 tông
    const ring = (r: number, face: string, edge: string): void => {
      g.circle(9.2, 11.2, r, edge)
      g.circle(8.95, 10.95, r - 0.28, face)
    }
    ring(8.2, '#e8432e', '#8a1f16')
    ring(6.6, '#fdfdfd', '#a9b0c6')
    ring(5, '#e8432e', '#8a1f16')
    ring(3.4, '#fdfdfd', '#a9b0c6')
    ring(1.8, '#ffd23f', '#b8860b')
    g.circle(8.5, 10.4, 0.5, '#fff8d2')
    g.line(9.2, 11.2, 16.3, 4, 0.55, '#6a4424')
    g.line(9.2, 11, 16.1, 3.9, 0.3, '#b98a52')
    g.poly(
      [
        [14.2, 5.7],
        [16.6, 1.2],
        [18.9, 3.1],
        [15.2, 6.6]
      ],
      '#c8860b'
    )
    g.poly(
      [
        [14.4, 5.3],
        [16.4, 1.6],
        [18.2, 3],
        [15.2, 6.2]
      ],
      '#ffd23f'
    )
    g.poly(
      [
        [13.2, 4.6],
        [15.4, 1.6],
        [16.2, 2.4],
        [14, 5.4]
      ],
      '#fff3a0'
    )
    g.line(15.8, 4.2, 18.6, 1.4, 0.18, '#ffffff')
  },
  cap: (g) => {
    // mũ cử nhân: đế cong, tấm vuông 3 mặt sáng, nút vàng, tua rua nhiều sợi
    g.poly(
      smoothClosed(
        [
          [4.6, 10.4],
          [10, 13.4],
          [15.4, 10.4],
          [15.4, 15.6],
          [10, 18.6],
          [4.6, 15.6]
        ],
        6
      ),
      '#223d86'
    )
    g.poly(
      smoothClosed(
        [
          [5.4, 11.4],
          [10, 13.9],
          [14.6, 11.4],
          [14.6, 15.2],
          [10, 17.7],
          [5.4, 15.2]
        ],
        6
      ),
      '#2d4fa8'
    )
    g.poly(
      [
        [10, 2.6],
        [19.4, 7.8],
        [10, 13],
        [0.6, 7.8]
      ],
      '#34509c'
    )
    g.poly(
      [
        [10, 2.6],
        [19.4, 7.8],
        [10, 13],
        [0.6, 7.8]
      ].map(([x, y]) => [10 + (x - 10) * 0.94, 7.8 + (y - 7.8) * 0.9] as [number, number]),
      '#4b78e0'
    )
    g.poly(
      [
        [10, 3.2],
        [18.3, 7.8],
        [10, 7.8]
      ],
      '#8fb0ff'
    )
    g.poly(
      [
        [10, 3.2],
        [1.7, 7.8],
        [10, 7.8]
      ],
      '#6e98f4'
    )
    g.line(10, 7.8, 10, 12.2, 0.2, '#2a448f')
    g.circle(10, 7.8, 1, '#b8860b')
    g.circle(9.85, 7.65, 0.78, '#ffd23f')
    g.line(10, 7.8, 17.2, 9, 0.28, '#e0a21a')
    g.line(17.2, 9, 17.2, 14.4, 0.4, '#e0a21a')
    g.line(17.2, 9, 17.2, 14.4, 0.2, '#ffd23f')
    for (const dx of [-0.7, -0.25, 0.25, 0.7])
      g.line(17.2 + dx * 0.4, 14.4, 17.2 + dx * 1.4, 17.4, 0.18, '#ffd23f')
    g.circle(17.2, 14.5, 0.9, '#b8860b')
    g.circle(17.1, 14.4, 0.7, '#ffd23f')
  },
  star: (g) => {
    // sao 5 cánh dạng ngọc: mỗi cánh có mặt sáng/tối, tâm sáng, ánh lấp lánh
    const cx = 10
    const cy = 10.7
    const outerPts = starPoints(cx, cy, 9.4, 4.1)
    g.poly(outerPts, '#c8860b')
    const inset = starPoints(cx, cy, 8.6, 3.7)
    g.poly(inset, '#ffd23f')
    for (let i = 0; i < 5; i++) {
      const tip = inset[i * 2]
      const left = inset[(i * 2 + 9) % 10]
      const right = inset[(i * 2 + 1) % 10]
      g.poly([[cx, cy], tip, left], i % 2 === 0 ? '#ffe27a' : '#ffd23f')
      g.poly([[cx, cy], tip, right], i % 2 === 0 ? '#f2b21f' : '#e0a21a')
    }
    g.poly(starPoints(cx - 0.2, cy - 0.2, 3.6, 1.7), '#fff1a0')
    g.circle(8.4, 7.4, 0.9, '#ffffff')
    g.line(7.6, 5.4, 9, 4.2, 0.2, '#ffffff')
  },
  calendar: (g) => {
    // trang lịch: thân bo góc, đầu đỏ, hai khoen kim loại, lưới ngày, ngày hiện tại nổi bật
    g.poly(rotRect(10, 11.2, 14.6, 14.4, 0, 1.6), '#9aa5c4')
    g.poly(rotRect(9.9, 11, 14.4, 14.1, 0, 1.5), '#fdfdfd')
    g.poly(rotRect(10, 6, 14.4, 4.6, 0, 1.4), '#b3261e')
    g.poly(rotRect(9.9, 5.8, 14.2, 4, 0, 1.2), '#e8432e')
    g.line(3.6, 4.1, 16.2, 4.1, 0.22, '#ff8f7a')
    for (const x of [6.2, 13.8]) {
      g.poly(rotRect(x, 3.6, 1.7, 3.8, 0, 0.7), '#5a5f74')
      g.poly(rotRect(x - 0.12, 3.5, 1.2, 3.4, 0, 0.5), '#b4bad0')
    }
    const days = [
      ['#4a78d6', '#2f55a8'],
      ['#4a78d6', '#2f55a8'],
      ['#4a78d6', '#2f55a8'],
      ['#4a78d6', '#2f55a8'],
      ['#2fae4e', '#1f7a36'],
      ['#4a78d6', '#2f55a8'],
      ['#4a78d6', '#2f55a8'],
      ['#4a78d6', '#2f55a8'],
      ['#4a78d6', '#2f55a8']
    ]
    days.forEach(([face, edge], i) => {
      const x = 5.9 + (i % 3) * 3.9
      const y = 10 + Math.floor(i / 3) * 3.1
      g.poly(rotRect(x + 0.12, y + 0.15, 2.6, 2.1, 0, 0.5), edge)
      g.poly(rotRect(x, y, 2.6, 2.1, 0, 0.5), face)
    })
    g.line(9.1, 13.1, 9.9, 14, 0.28, '#ffffff')
    g.line(9.9, 14, 11.2, 12.4, 0.28, '#ffffff')
  },
  bolt: (g) => {
    // tia chớp nhiều mặt: viền cam, thân vàng, mặt sáng bên trái, vệt trắng, tia lửa điện nhỏ
    const bolt: Array<[number, number]> = [
      [12.4, 0.8],
      [3.6, 11.2],
      [8.6, 11.2],
      [6.4, 19.2],
      [16.6, 8],
      [11, 8]
    ]
    g.poly(bolt, '#c8860b')
    g.poly(shrink(bolt, 0.9, 10, 10, 0), '#ffd23f')
    g.poly(
      [
        [12, 2.6],
        [5.9, 10.4],
        [9.4, 10.4],
        [9.6, 9.8],
        [11.6, 4.6]
      ],
      '#fff3a0'
    )
    g.poly(
      [
        [11, 8.4],
        [14.6, 8.4],
        [7.8, 16.4],
        [8.6, 11.8]
      ],
      '#f2b21f'
    )
    g.line(11.6, 3.4, 7.2, 9.6, 0.22, '#ffffff')
    g.line(9.6, 8.4, 10, 9.2, 0.16, '#ffffff')
  },
  heart: (g) => {
    // trái tim: ba lớp đỏ thẫm → đỏ → hồng, vệt bóng kính và ánh lấp lánh
    const pts: Array<[number, number]> = Array.from({ length: 64 }, (_, i) => {
      const t = (i / 64) * Math.PI * 2
      const x = 16 * Math.sin(t) ** 3
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
      return [10 + (x / 16) * 9, 9.6 - (y / 16) * 9]
    })
    g.poly(pts, '#a8182c')
    g.poly(shrink(pts, 0.93, 10, 9.4, -0.3), '#d92b3c')
    g.poly(shrink(pts, 0.78, 8.8, 8.2, 0.4), '#f2495a')
    g.poly(shrink(pts, 0.52, 7.6, 6.6, 0.8), '#ff7a8a')
    g.poly(
      smoothClosed(
        [
          [4.4, 5],
          [6, 3.6],
          [8.2, 3.8],
          [8.6, 5],
          [6.8, 5.6]
        ],
        6
      ),
      '#ffc2c9'
    )
    g.circle(5.6, 4.8, 0.55, '#ffffff')
    g.circle(13.8, 5, 0.4, '#ffd0d6')
  },
  lock: (g) => {
    // ổ khóa: quai kim loại hai tông, thân bo góc đổ sáng, lỗ khóa và vệt sáng
    g.circle(10, 7.6, 5.4, '#6b7188')
    g.circle(10, 7.6, 3.1, null)
    g.circle(9.9, 7.5, 4.9, '#b4bad0')
    g.circle(9.9, 7.5, 3.5, null)
    g.poly(rotRect(10.1, 13.6, 14.6, 9.6, 0, 1.6), '#4a4f64')
    g.poly(rotRect(10, 13.4, 14.4, 9.4, 0, 1.5), '#8a90a8')
    g.poly(rotRect(10, 11.4, 14, 5, 0, 1.3), '#a6adc4')
    g.line(4, 9.4, 16, 9.4, 0.2, '#e4e8f4')
    g.circle(10, 13.2, 1.6, '#23263a')
    g.poly(
      [
        [9.2, 13.2],
        [10.8, 13.2],
        [11.2, 17],
        [8.8, 17]
      ],
      '#23263a'
    )
    g.circle(9.5, 12.7, 0.45, '#5b6178')
  }
}

/** Chi tiết vẽ SAU khi đã đổ sáng và viền (không bị viền tối bao quanh): tia lửa, điểm sáng... */
const POST_HD: Record<string, Painter> = {
  flame: (g) => {
    g.circle(14.6, 1.9, 0.55, '#ffd23f')
    g.circle(16.9, 4.6, 0.42, '#ffe9a0')
    g.circle(3.4, 3.4, 0.45, '#ffb347')
    g.circle(5.6, 1.4, 0.32, '#ffe9a0')
    g.circle(17.6, 8.2, 0.3, '#ffb347')
  }
}

/** Tên các biểu tượng có sẵn */
export const GLYPHS: Record<string, true> = Object.fromEntries(
  Object.keys(PAINTERS).map((name) => [name, true])
)

const glyphCache = new Map<string, Grid>()

/** `scale` = số ô mỗi đơn vị logic (1 = bản 32×32 của bộ cài, 3 = bản 96×96 nét hơn) */
const postCache = new Map<string, Grid | null>()

/** Lớp chi tiết vẽ sau cùng (tia lửa, điểm sáng): không bị viền/bóng đổ; null nếu biểu tượng không có */
function glyphPost(name: string, scale: number): Grid | null {
  const key = `${name}@${scale}`
  let grid = postCache.get(key)
  if (grid === undefined) {
    const paint = scale >= 2 ? POST_HD[name] : undefined
    if (paint) {
      grid = new Grid(GLYPH_SIZE, scale)
      paint(grid)
    } else grid = null
    postCache.set(key, grid)
  }
  return grid
}

function glyphGrid(name: string, scale = 1): Grid {
  const key = `${name}@${scale}`
  let grid = glyphCache.get(key)
  if (!grid) {
    const paint = (scale >= 2 ? PAINTERS_HD[name] : undefined) ?? PAINTERS[name]
    if (!paint) throw new Error(`Unknown badge glyph: ${name}`)
    grid = new Grid(GLYPH_SIZE, scale)
    paint(grid)
    // Viền và dải sáng/tối dày ~1 ô logic ở mọi độ phân giải
    grid.shadeAndOutline(scale, scale)
    glyphCache.set(key, grid)
  }
  return grid
}

// --- Huy chương ---

export const TIERS = ['bronze', 'silver', 'gold', 'diamond'] as const
export type BadgeTier = (typeof TIERS)[number]

interface TierColors {
  /** Viền huy chương */
  ring: string
  /** Mặt sáng (góc trên trái) */
  shine: string
  /** Mặt tối (góc dưới phải) */
  shade: string
  /** Nền bên trong: tối ở rìa, sáng ở giữa (dither) */
  fieldDark: string
  fieldLight: string
}

export const TIER_COLORS: Record<BadgeTier | 'locked', TierColors> = {
  bronze: {
    ring: '#c8803c',
    shine: '#f4b97a',
    shade: '#8a5224',
    fieldDark: '#3a2316',
    fieldLight: '#8a5a36'
  },
  silver: {
    ring: '#b8bfd0',
    shine: '#f2f5fc',
    shade: '#7c8499',
    fieldDark: '#262b3b',
    fieldLight: '#5f6a8c'
  },
  gold: {
    ring: '#f2c230',
    shine: '#fff3a0',
    shade: '#b8860b',
    fieldDark: '#3d2f0c',
    fieldLight: '#9a7a1e'
  },
  diamond: {
    ring: '#5de6ff',
    shine: '#e0fbff',
    shade: '#2a8fb8',
    fieldDark: '#14304f',
    fieldLight: '#3a82b4'
  },
  locked: {
    ring: '#6b6f80',
    shine: '#8a8ea0',
    shade: '#4c4f5e',
    fieldDark: '#1f2130',
    fieldLight: '#33364a'
  }
}

/** Ma trận Bayer 4×4 cho dither nền */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
]

export interface BadgePixel {
  x: number
  y: number
  color: string
}

function medal(tier: BadgeTier | 'locked', scale = 1): Grid {
  const colors = TIER_COLORS[tier]
  const grid = new Grid(BADGE_SIZE, scale)
  const half = BADGE_SIZE / 2
  const dim = grid.dim
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      // Toạ độ logic (đơn vị 32×32) của tâm ô → cùng một thiết kế ở mọi độ phân giải
      const dx = (x + 0.5) / scale - half
      const dy = (y + 0.5) / scale - half
      const d = Math.hypot(dx, dy)
      if (d > half) continue
      if (d > half - 1) {
        grid.set(x, y, INK)
      } else if (d > 12.4) {
        // viền vát: sáng ở góc trên trái, tối ở góc dưới phải
        const side = (dx + dy) / (d * Math.SQRT2)
        let c = side < -0.4 ? colors.shine : side > 0.4 ? colors.shade : colors.ring
        if (d > 14.2) c = darken(c, 0.18)
        else if (d < 13.2) c = lighten(c, 0.12)
        grid.set(x, y, c)
      } else if (d > 11.4) {
        grid.set(x, y, darken(colors.ring, 0.62))
      } else {
        // nền: sáng dần về phía trên trái; bản thô dither 2 tông, bản nét dùng chuyển màu mượt 4 bậc
        const lit = Math.max(0, 1 - Math.hypot(dx + 3, dy + 4) / 15)
        if (scale === 1) {
          const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16
          grid.set(x, y, lit > threshold ? colors.fieldLight : colors.fieldDark)
        } else {
          const t = Math.round(lit * 4) / 4 + (BAYER[y % 4][x % 4] / 16 - 0.47) * 0.12
          grid.set(x, y, mix(colors.fieldDark, colors.fieldLight, Math.min(1, Math.max(0, t))))
        }
      }
    }
  }
  if (tier === 'gold' || tier === 'diamond' || tier === 'silver') {
    // lấp lánh nhỏ ở góc trên phải của nền (toạ độ logic)
    const spark = tier === 'silver' ? '#ffffff' : colors.shine
    const dot = (lx: number, ly: number, color: string): void => {
      for (let j = 0; j < scale; j++)
        for (let i = 0; i < scale; i++) grid.set(lx * scale + i, ly * scale + j, color)
    }
    for (const [x, y] of [
      [24, 8],
      [23, 8],
      [25, 8],
      [22, 8],
      [26, 8],
      [24, 7],
      [24, 9],
      [24, 6],
      [24, 10]
    ]) {
      dot(x, y, spark)
    }
    dot(24, 8, '#ffffff')
  }
  return grid
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

/**
 * Huy chương chi tiết cho bản nét (scale ≥ 2): viền vát hai lớp sáng/tối theo hướng đèn, hàng đinh tán,
 * ngọc ở đỉnh, nền chuyển sắc có tia nắng mờ + tối dần ở mép + vệt phản chiếu kính ở góc trên trái.
 */
function medalDetailed(tier: BadgeTier | 'locked', scale: number): Grid {
  const c = TIER_COLORS[tier]
  const grid = new Grid(BADGE_SIZE, scale)
  const half = BADGE_SIZE / 2
  const dim = grid.dim
  const gem =
    tier === 'bronze'
      ? '#ff6b57'
      : tier === 'silver'
        ? '#7ad7ff'
        : tier === 'gold'
          ? '#ff4d6d'
          : '#ffffff'
  const rays = 14
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const dx = (x + 0.5) / scale - half
      const dy = (y + 0.5) / scale - half
      const d = Math.hypot(dx, dy)
      if (d > half) continue
      // ánh sáng từ trên-trái: +1 ở góc trên trái, -1 ở góc dưới phải
      const light = -(dx + dy) / (Math.max(d, 0.001) * Math.SQRT2)
      const ang = Math.atan2(dy, dx)
      if (d > half - 0.9) {
        grid.set(x, y, INK)
      } else if (d > 11.3) {
        // vòng viền: vát ngoài (d 14.4–15.1) tối hơn, mặt phẳng, vát trong (11.3–12.4) đảo chiều sáng
        let t = light
        if (d < 12.4) t = -light * 0.8
        let col = mix(c.shade, c.shine, clamp01(0.5 + t * 0.5))
        if (d > 14.3) col = darken(col, 0.22 + 0.1 * clamp01(-light))
        else if (d > 12.4 && d < 13) col = lighten(col, 0.1)
        grid.set(x, y, col)
        // đinh tán: 20 chấm quanh vòng, sáng ở nửa trên-trái, tối ở nửa dưới-phải
        const ringD = 13.4
        const step = (Math.PI * 2) / 20
        const near = Math.abs(((ang + Math.PI / 2 + step / 2) % step) - step / 2)
        if (Math.abs(d - ringD) < 0.62 && near * ringD < 0.62) {
          grid.set(x, y, light > 0 ? lighten(c.shine, 0.3) : darken(c.shade, 0.2))
        }
      } else {
        // nền: chuyển sắc xuyên tâm lệch về trên-trái, tia nắng mờ, tối dần ra mép
        const lit = clamp01(1 - Math.hypot(dx + 3, dy + 4) / 15)
        const ray =
          (Math.floor(((ang + Math.PI) / (Math.PI * 2)) * rays) % 2 === 0 ? 0.06 : 0) * (1 - d / 12)
        let t = clamp01(lit * 0.95 + ray)
        // dither rất nhẹ để giữ chất pixel
        t = clamp01(t + (BAYER[y % 4][x % 4] / 16 - 0.47) * 0.07)
        let col = mix(c.fieldDark, c.fieldLight, t)
        if (d > 9.6) col = darken(col, 0.18 * ((d - 9.6) / 1.7)) // vignette sát mép
        // vệt phản chiếu kính ở góc trên trái
        const gx = (dx + 5.2) / 5.6
        const gy = (dy + 6.4) / 3.0
        if (gx * gx + gy * gy < 1 && dx + dy < -3) col = lighten(col, 0.16)
        grid.set(x, y, col)
      }
    }
  }
  // ngọc ở đỉnh vòng viền
  const jewel = (cx: number, cy: number, r: number, col: string): void => {
    for (let y = 0; y < dim; y++)
      for (let x = 0; x < dim; x++) {
        const dd = Math.hypot((x + 0.5) / scale - cx, (y + 0.5) / scale - cy)
        if (dd <= r + 0.5) grid.set(x, y, INK)
      }
    for (let y = 0; y < dim; y++)
      for (let x = 0; x < dim; x++) {
        const lx = (x + 0.5) / scale - cx
        const ly = (y + 0.5) / scale - cy
        const dd = Math.hypot(lx, ly)
        if (dd <= r - 0.15)
          grid.set(
            x,
            y,
            lx + ly < -r * 0.3 ? lighten(col, 0.45) : lx + ly > r * 0.5 ? darken(col, 0.3) : col
          )
      }
  }
  if (tier !== 'locked') jewel(half, half - 13.35, 1.55, gem)
  if (tier === 'gold' || tier === 'diamond' || tier === 'silver') {
    // lấp lánh bốn cánh ở góc trên phải của nền
    const spark = tier === 'silver' ? '#ffffff' : c.shine
    const sx = 23.6
    const sy = 9.2
    for (let y = 0; y < dim; y++)
      for (let x = 0; x < dim; x++) {
        const lx = Math.abs((x + 0.5) / scale - sx)
        const ly = Math.abs((y + 0.5) / scale - sy)
        const arm = Math.min(lx, ly) < 0.3 && Math.max(lx, ly) < 2.8 - Math.min(lx, ly) * 4
        if (arm) grid.set(x, y, spark)
        if (lx + ly < 0.55) grid.set(x, y, '#ffffff')
      }
  }
  return grid
}

const medalCache = new Map<string, Grid>()

/** Các ô màu của một huy hiệu (chưa gộp). Chưa mở khoá → màu xám + biểu tượng ổ khoá. */
export function badgePixels(
  glyph: string,
  tier: BadgeTier,
  locked: boolean,
  scale = 1
): BadgePixel[] {
  const key = `${locked ? 'locked' : tier}@${scale}`
  let base = medalCache.get(key)
  if (!base) {
    base =
      scale >= 2
        ? medalDetailed(locked ? 'locked' : tier, scale)
        : medal(locked ? 'locked' : tier, scale)
    medalCache.set(key, base)
  }
  const art = glyphGrid(locked ? 'lock' : glyph, scale)
  const offset = ((BADGE_SIZE - GLYPH_SIZE) / 2) * scale
  const dim = BADGE_SIZE * scale
  const pixels: BadgePixel[] = []
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      let color = art.get(x - offset, y - offset) ?? base.get(x, y)
      if (scale >= 2) {
        color = detailGlyphCell(art, base, x, y, offset, scale, color, locked ? undefined : glyph)
        color = (locked ? null : glyphPost(glyph, scale))?.get(x - offset, y - offset) ?? color
      }
      if (color) pixels.push({ x, y, color })
    }
  }
  return pixels
}

/** Màu quầng sáng quanh biểu tượng trên nền huy chương (bản nét) */
const GLOW: Record<string, string> = {
  flame: '#ff7a1f',
  bolt: '#ffe066',
  star: '#fff0a0',
  heart: '#ff7a9a',
  target: '#ff6b57'
}

/** Mật độ lấy mẫu của bản đồ quầng sáng: 2 ô mỗi đơn vị logic (đủ mịn, nội suy khi tra) */
const GLOW_RES = 2
const glowMaps = new Map<string, Float32Array>()

/** Bản đồ quầng sáng của một biểu tượng: giảm dần theo khoảng cách tới biểu tượng (≤ 3,2 đơn vị logic) */
function glowMap(name: string): Float32Array {
  let map = glowMaps.get(name)
  if (!map) {
    const art = glyphGrid(name, GLOW_RES)
    const dim = art.dim
    const reach = 3.2 * GLOW_RES
    const r = Math.ceil(reach)
    map = new Float32Array(dim * dim)
    for (let y = 0; y < dim; y++)
      for (let x = 0; x < dim; x++) {
        let best = reach
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            const d = Math.hypot(dx, dy)
            if (d < best && art.get(x + dx, y + dy)) best = d
          }
        map[y * dim + x] = best >= reach ? 0 : (1 - best / reach) ** 2
      }
    glowMaps.set(name, map)
  }
  return map
}

/** Cường độ quầng sáng (0–1) tại ô (gx, gy) của lưới biểu tượng ở độ phân giải `scale` (nội suy song tuyến) */
function glowAt(name: string, gx: number, gy: number, scale: number): number {
  const map = glowMap(name)
  const dim = GLYPH_SIZE * GLOW_RES
  const fx = ((gx + 0.5) / scale) * GLOW_RES - 0.5
  const fy = ((gy + 0.5) / scale) * GLOW_RES - 0.5
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const tx = fx - x0
  const ty = fy - y0
  const at = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= dim || y >= dim ? 0 : map[y * dim + x]
  return (
    at(x0, y0) * (1 - tx) * (1 - ty) +
    at(x0 + 1, y0) * tx * (1 - ty) +
    at(x0, y0 + 1) * (1 - tx) * ty +
    at(x0 + 1, y0 + 1) * tx * ty
  )
}

/**
 * Bản nét: biểu tượng có bóng đổ xuống nền (lệch xuống-phải), đổ sáng mượt theo hướng đèn
 * (trên-trái sáng, dưới-phải tối) thay vì chỉ sáng/tối ở mép, và điểm sáng nhỏ ở góc trên-trái của khối.
 */
function detailGlyphCell(
  art: Grid,
  base: Grid,
  x: number,
  y: number,
  offset: number,
  scale: number,
  color: string | null,
  glyphName?: string
): string | null {
  const gx = x - offset
  const gy = y - offset
  if (art.get(gx, gy)) {
    const c = art.get(gx, gy) as string
    // gradient theo vị trí trong biểu tượng
    const u = (gx + gy) / (GLYPH_SIZE * scale * 2)
    let out = u < 0.5 ? lighten(c, (0.5 - u) * 0.34) : darken(c, (u - 0.5) * 0.34)
    // mép trên-trái của khối: điểm sáng
    const edgeNear = !art.get(gx - scale, gy) || !art.get(gx, gy - scale)
    if (edgeNear && u < 0.55 && c !== INK) out = lighten(out, 0.18)
    return out
  }
  // bóng đổ: ô nền mà ô cách (−1,−1.5) logic thuộc biểu tượng
  const sx = Math.round(gx - scale * 1.0)
  const sy = Math.round(gy - scale * 1.5)
  if (art.get(sx, sy) && base.get(x, y) && color) return darken(color, 0.38)
  const glow = glyphName ? GLOW[glyphName] : undefined
  if (glow && color && base.get(x, y) === color) {
    const k = glowAt(glyphName as string, gx, gy, scale)
    if (k > 0.01) return mix(color, glow, k * 0.4)
  }
  return color
}

export interface BadgeRect extends BadgePixel {
  w: number
}

/** Gộp các ô liền nhau cùng màu trên một hàng → ít phần tử SVG hơn */
export function mergeRuns(pixels: BadgePixel[]): BadgeRect[] {
  const rects: BadgeRect[] = []
  for (const p of pixels) {
    const last = rects[rects.length - 1]
    if (last && last.y === p.y && last.color === p.color && last.x + last.w === p.x) last.w++
    else rects.push({ ...p, w: 1 })
  }
  return rects
}
