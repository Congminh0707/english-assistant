// Nhà hát Con Sò (Sydney, Úc): những "cánh buồm" trắng lớn nhỏ xếp cạnh nhau trên bệ đá bên cảng, cầu cảng và thuyền buồm.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'

const SHELL = '#f6f4ee'
const SHELL_RIB = '#dedbd0'
const PODIUM = '#d9b98a'
const PODIUM_DARK = '#b99468'

export const sydneyOpera: VoxelModel = {
  id: 'sydney-opera',
  size: [46, 28, 32],
  build: (g) => {
    // vịnh + bờ đá phía sau
    g.box(0, 0, 0, 45, 0, 31, VP.waterDeep)
    g.box(0, 1, 0, 45, 1, 31, VP.water)
    g.box(3, 1, 3, 40, 3, 22, PODIUM_DARK)
    g.box(3, 4, 3, 40, 4, 22, PODIUM)
    g.box(0, 1, 0, 8, 2, 4, VP.grass)

    // mỗi cánh buồm: mép trái dựng đứng, mép phải nghiêng, dày dần về giữa
    const sail = (x0: number, z0: number, depth: number, len: number, h: number): void => {
      for (let y = 0; y <= h; y++) {
        const t = y / h
        const run = Math.max(1, Math.round(len * (1 - t ** 1.7)))
        for (let z = z0; z < z0 + depth; z++) {
          const edge = z === z0 || z === z0 + depth - 1
          for (let x = x0; x < x0 + run; x++) g.set(x, 5 + y, z, edge || (x + y) % 6 === 0 ? SHELL_RIB : SHELL)
        }
      }
    }
    // dãy lớn (phía sau) và dãy vừa (phía trước)
    sail(6, 6, 6, 8, 18)
    sail(13, 6, 6, 9, 15)
    sail(21, 6, 6, 10, 12)
    sail(29, 6, 6, 9, 9)
    sail(7, 14, 5, 7, 11)
    sail(14, 14, 5, 8, 9)
    sail(22, 14, 5, 8, 7)
    // kính ở phía mở của cánh
    for (const [x, z] of [
      [14, 12],
      [22, 12],
      [30, 12]
    ]) g.box(x, 5, z, x + 3, 8, z, VP.glass)

    // cầu cảng gỗ + thuyền buồm nhỏ
    g.box(41, 2, 14, 45, 2, 16, VP.wood)
    g.box(20, 1, 26, 28, 2, 27, VP.woodRed)
    g.box(24, 3, 26, 24, 11, 26, VP.woodDark)
    for (let y = 4; y <= 10; y++) g.box(25, y, 26, 25 + Math.max(0, 10 - y) / 2, y, 26, VP.white)
    for (const x of [1, 4, 7]) g.box(x, 5, 1, x, 6, 1, VP.leaf)
  }
}
