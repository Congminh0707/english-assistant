// Chữ số 1–10 (trừ 3, ở trial.ts): một chữ số to vẽ bằng tube + số chấm đếm tương ứng bên dưới. Khung 256×256, xem kit.ts.
import { ell, line, shape, tube, type Painter } from '../kit'

const DOT = '#ffd23f'

/** Hàng chấm đếm: mỗi phần tử của `rows` là số chấm của một hàng, căn giữa. */
function dots(
  c: CanvasRenderingContext2D,
  rows: number[],
  ys: number[],
  r: number,
  gap: number
): void {
  rows.forEach((n, i) => {
    const y = ys[i]
    for (let k = 0; k < n; k++) {
      const x = 128 + (k - (n - 1) / 2) * gap
      shape(c, ell(x, y, r, r), DOT, {
        lw: 5,
        gloss: [x - r * 0.35, y - r * 0.4, r * 0.35, r * 0.24]
      })
    }
  })
}

/** Hai hàng chấm (cho 4–10) — chữ số phải nằm trong khoảng y ≤ ~150. */
const twoRows = (c: CanvasRenderingContext2D, a: number, b: number): void =>
  dots(c, [a, b], [194, 228], 14, 38)

/** Vòng elip dạng chuỗi SVG — nối với nét khác thành một path để viền mực không cắt ngang chỗ nối. */
const loop = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} Z`

const shine = (c: CanvasRenderingContext2D, d: string): void =>
  line(c, d, 8, 'rgba(255,255,255,.55)')

export const PICTURES: Record<string, Painter> = {
  one(c) {
    tube(c, 'M98 62 L 136 34 L 136 160 M106 164 L 166 164', '#ff5b5b', 38)
    shine(c, 'M104 54 L 126 38')
    dots(c, [1], [222], 17, 44)
  },
  two(c) {
    tube(c, 'M86 66 Q 98 30 132 30 Q 172 32 170 70 Q 166 102 88 162 L 172 162', '#ff922b', 38)
    shine(c, 'M92 50 Q 106 26 134 24')
    dots(c, [2], [222], 17, 44)
  },
  four(c) {
    tube(c, 'M146 144 L 146 36 L 82 112 L 182 112', '#40c057', 36)
    shine(c, 'M146 50 L 146 40')
    twoRows(c, 2, 2)
  },
  five(c) {
    tube(
      c,
      'M168 38 L 106 38 L 100 84 Q 140 70 162 94 Q 178 118 156 138 Q 128 156 92 138',
      '#339af0',
      36
    )
    shine(c, 'M110 30 L 160 30')
    twoRows(c, 3, 2)
  },
  six(c) {
    tube(c, `M158 42 Q 122 28 104 58 Q 92 80 94 112 ${loop(128, 114, 34, 30)}`, '#f06595', 32)
    shine(c, 'M108 42 Q 128 28 150 34')
    twoRows(c, 3, 3)
  },
  seven(c) {
    tube(c, 'M84 40 L 172 40 Q 128 92 116 144', '#15aabf', 36)
    shine(c, 'M92 32 L 160 32')
    twoRows(c, 4, 3)
  },
  eight(c) {
    tube(c, `${loop(128, 114, 36, 30)} ${loop(128, 56, 29, 25)}`, '#82c91e', 30)
    shine(c, 'M112 34 Q 128 26 144 34')
    twoRows(c, 4, 4)
  },
  nine(c) {
    tube(c, `${loop(128, 60, 34, 30)} M162 62 Q 164 100 150 122 Q 132 148 100 138`, '#4c6ef5', 32)
    shine(c, 'M108 36 Q 128 24 148 36')
    twoRows(c, 5, 4)
  },
  ten(c) {
    tube(c, 'M50 62 L 82 38 L 82 144', '#ff5b5b', 34)
    shine(c, 'M56 54 L 74 40')
    tube(c, ell(164, 90, 34, 52), '#4c6ef5', 34)
    shine(c, 'M148 36 Q 164 30 180 36')
    twoRows(c, 5, 5)
  }
}
