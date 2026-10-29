// Ga Đà Lạt: toà nhà màu kem/vàng với ba mái nhọn dốc cao (gợi ba đỉnh Langbiang) lợp ngói nâu đỏ, mặt tam giác
// ghép kính màu; phía trước là đường ray với đầu máy hơi nước nhỏ cùng toa tàu, và một cây thông. Vẽ cách điệu.
// docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const ROOF_A = '#a24a36'
const ROOF_B = '#86392b'
const GLASS_COLORS = ['#e0524a', '#4a90d9', '#f2c94c', '#4fae6a']
const PINE = '#2f7a45'
const LOCO_BLACK = '#2b2d36'
const SMOKE = '#eeeeee'

/** Mái dốc hai mái, mặt trước (z1) là tam giác kính màu; mỗi bậc thu vào 1 ô sau `lps` tầng */
function steepGable(
  g: VoxelGrid,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  y: number,
  lps: number
): number {
  let top = y
  for (let k = 0; x0 + k <= x1 - k; k++) {
    for (let j = 0; j < lps; j++) {
      const yy = y + k * lps + j
      top = yy
      const a = x0 + k
      const b = x1 - k
      g.box(a, yy, z0, b, yy, z1 - 1, yy % 2 === 0 ? ROOF_A : ROOF_B)
      for (let x = a; x <= b; x++) {
        const edge = x - a < 2 || b - x < 2
        if (edge) g.set(x, yy, z1, yy % 2 === 0 ? ROOF_A : ROOF_B)
        else if (x % 3 === 0) g.set(x, yy, z1, VP.plaster)
        else g.set(x, yy, z1, GLASS_COLORS[(Math.floor(x / 3) + Math.floor(yy / 3)) % 4])
      }
    }
  }
  return top
}

function wheel(g: VoxelGrid, cx: number, cy: number, z: number, r: number, color: string): void {
  g.fill((x, y) => Math.hypot(x - cx, y - cy) <= r, color, [
    cx - r - 1,
    cy - r - 1,
    z,
    cx + r + 1,
    cy + r + 1,
    z + 1
  ])
}

function pine(g: VoxelGrid, cx: number, cz: number, h: number, rMax: number): void {
  g.cylinder(cx, cz, 0.8, 1, 3, VP.woodDark)
  for (let i = 0; i < h; i++) {
    const r = Math.max(0.6, rMax * (1 - i / h))
    g.cylinder(cx, cz, r, 3 + i, 3 + i, i % 2 === 0 ? PINE : VP.leaf)
  }
}

export const dalatStation: VoxelModel = {
  id: 'dalat-station',
  size: [46, 30, 34],
  build: (g) => {
    const T = 27 // z của ray gần nhà ga
    // Nền cỏ, sân ga, nền đá dăm + ray
    g.box(0, 0, 0, 45, 0, 33, VP.grass)
    g.box(2, 1, 17, 43, 1, 25, VP.stone)
    g.box(0, 0, 26, 45, 1, 33, VP.stoneDark)
    for (let x = 0; x < 46; x++) {
      if (x % 3 === 0) g.box(x, 2, T, x, 2, T + 5, VP.wood)
      g.set(x, 2, T, VP.iron)
      g.set(x, 2, T + 5, VP.iron)
    }

    // Thân nhà ga
    g.box(3, 1, 6, 42, 10, 16, VP.plaster)
    g.box(3, 1, 6, 42, 1, 16, VP.stoneDark)
    g.box(3, 5, 16, 42, 5, 16, VP.plasterYellow) // dải vàng
    g.box(16, 11, 6, 29, 13, 16, VP.plasterYellow) // gian giữa cao hơn
    for (const [a, b] of [
      [14, 15],
      [30, 31]
    ])
      g.box(a, 11, 6, b, 11, 16, ROOF_B)

    // Ba mái nhọn: hai bên thấp, giữa cao nhất
    steepGable(g, 3, 13, 6, 17, 11, 2)
    steepGable(g, 32, 42, 6, 17, 11, 2)
    const top = steepGable(g, 16, 29, 6, 17, 14, 2)
    g.box(22, top + 1, 10, 23, top + 2, 12, VP.gold) // chóp
    for (const x of [8, 37]) g.set(x, 24, 11, VP.gold)

    // Cửa sổ hai cánh
    for (const x of [5, 9, 36, 40]) {
      g.box(x - 1, 2, 16, x + 2, 6, 16, VP.white)
      g.box(x, 3, 16, x + 1, 5, 16, VP.glass)
    }
    // Cửa chính + hai ô kính màu cao
    g.box(22, 1, 16, 23, 5, 16, VP.woodDark)
    g.box(21, 6, 16, 24, 7, 16, VP.glass)
    for (const x of [18, 26]) {
      g.box(x, 3, 16, x + 1, 8, 16, VP.white)
      for (let y = 4; y <= 7; y++)
        for (const xx of [x, x + 1]) g.set(xx, y, 16, GLASS_COLORS[(xx + y) % 4])
    }
    // Bậc thềm
    g.box(20, 1, 17, 25, 1, 18, VP.stoneDark)

    // Mái hiên sân ga
    g.box(14, 8, 17, 31, 8, 21, ROOF_B)
    for (const x of [14, 31]) g.box(x, 2, 21, x, 7, 21, VP.lacquer)

    // Toa tàu (trái)
    g.box(3, 4, T + 1, 18, 5, T + 4, VP.iron)
    g.box(4, 6, T + 1, 17, 8, T + 4, VP.tileGreen)
    g.box(3, 9, T + 1, 18, 9, T + 4, VP.white)
    for (let x = 5; x <= 15; x += 3) g.box(x, 6, T + 4, x + 1, 7, T + 4, VP.glass)
    for (const x of [6, 15]) for (const z of [T, T + 5]) wheel(g, x, 4, z, 1.4, VP.iron)
    g.box(19, 5, T + 2, 20, 5, T + 3, VP.iron) // móc nối

    // Đầu máy hơi nước (phải, quay về +x)
    g.box(21, 4, T + 1, 41, 4, T + 4, VP.iron)
    g.cylinderX(7, T + 2.5, 2, 28, 38, LOCO_BLACK)
    for (const x of [30, 34]) g.cylinderX(7, T + 2.5, 2.4, x, x, VP.gold)
    g.box(39, 5, T + 1, 39, 8, T + 4, VP.iron) // hộp khói
    g.cylinder(37, T + 2.5, 1, 10, 11, LOCO_BLACK)
    g.cylinder(37, T + 2.5, 1.6, 12, 12, VP.gold)
    g.ellipsoid(32, 9.5, T + 2.5, 1.3, 1.1, 1.3, VP.gold) // nắp nồi hơi
    g.box(22, 5, T + 1, 27, 10, T + 4, VP.tileGreen) // buồng lái
    g.box(21, 11, T, 28, 11, T + 5, VP.lacquer)
    g.box(23, 7, T + 4, 25, 9, T + 4, VP.glass)
    g.box(40, 4, T + 1, 41, 5, T + 4, VP.lacquer) // cản
    g.set(40, 7, T + 2, VP.lanternGlow)
    g.set(40, 7, T + 3, VP.lanternGlow)
    for (const z of [T, T + 5]) {
      wheel(g, 25, 4, z, 1.6, VP.lacquer)
      wheel(g, 30, 4, z, 1.6, VP.lacquer)
      wheel(g, 35, 4, z, 1.3, VP.iron)
    }
    // Khói
    g.ellipsoid(37, 14, T + 2.5, 1.4, 1.2, 1.4, SMOKE)
    g.ellipsoid(34, 16, T + 3, 1.9, 1.5, 1.9, SMOKE)
    g.ellipsoid(30, 19, T + 3, 2.3, 1.7, 2.3, SMOKE)

    // Cây thông
    pine(g, 44.5, 20, 11, 3)
    pine(g, 1.5, 19, 9, 2.6)
  }
}
