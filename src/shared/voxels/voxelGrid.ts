// Lưới voxel ("pixel 3D") dùng để vẽ công trình, nhà, cây... của bản đồ thế giới của bé bằng code
// (giống pixelGrid.ts cho hình 2D). Trục: x sang phải, y lên trên, z về phía người xem. Thuần dữ liệu → test ở Node.
// docs/19-kids-world.md §5.2

export type VoxelColor = string | null

export class VoxelGrid {
  /** Chỉ số màu từng ô (0 = trống), màu thật trong `palette` (palette[0] không dùng) */
  private readonly cells: Uint16Array
  readonly palette: string[] = ['']
  private readonly paletteIndex = new Map<string, number>()

  constructor(
    readonly sx: number,
    readonly sy: number,
    readonly sz: number
  ) {
    this.cells = new Uint16Array(sx * sy * sz)
  }

  private index(x: number, y: number, z: number): number {
    return (y * this.sz + z) * this.sx + x
  }

  inside(x: number, y: number, z: number): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz
  }

  private colorIndex(color: string): number {
    let i = this.paletteIndex.get(color)
    if (i === undefined) {
      i = this.palette.length
      this.palette.push(color)
      this.paletteIndex.set(color, i)
    }
    return i
  }

  get(x: number, y: number, z: number): VoxelColor {
    if (!this.inside(x, y, z)) return null
    const i = this.cells[this.index(x, y, z)]
    return i === 0 ? null : this.palette[i]
  }

  /** Ghi một ô (null = xoá); ngoài lưới thì bỏ qua */
  set(x: number, y: number, z: number, color: VoxelColor): void {
    if (!this.inside(x, y, z)) return
    this.cells[this.index(x, y, z)] = color === null ? 0 : this.colorIndex(color)
  }

  /** Tô mọi ô có tâm thoả điều kiện (toạ độ tâm ô = x + 0.5…) trong hộp giới hạn */
  fill(
    test: (x: number, y: number, z: number) => boolean,
    color: VoxelColor,
    bounds: [number, number, number, number, number, number] = [0, 0, 0, this.sx, this.sy, this.sz]
  ): void {
    const [x0, y0, z0, x1, y1, z1] = bounds
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(this.sy, Math.ceil(y1)); y++)
      for (let z = Math.max(0, Math.floor(z0)); z < Math.min(this.sz, Math.ceil(z1)); z++)
        for (let x = Math.max(0, Math.floor(x0)); x < Math.min(this.sx, Math.ceil(x1)); x++)
          if (test(x + 0.5, y + 0.5, z + 0.5)) this.set(x, y, z, color)
  }

  /** Hộp từ (x0, y0, z0) tới (x1, y1, z1), tính cả hai đầu (toạ độ ô nguyên) */
  box(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    color: VoxelColor
  ): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, z, color)
  }

  /** Hộp rỗng ruột (chỉ vách), độ dày 1 */
  shell(
    x0: number,
    y0: number,
    z0: number,
    x1: number,
    y1: number,
    z1: number,
    color: VoxelColor
  ): void {
    this.box(x0, y0, z0, x1, y1, z1, color)
    if (x1 - x0 > 1 && z1 - z0 > 1) this.box(x0 + 1, y0, z0 + 1, x1 - 1, y1, z1 - 1, null)
  }

  /** Trụ đứng tâm (cx, cz) bán kính r, từ y0 tới y1 */
  cylinder(cx: number, cz: number, r: number, y0: number, y1: number, color: VoxelColor): void {
    this.fill((x, _y, z) => Math.hypot(x - cx, z - cz) <= r, color, [
      cx - r - 1,
      y0,
      cz - r - 1,
      cx + r + 1,
      y1 + 1,
      cz + r + 1
    ])
  }

  /** Trụ nằm ngang dọc trục x (vd cột kèo, thân thuyền) tâm (cy, cz) bán kính r */
  cylinderX(cy: number, cz: number, r: number, x0: number, x1: number, color: VoxelColor): void {
    this.fill((_x, y, z) => Math.hypot(y - cy, z - cz) <= r, color, [
      x0,
      cy - r - 1,
      cz - r - 1,
      x1 + 1,
      cy + r + 1,
      cz + r + 1
    ])
  }

  ellipsoid(
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
    color: VoxelColor
  ): void {
    this.fill(
      (x, y, z) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1,
      color,
      [cx - rx - 1, cy - ry - 1, cz - rz - 1, cx + rx + 1, cy + ry + 1, cz + rz + 1]
    )
  }

  /**
   * Mái bốn mái kiểu bậc thang: tầng dưới cùng phủ (x0..x1, z0..z1) ở độ cao y, mỗi tầng trên thu vào `step` ô
   * mỗi phía, tới khi hết. Trả về độ cao tầng trên cùng.
   */
  hipRoof(
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    y: number,
    color: VoxelColor,
    step = 1
  ): number {
    let top = y
    for (let k = 0; x0 + k * step <= x1 - k * step && z0 + k * step <= z1 - k * step; k++) {
      top = y + k
      this.box(x0 + k * step, top, z0 + k * step, x1 - k * step, top, z1 - k * step, color)
    }
    return top
  }

  /** Mái hai mái: nóc chạy dọc trục `ridge`, mỗi tầng thu vào 1 ô ở hai phía còn lại. Trả về độ cao nóc */
  gableRoof(
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    y: number,
    ridge: 'x' | 'z',
    color: VoxelColor
  ): number {
    let top = y
    for (let k = 0; ; k++) {
      const [a0, a1] = ridge === 'x' ? [z0 + k, z1 - k] : [x0 + k, x1 - k]
      if (a0 > a1) break
      top = y + k
      if (ridge === 'x') this.box(x0, top, a0, x1, top, a1, color)
      else this.box(a0, top, z0, a1, top, z1, color)
    }
    return top
  }

  /** Chép nửa trái (x < sx/2) sang nửa phải theo gương — vẽ một nửa công trình đối xứng */
  mirrorX(): void {
    const half = Math.floor(this.sx / 2)
    for (let y = 0; y < this.sy; y++)
      for (let z = 0; z < this.sz; z++)
        for (let x = 0; x < half; x++) this.set(this.sx - 1 - x, y, z, this.get(x, y, z))
  }

  /** Số ô có màu */
  count(): number {
    let n = 0
    for (const c of this.cells) if (c !== 0) n++
    return n
  }

  /** Duyệt các ô có màu */
  *voxels(): Generator<{ x: number; y: number; z: number; color: string }> {
    for (let y = 0; y < this.sy; y++)
      for (let z = 0; z < this.sz; z++)
        for (let x = 0; x < this.sx; x++) {
          const i = this.cells[this.index(x, y, z)]
          if (i !== 0) yield { x, y, z, color: this.palette[i] }
        }
  }
}

/** Một mô hình voxel có tên: kích thước lưới + hàm vẽ */
export interface VoxelModel {
  id: string
  size: [number, number, number]
  build: (g: VoxelGrid) => void
}

export function buildModel(model: VoxelModel): VoxelGrid {
  const g = new VoxelGrid(...model.size)
  model.build(g)
  return g
}
