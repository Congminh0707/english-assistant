// Chợ Bến Thành (TP. Hồ Chí Minh): toà chợ thấp màu kem – vàng, mái ngói nâu đỏ, cổng chính ở giữa có tháp đồng hồ
// vuông nhìn ra phố (phía +z), có lá cờ trên đỉnh; phía trước là vỉa hè, vài chiếc xe máy nhỏ, ô che và cây xanh.
// Vẽ cách điệu, không có chữ. docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const ASPHALT = '#5f636d'
const SHUTTER = '#3f7f6a'
const DARK_DOOR = '#3a2a22'

/** Mái ngói hai mái, nóc chạy dọc trục x: thoải, xen kẽ hàng ngói sáng/tối */
function tileRoofX(g: VoxelGrid, x0: number, x1: number, z0: number, z1: number, y: number): void {
  for (let z = z0; z <= z1; z++) {
    const d = Math.min(z - z0, z1 - z)
    const top = y + Math.floor(d * 0.6)
    const color =
      d === Math.max(0, Math.floor((z1 - z0) / 2)) ? VP.tileDark : z % 2 === 0 ? VP.tile : '#8a5e4e'
    g.box(x0, y, z, x1, top, z, color)
  }
}

/** Xe máy nhỏ chạy dọc trục x */
function motorbike(g: VoxelGrid, x: number, z: number, body: string): void {
  g.set(x, 1, z, VP.iron)
  g.set(x + 3, 1, z, VP.iron)
  g.box(x + 1, 2, z, x + 2, 2, z, body)
  g.set(x + 3, 2, z, body)
  g.set(x + 1, 3, z, VP.iron) // yên
  g.set(x + 3, 3, z, VP.iron) // tay lái
  g.set(x + 4, 2, z, VP.lanternGlow) // đèn
}

function parasol(g: VoxelGrid, x: number, z: number, color: string): void {
  g.box(x, 1, z, x, 4, z, VP.woodDark)
  g.cylinder(x + 0.5, z + 0.5, 2.6, 5, 5, color)
  g.cylinder(x + 0.5, z + 0.5, 1.4, 6, 6, color)
}

function tree(g: VoxelGrid, x: number, z: number): void {
  g.box(x, 1, z, x, 5, z, VP.woodDark)
  g.ellipsoid(x + 0.5, 8, z + 0.5, 3.4, 3.2, 3.4, VP.leaf)
  g.ellipsoid(x + 1.5, 9, z + 0.5, 2, 2, 2, VP.leafLight)
}

export const hcmcBenThanh: VoxelModel = {
  id: 'hcmc-ben-thanh',
  size: [44, 40, 32],
  build: (g) => {
    // Nền: sân/vỉa hè đá, đường nhựa phía trước có vạch trắng
    g.box(0, 0, 0, 43, 0, 31, VP.stone)
    g.box(0, 0, 0, 43, 0, 3, VP.grassDark)
    g.box(0, 0, 24, 43, 0, 24, VP.stoneDark) // lề đường
    g.box(0, 0, 25, 43, 0, 31, ASPHALT)
    for (let x = 1; x < 44; x += 6) g.box(x, 0, 28, x + 2, 0, 28, VP.white)

    // Hai cánh chợ: tường kem, gờ vàng, mái ngói thoải
    const wing = (x0: number, x1: number, outerX: number): void => {
      g.box(x0, 1, 6, x1, 9, 18, VP.plaster)
      g.box(x0, 1, 6, x1, 1, 18, VP.plasterYellow) // chân tường
      g.box(x0, 9, 6, x1, 9, 18, VP.plasterYellow) // gờ mái
      tileRoofX(g, x0, x1, 5, 19, 10)
      // mặt hồi ở đầu cánh
      for (let z = 6; z <= 18; z++) {
        const d = Math.min(z - 5, 19 - z)
        g.box(outerX, 10, z, outerX, 9 + Math.floor(d * 0.6), z, VP.plaster)
      }
    }
    wing(2, 15, 2)
    wing(28, 41, 41)

    // Cửa vòm tầng trệt và cửa sổ chớp xanh tầng trên (mặt trước z = 18)
    for (const xs of [
      [4, 8, 12],
      [30, 34, 38]
    ])
      for (const x of xs) {
        g.box(x, 2, 18, x + 1, 4, 18, DARK_DOOR)
        g.set(x, 5, 18, DARK_DOOR)
        g.set(x + 1, 5, 18, DARK_DOOR)
        g.box(x, 6, 18, x + 1, 8, 18, SHUTTER)
        g.box(x, 7, 18, x + 1, 7, 18, VP.glass)
      }
    // cửa sổ ở mặt bên +x của cánh phải
    for (const z of [9, 13]) {
      g.box(41, 3, z, 41, 4, z + 1, DARK_DOOR)
      g.box(41, 6, z, 41, 8, z + 1, SHUTTER)
      g.set(41, 7, z, VP.glass)
      g.set(41, 7, z + 1, VP.glass)
    }

    // Khối cổng chính ở giữa (nhô ra phía người xem)
    g.box(16, 1, 14, 27, 12, 21, VP.plaster)
    g.box(16, 1, 14, 27, 1, 21, VP.plasterYellow)
    // cửa vòm lớn ở giữa + hai cửa phụ
    g.box(20, 1, 21, 23, 7, 21, DARK_DOOR)
    g.box(21, 8, 21, 22, 8, 21, DARK_DOOR)
    for (const x of [17, 25]) g.box(x, 1, 21, x + 1, 5, 21, DARK_DOOR)
    for (const x of [16, 19, 24, 27]) g.box(x, 1, 21, x, 12, 21, VP.plasterYellow) // trụ
    g.box(16, 9, 21, 27, 9, 21, VP.plasterYellow)
    for (const x of [17, 25]) g.box(x, 10, 21, x + 1, 11, 21, VP.glass)
    for (const x of [20, 22]) g.box(x, 10, 21, x + 1, 11, 21, VP.plasterYellow)
    // cửa bên +x của khối cổng
    g.box(27, 2, 16, 27, 5, 17, DARK_DOOR)
    g.box(27, 2, 19, 27, 5, 19, DARK_DOOR)
    g.box(15, 13, 13, 28, 13, 22, VP.stone) // diềm mái
    g.hipRoof(15, 13, 28, 22, 14, VP.tile)

    // Tháp đồng hồ vuông
    g.box(19, 14, 16, 24, 25, 21, VP.plaster)
    for (const y of [14, 25]) g.box(18, y, 15, 25, y, 22, VP.stone)
    g.box(19, 15, 16, 19, 24, 16, VP.plasterYellow) // cạnh tháp
    g.box(24, 15, 16, 24, 24, 16, VP.plasterYellow)
    g.box(19, 15, 21, 19, 24, 21, VP.plasterYellow)
    g.box(24, 15, 21, 24, 24, 21, VP.plasterYellow)
    // mặt đồng hồ phía trước (z = 21)
    g.fill((x, y) => Math.hypot(x - 22, y - 21) <= 2.5, VP.white, [19, 18, 21, 25, 24, 22])
    g.set(21, 21, 21, VP.iron)
    g.set(21, 22, 21, VP.iron)
    g.set(21, 23, 21, VP.iron)
    g.set(22, 21, 21, VP.iron)
    g.set(23, 21, 21, VP.iron)
    // mặt đồng hồ bên phải (x = 24)
    g.fill((_x, y, z) => Math.hypot(z - 19, y - 21) <= 2.5, VP.white, [24, 18, 16, 25, 24, 22])
    g.set(24, 21, 18, VP.iron)
    g.set(24, 22, 18, VP.iron)
    g.set(24, 23, 18, VP.iron)
    g.set(24, 21, 19, VP.iron)
    g.set(24, 21, 20, VP.iron)
    // mái tháp nhọn + đỉnh vàng + cờ
    const top = g.hipRoof(18, 15, 25, 22, 26, VP.tile)
    g.box(21, top + 1, 18, 22, top + 2, 19, VP.gold)
    g.box(21, top + 3, 18, 21, top + 9, 18, VP.iron)
    g.box(22, top + 6, 18, 25, top + 9, 18, VP.lacquer)
    g.set(23, top + 7, 18, VP.gold)
    g.set(23, top + 8, 18, VP.gold)

    // Đèn lồng đỏ ở cổng
    for (const x of [18, 25]) {
      g.set(x, 8, 22, VP.gold)
      g.set(x, 7, 22, VP.lantern)
    }

    // Vỉa hè: bậc thềm trước cổng, ô che, cây
    g.box(19, 1, 22, 24, 1, 23, VP.stone)
    parasol(g, 6, 21, VP.lacquer)
    parasol(g, 12, 22, VP.plasterYellow)
    parasol(g, 33, 21, VP.tileGreen)
    tree(g, 3, 22)
    tree(g, 40, 22)

    // Xe máy trên đường
    motorbike(g, 7, 26, VP.lacquer)
    motorbike(g, 19, 30, '#2f7fb8')
    motorbike(g, 30, 26, VP.gold)
    motorbike(g, 36, 23, VP.leafLight)
  }
}
