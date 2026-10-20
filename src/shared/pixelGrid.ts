// Lưới vẽ pixel art dùng chung (huy hiệu thành tựu, hình minh hoạ): vẽ bằng hình cơ bản (tròn, elip, đa giác, đoạn
// thẳng) rồi tự động đổ sáng/tối ở mép và viền tối quanh hình. Thuần dữ liệu → test được ở Node.

export type Color = string | null

// --- Màu ---

function parse(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function toHex(rgb: number[]): string {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

export function mix(a: string, b: string, t: number): string {
  const [pa, pb] = [parse(a), parse(b)]
  return toHex(pa.map((v, i) => v + (pb[i] - v) * t))
}

export const lighten = (c: string, t: number): string => mix(c, '#ffffff', t)
export const darken = (c: string, t: number): string => mix(c, '#000000', t)

export const INK = '#1e1b2e'

// --- Lưới vẽ ---

export class Grid {
  readonly cells: Color[]
  /** Số ô mỗi cạnh = size × scale */
  readonly dim: number

  /**
   * `size`: cạnh theo đơn vị logic (toạ độ khi vẽ). `scale`: mỗi đơn vị logic gồm scale×scale ô — scale 2 cho hình
   * 64×64 ô từ cùng một bản vẽ 32×32, đường cong và viền mịn hơn khi phóng to.
   */
  constructor(
    readonly size: number,
    readonly scale = 1
  ) {
    this.dim = size * scale
    this.cells = Array.from({ length: this.dim * this.dim }, () => null)
  }

  /** Đọc/ghi theo toạ độ ô (không phải toạ độ logic) */
  get(x: number, y: number): Color {
    return x < 0 || y < 0 || x >= this.dim || y >= this.dim ? null : this.cells[y * this.dim + x]
  }

  set(x: number, y: number, color: Color): void {
    if (x >= 0 && y >= 0 && x < this.dim && y < this.dim) this.cells[y * this.dim + x] = color
  }

  /** Duyệt các ô có tâm thoả điều kiện */
  private fill(test: (px: number, py: number) => boolean, color: Color): void {
    const k = this.scale
    for (let y = 0; y < this.dim; y++) {
      for (let x = 0; x < this.dim; x++)
        if (test((x + 0.5) / k, (y + 0.5) / k)) this.set(x, y, color)
    }
  }

  circle(cx: number, cy: number, r: number, color: Color): void {
    this.fill((px, py) => Math.hypot(px - cx, py - cy) <= r, color)
  }

  /** Hình elip (rx, ry là bán kính ngang/dọc) */
  ellipse(cx: number, cy: number, rx: number, ry: number, color: Color): void {
    this.fill((px, py) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1, color)
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

  /**
   * Mép trên/trái sáng hơn, mép dưới/phải tối hơn (dải rộng `rim` ô), rồi viền tối rộng `outline` ô quanh hình.
   * Lưới thô (scale 1) dùng mặc định 1/1; lưới mịn (scale 2) nên dùng rim 2, outline 1–2.
   */
  shadeAndOutline(rim = 1, outline = 1): void {
    const d = this.dim
    const opaque = (x: number, y: number): boolean => this.get(x, y) !== null
    const next = [...this.cells]
    for (let y = 0; y < d; y++) {
      for (let x = 0; x < d; x++) {
        const c = this.get(x, y)
        if (!c) continue
        let lit = false
        let shadow = false
        for (let k = 1; k <= rim; k++) {
          if (!opaque(x - k, y) || !opaque(x, y - k)) lit = true
          if (!opaque(x + k, y) || !opaque(x, y + k)) shadow = true
        }
        if (lit) next[y * d + x] = lighten(c, 0.28)
        else if (shadow) next[y * d + x] = darken(c, 0.25)
      }
    }
    // Viền: mỗi vòng thêm một lớp ô tối quanh hình (và quanh viền đã vẽ)
    const mask = this.cells.map((c) => c !== null)
    for (let round = 0; round < outline; round++) {
      const grow: number[] = []
      for (let y = 0; y < d; y++) {
        for (let x = 0; x < d; x++) {
          if (mask[y * d + x]) continue
          const near = (nx: number, ny: number): boolean =>
            nx >= 0 && ny >= 0 && nx < d && ny < d && mask[ny * d + nx]
          if (near(x - 1, y) || near(x + 1, y) || near(x, y - 1) || near(x, y + 1))
            grow.push(y * d + x)
        }
      }
      for (const i of grow) {
        mask[i] = true
        next[i] = INK
      }
    }
    next.forEach((c, i) => (this.cells[i] = c))
  }
}
