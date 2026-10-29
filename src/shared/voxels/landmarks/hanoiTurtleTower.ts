// Tháp Rùa (Hà Nội): tháp ba tầng nhỏ nhắn rêu phong trên cù lao giữa Hồ Gươm, cây liễu rủ bên cạnh,
// phía trước có cầu Thê Húc sơn đỏ cong nhẹ. Vẽ cách điệu, trang trọng. docs/19-kids-world.md §2.1
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'

const WALL = '#d9c99c' // vữa cũ ngả vàng
const WALL_DARK = '#bfae82' // vệt rêu, bóng
const OPENING = '#5a4a3a'
const LILY = '#5fae48'
const FOAM = '#d7efff'

/** Nhiễu giả ngẫu nhiên cố định theo toạ độ, trong [0, 1) */
function noise(x: number, y: number, z: number): number {
  let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(z + 7, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1103515245)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

export const hanoiTurtleTower: VoxelModel = {
  id: 'hanoi-turtle-tower',
  size: [40, 30, 32],
  build: (g) => {
    // Mặt hồ
    g.box(0, 0, 0, 39, 0, 31, VP.waterDeep)
    g.box(0, 1, 0, 39, 1, 31, VP.water)
    // Bọt nước lăn tăn
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(noise(i, 1, 2) * 40)
      const z = Math.floor(noise(i, 3, 4) * 32)
      if (noise(x, 5, z) > 0.45) g.set(x, 1, z, FOAM)
    }
    // Vài lá sen nổi
    for (const [x, z] of [
      [3, 12],
      [4, 13],
      [30, 6],
      [31, 6],
      [34, 14]
    ])
      g.set(x, 1, z, LILY)

    // Cù lao: đất + cỏ, mép đá
    g.cylinder(18.5, 14.5, 9, 2, 2, VP.stoneDark)
    g.cylinder(18.5, 14.5, 8.2, 3, 3, VP.soil)
    g.cylinder(18.5, 14.5, 7.4, 4, 4, VP.grass)
    g.cylinder(18.5, 14.5, 9.4, 1, 1, VP.stone)

    // Thân tháp ba tầng thu nhỏ dần (rộng 7, 5, 3), mái lá/ngói cong bao quanh từng tầng
    const floors: Array<{ half: number; y0: number; y1: number }> = [
      { half: 3, y0: 5, y1: 10 },
      { half: 2, y0: 12, y1: 16 },
      { half: 1, y0: 18, y1: 21 }
    ]
    const cx = 18
    const cz = 14
    // nền tháp
    g.box(cx - 4, 4, cz - 4, cx + 4, 4, cz + 4, VP.stoneDark)
    for (const { half, y0, y1 } of floors) {
      for (let y = y0; y <= y1; y++)
        for (let z = cz - half; z <= cz + half; z++)
          for (let x = cx - half; x <= cx + half; x++)
            g.set(x, y, z, noise(x, y, z) > 0.84 ? WALL_DARK : WALL)
      // gờ mái (đầu đao nhô ra) ngay trên mỗi tầng
      g.box(cx - half - 1, y1 + 1, cz - half - 1, cx + half + 1, y1 + 1, cz + half + 1, VP.tile)
      g.box(cx - half, y1 + 1, cz - half, cx + half, y1 + 1, cz + half, VP.tileDark)
      for (const [dx, dz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ])
        g.set(cx + dx * (half + 1), y1 + 2, cz + dz * (half + 1), VP.tile) // đầu đao cong lên
    }
    // Cửa vòm (mặt +z và +x) và cửa sổ
    const arch = (axis: 'z' | 'x', half: number, y0: number, h: number, width: number): void => {
      for (let w = -width; w <= width; w++) {
        const top = y0 + h - (Math.abs(w) === width && width > 0 ? 1 : 0)
        for (let y = y0; y < top; y++) {
          if (axis === 'z') g.set(cx + w, y, cz + half, OPENING)
          else g.set(cx + half, y, cz + w, OPENING)
        }
      }
    }
    arch('z', 3, 5, 5, 1)
    arch('x', 3, 5, 5, 1)
    arch('z', 2, 12, 4, 0)
    arch('x', 2, 12, 4, 0)
    arch('z', 1, 18, 3, 0)
    arch('x', 1, 18, 3, 0)
    // Mái đỉnh bốn mái + nhụy vàng
    const roofTop = g.hipRoof(cx - 2, cz - 2, cx + 2, cz + 2, 23, VP.tile)
    g.box(cx, roofTop + 1, cz, cx, roofTop + 2, cz, VP.gold)

    // Cây liễu bên trái cù lao: thân + tán + cành rủ
    g.box(12, 4, 18, 12, 9, 18, VP.woodDark)
    g.box(13, 8, 18, 13, 9, 18, VP.woodDark)
    g.ellipsoid(12.5, 12, 18.5, 4.2, 2.6, 4.2, VP.leaf)
    g.ellipsoid(12.5, 13, 18.5, 2.8, 1.6, 2.8, VP.leafLight)
    for (let a = 0; a < 14; a++) {
      const ang = (a / 14) * Math.PI * 2
      const x = Math.round(12.5 + Math.cos(ang) * 4.3)
      const z = Math.round(18.5 + Math.sin(ang) * 4.3)
      const len = 3 + Math.floor(noise(a, 9, 9) * 4)
      g.box(x, 11 - len, z, x, 10, z, VP.leafLight)
    }
    // Bụi cỏ và đá nhỏ quanh bờ
    for (const [x, z] of [
      [25, 17],
      [24, 20],
      [14, 21]
    ])
      g.box(x, 5, z, x, 5, z, VP.leaf)

    // Cầu Thê Húc: mặt cầu cong sơn đỏ, lan can, hai bờ nhỏ
    g.box(3, 2, 24, 9, 2, 31, VP.soil)
    g.box(3, 3, 24, 9, 3, 31, VP.grass)
    g.box(32, 2, 24, 38, 2, 31, VP.soil)
    g.box(32, 3, 24, 38, 3, 31, VP.grass)
    const deck = (x: number): number => 4 + Math.round(2.4 * Math.sin(((x - 8) / 25) * Math.PI))
    for (let x = 8; x <= 33; x++) {
      const y = deck(x)
      g.box(x, y - 1, 27, x, y, 29, VP.woodRed)
      g.box(x, y, 28, x, y, 28, VP.wood) // lòng cầu
    }
    for (let x = 8; x <= 33; x += 5) {
      const y = deck(x)
      for (const z of [27, 29]) g.box(x, y + 1, z, x, y + 3, z, VP.lacquer)
    }
    for (let x = 8; x <= 33; x++) {
      const y = deck(x)
      for (const z of [27, 29]) g.set(x, y + 1, z, VP.lacquer)
    }
    // cột đỡ dưới nước ở hai chân cầu
    for (const x of [10, 31])
      for (const z of [27, 29]) g.box(x, 1, z, x, deck(x) - 2, z, VP.woodDark)
    // đèn lồng đỏ ở hai đầu cầu
    for (const x of [8, 33]) {
      g.box(x, deck(x) + 4, 27, x, deck(x) + 5, 27, VP.lantern)
      g.set(x, deck(x) + 6, 27, VP.gold)
    }
  }
}
