// Hình minh hoạ pixel art cho bài tập chọn hình / lưới âm (đặc biệt cho trẻ chưa biết đọc): mỗi hình là một vật thể
// lớn, viền đậm, màu phẳng trên lưới 32×32, vẽ bằng hình cơ bản (xem pixelGrid.ts). Thay cho emoji hệ thống vốn khác
// nhau giữa các máy và khó nhận ra khi nhỏ. Thuần dữ liệu → renderer vẽ các ô vuông bằng SVG, test được ở Node.
import { mergeRuns, type BadgePixel, type BadgeRect } from './badgeArt'
import { PICTURE_EXTRAS, PICTURE_EXTRA_IDS } from './pictureExtras'
import { darken, Grid, lighten } from './pixelGrid'
import { MORE_PAINTERS, MORE_WORDS } from './picturesMore'

/** Bản vẽ theo toạ độ 32×32 nhưng dựng trên lưới 64×64 ô (gấp đôi chi tiết) để phóng to vẫn mịn */
export const PICTURE_SCALE = 2
export const PICTURE_LOGICAL = 32
export const PICTURE_SIZE = PICTURE_LOGICAL * PICTURE_SCALE

type Painter = (g: Grid) => void

const DARK = '#2b2b3a'
const WHITE = '#fdfdfd'

/** Đa giác cho hình có trục xiên (bút chì...): dải rộng `half` dọc theo trục từ a đến b, đoạn [t0, t1] (0–1) */
function strip(
  a: [number, number],
  b: [number, number],
  t0: number,
  t1: number,
  half: number
): Array<[number, number]> {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const len = Math.hypot(dx, dy)
  const [nx, ny] = [-dy / len, dx / len]
  const p = (t: number, s: number): [number, number] => [
    a[0] + dx * t + nx * half * s,
    a[1] + dy * t + ny * half * s
  ]
  return [p(t0, -1), p(t1, -1), p(t1, 1), p(t0, 1)]
}

/** Nửa vòm tròn (nửa trên của hình tròn) làm đa giác — vd đống cơm trong bát */
function dome(cx: number, cy: number, r: number): Array<[number, number]> {
  return Array.from({ length: 21 }, (_, i) => {
    const a = Math.PI + (i * Math.PI) / 20
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
}

/** Hai mắt tròn đen có điểm sáng */
function eyes(g: Grid, y: number, dx: number, r = 1.7): void {
  for (const x of [16 - dx, 16 + dx]) {
    g.circle(x, y, r, DARK)
    g.circle(x - r * 0.35, y - r * 0.35, r * 0.4, WHITE)
  }
}

/** Các ô nằm trong elip (dùng để rải chấm hoa văn bên trong hình) */
function insideEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  x: number,
  y: number
): boolean {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.8
}

function steam(g: Grid, xs: number[], top: number): void {
  for (const x of xs) {
    g.line(x, top + 5, x + 1.2, top + 2.5, 0.8, '#cfd3e0')
    g.line(x + 1.2, top + 2.5, x, top, 0.8, '#cfd3e0')
  }
}

const PAINTERS: Record<string, Painter> = {
  // ------------------------------------------------------------ Con vật
  dog: (g) => {
    g.ellipse(6.5, 15, 3.2, 6.5, '#8a5a36')
    g.ellipse(25.5, 15, 3.2, 6.5, '#8a5a36')
    g.circle(16, 17, 9.5, '#d9a066')
    g.circle(11, 12.5, 2.8, '#8a5a36')
    g.ellipse(16, 22, 5.5, 4.5, '#f6e7cf')
    eyes(g, 15.5, 4.5)
    g.ellipse(16, 20.2, 2.4, 1.7, DARK)
    g.line(16, 21.5, 16, 23.5, 0.4, DARK)
    g.line(16, 23.5, 13.5, 25, 0.4, DARK)
    g.line(16, 23.5, 18.5, 25, 0.4, DARK)
    g.ellipse(16, 27, 1.8, 2, '#ff7b8a')
  },
  cat: (g) => {
    g.poly(
      [
        [7, 3.5],
        [14, 9.5],
        [6.5, 14]
      ],
      '#f2994a'
    )
    g.poly(
      [
        [25, 3.5],
        [18, 9.5],
        [25.5, 14]
      ],
      '#f2994a'
    )
    g.poly(
      [
        [8.3, 7],
        [11.7, 10],
        [8, 12]
      ],
      '#ffb3c1'
    )
    g.poly(
      [
        [23.7, 7],
        [20.3, 10],
        [24, 12]
      ],
      '#ffb3c1'
    )
    g.circle(16, 19, 10, '#f2994a')
    for (const x of [13.5, 16, 18.5]) g.line(x, 11, x, 13.5, 0.4, '#c8661e')
    g.ellipse(16, 24, 4.2, 3, WHITE)
    for (const x of [11.5, 20.5]) {
      g.ellipse(x, 18, 2.2, 2.7, '#6bd16b')
      g.ellipse(x, 18, 0.7, 2.2, DARK)
    }
    g.poly(
      [
        [14.5, 21.5],
        [17.5, 21.5],
        [16, 23.2]
      ],
      '#ff7b9a'
    )
    g.line(16, 23.2, 14, 25, 0.35, DARK)
    g.line(16, 23.2, 18, 25, 0.35, DARK)
    for (const [y, dy] of [
      [21.5, -1.5],
      [24, 1.5]
    ] as const) {
      g.line(8, y, 1.8, y + dy, 0.35, DARK)
      g.line(24, y, 30.2, y + dy, 0.35, DARK)
    }
  },
  fish: (g) => {
    g.poly(
      [
        [21, 16],
        [29.5, 8.5],
        [29.5, 23.5]
      ],
      '#ff7a2e'
    )
    g.poly(
      [
        [9, 10],
        [15, 3.5],
        [20, 10.5]
      ],
      '#ff7a2e'
    )
    g.ellipse(14, 16, 11, 8, '#ff9a3d')
    g.ellipse(14, 20, 8, 3.5, '#ffd9a0')
    for (const x of [14, 18]) g.line(x, 9, x + 1, 22, 0.5, '#e8641e')
    g.circle(8, 14, 2.6, WHITE)
    g.circle(7.6, 14, 1.4, DARK)
    g.line(3.5, 18, 6, 18.8, 0.4, DARK)
    g.ellipse(13, 25, 3, 1.8, '#ff7a2e')
  },
  bird: (g) => {
    g.poly(
      [
        [11, 9],
        [13, 3.5],
        [16, 9]
      ],
      '#4aa3ff'
    )
    g.poly(
      [
        [5, 16],
        [1.2, 18.2],
        [5, 20.5]
      ],
      '#ffb02e'
    )
    g.circle(15, 18, 10, '#4aa3ff')
    g.ellipse(15, 22.5, 6.5, 5, '#dff0ff')
    g.ellipse(21, 18, 4.2, 6.5, '#2d78d6')
    g.circle(10, 14.5, 2.3, WHITE)
    g.circle(9.7, 14.5, 1.3, DARK)
    g.line(12.5, 28, 12.5, 30.5, 0.7, '#ff9a1f')
    g.line(17.5, 28, 17.5, 30.5, 0.7, '#ff9a1f')
  },
  horse: (g) => {
    g.poly(
      [
        [10, 6.5],
        [11, 1.5],
        [14, 5]
      ],
      '#9b5c2e'
    )
    g.poly(
      [
        [18, 3.5],
        [20, 1.5],
        [21.5, 6]
      ],
      '#9b5c2e'
    )
    g.poly(
      [
        [11, 3],
        [17, 2],
        [23, 12],
        [24, 28],
        [14, 29.5],
        [10, 18],
        [9, 8]
      ],
      '#9b5c2e'
    )
    g.poly(
      [
        [9, 8],
        [11, 3],
        [13.5, 6],
        [12.5, 14],
        [10, 18.5]
      ],
      '#3a2417'
    )
    g.poly(
      [
        [16, 5.5],
        [19, 5],
        [20.5, 16],
        [17.5, 17.5]
      ],
      WHITE
    )
    g.ellipse(19.5, 24, 5.2, 4.5, '#c98b55')
    g.circle(21.3, 25, 0.9, DARK)
    g.circle(17, 12.5, 1.7, DARK)
    g.circle(16.5, 12, 0.6, WHITE)
  },
  cow: (g) => {
    g.poly(
      [
        [10, 7],
        [7.5, 2],
        [12.5, 5]
      ],
      '#f6e7cf'
    )
    g.poly(
      [
        [22, 7],
        [24.5, 2],
        [19.5, 5]
      ],
      '#f6e7cf'
    )
    g.ellipse(5.5, 12.5, 3.8, 2.3, '#ffb3c1')
    g.ellipse(26.5, 12.5, 3.8, 2.3, '#ffb3c1')
    g.ellipse(16, 17.5, 9.5, 10.5, WHITE)
    g.circle(10.5, 12.5, 3.6, DARK)
    g.ellipse(16, 24, 6.8, 4.8, '#ffb3c1')
    g.circle(13.5, 24, 1, '#c8667f')
    g.circle(18.5, 24, 1, '#c8667f')
    g.circle(19.5, 14.5, 1.6, DARK)
    g.circle(13, 14.5, 1.6, DARK)
  },
  pig: (g) => {
    g.poly(
      [
        [8, 4.5],
        [14, 9],
        [7, 13]
      ],
      '#ff9fb5'
    )
    g.poly(
      [
        [24, 4.5],
        [18, 9],
        [25, 13]
      ],
      '#ff9fb5'
    )
    g.circle(16, 17.5, 10.5, '#ffb3c1')
    g.circle(9.5, 21, 2.2, '#ff9fb5')
    g.circle(22.5, 21, 2.2, '#ff9fb5')
    g.ellipse(16, 21.5, 5.2, 4, '#ff8fa6')
    g.circle(14, 21.5, 0.9, '#c8667f')
    g.circle(18, 21.5, 0.9, '#c8667f')
    eyes(g, 14.5, 4.8)
  },
  elephant: (g) => {
    g.ellipse(6, 14.5, 5.5, 7.2, '#9aa4b8')
    g.ellipse(26, 14.5, 5.5, 7.2, '#9aa4b8')
    g.ellipse(6.5, 14.5, 3, 5, '#ffb3c1')
    g.ellipse(25.5, 14.5, 3, 5, '#ffb3c1')
    g.circle(16, 14, 9, '#b4bdd0')
    g.poly(
      [
        [12.5, 17],
        [19.5, 17],
        [20, 26],
        [24, 28.2],
        [21.5, 30.7],
        [15.5, 28.5],
        [13, 26]
      ],
      '#b4bdd0'
    )
    g.poly(
      [
        [11.5, 19],
        [8.5, 26],
        [12, 25]
      ],
      WHITE
    )
    g.poly(
      [
        [20.5, 19],
        [23.5, 26],
        [20, 25]
      ],
      WHITE
    )
    eyes(g, 12.5, 4.2, 1.5)
  },
  rabbit: (g) => {
    g.ellipse(11.5, 8, 3.2, 8, WHITE)
    g.ellipse(20.5, 8, 3.2, 8, WHITE)
    g.ellipse(11.5, 9, 1.5, 5.5, '#ffb3c1')
    g.ellipse(20.5, 9, 1.5, 5.5, '#ffb3c1')
    g.circle(16, 20, 9, WHITE)
    g.circle(9.8, 22.5, 2, '#ffd0da')
    g.circle(22.2, 22.5, 2, '#ffd0da')
    eyes(g, 19, 3.7)
    g.ellipse(16, 22.2, 1.6, 1.2, '#ff7b9a')
    g.line(16, 23.4, 14.5, 24.8, 0.35, DARK)
    g.line(16, 23.4, 17.5, 24.8, 0.35, DARK)
    g.rect(15, 25, 2, 2.6, '#e6e6ef')
  },
  monkey: (g) => {
    g.circle(5.5, 17, 3.8, '#8a5a36')
    g.circle(26.5, 17, 3.8, '#8a5a36')
    g.circle(5.5, 17, 2, '#f0c9a0')
    g.circle(26.5, 17, 2, '#f0c9a0')
    g.circle(16, 15, 10, '#8a5a36')
    g.circle(12.8, 15.5, 4, '#f0c9a0')
    g.circle(19.2, 15.5, 4, '#f0c9a0')
    g.ellipse(16, 21, 6, 5, '#f0c9a0')
    eyes(g, 15.5, 3.2, 1.5)
    g.circle(15, 19.3, 0.6, DARK)
    g.circle(17, 19.3, 0.6, DARK)
    g.line(13.5, 22.5, 16, 24, 0.4, DARK)
    g.line(16, 24, 18.5, 22.5, 0.4, DARK)
  },
  duck: (g) => {
    g.poly(
      [
        [3, 16],
        [8.5, 15],
        [7, 21]
      ],
      '#e0a620'
    )
    g.ellipse(14.5, 21, 11, 7.5, '#ffd23f')
    g.circle(20, 11, 6.8, '#ffd23f')
    g.poly(
      [
        [25, 10],
        [30.5, 12],
        [25, 14.5]
      ],
      '#ff9a1f'
    )
    g.ellipse(13, 21.5, 5.5, 3.8, '#e8b820')
    g.circle(21.5, 9.5, 1.5, DARK)
    g.circle(21.1, 9.1, 0.5, WHITE)
  },
  frog: (g) => {
    g.ellipse(16, 19.5, 12, 8.5, '#6bd16b')
    g.circle(9, 12, 5, '#6bd16b')
    g.circle(23, 12, 5, '#6bd16b')
    for (const x of [9, 23]) {
      g.circle(x, 11.5, 3.3, WHITE)
      g.circle(x, 12, 1.8, DARK)
    }
    g.ellipse(16, 24, 7, 3.2, '#a8e8a0')
    g.line(10.5, 22.5, 16, 25.2, 0.45, DARK)
    g.line(16, 25.2, 21.5, 22.5, 0.45, DARK)
    g.circle(14.5, 18, 0.6, DARK)
    g.circle(17.5, 18, 0.6, DARK)
    g.circle(6.5, 20, 1.8, '#ffb3c1')
    g.circle(25.5, 20, 1.8, '#ffb3c1')
  },
  bear: (g) => {
    g.circle(7.5, 8, 4.4, '#9b6b3f')
    g.circle(24.5, 8, 4.4, '#9b6b3f')
    g.circle(7.5, 8, 2.2, '#e8c79a')
    g.circle(24.5, 8, 2.2, '#e8c79a')
    g.circle(16, 17.5, 11.5, '#9b6b3f')
    g.ellipse(16, 22, 5.6, 4.6, '#e8c79a')
    g.ellipse(16, 20, 2.3, 1.6, DARK)
    g.line(16, 21.4, 16, 23.2, 0.4, DARK)
    g.line(16, 23.2, 13.8, 24.5, 0.4, DARK)
    g.line(16, 23.2, 18.2, 24.5, 0.4, DARK)
    eyes(g, 14.5, 5.2)
  },
  // ------------------------------------------------------------ Trái cây
  apple: (g) => {
    g.circle(11.8, 18, 8.8, '#e8432e')
    g.circle(20.2, 18, 8.8, '#e8432e')
    g.poly(
      [
        [7, 21.5],
        [25, 21.5],
        [16, 29.8]
      ],
      '#e8432e'
    )
    g.line(16, 11, 17.5, 4.5, 0.9, '#7a4a1e')
    g.poly(
      [
        [17.5, 7],
        [25, 3.5],
        [22.5, 9]
      ],
      '#4fbf5a'
    )
    g.ellipse(10.5, 16, 1.6, 3.2, '#ff9a8a')
  },
  banana: (g) => {
    g.circle(16, 14, 13.5, '#ffd84a')
    g.circle(16, 7.5, 12.5, null)
    g.circle(3.4, 12.5, 1.6, '#7a4a1e')
    g.circle(28.6, 12.5, 1.6, '#7a4a1e')
    g.line(8, 22, 24, 22, 0.5, '#e8b820')
  },
  orange: (g) => {
    g.circle(16, 18, 11.5, '#ff9a1f')
    g.ellipse(11.5, 14, 2, 3.8, '#ffc866')
    for (const [x, y] of [
      [18, 16],
      [21, 21],
      [14, 23],
      [19, 25],
      [11, 20]
    ]) {
      g.circle(x, y, 0.6, '#e07d10')
    }
    g.circle(16, 6.7, 1.3, '#7a4a1e')
    g.poly(
      [
        [17, 6],
        [25, 3],
        [22.5, 8.5]
      ],
      '#4fbf5a'
    )
  },
  grapes: (g) => {
    g.line(16, 9, 16.5, 4, 0.8, '#7a4a1e')
    g.poly(
      [
        [17, 6],
        [25, 3],
        [22.5, 8.5]
      ],
      '#4fbf5a'
    )
    for (const [x, y] of [
      [11, 13],
      [16, 13],
      [21, 13],
      [13.5, 18.5],
      [18.5, 18.5],
      [16, 24.5],
      [8.5, 18.5],
      [23.5, 18.5]
    ]) {
      g.circle(x, y, 4.2, '#8a4fd6')
    }
    for (const [x, y] of [
      [10, 12],
      [15, 12],
      [20, 12],
      [12.5, 17.5],
      [17.5, 17.5],
      [15, 23.5]
    ]) {
      g.circle(x, y, 0.9, '#c9a6ff')
    }
  },
  strawberry: (g) => {
    g.circle(16, 14.5, 10.5, '#e8432e')
    g.poly(
      [
        [5.8, 17],
        [26.2, 17],
        [16, 29.8]
      ],
      '#e8432e'
    )
    g.poly(
      [
        [16, 2.5],
        [18, 8],
        [24.5, 5.5],
        [20, 10],
        [25, 13],
        [16, 11],
        [7, 13],
        [12, 10],
        [7.5, 5.5],
        [14, 8]
      ],
      '#4fbf5a'
    )
    for (const [x, y] of [
      [11, 15],
      [16, 14],
      [21, 15],
      [13, 20],
      [19, 20],
      [16, 25],
      [9.5, 19],
      [22.5, 19]
    ]) {
      g.circle(x, y, 0.7, '#ffe082')
    }
  },
  watermelon: (g) => {
    g.circle(16, 11, 15, '#2f9e44')
    g.circle(16, 11, 13, '#c8f0c0')
    g.circle(16, 11, 11.8, '#ff5a6a')
    g.rect(0, 0, 32, 11, null)
    for (const [x, y] of [
      [10.5, 16],
      [16, 19],
      [21.5, 16],
      [13, 23],
      [19, 23]
    ]) {
      g.ellipse(x, y, 0.8, 1.4, DARK)
    }
  },
  pineapple: (g) => {
    g.ellipse(16, 20, 8.8, 10.8, '#ffc233')
    for (let y = 12; y < 30; y += 3.2) {
      for (let x = 9; x < 24; x += 3.2) {
        if (insideEllipse(16, 20, 8.8, 10.8, x, y)) g.circle(x, y, 0.7, '#e08a1e')
        if (insideEllipse(16, 20, 8.8, 10.8, x + 1.6, y + 1.6))
          g.circle(x + 1.6, y + 1.6, 0.7, '#e08a1e')
      }
    }
    g.poly(
      [
        [16, 12],
        [10, 4.5],
        [14, 8.5],
        [16, 1.5],
        [18, 8.5],
        [22, 4.5]
      ],
      '#4fbf5a'
    )
  },
  peach: (g) => {
    g.circle(16, 18, 10.8, '#ffb38a')
    g.circle(20, 20, 7.5, '#ff8f6b')
    g.circle(12, 15, 3, '#ffd2b8')
    g.line(16, 8, 15.5, 27, 0.4, '#e0704f')
    g.line(16, 8, 17, 5, 0.8, '#7a4a1e')
    g.poly(
      [
        [17, 6],
        [25, 3],
        [22.5, 8.5]
      ],
      '#4fbf5a'
    )
  },
  lemon: (g) => {
    g.ellipse(16, 17.5, 10.8, 8.2, '#ffe14a')
    g.circle(4.8, 17.5, 2, '#ffe14a')
    g.circle(27.2, 17.5, 2, '#ffe14a')
    g.ellipse(12, 14, 3.6, 1.7, '#fff4a8')
    g.poly(
      [
        [17, 10],
        [24.5, 5.5],
        [23, 11]
      ],
      '#4fbf5a'
    )
  },
  mango: (g) => {
    g.ellipse(16, 18.5, 9, 11.2, '#ffb02e')
    g.ellipse(19, 20.5, 6.2, 9, '#ff7a3d')
    g.ellipse(12, 15, 1.8, 4, '#ffd98a')
    g.line(16, 8, 16.5, 5, 0.8, '#7a4a1e')
    g.poly(
      [
        [17, 6.5],
        [25, 3.5],
        [22, 9]
      ],
      '#4fbf5a'
    )
  },
  // ------------------------------------------------------------ Đồ ăn, thức uống
  bread: (g) => {
    g.circle(9.5, 10, 7.2, '#b86b2f')
    g.circle(22.5, 10, 7.2, '#b86b2f')
    g.rect(2.3, 10, 27.4, 17.5, '#b86b2f')
    g.circle(9.5, 10.5, 5.6, '#ffe2a8')
    g.circle(22.5, 10.5, 5.6, '#ffe2a8')
    g.rect(4.8, 10.5, 22.4, 14.8, '#ffe2a8')
    for (const [x, y] of [
      [10, 14],
      [16, 11],
      [21, 15],
      [13, 19],
      [19, 21],
      [9, 22],
      [23, 22]
    ]) {
      g.circle(x, y, 0.7, '#e8c27a')
    }
  },
  rice: (g) => {
    g.ellipse(16, 22, 13.5, 8.8, '#4a78d6')
    g.rect(0, 0, 32, 19, null)
    g.poly(dome(16, 19, 10.8), WHITE)
    for (const [x, y] of [
      [11, 15],
      [16, 11.5],
      [21, 15],
      [14, 17],
      [19, 17.5],
      [9, 17.5],
      [23, 17.5]
    ]) {
      g.ellipse(x, y, 1.2, 0.6, '#d5d9e6')
    }
    g.ellipse(16, 19.2, 13.5, 1.8, '#9fc0ff')
    g.line(24, 3, 17.5, 14, 0.8, '#c98b55')
    g.line(27.5, 5.5, 21, 15.5, 0.8, '#c98b55')
  },
  egg: (g) => {
    for (const [x, y, r] of [
      [10, 17, 7],
      [20, 14.5, 8],
      [15, 22.5, 7],
      [23.5, 21.5, 5]
    ] as const) {
      g.circle(x, y, r, WHITE)
    }
    g.circle(15.5, 18, 5, '#ffc233')
    g.circle(14, 16.3, 1.4, '#fff3a0')
  },
  noodles: (g) => {
    steam(g, [11, 16, 21], 1)
    g.ellipse(16, 22.5, 13, 8.5, '#e8432e')
    g.rect(0, 0, 32, 19.5, null)
    g.ellipse(16, 19.5, 13, 2.2, '#ffd84a')
    for (const dy of [0, 2.2]) {
      let prev: [number, number] = [4, 18 + dy]
      for (const [x, y] of [
        [7, 14.5],
        [10, 18],
        [13, 14.5],
        [16, 18],
        [19, 14.5],
        [22, 18],
        [25, 14.5],
        [28, 18]
      ] as const) {
        g.line(prev[0], prev[1], x, y + dy, 1, '#ffd84a')
        prev = [x, y + dy]
      }
    }
    g.circle(22.5, 14.5, 3, WHITE)
    g.circle(22.5, 14.5, 1.2, '#ff9fb5')
    g.line(5, 6, 14, 17, 0.8, '#c98b55')
    g.line(8.5, 4, 17, 15.5, 0.8, '#c98b55')
  },
  pizza: (g) => {
    g.poly(
      [
        [16, 29.8],
        [2.5, 9],
        [29.5, 9]
      ],
      '#ffc233'
    )
    g.poly(
      [
        [2.5, 9],
        [29.5, 9],
        [27.8, 13],
        [4.2, 13]
      ],
      '#d9863a'
    )
    g.circle(12, 16.5, 3, '#e8432e')
    g.circle(20, 17, 3, '#e8432e')
    g.circle(16, 23, 2.6, '#e8432e')
    for (const [x, y] of [
      [11, 16],
      [13, 17.5],
      [19.5, 16.2],
      [21, 18],
      [15.5, 22.5]
    ]) {
      g.circle(x, y, 0.55, '#b02a1a')
    }
    g.circle(16.5, 17, 0.9, '#6bd16b')
  },
  hamburger: (g) => {
    g.ellipse(16, 11.5, 12.5, 7.5, '#d9863a')
    g.rect(0, 14, 32, 20, null)
    for (const [x, y] of [
      [10, 8],
      [15, 6],
      [20, 8.5],
      [24, 11],
      [13, 11]
    ]) {
      g.ellipse(x, y, 1.2, 0.6, '#ffe2a8')
    }
    g.poly(
      [
        [3, 14],
        [29, 14],
        [29, 17.5],
        [26, 16.5],
        [23, 18],
        [20, 16.6],
        [17, 18],
        [14, 16.6],
        [11, 18],
        [8, 16.6],
        [5, 18],
        [3, 17.5]
      ],
      '#6bd16b'
    )
    g.rect(4, 17.5, 24, 2.2, '#e8432e')
    g.rect(3.5, 19.5, 25, 4.5, '#7a4a1e')
    g.poly(
      [
        [5, 19.5],
        [27, 19.5],
        [24.5, 22.5],
        [21, 20.5],
        [17, 23],
        [13, 20.5],
        [8, 22.5]
      ],
      '#ffd23f'
    )
    g.circle(6, 26, 2.6, '#d9863a')
    g.circle(26, 26, 2.6, '#d9863a')
    g.rect(6, 24, 20, 4.8, '#d9863a')
  },
  coffee: (g) => {
    steam(g, [10, 14, 18], 0.5)
    g.circle(24.8, 17, 4.4, WHITE)
    g.circle(24.8, 17, 2.4, null)
    g.poly(
      [
        [4.5, 11],
        [23.5, 11],
        [21, 25.5],
        [7, 25.5]
      ],
      WHITE
    )
    g.ellipse(14, 11, 9.5, 2.6, '#7a4a1e')
    g.ellipse(14, 27, 12, 2.2, '#e8e2d0')
    g.ellipse(11, 17, 1.2, 3.5, '#e6e9f5')
  },
  milk: (g) => {
    g.poly(
      [
        [7.5, 6],
        [24.5, 6],
        [22, 28.5],
        [10, 28.5]
      ],
      '#d6ecff'
    )
    g.poly(
      [
        [8.5, 11],
        [23.5, 11],
        [22, 28.5],
        [10, 28.5]
      ],
      WHITE
    )
    g.ellipse(16, 6.5, 8.5, 1.4, '#9acbff')
    g.ellipse(12.5, 19, 1.4, 5, '#e6f2ff')
    g.circle(19.5, 17, 1.6, '#cfe3ff')
  },
  tea: (g) => {
    g.line(20, 11, 25, 4.5, 0.4, WHITE)
    g.rect(24, 2, 5, 4.5, '#ffd84a')
    g.circle(24.8, 17, 4.4, '#ffd6e0')
    g.circle(24.8, 17, 2.4, null)
    g.poly(
      [
        [4.5, 11],
        [23.5, 11],
        [21, 25.5],
        [7, 25.5]
      ],
      '#ffd6e0'
    )
    g.ellipse(14, 11, 9.5, 2.6, '#8fd694')
    g.ellipse(14, 27, 12, 2.2, '#e8e2d0')
    g.circle(11, 18, 1.5, WHITE)
    g.circle(15, 20, 1.5, WHITE)
    g.circle(18, 17, 1.5, WHITE)
  },
  cheese: (g) => {
    g.poly(
      [
        [2.5, 26],
        [2.5, 15],
        [29.5, 8],
        [29.5, 26]
      ],
      '#ffd84a'
    )
    g.poly(
      [
        [2.5, 15],
        [29.5, 8],
        [29.5, 11.5],
        [2.5, 18.5]
      ],
      '#fff0a0'
    )
    g.circle(9, 22, 2.4, '#e8b020')
    g.circle(17, 18, 2, '#e8b020')
    g.circle(23, 22.5, 2.6, '#e8b020')
    g.circle(14, 24, 1.3, '#e8b020')
    g.circle(26, 15.5, 1.4, '#e8b020')
  },
  // ------------------------------------------------------------ Đồ vật
  books: (g) => {
    for (const [x, y, w, h, color] of [
      [3, 21, 25, 7, '#4a78d6'],
      [5, 14, 22, 7, '#e8432e'],
      [4, 7, 23, 7, '#4fbf5a']
    ] as const) {
      g.rect(x, y, w, h, color)
      g.rect(x + w - 3, y + 0.8, 3, h - 1.6, WHITE)
      g.rect(x + 2.5, y, 1.4, h, '#ffd23f')
      g.rect(x + 6.5, y, 1.4, h, '#ffd23f')
    }
  },
  pencil: (g) => {
    const a: [number, number] = [3, 29]
    const b: [number, number] = [27, 5]
    g.poly(strip(a, b, 0, 0.26, 3), '#f0c9a0')
    g.poly(strip(a, b, 0, 0.1, 3), DARK)
    g.poly(strip(a, b, 0.26, 0.8, 3), '#ffd23f')
    g.poly(strip(a, b, 0.8, 0.86, 3), '#b8bcc8')
    g.poly(strip(a, b, 0.86, 1, 3), '#ff9fb5')
    g.poly(strip(a, b, 0.3, 0.78, 0.9), '#ffe98a')
  },
  backpack: (g) => {
    g.circle(16, 4.8, 3.2, '#2d58b0')
    g.circle(16, 4.8, 1.5, null)
    g.ellipse(4.5, 22, 2.6, 5, '#2d58b0')
    g.ellipse(27.5, 22, 2.6, 5, '#2d58b0')
    g.circle(16, 12, 9.2, '#4a78d6')
    g.rect(6.8, 12, 18.4, 16, '#4a78d6')
    g.line(11, 9, 9.5, 16, 0.8, '#ffd23f')
    g.line(21, 9, 22.5, 16, 0.8, '#ffd23f')
    g.rect(10, 19.5, 12, 8, '#2d58b0')
    g.line(10, 22, 22, 22, 0.4, '#ffd23f')
    g.rect(14.6, 21.3, 2.8, 2.6, '#ffd23f')
    g.line(8, 13, 24, 13, 0.4, '#2d58b0')
    g.circle(16, 15.5, 1.1, '#ffd23f')
  },
  watch: (g) => {
    g.rect(11, 3, 10, 26, '#e8432e')
    g.rect(11, 3, 10, 5, '#c8301e')
    g.circle(16, 16, 10.2, '#7a7f94')
    g.circle(16, 16, 8.2, WHITE)
    for (const [x, y] of [
      [16, 9.5],
      [22.5, 16],
      [16, 22.5],
      [9.5, 16]
    ])
      g.circle(x, y, 0.7, DARK)
    g.line(16, 16, 16, 11, 0.6, DARK)
    g.line(16, 16, 20, 17.5, 0.6, DARK)
    g.circle(16, 16, 1, '#e8432e')
  },
  phone: (g) => {
    g.rect(8, 3, 16, 26, DARK)
    g.rect(9.5, 6, 13, 18, '#6ec1ff')
    const colors = ['#e8432e', '#ffd23f', '#4fbf5a', '#fdfdfd', '#ff9fb5', '#8a4fd6']
    colors.forEach((c, i) => g.rect(11 + (i % 3) * 3.8, 8 + Math.floor(i / 3) * 4.2, 3, 3, c))
    g.rect(14, 4.2, 4, 0.9, '#7a7f94')
    g.circle(16, 26.6, 1.3, '#7a7f94')
  },
  laptop: (g) => {
    g.rect(5, 5, 22, 15.5, '#4a4f66')
    g.rect(6.8, 7, 18.4, 11.5, '#6ec1ff')
    g.line(9, 10, 18, 10, 0.4, WHITE)
    g.line(9, 12.5, 21, 12.5, 0.4, WHITE)
    g.line(9, 15, 15, 15, 0.4, WHITE)
    g.poly(
      [
        [2, 21.5],
        [30, 21.5],
        [27.5, 26.5],
        [4.5, 26.5]
      ],
      '#c9ccd8'
    )
    g.rect(13, 23, 6, 1.6, '#9aa0b4')
  },
  key: (g) => {
    g.circle(8.5, 16, 6.8, '#ffd23f')
    g.circle(8.5, 16, 3.2, null)
    g.rect(13, 14.2, 16.5, 3.8, '#ffd23f')
    g.rect(22, 17.5, 3.2, 4.5, '#ffd23f')
    g.rect(27, 17.5, 2.5, 3.2, '#ffd23f')
    g.ellipse(7, 12.5, 1.5, 0.9, '#fff3a0')
  },
  chair: (g) => {
    g.rect(8, 3, 16, 13, '#c98b55')
    for (const x of [11.5, 16, 20.5]) g.rect(x - 0.5, 4.5, 1, 10, '#a8703a')
    g.rect(5.5, 16, 21, 4.5, '#a8703a')
    g.rect(6.5, 20.5, 3.2, 9.5, '#8a5a36')
    g.rect(22.3, 20.5, 3.2, 9.5, '#8a5a36')
  },
  bed: (g) => {
    g.rect(2.5, 7, 4, 21, '#8a5a36')
    g.rect(2.5, 17.5, 27, 7, WHITE)
    g.rect(9, 14.5, 20.5, 10, '#4a78d6')
    g.ellipse(10.5, 16.5, 5, 3.2, '#ffd6e0')
    g.rect(26.5, 13, 3.5, 15, '#8a5a36')
    g.line(13, 17, 28, 17, 0.4, '#8fb0ff')
  },
  umbrella: (g) => {
    g.circle(16, 13.5, 12.8, '#e8432e')
    g.rect(0, 14, 32, 20, null)
    for (const x of [7.5, 16, 24.5]) g.circle(x, 14, 4.2, '#e8432e')
    g.poly(
      [
        [16, 1.5],
        [10.5, 14],
        [21.5, 14]
      ],
      WHITE
    )
    g.line(16, 14, 16, 26, 0.9, '#7a4a1e')
    g.line(16, 26, 13.5, 28.8, 1, '#7a4a1e')
    g.line(13.5, 28.8, 10.8, 26.2, 1, '#7a4a1e')
  },
  // ------------------------------------------------------------ Thêm cho bảng chữ cái
  icecream: (g) => {
    g.poly(
      [
        [9, 16],
        [23, 16],
        [16, 30]
      ],
      '#e8a85a'
    )
    g.line(11, 18, 18, 28, 0.35, '#c8803c')
    g.line(21, 18, 14, 28, 0.35, '#c8803c')
    g.line(9.5, 17.5, 22.5, 17.5, 0.35, '#c8803c')
    g.circle(16, 12, 7.5, '#ff9fb5')
    g.circle(10.5, 15.2, 4.2, '#ff9fb5')
    g.circle(21.5, 15.2, 4.2, '#ff9fb5')
    g.ellipse(13, 9, 2, 1.2, '#ffd0da')
    g.circle(16, 4.3, 2.2, '#e8432e')
    g.line(16, 3, 18, 1.5, 0.4, '#3f9e4a')
  },
  jam: (g) => {
    g.rect(7, 10, 18, 18, '#d6ecff')
    g.rect(7.8, 14, 16.4, 13.2, '#8a1f4f')
    g.rect(6, 6, 20, 5, '#e8432e')
    g.rect(10, 17.5, 12, 7, WHITE)
    g.circle(16, 21, 2, '#e8432e')
    g.ellipse(10, 19, 0.9, 3, '#c9558a')
  },
  crown: (g) => {
    g.poly(
      [
        [4, 24],
        [4, 10],
        [10, 16],
        [16, 6],
        [22, 16],
        [28, 10],
        [28, 24]
      ],
      '#ffd23f'
    )
    g.rect(4, 21.5, 24, 5.5, '#e0a620')
    g.circle(4, 9, 2, '#ff9fb5')
    g.circle(16, 5, 2, '#6ec1ff')
    g.circle(28, 9, 2, '#ff9fb5')
    g.circle(10, 24, 1.5, '#e8432e')
    g.circle(16, 24, 1.5, '#4fbf5a')
    g.circle(22, 24, 1.5, '#e8432e')
    g.ellipse(9, 16, 1.2, 3, '#fff3a0')
  },
  van: (g) => {
    g.rect(2.5, 9, 19.5, 16, '#4a78d6')
    g.poly(
      [
        [22, 13],
        [27, 13],
        [30, 19],
        [30, 25],
        [22, 25]
      ],
      '#4a78d6'
    )
    g.poly(
      [
        [23.5, 14.5],
        [26.5, 14.5],
        [28.7, 19],
        [23.5, 19]
      ],
      '#9fd8ff'
    )
    g.rect(2.5, 15, 19.5, 2.6, WHITE)
    g.rect(29, 21, 1.8, 2.2, '#ffd23f')
    for (const x of [9, 24]) {
      g.circle(x, 25.5, 3.8, DARK)
      g.circle(x, 25.5, 1.6, '#c9ccd8')
    }
  },
  fox: (g) => {
    g.poly(
      [
        [5, 3],
        [13, 9.5],
        [5, 15]
      ],
      '#ff8a2e'
    )
    g.poly(
      [
        [27, 3],
        [19, 9.5],
        [27, 15]
      ],
      '#ff8a2e'
    )
    g.poly(
      [
        [5.5, 4.5],
        [8.5, 7],
        [6.2, 9]
      ],
      DARK
    )
    g.poly(
      [
        [26.5, 4.5],
        [23.5, 7],
        [25.8, 9]
      ],
      DARK
    )
    g.circle(16, 16.5, 10, '#ff8a2e')
    g.poly(
      [
        [6.5, 18],
        [16, 17.5],
        [25.5, 18],
        [16, 29.5]
      ],
      WHITE
    )
    g.circle(16, 27.2, 1.7, DARK)
    eyes(g, 15, 4.6, 1.5)
  },
  zebra: (g) => {
    g.poly(
      [
        [10, 6],
        [11, 1.5],
        [14, 5]
      ],
      DARK
    )
    g.poly(
      [
        [22, 6],
        [21, 1.5],
        [18, 5]
      ],
      DARK
    )
    g.ellipse(16, 16, 8.5, 12, WHITE)
    g.poly(
      [
        [13, 3.5],
        [19, 3.5],
        [18, 10],
        [14, 10]
      ],
      DARK
    )
    for (let y = 11; y < 22; y += 3.2) {
      const half = 8.5 * Math.sqrt(Math.max(0, 1 - ((y - 16) / 12) ** 2)) * 0.9
      g.line(16 - half, y, 16 - half * 0.45, y + 1.3, 0.8, DARK)
      g.line(16 + half, y, 16 + half * 0.45, y + 1.3, 0.8, DARK)
    }
    g.ellipse(16, 24.5, 5, 4, '#9aa0b4')
    g.circle(14, 24.5, 0.9, DARK)
    g.circle(18, 24.5, 0.9, DARK)
    g.circle(12.2, 15, 1.4, DARK)
    g.circle(19.8, 15, 1.4, DARK)
  },
  // ------------------------------------------------------------ Thiên nhiên, quen thuộc
  sun: (g) => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      g.line(
        16 + 10 * Math.cos(a),
        16 + 10 * Math.sin(a),
        16 + 13.5 * Math.cos(a),
        16 + 13.5 * Math.sin(a),
        1.2,
        '#ffa42e'
      )
    }
    g.circle(16, 16, 8, '#ffd23f')
    eyes(g, 14.5, 3, 1.3)
    g.line(12.5, 18.5, 16, 20.5, 0.45, DARK)
    g.line(16, 20.5, 19.5, 18.5, 0.45, DARK)
    g.circle(10.5, 18, 1.2, '#ffa42e')
    g.circle(21.5, 18, 1.2, '#ffa42e')
  },
  moon: (g) => {
    g.circle(16, 16, 12.5, '#ffe28a')
    g.circle(21.5, 12.5, 10.5, null)
    g.circle(9, 14, 1.2, '#e8c55a')
    g.circle(12, 22, 1.8, '#e8c55a')
    g.circle(8.5, 19, 0.9, '#e8c55a')
  },
  star: (g) => {
    const pts: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? 13 : 5.6
      const ang = -Math.PI / 2 + (i * Math.PI) / 5
      return [16 + r * Math.cos(ang), 17 + r * Math.sin(ang)]
    })
    g.poly(pts, '#ffd23f')
    g.circle(14, 14, 1.3, WHITE)
    eyes(g, 17, 2.6, 1.2)
    g.line(14.5, 20.5, 16, 21.5, 0.4, DARK)
    g.line(16, 21.5, 17.5, 20.5, 0.4, DARK)
  },
  tree: (g) => {
    g.rect(13.5, 18, 5, 12, '#8a5a36')
    g.circle(16, 11.5, 8.8, '#4fbf5a')
    g.circle(9.5, 17, 6.2, '#4fbf5a')
    g.circle(22.5, 17, 6.2, '#4fbf5a')
    for (const [x, y] of [
      [12, 10],
      [19, 12],
      [10, 17],
      [22, 18]
    ])
      g.circle(x, y, 1.3, '#e8432e')
  },
  flower: (g) => {
    g.line(16, 17, 16, 29.5, 1, '#3f9e4a')
    g.poly(
      [
        [16, 25],
        [24, 21],
        [21, 27.5]
      ],
      '#4fbf5a'
    )
    g.poly(
      [
        [16, 27],
        [8, 23.5],
        [11, 29]
      ],
      '#4fbf5a'
    )
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2
      g.circle(16 + 6.5 * Math.cos(a), 11 + 6.5 * Math.sin(a), 4.3, '#ff7bb0')
    }
    g.circle(16, 11, 4, '#ffd23f')
  },
  house: (g) => {
    g.rect(21, 5, 3.5, 8, '#b84b3a')
    g.rect(6, 15, 20, 14, '#ffe2a8')
    g.poly(
      [
        [2.5, 16.5],
        [16, 3.5],
        [29.5, 16.5]
      ],
      '#e8432e'
    )
    g.rect(13.5, 21, 5, 8, '#8a5a36')
    g.circle(17.2, 25.3, 0.5, '#ffd23f')
    g.rect(8, 18, 4.2, 4.2, '#6ec1ff')
    g.rect(19.8, 18, 4.2, 4.2, '#6ec1ff')
    g.line(10.1, 18, 10.1, 22.2, 0.3, WHITE)
    g.line(8, 20.1, 12.2, 20.1, 0.3, WHITE)
  },
  car: (g) => {
    g.rect(2.5, 15.5, 27, 8.5, '#e8432e')
    g.poly(
      [
        [7, 15.5],
        [10.5, 8.5],
        [21.5, 8.5],
        [25.5, 15.5]
      ],
      '#e8432e'
    )
    g.poly(
      [
        [9.3, 15],
        [12, 10.3],
        [15.3, 10.3],
        [15.3, 15]
      ],
      '#9fd8ff'
    )
    g.poly(
      [
        [17, 10.3],
        [20.5, 10.3],
        [23.3, 15],
        [17, 15]
      ],
      '#9fd8ff'
    )
    g.rect(26, 17, 3.5, 2.5, '#ffd23f')
    g.rect(2.5, 17.5, 2.5, 2, '#ffa42e')
    for (const x of [9, 23]) {
      g.circle(x, 24.5, 4.2, DARK)
      g.circle(x, 24.5, 1.8, '#c9ccd8')
    }
  },
  ball: (g) => {
    g.circle(16, 16, 12.8, WHITE)
    g.poly(
      [
        [16, 11.2],
        [20.4, 14.4],
        [18.7, 19.6],
        [13.3, 19.6],
        [11.6, 14.4]
      ],
      DARK
    )
    for (const [x, y] of [
      [16, 4],
      [26.5, 11.5],
      [22.5, 26],
      [9.5, 26],
      [5.5, 11.5]
    ])
      g.circle(x, y, 2.7, DARK)
    for (const [x, y] of [
      [16, 6.5],
      [24, 12.5],
      [21, 24],
      [11, 24],
      [8, 12.5]
    ])
      g.line(16, 15, x, y, 0.4, DARK)
  },
  cake: (g) => {
    g.ellipse(16, 28, 13.5, 2.2, '#e8e2d0')
    g.rect(5, 17, 22, 10.5, '#ff9ac0')
    g.rect(4.5, 14, 23, 5, WHITE)
    for (const x of [7.5, 12.5, 18, 23.5]) g.circle(x, 19, 2.4, WHITE)
    g.circle(16, 12, 2.6, '#e8432e')
    g.rect(15, 4.5, 2, 6, '#6ec1ff')
    g.ellipse(16, 3, 1.5, 2.2, '#ffc233')
    g.circle(10, 23, 1, WHITE)
    g.circle(17, 24, 1, WHITE)
    g.circle(23, 22.5, 1, WHITE)
  },
  heart: (g) => {
    g.circle(10.5, 12, 7.8, '#e8432e')
    g.circle(21.5, 12, 7.8, '#e8432e')
    g.poly(
      [
        [3.2, 15],
        [28.8, 15],
        [16, 29.5]
      ],
      '#e8432e'
    )
    g.ellipse(9.5, 10.5, 2.2, 3.2, '#ff9aa5')
  },
  cloud: (g) => {
    g.circle(9.5, 18.5, 6.5, WHITE)
    g.circle(16, 13.5, 8, WHITE)
    g.circle(23, 18.5, 6.5, WHITE)
    g.rect(9.5, 18.5, 13.5, 6.5, WHITE)
    g.ellipse(16, 23.5, 12, 1.4, '#dde6f5')
    eyes(g, 17.5, 3.4, 1.3)
    g.line(14.5, 20.8, 16, 21.8, 0.4, DARK)
    g.line(16, 21.8, 17.5, 20.8, 0.4, DARK)
  },
  // Hình cho bản đồ thế giới của trẻ (picturesMore.ts, docs/19-kids-world.md)
  ...MORE_PAINTERS
}

/** Tên (id) các hình có sẵn */
export const PICTURE_IDS: readonly string[] = Object.keys(PAINTERS)

/** Emoji → id hình: nội dung bài học cũ dùng emoji nên tự động hiện hình pixel tương ứng */
const EMOJI_TO_PICTURE: Record<string, string> = {
  '🐶': 'dog',
  '🐱': 'cat',
  '🐟': 'fish',
  '🐦': 'bird',
  '🐴': 'horse',
  '🐮': 'cow',
  '🐷': 'pig',
  '🐘': 'elephant',
  '🐰': 'rabbit',
  '🐵': 'monkey',
  '🦆': 'duck',
  '🐸': 'frog',
  '🐻': 'bear',
  '🍎': 'apple',
  '🍌': 'banana',
  '🍊': 'orange',
  '🍇': 'grapes',
  '🍓': 'strawberry',
  '🍉': 'watermelon',
  '🍍': 'pineapple',
  '🍑': 'peach',
  '🍋': 'lemon',
  '🥭': 'mango',
  '🍞': 'bread',
  '🍚': 'rice',
  '🥚': 'egg',
  '🍜': 'noodles',
  '🍕': 'pizza',
  '🍔': 'hamburger',
  '☕': 'coffee',
  '🥛': 'milk',
  '🍵': 'tea',
  '🧀': 'cheese',
  '🎂': 'cake',
  '📚': 'books',
  '✏': 'pencil',
  '🎒': 'backpack',
  '⌚': 'watch',
  '📱': 'phone',
  '💻': 'laptop',
  '🔑': 'key',
  '🪑': 'chair',
  '🛏': 'bed',
  '☂': 'umbrella',
  '🍦': 'icecream',
  '🫙': 'jam',
  '👑': 'crown',
  '🚐': 'van',
  '🦊': 'fox',
  '🦓': 'zebra',
  '☀': 'sun',
  '🌙': 'moon',
  '⭐': 'star',
  '🌳': 'tree',
  '🌸': 'flower',
  '🏠': 'house',
  '🚗': 'car',
  '⚽': 'ball',
  '❤': 'heart',
  '☁': 'cloud'
}

/** Bỏ ký tự chọn kiểu hiển thị (U+FE0F) để so emoji */
const stripVariation = (s: string): string => s.replace(/️/g, '')

/** Id hình tương ứng với một emoji (hoặc chính id hình); undefined nếu không có */
export function pictureFor(emojiOrId: string): string | undefined {
  const key = stripVariation(emojiOrId.trim())
  if (key in PAINTERS || key in PICTURE_EXTRAS) return key
  return EMOJI_TO_PICTURE[key]
}

/** Tách emoji đứng đầu chuỗi ("🐶 dog" → { picture: 'dog', rest: 'dog' }); không có emoji hình → picture undefined */
export function splitLeadingPicture(text: string): { picture?: string; rest: string } {
  const chars = Array.from(text.trim())
  for (let n = Math.min(2, chars.length); n >= 1; n--) {
    const head = chars.slice(0, n).join('')
    const picture = EMOJI_TO_PICTURE[stripVariation(head)]
    if (picture) return { picture, rest: chars.slice(n).join('').trim() }
  }
  return { rest: text }
}

const cache = new Map<string, Grid>()

/** `scale` = số ô mỗi đơn vị logic: 2 (bộ cài, SVG) hoặc cao hơn (ảnh PNG nét, vd 8 → 256×256) */
function pictureGrid(id: string, scale = PICTURE_SCALE): Grid {
  const key = `${id}@${scale}`
  let grid = cache.get(key)
  if (!grid) {
    const paint = PAINTERS[id]
    if (!paint) throw new Error(`Unknown picture: ${id}`)
    grid = new Grid(PICTURE_LOGICAL, scale)
    paint(grid)
    // Bản thô: rim 2, viền 1 ô; bản nét: viền và dải sáng/tối dày ~1 đơn vị logic
    if (scale <= PICTURE_SCALE) grid.shadeAndOutline(2, 1)
    else {
      grid.shadeAndOutline(scale, Math.max(1, Math.round(scale * 0.8)))
      detailShade(grid, scale)
    }
    cache.set(key, grid)
  }
  return grid
}

/**
 * Bản nét: đổ sáng mượt theo hướng đèn (trên-trái sáng, dưới-phải tối) trên toàn hình thay vì chỉ ở mép,
 * giữ nguyên ô viền tối để hình không bị nhoè.
 */
function detailShade(grid: Grid, scale: number): void {
  const d = grid.dim
  let [x0, y0, x1, y1] = [d, d, 0, 0]
  for (let y = 0; y < d; y++)
    for (let x = 0; x < d; x++)
      if (grid.get(x, y)) {
        x0 = Math.min(x0, x)
        y0 = Math.min(y0, y)
        x1 = Math.max(x1, x)
        y1 = Math.max(y1, y)
      }
  const span = Math.max(1, x1 - x0 + (y1 - y0))
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const c = grid.get(x, y)
      if (!c || c === DARK || c === '#1e1b2e') continue
      const u = (x - x0 + (y - y0)) / span // 0 = góc trên-trái, 1 = dưới-phải
      grid.set(x, y, u < 0.5 ? lighten(c, (0.5 - u) * 0.24) : darken(c, (u - 0.5) * 0.3))
    }
  void scale
}

/** Các ô màu của một hình (chưa gộp) */
export function picturePixels(id: string, scale = PICTURE_SCALE): BadgePixel[] {
  const grid = pictureGrid(id, scale)
  const dim = PICTURE_LOGICAL * scale
  const out: BadgePixel[] = []
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const color = grid.get(x, y)
      if (color) out.push({ x, y, color })
    }
  }
  return out
}

/** Các hình chữ nhật đã gộp theo hàng, sẵn sàng vẽ bằng SVG */
export function pictureRects(id: string): BadgeRect[] {
  return mergeRuns(picturePixels(id))
}

/** Từ tiếng Anh + nghĩa tiếng Việt của từng hình — bộ thẻ "nghe → chạm hình" cho trẻ chưa biết đọc */
export const PICTURE_WORDS: Record<string, { en: string; vi: string }> = {
  dog: { en: 'dog', vi: 'con chó' },
  cat: { en: 'cat', vi: 'con mèo' },
  fish: { en: 'fish', vi: 'con cá' },
  bird: { en: 'bird', vi: 'con chim' },
  horse: { en: 'horse', vi: 'con ngựa' },
  cow: { en: 'cow', vi: 'con bò' },
  pig: { en: 'pig', vi: 'con heo' },
  elephant: { en: 'elephant', vi: 'con voi' },
  rabbit: { en: 'rabbit', vi: 'con thỏ' },
  monkey: { en: 'monkey', vi: 'con khỉ' },
  duck: { en: 'duck', vi: 'con vịt' },
  frog: { en: 'frog', vi: 'con ếch' },
  bear: { en: 'bear', vi: 'con gấu' },
  fox: { en: 'fox', vi: 'con cáo' },
  zebra: { en: 'zebra', vi: 'ngựa vằn' },
  apple: { en: 'apple', vi: 'quả táo' },
  banana: { en: 'banana', vi: 'quả chuối' },
  orange: { en: 'orange', vi: 'quả cam' },
  grapes: { en: 'grapes', vi: 'chùm nho' },
  strawberry: { en: 'strawberry', vi: 'quả dâu tây' },
  watermelon: { en: 'watermelon', vi: 'dưa hấu' },
  pineapple: { en: 'pineapple', vi: 'quả dứa' },
  peach: { en: 'peach', vi: 'quả đào' },
  lemon: { en: 'lemon', vi: 'quả chanh' },
  mango: { en: 'mango', vi: 'quả xoài' },
  bread: { en: 'bread', vi: 'bánh mì' },
  rice: { en: 'rice', vi: 'cơm' },
  egg: { en: 'egg', vi: 'quả trứng' },
  noodles: { en: 'noodles', vi: 'mì' },
  pizza: { en: 'pizza', vi: 'bánh pizza' },
  hamburger: { en: 'hamburger', vi: 'bánh hamburger' },
  coffee: { en: 'coffee', vi: 'cà phê' },
  milk: { en: 'milk', vi: 'sữa' },
  tea: { en: 'tea', vi: 'trà' },
  cheese: { en: 'cheese', vi: 'phô mai' },
  cake: { en: 'cake', vi: 'bánh kem' },
  icecream: { en: 'ice cream', vi: 'kem' },
  jam: { en: 'jam', vi: 'mứt' },
  books: { en: 'books', vi: 'sách' },
  pencil: { en: 'pencil', vi: 'bút chì' },
  backpack: { en: 'backpack', vi: 'ba lô' },
  watch: { en: 'watch', vi: 'đồng hồ' },
  phone: { en: 'phone', vi: 'điện thoại' },
  laptop: { en: 'laptop', vi: 'máy tính' },
  key: { en: 'key', vi: 'chìa khóa' },
  chair: { en: 'chair', vi: 'cái ghế' },
  bed: { en: 'bed', vi: 'cái giường' },
  umbrella: { en: 'umbrella', vi: 'cái ô' },
  crown: { en: 'crown', vi: 'vương miện' },
  van: { en: 'van', vi: 'xe tải nhỏ' },
  sun: { en: 'sun', vi: 'mặt trời' },
  moon: { en: 'moon', vi: 'mặt trăng' },
  star: { en: 'star', vi: 'ngôi sao' },
  tree: { en: 'tree', vi: 'cái cây' },
  flower: { en: 'flower', vi: 'bông hoa' },
  house: { en: 'house', vi: 'ngôi nhà' },
  car: { en: 'car', vi: 'xe hơi' },
  ball: { en: 'ball', vi: 'quả bóng' },
  heart: { en: 'heart', vi: 'trái tim' },
  cloud: { en: 'cloud', vi: 'đám mây' },
  ...MORE_WORDS,
  // Hình bổ sung từ Twemoji (pictureExtras.ts): có từ + nghĩa như hình vẽ, nhưng không có bản vẽ pixel
  ...Object.fromEntries(
    Object.entries(PICTURE_EXTRAS).map(([id, e]) => [id, { en: e.en, vi: e.vi }])
  )
}

/** Mọi hình có thể hiển thị: hình vẽ (PICTURE_IDS) + hình Twemoji bổ sung — dùng cho bộ thẻ/sticker trẻ em */
export const ALL_PICTURE_IDS: readonly string[] = [...Object.keys(PAINTERS), ...PICTURE_EXTRA_IDS]

const WORD_TO_PICTURE = new Map(
  Object.entries(PICTURE_WORDS).map(([id, word]) => [word.en.toLowerCase(), id])
)

/** Id hình minh hoạ cho một từ tiếng Anh (vd 'dog' → 'dog'); undefined nếu chưa có hình */
export function pictureForWord(word: string): string | undefined {
  return WORD_TO_PICTURE.get(word.trim().toLowerCase())
}
