// Sa Pa (Lào Cai): ruộng bậc thang xanh mướt nhìn từ trên cao, nước ngập lấp lánh ở mép ruộng, nhà sàn mái lá,
// đỉnh núi phủ mây phía sau. Vẽ cách điệu. docs/19-kids-world.md §2.4
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const RICE = '#8bd04a'
const RICE_DARK = '#6cbf3a'
const PADDY_WATER = '#a6dcee'
const FOREST = '#3f7f3b'
const MOUNTAIN_ROCK = '#8c968c'
const CLOUD = '#ffffff'
const THATCH = '#c9a85a'
const THATCH_DARK = '#a98a44'

/** Nhiễu giả ngẫu nhiên cố định theo toạ độ, trong [0, 1) */
function noise(x: number, y: number, z: number): number {
  let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(z + 7, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1103515245)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

/** Bỏ các ô nằm kín bên trong (cả 6 mặt đều có ô khác) cho nhẹ — nhìn bên ngoài không đổi */
function hollow(g: VoxelGrid): void {
  const kill: Array<[number, number, number]> = []
  for (const { x, y, z } of g.voxels())
    if (
      g.get(x - 1, y, z) !== null &&
      g.get(x + 1, y, z) !== null &&
      g.get(x, y - 1, z) !== null &&
      g.get(x, y + 1, z) !== null &&
      g.get(x, y, z - 1) !== null &&
      g.get(x, y, z + 1) !== null
    )
      kill.push([x, y, z])
  for (const [x, y, z] of kill) g.set(x, y, z, null)
}

const SX = 44
const SZ = 32

/** Độ cao đồi (trước khi chia bậc): thấp dần về phía người xem (z lớn), đường đồng mức uốn lượn */
function hill(x: number, z: number): number {
  return 21 - 0.6 * z + 1.6 * Math.sin(x * 0.23 + z * 0.12) - 0.012 * (x - 22) ** 2 * 0.35
}

/** Đỉnh núi phía sau bên trái */
function peak(x: number, z: number): number {
  return (
    36 -
    1.75 * Math.hypot(x - 11, (z - 4) * 1.15) +
    (noise(Math.floor(x), 0, Math.floor(z)) - 0.5) * 1.2
  )
}

export const sapaTerraces: VoxelModel = {
  id: 'sapa-terraces',
  size: [SX, 40, SZ],
  build: (g) => {
    // Nhà sàn đứng trên một mặt bằng phẳng — chọn độ cao theo bậc ruộng tại đó
    const houseLevel = Math.max(2, 2 * Math.floor(hill(35, 20) / 2) + 1)
    const plot = (x: number, z: number): boolean => x >= 29 && x <= 41 && z >= 14 && z <= 26

    for (let z = 0; z < SZ; z++)
      for (let x = 0; x < SX; x++) {
        const H = hill(x, z)
        const M = peak(x, z)
        let top: number
        let topColor: string
        if (plot(x, z)) {
          top = houseLevel
          topColor = VP.grass
        } else if (M > H + 1) {
          // sườn núi: rừng xanh, đá xám ở trên cao
          top = Math.max(3, Math.round(M))
          topColor = top > 26 ? MOUNTAIN_ROCK : noise(x, 3, z) > 0.8 ? VP.leaf : FOREST
        } else {
          // ruộng bậc thang: mỗi bậc cao 2 ô
          top = Math.max(2, 2 * Math.floor(H / 2) + 1)
          const hz = hill(x, z - 1)
          const behind = 2 * Math.floor(hz / 2) + 1
          const hx = hill(x - 1, z)
          const left = 2 * Math.floor(hx / 2) + 1
          if (z > 0 && behind > top)
            topColor = PADDY_WATER // mép ruộng sát bờ cao phía sau: nước phản chiếu
          else if (x > 0 && left > top) topColor = PADDY_WATER
          else topColor = (Math.floor(x / 2) + Math.floor(z / 2)) % 3 === 0 ? RICE_DARK : RICE
        }
        top = Math.min(top, 36)
        // cột đất; bờ ruộng (gờ cỏ) ở lớp ngay dưới mặt
        if (top > 1) g.box(x, 0, z, x, top - 2, z, VP.soil)
        g.set(
          x,
          top - 1,
          z,
          topColor === PADDY_WATER || topColor === RICE || topColor === RICE_DARK
            ? VP.grassDark
            : topColor
        )
        g.set(x, top, z, topColor)
      }

    // Cây thông/cây rừng rải trên sườn núi
    for (let z = 1; z < 14; z++)
      for (let x = 1; x < 30; x++) {
        const c = g.get(x, Math.round(peak(x, z)), z)
        if (
          c === FOREST &&
          noise(x, 9, z) > 0.93 &&
          peak(x, z) < 24 &&
          peak(x, z) > hill(x, z) + 2
        ) {
          const y = Math.round(peak(x, z))
          g.box(x, y + 1, z, x, y + 2, z, VP.woodDark)
          g.box(x, y + 3, z, x, y + 4, z, VP.leaf)
        }
      }

    // Nhà sàn Tày: bốn cột + thêm cột giữa, sàn gỗ, vách, mái lá hai mái, thang lên
    const py = houseLevel
    const x0 = 31
    const x1 = 38
    const z0 = 16
    const z1 = 23
    for (const x of [x0, x1])
      for (const z of [z0, (z0 + z1) >> 1, z1]) g.box(x, py + 1, z, x, py + 3, z, VP.woodDark)
    g.box(x0 - 1, py + 4, z0 - 1, x1 + 1, py + 4, z1 + 1, VP.wood) // sàn
    // vách
    g.box(x0, py + 5, z0, x1, py + 8, z1, VP.wood)
    g.box(x0 + 1, py + 5, z0 + 1, x1 - 1, py + 8, z1 - 1, null)
    for (let y = py + 6; y <= py + 8; y += 2) g.box(x0, y, z0, x1, y, z0, VP.woodDark) // thớ gỗ vách sau
    // cửa chính và cửa sổ nhìn ra phía trước (+z) và bên (+x)
    g.box(34, py + 5, z1, 35, py + 7, z1, VP.woodDark)
    g.box(x1, py + 6, 19, x1, py + 7, 20, VP.woodDark)
    g.box(x0 + 1, py + 6, z1, x0 + 2, py + 7, z1, VP.glass)
    // mái lá: nóc chạy dọc theo trục x
    g.gableRoof(x0 - 2, z0 - 2, x1 + 2, z1 + 2, py + 9, 'x', THATCH)
    g.box(x0 - 2, py + 9, z0 - 2, x1 + 2, py + 9, z0 - 2, THATCH_DARK)
    g.box(x0 - 2, py + 9, z1 + 2, x1 + 2, py + 9, z1 + 2, THATCH_DARK)
    g.box(x0 - 2, py + 13, (z0 + z1) >> 1, x1 + 2, py + 13, ((z0 + z1) >> 1) + 1, THATCH_DARK)
    // thang gỗ phía trước
    for (let k = 0; k < 4; k++)
      g.box(33, py + 1 + k, z1 + 4 - k, 35, py + 1 + k, z1 + 4 - k, VP.wood)
    // chum nước/bó rơm cạnh nhà
    g.box(39, py + 1, 25, 40, py + 2, 25, THATCH)

    // Mây trắng vờn quanh đỉnh núi và một đám mây nhỏ bên phải
    g.ellipsoid(10, 27, 9.5, 6, 1.5, 3, CLOUD)
    g.ellipsoid(17, 28, 6, 4, 1.3, 2.4, CLOUD)
    g.ellipsoid(3, 27, 6, 3, 1.2, 2.2, CLOUD)
    g.ellipsoid(34, 31, 4, 5, 1.4, 2.5, CLOUD)
    g.ellipsoid(38, 30, 5, 3.5, 1.2, 2, CLOUD)
    hollow(g)
  }
}
