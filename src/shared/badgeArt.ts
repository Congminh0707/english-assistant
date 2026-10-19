// Pixel art cho huy hiệu thành tựu: huy chương tròn 32×32 (viền vát theo hạng, nền chấm dither) + biểu tượng 20×20.
// Biểu tượng được "vẽ" bằng các hình cơ bản (đa giác, tròn, đoạn thẳng) rồi tự động đổ sáng/tối ở mép và viền ngoài,
// nên chi tiết hơn tự gõ từng ô. Thuần dữ liệu → renderer chỉ việc vẽ các ô vuông (SVG), test được ở Node.

export const BADGE_SIZE = 32
export const GLYPH_SIZE = 20

type Color = string | null

// --- Màu ---

function parse(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function toHex(rgb: number[]): string {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

function mix(a: string, b: string, t: number): string {
  const [pa, pb] = [parse(a), parse(b)]
  return toHex(pa.map((v, i) => v + (pb[i] - v) * t))
}

const lighten = (c: string, t: number): string => mix(c, '#ffffff', t)
const darken = (c: string, t: number): string => mix(c, '#000000', t)

const INK = '#1e1b2e'

// --- Lưới vẽ ---

class Grid {
  readonly cells: Color[]

  constructor(readonly size: number) {
    this.cells = Array.from({ length: size * size }, () => null)
  }

  get(x: number, y: number): Color {
    return x < 0 || y < 0 || x >= this.size || y >= this.size ? null : this.cells[y * this.size + x]
  }

  set(x: number, y: number, color: Color): void {
    if (x >= 0 && y >= 0 && x < this.size && y < this.size) this.cells[y * this.size + x] = color
  }

  /** Duyệt các ô có tâm thoả điều kiện */
  private fill(test: (px: number, py: number) => boolean, color: Color): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) if (test(x + 0.5, y + 0.5)) this.set(x, y, color)
    }
  }

  circle(cx: number, cy: number, r: number, color: Color): void {
    this.fill((px, py) => Math.hypot(px - cx, py - cy) <= r, color)
  }

  rect(x: number, y: number, w: number, h: number, color: Color): void {
    this.fill((px, py) => px >= x && px <= x + w && py >= y && py <= y + h, color)
  }

  /** Đa giác (quy tắc chẵn–lẻ) */
  poly(points: Array<[number, number]>, color: Color): void {
    this.fill((px, py) => {
      let inside = false
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i]
        const [xj, yj] = points[j]
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
      }
      return inside
    }, color)
  }

  /** Đoạn thẳng dày `r` (bán kính) */
  line(x0: number, y0: number, x1: number, y1: number, r: number, color: Color): void {
    this.fill((px, py) => {
      const dx = x1 - x0
      const dy = y1 - y0
      const len2 = dx * dx + dy * dy
      const t = len2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2)) : 0
      return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy)) <= r
    }, color)
  }

  /** Mép trên/trái sáng hơn, mép dưới/phải tối hơn, rồi viền tối quanh hình */
  shadeAndOutline(): void {
    const next = [...this.cells]
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const c = this.get(x, y)
        if (c) {
          if (!this.get(x - 1, y) || !this.get(x, y - 1)) next[y * this.size + x] = lighten(c, 0.28)
          else if (!this.get(x + 1, y) || !this.get(x, y + 1))
            next[y * this.size + x] = darken(c, 0.25)
        } else if (
          this.get(x - 1, y) ||
          this.get(x + 1, y) ||
          this.get(x, y - 1) ||
          this.get(x, y + 1)
        ) {
          next[y * this.size + x] = INK
        }
      }
    }
    next.forEach((c, i) => (this.cells[i] = c))
  }
}

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

/** Tên các biểu tượng có sẵn */
export const GLYPHS: Record<string, true> = Object.fromEntries(
  Object.keys(PAINTERS).map((name) => [name, true])
)

const glyphCache = new Map<string, Grid>()

function glyphGrid(name: string): Grid {
  let grid = glyphCache.get(name)
  if (!grid) {
    const paint = PAINTERS[name]
    if (!paint) throw new Error(`Unknown badge glyph: ${name}`)
    grid = new Grid(GLYPH_SIZE)
    paint(grid)
    grid.shadeAndOutline()
    glyphCache.set(name, grid)
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

function medal(tier: BadgeTier | 'locked'): Grid {
  const colors = TIER_COLORS[tier]
  const grid = new Grid(BADGE_SIZE)
  const half = BADGE_SIZE / 2
  for (let y = 0; y < BADGE_SIZE; y++) {
    for (let x = 0; x < BADGE_SIZE; x++) {
      const dx = x + 0.5 - half
      const dy = y + 0.5 - half
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
        // nền: sáng dần về phía trên trái, dither 2 tông
        const lit = Math.max(0, 1 - Math.hypot(dx + 3, dy + 4) / 15)
        const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16
        grid.set(x, y, lit > threshold ? colors.fieldLight : colors.fieldDark)
      }
    }
  }
  if (tier === 'gold' || tier === 'diamond' || tier === 'silver') {
    // lấp lánh nhỏ ở góc trên phải của nền
    const spark = tier === 'silver' ? '#ffffff' : colors.shine
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
      grid.set(x, y, spark)
    }
    grid.set(24, 8, '#ffffff')
  }
  return grid
}

const medalCache = new Map<string, Grid>()

/** Các ô màu của một huy hiệu (chưa gộp). Chưa mở khoá → màu xám + biểu tượng ổ khoá. */
export function badgePixels(glyph: string, tier: BadgeTier, locked: boolean): BadgePixel[] {
  const key = locked ? 'locked' : tier
  let base = medalCache.get(key)
  if (!base) {
    base = medal(key)
    medalCache.set(key, base)
  }
  const art = glyphGrid(locked ? 'lock' : glyph)
  const offset = (BADGE_SIZE - GLYPH_SIZE) / 2
  const pixels: BadgePixel[] = []
  for (let y = 0; y < BADGE_SIZE; y++) {
    for (let x = 0; x < BADGE_SIZE; x++) {
      const color = art.get(x - offset, y - offset) ?? base.get(x, y)
      if (color) pixels.push({ x, y, color })
    }
  }
  return pixels
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
