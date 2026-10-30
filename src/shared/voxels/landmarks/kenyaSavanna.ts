// Thảo nguyên Kê-ni-a: cây keo tán phẳng, núi Kilimanjaro tuyết phía xa, một chú voi và hươu cao cổ.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'
import { boulder, noise } from './scenery'

const SAVANNA = '#d8c46a'
const SAVANNA_DARK = '#b8a24e'
const ELEPHANT = '#8e939c'
const ELEPHANT_DARK = '#6e737c'
const GIRAFFE = '#e8b84a'
const SPOT = '#9a5a2a'

function acacia(g: VoxelGrid, x: number, z: number, h: number): void {
  for (let y = 3; y < 3 + h; y++) g.set(x + (y > 3 + h / 2 ? 1 : 0), y, z, VP.woodDark)
  const top = 3 + h
  g.ellipsoid(x + 1.5, top + 1, z + 0.5, 6.5, 1.6, 4.2, VP.leaf)
  g.ellipsoid(x + 1.5, top + 2, z + 0.5, 5, 1, 3, VP.leafLight)
}

export const kenyaSavanna: VoxelModel = {
  id: 'kenya-savanna',
  size: [44, 34, 32],
  build: (g) => {
    g.box(0, 0, 0, 43, 1, 31, VP.soil)
    g.box(0, 2, 0, 43, 2, 31, SAVANNA)
    for (let i = 0; i < 120; i++) {
      const x = Math.floor(noise(i, 1, 1) * 44)
      const z = Math.floor(noise(i, 2, 1) * 32)
      g.set(x, 2, z, noise(i, 3, 1) > 0.5 ? SAVANNA_DARK : VP.grassDark)
    }
    // núi xa có tuyết
    for (let y = 3; y <= 18; y++) {
      const r = 12 * (1 - (y - 3) / 16) + 0.5
      for (let z = 0; z < 8; z++)
        for (let x = 0; x < 44; x++) {
          if (Math.hypot(x + 0.5 - 12, (z + 0.5 - 2) * 1.5) > r) continue
          g.set(x, y, z, y > 14 ? VP.white : y > 9 ? '#7f8aa6' : '#6a7f6a')
        }
    }
    acacia(g, 30, 14, 12)
    acacia(g, 6, 20, 8)
    // voi
    const ex = 14
    const ez = 22
    g.box(ex, 5, ez, ex + 8, 11, ez + 4, ELEPHANT)
    g.box(ex, 5, ez, ex + 8, 6, ez + 4, ELEPHANT_DARK)
    for (const [dx, dz] of [
      [0, 0],
      [6, 0],
      [0, 3],
      [6, 3]
    ]) g.box(ex + dx, 3, ez + dz, ex + dx + 1, 5, ez + dz + 1, ELEPHANT_DARK)
    g.box(ex + 8, 8, ez, ex + 11, 12, ez + 4, ELEPHANT) // đầu
    g.box(ex + 11, 4, ez + 1, ex + 12, 10, ez + 2, ELEPHANT_DARK) // vòi
    g.box(ex + 10, 7, ez + 5, ex + 11, 10, ez + 5, ELEPHANT_DARK) // tai
    g.set(ex + 11, 9, ez + 3, VP.white)
    g.set(ex + 12, 9, ez + 3, VP.white) // ngà
    // hươu cao cổ
    const gx = 37
    const gz = 24
    g.box(gx, 8, gz, gx + 4, 11, gz + 2, GIRAFFE)
    for (const [dx, dz] of [
      [0, 0],
      [3, 0],
      [0, 2],
      [3, 2]
    ]) g.box(gx + dx, 3, gz + dz, gx + dx, 7, gz + dz, GIRAFFE)
    g.box(gx + 4, 12, gz + 1, gx + 4, 19, gz + 1, GIRAFFE) // cổ
    g.box(gx + 4, 19, gz, gx + 6, 21, gz + 2, GIRAFFE)
    g.set(gx + 5, 22, gz + 1, SPOT)
    for (const [dx, dy] of [
      [1, 9],
      [3, 10],
      [4, 14],
      [4, 17]
    ]) g.set(gx + dx, dy, gz, SPOT)
    boulder(g, 38, 3, 8, 2)
    boulder(g, 3, 3, 8, 2)
  }
}
