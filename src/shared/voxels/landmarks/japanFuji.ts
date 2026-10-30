// Núi Phú Sĩ (Nhật Bản): ngọn núi hình nón đỉnh phủ tuyết soi bóng xuống hồ, cổng torii đỏ phía trước, vài cây anh đào.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'
import { noise, tree } from './scenery'

const SNOW = '#f7fbff'
const SNOW_SHADE = '#cfe3f2'
const MOUNTAIN = '#5c78a8'
const MOUNTAIN_DARK = '#46608c'
const BLOSSOM = '#f6a9c6'
const BLOSSOM_LIGHT = '#fcd2e2'

export const japanFuji: VoxelModel = {
  id: 'japan-fuji',
  size: [44, 38, 32],
  build: (g) => {
    // hồ + bờ cỏ phía sau
    g.box(0, 0, 0, 43, 0, 31, VP.waterDeep)
    g.box(0, 1, 0, 43, 1, 31, VP.water)
    g.box(0, 1, 0, 43, 3, 9, VP.grassDark)
    g.box(0, 4, 0, 43, 4, 8, VP.grass)
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(noise(i, 1, 9) * 44)
      const z = Math.floor(noise(i, 2, 9) * 22) + 10
      if (g.get(x, 1, z) === VP.water) g.set(x, 1, z, '#8fd0ee')
    }

    // núi: nón cong (sườn thoải dần), phần trên phủ tuyết răng cưa
    const cx = 22
    const cz = 6
    for (let y = 4; y <= 33; y++) {
      const t = (y - 4) / 29
      const r = 17 * (1 - t) ** 1.15 + 1
      for (let z = 0; z < 20; z++)
        for (let x = 0; x < 44; x++) {
          if (Math.hypot(x + 0.5 - cx, (z + 0.5 - cz) * 1.1) > r) continue
          const snowLine = 21 + Math.floor(noise(x, 0, z) * 3) + Math.floor(Math.sin(x * 0.9) * 1.5)
          let c = x > cx + 2 ? MOUNTAIN_DARK : MOUNTAIN
          if (y >= snowLine) c = x > cx + 3 ? SNOW_SHADE : SNOW
          g.set(x, y, z, c)
        }
    }
    g.fill((x, y, z) => y > 33 && Math.hypot(x - cx - 0.5, z - cz - 0.5) < 2, SNOW, [20, 33, 4, 25, 35, 9])

    // cổng torii đỏ đứng trên mặt nước
    const tx = 28
    const tz = 22
    for (const x of [tx, tx + 8]) {
      g.box(x, 1, tz, x + 1, 13, tz + 1, VP.lacquer)
      g.box(x - 1, 1, tz - 1, x + 2, 2, tz + 2, VP.stoneDark)
    }
    g.box(tx - 3, 14, tz - 1, tx + 12, 14, tz + 2, VP.lacquer)
    g.box(tx - 4, 15, tz - 1, tx + 13, 15, tz + 2, VP.iron)
    g.box(tx - 1, 11, tz, tx + 10, 11, tz + 1, VP.lacquer)
    g.box(tx + 4, 12, tz, tx + 5, 14, tz + 1, VP.lacquer)

    // bãi cỏ nhỏ bên trái với cây anh đào + tháp ngũ trùng thấp
    g.box(2, 1, 18, 14, 3, 29, VP.stoneDark)
    g.box(2, 4, 18, 14, 4, 29, VP.grass)
    for (const [x, z] of [
      [5, 22],
      [11, 25],
      [4, 27]
    ]) {
      g.box(x, 5, z, x, 8, z, VP.woodDark)
      g.ellipsoid(x + 0.5, 10, z + 0.5, 3.4, 2.6, 3.4, BLOSSOM)
      g.ellipsoid(x + 1, 11, z + 1, 2.2, 1.6, 2.2, BLOSSOM_LIGHT)
    }
    tree(g, 36, 5, 4, 5, 2)
    tree(g, 6, 5, 4, 6, 3)
  }
}
