// Tượng Nữ thần Tự do (Hoa Kỳ): tượng đồng xanh cầm đuốc trên bệ đá hình sao giữa vịnh, thuyền nhỏ chạy quanh.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'
import { noise } from './scenery'

const COPPER = '#6fb8a2'
const COPPER_DARK = '#4f9484'
const COPPER_LIGHT = '#98d6c2'

export const usaLiberty: VoxelModel = {
  id: 'usa-liberty',
  size: [36, 48, 32],
  build: (g) => {
    g.box(0, 0, 0, 35, 0, 31, VP.waterDeep)
    g.box(0, 1, 0, 35, 1, 31, VP.water)
    for (let i = 0; i < 30; i++) g.set(Math.floor(noise(i, 1, 5) * 36), 1, Math.floor(noise(i, 2, 5) * 32), '#8fd0ee')
    // đảo + bệ nhiều bậc
    g.cylinder(18, 14, 11, 1, 2, VP.grassDark)
    g.cylinder(18, 14, 10, 3, 3, VP.grass)
    g.box(11, 3, 7, 24, 5, 20, VP.stone)
    g.box(12, 6, 8, 23, 7, 19, VP.stoneDark)
    g.box(13, 8, 9, 22, 18, 18, VP.stone)
    g.box(13, 12, 9, 22, 12, 18, VP.stoneDark) // đường gờ
    g.box(12, 19, 8, 23, 20, 19, VP.stoneDark)
    // tượng: váy, thân, đầu, cánh tay giơ đuốc
    const cx = 17
    const cz = 13
    g.cylinder(cx, cz, 4, 21, 22, COPPER_DARK)
    g.cylinder(cx, cz, 3.2, 23, 26, COPPER)
    g.cylinder(cx, cz, 2.6, 27, 31, COPPER)
    g.box(cx + 2, 27, cz - 1, cx + 3, 30, cz + 1, COPPER_DARK) // nếp áo phải
    g.cylinder(cx, cz, 1.8, 32, 35, COPPER_LIGHT) // đầu
    for (const [dx, dz] of [
      [0, 2],
      [-2, 1],
      [2, 1],
      [-2, -1],
      [2, -1],
      [0, -2]
    ]) g.box(cx + dx, 36, cz + dz, cx + dx, 37, cz + dz, COPPER) // vương miện
    // tay giơ đuốc
    g.box(cx + 3, 28, cz, cx + 3, 37, cz, COPPER)
    g.box(cx + 2, 38, cz - 1, cx + 4, 38, cz + 1, COPPER_DARK)
    g.box(cx + 3, 39, cz, cx + 3, 42, cz, VP.gold)
    g.set(cx + 3, 43, cz, VP.lanternGlow)
    g.set(cx + 3, 44, cz, VP.lantern)
    // tay trái cầm bảng
    g.box(cx - 3, 28, cz - 1, cx - 3, 31, cz + 1, COPPER_DARK)
    // thuyền nhỏ
    g.box(3, 1, 24, 9, 2, 26, VP.woodRed)
    g.box(6, 3, 25, 6, 8, 25, VP.woodDark)
    g.box(7, 4, 25, 9, 7, 25, VP.white)
  }
}
