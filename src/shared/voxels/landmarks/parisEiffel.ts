// Tháp Eiffel (Pháp): tháp sắt thon dần, hai tầng ngắm cảnh, bốn chân chụm lại, công viên và sông Seine phía trước.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'
import { noise, tree } from './scenery'

const IRON = '#8a7560'
const IRON_DARK = '#6a5848'
const IRON_LIGHT = '#a8917a'

export const parisEiffel: VoxelModel = {
  id: 'paris-eiffel',
  size: [40, 46, 36],
  build: (g) => {
    // công viên + đường + sông phía trước
    g.box(0, 0, 0, 39, 0, 35, VP.soil)
    g.box(0, 1, 0, 39, 1, 24, VP.grass)
    g.box(0, 1, 25, 39, 1, 35, VP.waterDeep)
    g.box(0, 2, 25, 39, 2, 35, VP.water)
    g.box(0, 2, 22, 39, 2, 24, VP.stone) // kè sông
    for (let i = 0; i < 40; i++) g.set(Math.floor(noise(i, 1, 3) * 40), 2, 25 + Math.floor(noise(i, 2, 3) * 11), '#8fd0ee')
    g.box(18, 2, 0, 21, 2, 22, VP.sand) // lối đi giữa
    // tháp: nửa rộng giảm dần; mỗi lớp là vòng vuông thưa (khung sắt)
    const cx = 20
    const cz = 11
    const half = (y: number): number => 1 + 9.5 * Math.exp(-(y - 3) / 8.5)
    for (let y = 3; y <= 41; y++) {
      const w = Math.round(half(y))
      const x0 = cx - w
      const x1 = cx + w - 1
      const z0 = cz - w
      const z1 = cz + w - 1
      const brace = (y % 3) / 3
      for (let x = x0; x <= x1; x++)
        for (const z of [z0, z1]) {
          const edge = x === x0 || x === x1
          if (edge || (x + y) % 3 === 0 || brace === 0) g.set(x, y, z, edge ? IRON_DARK : IRON)
        }
      for (let z = z0; z <= z1; z++)
        for (const x of [x0, x1]) {
          const edge = z === z0 || z === z1
          if (edge || (z + y) % 3 === 0 || brace === 0) g.set(x, y, z, edge ? IRON_DARK : IRON)
        }
    }
    // vòm hở giữa bốn chân
    g.box(cx - 4, 3, cz - 4, cx + 3, 8, cz + 3, null)
    for (const y of [3, 4, 5, 6]) {
      const r = 4 - Math.floor((y - 3) / 2)
      g.box(cx - r, y + 3, cz + 4, cx + r - 1, y + 3, cz + 4, IRON_DARK)
    }
    // hai tầng ngắm cảnh + đỉnh
    for (const y of [15, 27]) {
      const w = Math.round(half(y)) + 1
      g.box(cx - w - 1, y, cz - w - 1, cx + w, y + 1, cz + w, IRON_LIGHT)
      g.box(cx - w - 1, y + 2, cz - w - 1, cx + w, y + 2, cz + w, IRON_DARK)
    }
    g.box(cx - 1, 38, cz - 1, cx, 41, cz, IRON_LIGHT)
    g.box(cx - 1, 42, cz - 1, cx - 1, 45, cz - 1, IRON)
    g.set(cx - 1, 45, cz - 1, VP.gold)
    // cây hai bên lối đi
    for (const [x, z] of [
      [8, 10],
      [8, 18],
      [31, 10],
      [31, 18],
      [4, 4],
      [35, 4]
    ]) tree(g, x, 2, z, 5, 2.5)
  }
}
