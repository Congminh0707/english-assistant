// Tháp đồng hồ trường học (Đồ vật thông minh): toà nhà gạch có tháp đồng hồ cao, bóng đèn lớn trên đỉnh, sân cỏ
// với cây đàn piano nhỏ, quyển sách khổng lồ và cây búa. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'
import { tree } from './scenery'

const BRICK = '#c8765a'
const BRICK_DARK = '#a45a44'
const ROOF = '#4d5f8a'
const ROOF_DARK = '#3a4a70'

export const earthWorkshopTower: VoxelModel = {
  id: 'earth-workshop-tower',
  size: [42, 46, 32],
  build: (g) => {
    g.box(0, 0, 0, 41, 0, 31, VP.soil)
    g.box(0, 1, 0, 41, 1, 31, VP.grass)
    g.box(16, 1, 18, 25, 1, 31, VP.sand) // lối vào
    // thân toà nhà dài + mái
    g.box(2, 2, 4, 39, 11, 16, BRICK)
    g.box(2, 2, 16, 39, 3, 16, BRICK_DARK)
    for (let x = 4; x <= 37; x += 4) {
      g.box(x, 6, 16, x + 1, 9, 16, VP.glass)
      g.box(x, 6, 16, x + 1, 6, 16, VP.white)
    }
    g.gableRoof(1, 3, 40, 17, 12, 'x', ROOF)
    g.box(1, 12, 3, 40, 12, 3, ROOF_DARK)
    // tháp đồng hồ ở giữa
    g.box(16, 2, 7, 25, 31, 15, BRICK)
    g.box(16, 2, 15, 25, 3, 15, BRICK_DARK)
    g.box(18, 2, 15, 23, 7, 15, VP.woodDark) // cửa lớn
    g.box(19, 2, 15, 22, 5, 15, VP.wood)
    for (const x of [16, 25]) g.box(x, 2, 7, x, 31, 7, BRICK_DARK)
    // mặt đồng hồ trên mặt trước (z) và mặt bên (x)
    const clock = (axis: 'z' | 'x'): void => {
      for (let a = 0; a < 7; a++)
        for (let b = 0; b < 7; b++) {
          const da = a - 3
          const db = b - 3
          const d = Math.hypot(da, db)
          if (d > 3.4) continue
          const c = d > 2.7 ? VP.gold : VP.white
          if (axis === 'z') g.set(18 + a, 21 + b, 15, c)
          else g.set(25, 21 + b, 8 + a, c)
        }
      if (axis === 'z') {
        g.box(21, 24, 15, 21, 26, 15, VP.iron) // kim phút
        g.box(21, 24, 15, 23, 24, 15, VP.iron) // kim giờ
      } else {
        g.box(25, 24, 11, 25, 26, 11, VP.iron)
        g.box(25, 24, 11, 25, 24, 13, VP.iron)
      }
    }
    clock('z')
    clock('x')
    g.box(16, 32, 7, 25, 32, 15, ROOF_DARK)
    g.hipRoof(16, 7, 25, 15, 33, ROOF)
    // bóng đèn trên đỉnh tháp
    g.box(20, 38, 10, 21, 39, 11, VP.iron)
    g.ellipsoid(21, 42, 11, 2.4, 2.8, 2.4, VP.lanternGlow)
    g.ellipsoid(21, 42.6, 11, 1.4, 1.6, 1.4, '#fff3b0')
    // đồ vật khổng lồ ở sân: sách, piano, búa
    g.box(3, 2, 22, 9, 3, 27, VP.lacquer)
    g.box(4, 4, 22, 9, 4, 27, VP.white)
    g.box(3, 2, 22, 3, 4, 27, '#8a1f1a')
    g.box(29, 2, 21, 37, 5, 26, VP.iron)
    g.box(29, 6, 24, 37, 7, 26, VP.iron)
    for (let x = 30; x <= 36; x += 1) g.set(x, 5, 26, x % 2 ? VP.white : VP.iron)
    g.box(31, 2, 22, 31, 2, 22, VP.woodDark)
    g.box(12, 2, 26, 12, 7, 26, VP.wood)
    g.box(10, 8, 25, 14, 9, 27, VP.stoneDark)
    tree(g, 4, 2, 6, 6, 3)
    tree(g, 38, 2, 22, 6, 3)
  }
}
