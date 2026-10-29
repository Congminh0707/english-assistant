// Hình pixel art bổ sung cho bản đồ thế giới của trẻ (docs/19-kids-world.md): người thân, số 1–10 (kèm chấm để đếm),
// màu sắc (vệt sơn), và vài vật quen thuộc ở Việt Nam. Cùng phong cách với pictures.ts (lưới logic 32×32, vẽ bằng hình
// cơ bản, viền/đổ sáng tự động). Thuần dữ liệu, chỉ import pixelGrid → không vòng import với pictures.ts.
import { darken, Grid, lighten } from './pixelGrid'

type Painter = (g: Grid) => void

const DARK = '#2b2b3a'
const WHITE = '#fdfdfd'
const SKIN = '#ffd9b8'

type Pt = [number, number]

/** Nét vẽ liền theo danh sách điểm (đầu nét tròn) */
function stroke(g: Grid, pts: Pt[], r: number, color: string): void {
  for (let i = 0; i < pts.length; i++) {
    g.circle(pts[i][0], pts[i][1], r, color)
    if (i > 0) g.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], r, color)
  }
}

/** Mặt chibi: hai mắt, má hồng, miệng cười; cy là cao độ mắt */
function face(g: Grid, cy: number, dx = 3.6, r = 1.3): void {
  for (const x of [16 - dx, 16 + dx]) {
    g.circle(x, cy, r, DARK)
    g.circle(x - r * 0.35, cy - r * 0.35, r * 0.4, WHITE)
    g.ellipse(x + (x < 16 ? -1.6 : 1.6), cy + 2.4, 1.5, 0.9, '#ff9aa5')
  }
  g.line(14.6, cy + 3.3, 15.4, cy + 4.1, 0.35, DARK)
  g.line(15.4, cy + 4.1, 16.6, cy + 4.1, 0.35, DARK)
  g.line(16.6, cy + 4.1, 17.4, cy + 3.3, 0.35, DARK)
}

/** Kính tròn hai mắt */
function glasses(g: Grid, cy: number, dx = 3.8): void {
  for (const x of [16 - dx, 16 + dx]) {
    g.circle(x, cy, 3, '#5a4a6a')
    g.circle(x, cy, 2.2, '#e9f4ff')
  }
  g.line(16 - dx + 3, cy, 16 + dx - 3, cy, 0.4, '#5a4a6a')
}

// ---------------------------------------------------------------- Số 1–10 (nét dày + chấm đếm)

const MID_Y = 11.5

/** Nét của từng chữ số trong khung x 11–21, y 3.5–20 (nhiều nét = nhiều danh sách điểm) */
const DIGITS: Record<string, Pt[][]> = {
  '1': [
    [
      [12.5, 6.5],
      [16, 3.5],
      [16, 20]
    ],
    [
      [12.5, 20],
      [19.5, 20]
    ]
  ],
  '2': [
    [
      [11.5, 6.5],
      [13.5, 4],
      [18.5, 4],
      [20.8, 6.5],
      [20.8, 9.5],
      [11.5, 20],
      [21, 20]
    ]
  ],
  '3': [
    [
      [11.5, 4],
      [20.5, 4],
      [15, 10.5],
      [18.8, 11],
      [21, 14],
      [21, 17],
      [18.8, 20],
      [13.2, 20],
      [11.5, 18]
    ]
  ],
  '4': [
    [
      [18, 3.5],
      [11, 14.5],
      [22, 14.5]
    ],
    [
      [18, 3.5],
      [18, 20]
    ]
  ],
  '5': [
    [
      [20.8, 4],
      [12.8, 4],
      [12.2, 10.2],
      [16.5, 9.8],
      [20, 12],
      [21, 15.5],
      [19, 19.5],
      [13.2, 20],
      [11.5, 18]
    ]
  ],
  '6': [
    [
      [19.5, 4.5],
      [15, 4.2],
      [12, 8],
      [11.5, 15],
      [13.2, 19.3],
      [17, 20.3],
      [20.3, 18],
      [20.5, 13.8],
      [17, 11],
      [13.2, 12],
      [11.8, 14.5]
    ]
  ],
  '7': [
    [
      [11, 4],
      [21, 4],
      [15, 20]
    ]
  ]
}

/** 9 = chữ 6 xoay 180° */
DIGITS['9'] = DIGITS['6'].map((s) => s.map(([x, y]): Pt => [32 - x, 2 * MID_Y - y]))

function paintDigit(g: Grid, digit: string, color: string): void {
  if (digit === '0' || digit === '8') {
    if (digit === '0') {
      g.ellipse(16, MID_Y, 5.8, 8.6, color)
      g.ellipse(16, MID_Y, 3.1, 6, null)
    } else {
      g.circle(16, 7.8, 4.8, color)
      g.circle(16, 15.6, 5.6, color)
      g.circle(16, 7.8, 2.4, null)
      g.circle(16, 15.6, 3.4, null)
    }
    return
  }
  for (const s of DIGITS[digit]) stroke(g, s, 1.6, color)
}

/** Số lớn ở phần trên + n chấm xếp hàng ở dưới để trẻ chưa biết đọc số vẫn đếm được */
function number(n: number, color: string): Painter {
  return (g) => {
    if (n === 10) {
      // "1" dịch trái, "0" dịch phải
      for (const s of DIGITS['1'])
        stroke(
          g,
          s.map(([x, y]): Pt => [x - 5.5, y]),
          1.6,
          color
        )
      g.ellipse(22.5, MID_Y, 5, 8.6, color)
      g.ellipse(22.5, MID_Y, 2.4, 6, null)
    } else {
      paintDigit(g, String(n), color)
    }
    const perRow = 5
    const rows = n > perRow ? 2 : 1
    for (let row = 0; row < rows; row++) {
      const count = rows === 1 ? n : row === 0 ? Math.ceil(n / 2) : Math.floor(n / 2)
      const y = rows === 1 ? 26.5 : 24.5 + row * 4.6
      for (let i = 0; i < count; i++) g.circle(16 + (i - (count - 1) / 2) * 5.2, y, 1.4, color)
    }
  }
}

// ---------------------------------------------------------------- Vệt sơn màu

function splash(color: string, variant: number): Painter {
  return (g) => {
    const flip = variant % 2 === 0 ? 1 : -1
    const x = (v: number): number => (flip === 1 ? v : 32 - v)
    g.circle(16, 16, 8.5, color)
    g.circle(x(10), 12, 5, color)
    g.circle(x(22.5), 10.5, 4.6, color)
    g.circle(x(22), 22, 5, color)
    g.circle(x(10.5), 22.5, 4.6, color)
    g.circle(x(16), 7.5, 3.6, color)
    // giọt nhỏ bắn ra
    g.circle(x(4.5), 6 + variant, 2.2, color)
    g.circle(x(27.5), 6.5, 1.8, color)
    g.circle(x(28), 19 + (variant % 3), 2.2, color)
    g.circle(x(4), 24, 1.9, color)
    g.circle(x(16), 28.5, 1.9, color)
    // bóng sáng + mặt cười
    g.ellipse(x(12), 11.5, 2.3, 1.4, lighten(color, 0.55))
    face(g, 16.5, 3.2, 1.2)
  }
}

// ---------------------------------------------------------------- Người thân

const FAMILY: Record<string, Painter> = {
  mom: (g) => {
    const hair = '#6b3a24'
    g.ellipse(16, 16, 11, 12.5, hair) // tóc dài phía sau
    g.ellipse(16, 31, 11.5, 7.5, '#ff7aa8') // áo hồng
    g.rect(14, 19, 4, 4, SKIN) // cổ
    g.poly(
      [
        [12.5, 23],
        [16, 26.5],
        [19.5, 23]
      ],
      '#ffd0e0'
    )
    g.circle(16, 13, 8.5, SKIN)
    g.ellipse(16, 7.2, 8.8, 4, hair) // tóc mái
    g.poly(
      [
        [16, 5],
        [24.5, 9],
        [24, 14],
        [19, 8.5]
      ],
      hair
    )
    g.ellipse(7.2, 24, 2.6, 5.5, hair) // lọn tóc rũ trước vai
    g.ellipse(24.8, 24, 2.6, 5.5, hair)
    // hoa cài tóc
    for (const [dx, dy] of [
      [0, -1.3],
      [1.3, 0],
      [0, 1.3],
      [-1.3, 0]
    ]) {
      g.circle(23 + dx, 5 + dy, 1.2, '#ffe14d')
    }
    g.circle(23, 5, 0.9, '#ff7a2e')
    face(g, 13.5)
  },
  dad: (g) => {
    const hair = '#3b2a22'
    g.ellipse(16, 31, 12, 8, '#4a90e2') // áo sơ mi xanh
    g.rect(14, 19, 4, 4, SKIN)
    g.poly(
      [
        [11.5, 22.5],
        [16, 28],
        [20.5, 22.5],
        [16, 21]
      ],
      WHITE
    ) // cổ áo
    g.poly(
      [
        [15, 23],
        [17, 23],
        [17.8, 30],
        [16, 32],
        [14.2, 30]
      ],
      '#e8423a'
    ) // cà vạt
    g.circle(7.6, 14, 1.8, SKIN) // tai
    g.circle(24.4, 14, 1.8, SKIN)
    g.circle(16, 13.5, 8.6, SKIN)
    g.ellipse(16, 7, 9, 4.6, hair) // tóc ngắn
    g.rect(7.4, 8, 2.2, 5, hair) // tóc mai
    g.rect(22.4, 8, 2.2, 5, hair)
    g.line(11.3, 10.2, 14, 10.2, 0.55, hair) // lông mày
    g.line(18, 10.2, 20.7, 10.2, 0.55, hair)
    face(g, 14)
  },
  baby: (g) => {
    g.ellipse(16, 30.5, 8, 5.5, '#ffe27a') // áo liền quần vàng
    g.ellipse(16, 29.5, 4.6, 4, WHITE) // yếm
    g.circle(16, 29, 1, '#ff7aa8')
    g.circle(5.8, 15, 2.4, SKIN) // tai
    g.circle(26.2, 15, 2.4, SKIN)
    g.circle(16, 14.5, 11, SKIN) // đầu to tròn
    // chỏm tóc xoăn
    stroke(
      g,
      [
        [16, 4.5],
        [15.4, 2.2],
        [17.6, 1.8],
        [18, 3.6]
      ],
      0.7,
      '#7a4a2a'
    )
    g.ellipse(16, 5.2, 3.6, 1.2, '#7a4a2a')
    // mắt to, má phính
    for (const x of [11, 21]) {
      g.circle(x, 14.5, 2.1, DARK)
      g.circle(x - 0.8, 13.6, 0.8, WHITE)
      g.ellipse(x + (x < 16 ? -2.4 : 2.4), 18.8, 2.1, 1.3, '#ff9aa5')
    }
    // núm vú giả
    g.circle(16, 20.6, 2.3, '#4fc3f7')
    g.circle(16, 20.6, 1.1, '#bfe9fb')
    g.circle(16, 23.3, 0.8, '#4fc3f7')
  },
  grandma: (g) => {
    const hair = '#c9ccd6'
    g.ellipse(16, 31, 11.5, 7.5, '#9b6bd6') // áo tím
    g.rect(14, 19, 4, 4, SKIN)
    for (let i = 0; i < 7; i++) {
      // vòng ngọc trai
      const a = (i / 6) * Math.PI
      g.circle(16 + 4.8 * Math.cos(a), 22.2 + 3 * Math.sin(a), 0.85, WHITE)
    }
    g.circle(16, 3.8, 4, hair) // búi tóc
    g.circle(16, 3.8, 1.2, '#e8eaf0')
    g.circle(16, 14, 8.4, SKIN)
    g.ellipse(16, 8.2, 8.8, 4.4, hair)
    g.ellipse(7.6, 12, 1.8, 3.2, hair)
    g.ellipse(24.4, 12, 1.8, 3.2, hair)
    glasses(g, 14.2)
    for (const x of [12.2, 19.8]) {
      g.circle(x, 14.2, 1.1, DARK)
      g.circle(x - 0.4, 13.8, 0.4, WHITE)
    }
    g.ellipse(9.8, 18.2, 1.6, 0.9, '#ff9aa5')
    g.ellipse(22.2, 18.2, 1.6, 0.9, '#ff9aa5')
    g.line(14.4, 19.2, 15.4, 20, 0.35, DARK)
    g.line(15.4, 20, 16.6, 20, 0.35, DARK)
    g.line(16.6, 20, 17.6, 19.2, 0.35, DARK)
  },
  grandpa: (g) => {
    const hair = '#d5d8e2'
    g.ellipse(16, 31, 12, 8, WHITE) // áo sơ mi trắng
    g.rect(14, 19, 4, 4, SKIN)
    g.poly(
      [
        [5, 27],
        [13, 22.5],
        [15, 32],
        [5, 32]
      ],
      '#8a5a36'
    ) // gilê nâu
    g.poly(
      [
        [27, 27],
        [19, 22.5],
        [17, 32],
        [27, 32]
      ],
      '#8a5a36'
    )
    g.circle(7.6, 14.5, 1.8, SKIN)
    g.circle(24.4, 14.5, 1.8, SKIN)
    g.circle(16, 14, 8.5, SKIN) // đầu hói
    g.ellipse(7.4, 12, 2.3, 4.4, hair) // tóc bạc hai bên
    g.ellipse(24.6, 12, 2.3, 4.4, hair)
    g.ellipse(16, 5.6, 3.2, 0.9, lighten(SKIN, 0.4)) // ánh trên đầu hói
    g.line(10.4, 10.4, 13.8, 10, 0.7, hair) // lông mày rậm
    g.line(18.2, 10, 21.6, 10.4, 0.7, hair)
    glasses(g, 14)
    for (const x of [12.2, 19.8]) {
      g.circle(x, 14, 1.1, DARK)
      g.circle(x - 0.4, 13.6, 0.4, WHITE)
    }
    g.ellipse(13.2, 19.2, 3.2, 1.7, hair) // ria mép
    g.ellipse(18.8, 19.2, 3.2, 1.7, hair)
    g.line(14.8, 21.6, 17.2, 21.6, 0.35, DARK)
  }
}

// ---------------------------------------------------------------- Vật dụng / Việt Nam

const OBJECTS: Record<string, Painter> = {
  shell: (g) => {
    const R = 17
    const arc: Pt[] = Array.from({ length: 8 }, (_, i): Pt => {
      const a = ((212 + (i * 116) / 7) * Math.PI) / 180
      return [16 + R * Math.cos(a), 27 + R * Math.sin(a)]
    })
    g.poly([[16, 27], ...arc], '#ffb59a')
    for (let i = 0; i < arc.length - 1; i++) {
      const [mx, my] = [(arc[i][0] + arc[i + 1][0]) / 2, (arc[i][1] + arc[i + 1][1]) / 2]
      const [dx, dy] = [mx - 16, my - 27]
      const k = 2.6 / Math.hypot(dx, dy)
      g.circle(mx + dx * k * 0.35, my + dy * k * 0.35, 3.2, '#ffb59a')
    }
    // gân vỏ
    for (const [x, y] of arc) {
      g.line(16, 26, 16 + (x - 16) * 0.93, 27 + (y - 27) * 0.93, 0.55, '#e0806a')
    }
    g.ellipse(16, 27.5, 9, 3.2, '#f4a58a') // bản lề
    g.ellipse(16, 26.8, 5, 1.6, '#ffd9c8')
  },
  kite: (g) => {
    const [top, right, bottom, left, c]: Pt[] = [
      [16, 1.5],
      [26, 11],
      [16, 22],
      [6, 11],
      [16, 11]
    ]
    g.poly([top, right, c], '#ff5a5a')
    g.poly([right, bottom, c], '#ffd23f')
    g.poly([bottom, left, c], '#4aa3ff')
    g.poly([left, top, c], '#4ecb71')
    g.line(top[0], top[1], bottom[0], bottom[1], 0.45, '#8a5a36') // nan diều
    g.line(left[0], left[1], right[0], right[1], 0.45, '#8a5a36')
    // đuôi lượn sóng có nơ
    const tail: Pt[] = [
      [16, 22],
      [13.4, 24.4],
      [16.4, 26.6],
      [13.6, 28.8],
      [16.2, 30.8]
    ]
    for (let i = 1; i < tail.length; i++)
      g.line(tail[i - 1][0], tail[i - 1][1], tail[i][0], tail[i][1], 0.5, '#8a5a36')
    const bowColors = ['#ff5a5a', '#ffd23f', '#4aa3ff']
    ;([1, 2, 3] as const).forEach((i, k) => {
      const [bx, by] = tail[i]
      g.poly(
        [
          [bx, by],
          [bx - 2.2, by - 1.4],
          [bx - 2.2, by + 1.4]
        ],
        bowColors[k]
      )
      g.poly(
        [
          [bx, by],
          [bx + 2.2, by - 1.4],
          [bx + 2.2, by + 1.4]
        ],
        bowColors[k]
      )
    })
  },
  lantern: (g) => {
    const red = '#f0452c'
    g.line(16, 6, 16, 3, 0.5, '#d4a017') // dây treo
    g.circle(16, 2.6, 1.5, '#ffd23f')
    g.ellipse(16, 16, 10.5, 8.8, red)
    g.ellipse(16, 16, 7, 8.8, '#b3201a')
    g.ellipse(16, 16, 6.1, 8.8, red)
    g.ellipse(16, 16, 3.6, 8.8, '#b3201a')
    g.ellipse(16, 16, 2.8, 8.8, '#ff8a3d') // giữa sáng như có đèn bên trong
    g.ellipse(11.6, 12.5, 1.4, 2.6, lighten(red, 0.45)) // bóng sáng
    // nắp vàng trên + dưới
    g.rect(9.5, 5.4, 13, 2.8, '#ffc933')
    g.rect(9.5, 24, 13, 2.8, '#ffc933')
    g.rect(11, 7.8, 10, 0.8, darken('#ffc933', 0.25))
    // tua rua
    g.line(16, 26.5, 16, 28.5, 0.5, '#d4a017')
    g.poly(
      [
        [14.2, 28.2],
        [17.8, 28.2],
        [19, 31.8],
        [13, 31.8]
      ],
      red
    )
    for (const x of [14.6, 16, 17.4]) g.line(x, 29, x, 31.6, 0.25, '#ffc933')
  },
  motorbike: (g) => {
    const body = '#e8423a'
    for (const x of [7, 25]) {
      g.circle(x, 24.5, 5.6, DARK) // lốp
      g.circle(x, 24.5, 3, '#cfd3e0')
      g.circle(x, 24.5, 1.1, '#7a8199')
    }
    g.poly(
      [
        [2.5, 17.5],
        [9, 13.5],
        [17, 13.5],
        [18.5, 20],
        [15.5, 23],
        [5, 22.5]
      ],
      body
    ) // thân sau
    g.rect(14, 20, 8.5, 2.6, darken(body, 0.3)) // sàn để chân
    g.poly(
      [
        [20, 9],
        [23.6, 9],
        [25.6, 21],
        [21.4, 21.5]
      ],
      body
    ) // yếm trước
    g.line(23.2, 10, 25.2, 24.5, 0.9, '#7a8199') // phuộc
    g.poly(
      [
        [3.5, 11.5],
        [15.5, 11.5],
        [15.5, 14],
        [3.5, 14]
      ],
      '#3b3b4f'
    ) // yên xe
    g.line(21, 7.2, 27, 6.2, 1, '#4a4a5e') // tay lái
    g.circle(21, 7.2, 1.3, DARK)
    g.circle(27.2, 11, 2.4, '#ffe14d') // đèn pha
    g.circle(26.6, 10.4, 0.9, WHITE)
    g.rect(2, 19.5, 2, 2, '#ff9a3d') // đèn hậu
  }
}

export const MORE_PAINTERS: Record<string, (g: Grid) => void> = {
  ...FAMILY,
  one: number(1, '#ff4d4d'),
  two: number(2, '#ff8a2e'),
  three: number(3, '#f2c200'),
  four: number(4, '#4ecb71'),
  five: number(5, '#22b8c9'),
  six: number(6, '#4a90e2'),
  seven: number(7, '#7a5af0'),
  eight: number(8, '#c05ad8'),
  nine: number(9, '#ff5fa2'),
  ten: number(10, '#e8423a'),
  red: splash('#ee2f35', 0),
  blue: splash('#2f7bf0', 1),
  yellow: splash('#ffd414', 2),
  green: splash('#2fbf4f', 3),
  pink: splash('#ff7eb8', 4),
  ...OBJECTS
}

export const MORE_WORDS: Record<string, { en: string; vi: string }> = {
  mom: { en: 'mom', vi: 'mẹ' },
  dad: { en: 'dad', vi: 'bố' },
  baby: { en: 'baby', vi: 'em bé' },
  grandma: { en: 'grandma', vi: 'bà' },
  grandpa: { en: 'grandpa', vi: 'ông' },
  one: { en: 'one', vi: 'số một' },
  two: { en: 'two', vi: 'số hai' },
  three: { en: 'three', vi: 'số ba' },
  four: { en: 'four', vi: 'số bốn' },
  five: { en: 'five', vi: 'số năm' },
  six: { en: 'six', vi: 'số sáu' },
  seven: { en: 'seven', vi: 'số bảy' },
  eight: { en: 'eight', vi: 'số tám' },
  nine: { en: 'nine', vi: 'số chín' },
  ten: { en: 'ten', vi: 'số mười' },
  red: { en: 'red', vi: 'màu đỏ' },
  blue: { en: 'blue', vi: 'màu xanh dương' },
  yellow: { en: 'yellow', vi: 'màu vàng' },
  green: { en: 'green', vi: 'màu xanh lá' },
  pink: { en: 'pink', vi: 'màu hồng' },
  shell: { en: 'shell', vi: 'vỏ sò' },
  kite: { en: 'kite', vi: 'con diều' },
  lantern: { en: 'lantern', vi: 'đèn lồng' },
  motorbike: { en: 'motorbike', vi: 'xe máy' }
}
