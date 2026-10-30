// Băng giá & bầu trời: tảng băng nổi với lều tuyết (igloo), chim cánh cụt, người tuyết, cờ nhỏ và tàu vũ trụ đang chờ bay.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'
import { noise } from './scenery'

const ICE = '#e6f4fb'
const ICE_SHADE = '#b9dcec'
const ICE_DEEP = '#8cc2dc'
const SNOW = '#fbfdff'
const PENGUIN = '#2f3a52'

export const earthPolar: VoxelModel = {
  id: 'earth-polar',
  size: [44, 40, 32],
  build: (g) => {
    g.box(0, 0, 0, 43, 0, 31, '#2f78ad')
    g.box(0, 1, 0, 43, 1, 31, VP.water)
    for (let i = 0; i < 24; i++) g.set(Math.floor(noise(i, 1, 6) * 44), 1, Math.floor(noise(i, 2, 6) * 32), '#d6eefb')
    // tảng băng: thân xanh băng, mặt tuyết trắng
    g.ellipsoid(22, 2, 15, 19, 3.2, 12, ICE_DEEP)
    g.ellipsoid(22, 4, 15, 18, 2.6, 11, ICE_SHADE)
    g.ellipsoid(22, 5.2, 15, 17, 1.6, 10, SNOW)
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(noise(i, 4, 6) * 44)
      const z = Math.floor(noise(i, 5, 6) * 32)
      if (g.get(x, 5, z) === SNOW && noise(i, 6, 6) > 0.5) g.set(x, 5, z, ICE)
    }
    // igloo
    g.fill((x, y, z) => ((x - 12) / 6) ** 2 + ((y - 6) / 5.4) ** 2 + ((z - 9) / 6) ** 2 <= 1, SNOW, [5, 6, 2, 19, 13, 16])
    g.fill((x, y, z) => ((x - 12) / 4.6) ** 2 + ((y - 6) / 4) ** 2 + ((z - 9) / 4.6) ** 2 <= 1, null, [5, 6, 2, 19, 13, 16])
    g.box(11, 6, 14, 13, 8, 15, ICE_SHADE)
    g.box(11, 6, 15, 13, 7, 15, VP.iron)
    for (let y = 7; y < 12; y += 2) g.box(5, y, 9, 18, y, 9, null)
    // người tuyết
    g.ellipsoid(31, 8, 9, 3, 2.6, 3, SNOW)
    g.ellipsoid(31, 12, 9, 2.2, 2.2, 2.2, SNOW)
    g.set(31, 12, 12, VP.lantern)
    g.box(29, 11, 11, 33, 11, 11, VP.lacquer) // khăn
    g.set(30, 13, 11, VP.iron)
    g.set(32, 13, 11, VP.iron)
    g.box(30, 15, 8, 32, 15, 10, VP.iron) // mũ
    g.box(31, 16, 9, 31, 17, 9, VP.iron)
    // chim cánh cụt
    for (const [x, z] of [
      [17, 20],
      [22, 22],
      [27, 19]
    ]) {
      g.box(x, 6, z, x + 1, 10, z + 1, PENGUIN)
      g.box(x, 7, z + 1, x + 1, 9, z + 1, VP.white)
      g.set(x, 11, z, PENGUIN)
      g.set(x + 1, 11, z, PENGUIN)
      g.set(x, 11, z + 1, VP.gold)
      g.box(x, 5, z, x + 1, 5, z + 1, VP.gold)
    }
    // cờ cắm trên băng
    g.box(36, 6, 20, 36, 14, 20, VP.woodDark)
    g.box(37, 12, 20, 40, 14, 20, VP.lacquer)
    // tàu vũ trụ
    const rx = 36
    const rz = 6
    g.cylinder(rx, rz, 2.2, 6, 17, VP.white)
    g.cylinder(rx, rz, 1.4, 18, 20, VP.white)
    g.cylinder(rx, rz, 0.8, 21, 22, VP.lacquer)
    g.cylinder(rx, rz, 2.4, 14, 15, VP.lacquer)
    g.box(rx, 11, rz + 2, rx + 1, 12, rz + 2, VP.glass)
    for (const [dx, dz] of [
      [-3, 0],
      [3, 0],
      [0, -3],
      [0, 3]
    ]) g.box(rx + dx, 6, rz + dz, rx + dx, 9, rz + dz, VP.lacquer)
  }
}
