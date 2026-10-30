// Vạn Lý Trường Thành (Trung Quốc): bức tường gạch uốn theo sườn đồi xanh, có lỗ châu mai và ba tháp canh mái ngói.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'
import { noise } from './scenery'

const BRICK = '#a8a190'
const BRICK_DARK = '#85806f'
const ROOF = '#9a3b2c'

export const chinaGreatWall: VoxelModel = {
  id: 'china-great-wall',
  size: [46, 30, 32],
  build: (g) => {
    // địa hình đồi: cao độ theo (x, z)
    const height = (x: number, z: number): number =>
      3 + Math.round(4 * Math.sin(x / 7.5) * 0.7 + 5 * Math.exp(-(((z - 8) / 9) ** 2)) + (noise(x, 0, z) - 0.5))
    for (let z = 0; z < 32; z++)
      for (let x = 0; x < 46; x++) {
        const h = height(x, z)
        g.box(x, 0, z, x, Math.max(0, h - 2), z, VP.soil)
        g.box(x, Math.max(0, h - 1), z, x, h, z, noise(x, 4, z) > 0.8 ? VP.leafLight : VP.grassDark)
      }
    // tường uốn lượn: tâm đường z(x), rộng 4
    const wallZ = (x: number): number => 15 + Math.round(5 * Math.sin(x / 7))
    for (let x = 0; x < 46; x++) {
      const zc = wallZ(x)
      for (let z = zc - 2; z <= zc + 1; z++) {
        const base = height(x, zc)
        g.box(x, base, z, x, base + 3, z, x % 2 ? BRICK : BRICK_DARK)
        if (z === zc - 2 || z === zc + 1) {
          if (x % 3 !== 0) g.set(x, base + 4, z, BRICK) // lỗ châu mai
        } else g.set(x, base + 3, z, BRICK_DARK)
      }
    }
    // ba tháp canh
    for (const x of [8, 23, 38]) {
      const zc = wallZ(x)
      const base = height(x, zc)
      g.box(x - 2, base, zc - 3, x + 2, base + 7, zc + 2, BRICK)
      g.box(x - 2, base + 4, zc + 2, x + 2, base + 4, zc + 2, BRICK_DARK)
      g.box(x - 1, base + 4, zc + 2, x - 1, base + 5, zc + 2, VP.iron) // cửa sổ
      g.box(x + 1, base + 4, zc + 2, x + 1, base + 5, zc + 2, VP.iron)
      g.box(x - 3, base + 8, zc - 4, x + 3, base + 8, zc + 3, ROOF)
      g.hipRoof(x - 2, zc - 3, x + 2, zc + 2, base + 9, ROOF)
      g.set(x, base + 12, zc - 1, VP.gold)
    }
    // vài cây thông phía trước
    for (const [x, z] of [
      [4, 27],
      [14, 28],
      [30, 27],
      [41, 26]
    ]) {
      const b = height(x, z) + 1
      g.box(x, b, z, x, b + 2, z, VP.woodDark)
      for (let k = 0; k < 4; k++) g.box(x - 2 + k, b + 2 + k, z - 2 + k, x + 2 - k, b + 2 + k, z + 2 - k, VP.leaf)
    }
  }
}
