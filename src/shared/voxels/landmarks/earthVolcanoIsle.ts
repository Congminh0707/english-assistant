// Đảo núi lửa (Hành tinh hoang dã): núi lửa phun khói và dung nham, cọ, xương rồng và hoa tulip trên bãi cỏ.
// Vẽ cách điệu. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'
import { boulder, noise, palm, tree } from './scenery'

const LAVA = '#ff6a2b'
const LAVA_GLOW = '#ffb347'
const SMOKE = '#c9ccd4'
const SMOKE_DARK = '#9fa4b0'
const CACTUS = '#4fa05a'

export const earthVolcanoIsle: VoxelModel = {
  id: 'earth-volcano-isle',
  size: [44, 40, 32],
  build: (g) => {
    g.box(0, 0, 0, 43, 0, 31, VP.waterDeep)
    g.box(0, 1, 0, 43, 1, 31, VP.water)
    g.ellipsoid(22, 2, 14, 21, 2.5, 14, VP.sand)
    g.ellipsoid(22, 3, 14, 19, 2, 12, VP.grass)
    // núi lửa nón có miệng
    const cx = 20
    const cz = 9
    for (let y = 3; y <= 22; y++) {
      const t = (y - 3) / 19
      const r = 11 * (1 - t) + 3.2
      for (let z = 0; z < 24; z++)
        for (let x = 6; x < 36; x++) {
          const d = Math.hypot(x + 0.5 - cx, (z + 0.5 - cz) * 1.05)
          if (d > r) continue
          const c = d > r - 1.1 && noise(x, y, z) > 0.55 ? VP.stoneDark : x > cx + 2 ? '#52483f' : '#6b5d50'
          g.set(x, y, z, c)
        }
    }
    g.cylinder(cx, cz, 2.6, 22, 23, LAVA) // miệng núi
    g.cylinder(cx, cz, 1.6, 23, 23, LAVA_GLOW)
    // dòng dung nham chảy xuống sườn
    for (let k = 0; k < 14; k++) {
      const y = 22 - k
      const x = Math.round(cx + 1 + k * 0.45)
      const z = Math.round(cz + 4 + k * 0.7 * (y > 12 ? 1 : 1.2))
      for (const dx of [0, 1]) {
        if (g.get(x + dx, y, z) !== null) g.set(x + dx, y, z, k % 3 === 0 ? LAVA_GLOW : LAVA)
      }
    }
    // khói
    g.ellipsoid(cx, 26, cz, 3.4, 2.2, 2.6, SMOKE)
    g.ellipsoid(cx + 1, 30, cz + 1, 3, 2, 2.4, SMOKE_DARK)
    g.ellipsoid(cx + 3, 34, cz + 1, 3.4, 2.2, 2.8, SMOKE)
    // thực vật phía trước
    palm(g, 8, 4, 18, 9)
    palm(g, 33, 4, 20, 8)
    tree(g, 29, 4, 8, 5, 2.4)
    for (const [x, z] of [
      [15, 22],
      [24, 24]
    ]) {
      g.box(x, 4, z, x, 8, z, CACTUS)
      g.box(x - 2, 6, z, x - 1, 6, z, CACTUS)
      g.box(x - 2, 7, z, x - 2, 8, z, CACTUS)
      g.box(x + 1, 7, z, x + 2, 7, z, CACTUS)
      g.box(x + 2, 8, z, x + 2, 9, z, CACTUS)
    }
    const tulips = ['#e8432e', '#ffd34d', '#f08ac0', '#e8432e']
    tulips.forEach((c, i) => {
      const x = 12 + i * 2
      const z = 25 - (i % 2)
      g.box(x, 4, z, x, 5, z, VP.leaf)
      g.set(x, 6, z, c)
    })
    boulder(g, 30, 4, 22, 2)
  }
}
