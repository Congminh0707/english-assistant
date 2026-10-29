// Làng chài Phú Quốc: nhà sàn gỗ trên mặt nước, cầu tàu gỗ dài ra biển, thuyền thúng tròn và ghe đánh cá xanh,
// bãi cát trắng có dừa, biển xanh ngọc. Vẽ cách điệu. docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const SEA_DEEP = '#1c9fb0'
const SEA = '#3ec9c1'
const SEA_SHALLOW = '#8ee6d4'
const SAND = '#f8eec8'
const SAND_DARK = '#ecdca6'
const PLANK = '#b88655'
const THATCH = '#d6b25a'
const BLUE = '#2f6fbd'
const BASKET = '#b07a3c'
const BASKET_RIM = '#6b4423'

const hash = (x: number, y: number, z: number): number =>
  ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0
const shore = (x: number): number => 8 + Math.round(1.5 * Math.sin(x / 5))

function palm(g: VoxelGrid, x: number, z: number, y0: number, height: number): void {
  let tz = z
  for (let i = 0; i < height; i++) {
    tz = z + Math.round((i * i * 3) / (height * height))
    g.set(x, y0 + i, tz, i % 3 === 2 ? VP.woodDark : VP.wood)
  }
  const ty = y0 + height
  g.set(x, ty, tz, VP.leaf)
  const dirs: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1]
  ]
  const droop = [1, 1, 0, -1, -2]
  for (const [dx, dz] of dirs)
    for (let s = 1; s <= 4; s++)
      g.set(x + dx * s, ty + droop[s - 1], tz + dz * s, s % 2 === 0 ? VP.leafLight : VP.leaf)
  g.set(x, ty - 1, tz + 1, '#6b4a2a')
  g.set(x + 1, ty - 1, tz, '#6b4a2a')
}

/** Nhà sàn: sàn gỗ trên cọc, vách màu, cửa ở mặt +z, mái hai mái (nóc dọc trục x) */
function stiltHouse(
  g: VoxelGrid,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  wall: string,
  roof: string,
  trimRoof: string
): void {
  for (let x = x0; x <= x1; x += Math.max(2, Math.floor((x1 - x0) / 2)))
    for (const z of [z0, z1]) g.box(x, 0, z, x, 2, z, VP.woodDark)
  g.box(x0, 3, z0, x1, 3, z1, PLANK)
  for (let x = x0; x <= x1; x++) g.set(x, 3, z1, VP.wood) // mép sàn
  const wx0 = x0 + 1
  const wx1 = x1 - 1
  const wz0 = z0 + 1
  const wz1 = z1 - 1
  g.box(wx0, 4, wz0, wx1, 7, wz1, wall)
  for (let y = 5; y <= 7; y += 2) g.box(wx0, y, wz1, wx1, y, wz1, VP.woodDark) // đường vách ván (nhẹ)
  for (let y = 5; y <= 7; y += 2) g.box(wx1, y, wz0, wx1, y, wz1, VP.woodDark)
  const cx = Math.floor((wx0 + wx1) / 2)
  g.box(cx, 4, wz1, cx + 1, 6, wz1, VP.woodDark) // cửa
  g.box(wx0 + 1, 5, wz1, wx0 + 1, 6, wz1, VP.glass) // cửa sổ
  g.box(wx1 - 1, 5, wz1, wx1 - 1, 6, wz1, VP.glass)
  g.box(wx1, 5, wz0 + 1, wx1, 6, wz0 + 1, VP.glass)
  // mái
  g.gableRoof(x0 - 1, z0 - 1, x1 + 1, z1 + 1, 8, 'x', roof)
  const rz = Math.floor((z0 + z1) / 2)
  g.box(
    x0 - 1,
    8 + Math.floor((z1 - z0 + 2) / 2),
    rz,
    x1 + 1,
    8 + Math.floor((z1 - z0 + 2) / 2),
    rz,
    trimRoof
  )
}

/** Thuyền thúng: rổ tròn đan, vành nâu đậm, có mái chèo */
function basketBoat(g: VoxelGrid, cx: number, cz: number, withHat: boolean): void {
  const px = cx + 0.5
  const pz = cz + 0.5
  g.cylinder(px, pz, 2.2, 1, 1, '#8a5a2a')
  g.cylinder(px, pz, 3.2, 2, 2, BASKET)
  g.cylinder(px, pz, 3.7, 3, 3, BASKET_RIM)
  g.cylinder(px, pz, 2.6, 3, 3, null)
  g.cylinder(px, pz, 2.6, 2, 2, VP.woodDark)
  // đan ngang: vài ô sáng/tối trên thân rổ
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2
    const x = Math.round(px - 0.5 + Math.cos(t) * 3.2)
    const z = Math.round(pz - 0.5 + Math.sin(t) * 3.2)
    if (a % 2 === 0) g.set(x, 2, z, '#8a5a2a')
  }
  // mái chèo dựng nghiêng
  g.box(cx + 2, 3, cz - 2, cx + 2, 6, cz - 2, VP.wood)
  g.box(cx + 2, 7, cz - 2, cx + 2, 8, cz - 2, VP.woodDark)
  if (withHat) {
    g.box(cx, 3, cz, cx, 4, cz, '#c8322b')
    g.set(cx, 5, cz, '#e8b890')
    g.cylinder(px, pz, 2.6, 6, 6, '#efe3a8')
    g.cylinder(px, pz, 1.6, 7, 7, '#efe3a8')
    g.set(cx, 8, cz, '#d9c88a')
  } else {
    // lưới cuộn trong rổ
    g.cylinder(px, pz, 1.8, 3, 3, '#3b8ea5')
    g.set(cx, 4, cz, '#6dc4d6')
  }
}

/** Ghe đánh cá xanh: thân xanh dương, vạch trắng, cabin trắng ở lái, cột cờ đỏ, lưới ở mũi */
function fishingBoat(g: VoxelGrid, x0: number, zc: number, len: number): void {
  for (let i = 0; i < len; i++) {
    const x = x0 + i
    const hw = Math.min(3, len - 1 - i, i + 2)
    for (let dz = -hw; dz <= hw; dz++) {
      const edge = Math.abs(dz) === hw
      g.set(x, 1, zc + dz, edge ? VP.lacquer : VP.woodDark)
      g.set(x, 2, zc + dz, edge ? BLUE : VP.wood)
      if (edge) g.set(x, 3, zc + dz, VP.white)
    }
  }
  g.box(x0 + len - 1, 2, zc, x0 + len - 1, 5, zc, BLUE)
  g.box(x0 + len - 2, 3, zc - 1, x0 + len - 2, 4, zc + 1, BLUE)
  g.box(x0, 3, zc - 1, x0, 4, zc + 1, BLUE)
  // đôi mắt ở mũi
  const xe = x0 + len - 5
  for (const dz of [-3, 3]) {
    g.box(xe - 1, 2, zc + dz, xe, 3, zc + dz, VP.white)
    g.set(xe, 2, zc + dz, VP.iron)
  }
  // cabin trắng, mái xanh, cửa sổ kính
  g.box(x0 + 1, 3, zc - 2, x0 + 5, 7, zc + 2, VP.white)
  g.box(x0 + 5, 4, zc - 1, x0 + 5, 6, zc + 1, VP.glass)
  g.box(x0 + 2, 5, zc + 2, x0 + 4, 6, zc + 2, VP.glass)
  g.box(x0 + 3, 3, zc + 2, x0 + 3, 4, zc + 2, VP.woodDark)
  g.box(x0, 8, zc - 3, x0 + 6, 8, zc + 3, BLUE)
  // cột buồm + cờ đỏ sao vàng
  g.box(x0 + 9, 3, zc, x0 + 9, 14, zc, VP.woodDark)
  g.box(x0 + 10, 12, zc, x0 + 12, 13, zc, VP.lacquer)
  g.set(x0 + 11, 12, zc, VP.gold)
  // chằng dây từ cột xuống hai mạn
  for (let k = 0; k < 4; k++) {
    g.set(x0 + 9, 10 - k * 2, zc + 1 + Math.floor(k / 2), '#e4dcc0')
  }
  // lưới và phao ở mũi
  g.box(x0 + 10, 3, zc - 2, x0 + 13, 4, zc + 2, '#3b8ea5')
  for (let z = zc - 2; z <= zc + 2; z += 2) g.set(x0 + 11, 5, z, VP.lanternGlow)
}

export const phuquocFishingVillage: VoxelModel = {
  id: 'phuquoc-fishing-village',
  size: [46, 22, 36],
  build: (g) => {
    // Bãi cát phía sau, mép lượn; biển phía trước, nước nông sáng gần bờ
    for (let x = 0; x < 46; x++)
      for (let z = 0; z < 36; z++) {
        const s = shore(x)
        if (z <= s) {
          g.box(x, 0, z, x, 1, z, SAND_DARK)
          g.set(x, 2, z, hash(x, 2, z) % 9 === 0 ? SAND_DARK : SAND)
        } else {
          g.set(x, 0, z, SEA_DEEP)
          g.set(x, 1, z, z - s <= 2 ? SEA_SHALLOW : hash(x, 1, z) % 13 === 0 ? SEA_SHALLOW : SEA)
        }
      }
    // bọt sóng ở mép nước
    for (let x = 0; x < 46; x++) if (hash(x, 5, 1) % 3 !== 0) g.set(x, 1, shore(x) + 1, VP.white)
    // dải cỏ bụi phía sau bãi
    for (let x = 0; x < 46; x++) {
      g.box(x, 2, 0, x, 2, 1, VP.grassDark)
      if (hash(x, 7, 0) % 3 === 0) g.box(x, 3, 0, x, 3, 1, VP.leaf)
    }

    // Dừa trên bãi
    palm(g, 5, 4, 3, 12)
    palm(g, 14, 2, 3, 10)
    palm(g, 30, 5, 3, 13)
    palm(g, 40, 3, 3, 11)
    palm(g, 44, 7, 3, 9)

    // Giàn phơi lưới trên bãi
    for (const x of [26, 36]) g.box(x, 3, 8, x, 8, 8, VP.woodDark)
    for (let x = 27; x <= 35; x++)
      for (let y = 5; y <= 7; y++) if ((x + y) % 2 === 0) g.set(x, y, 8, '#3b8ea5')
    g.box(26, 8, 8, 36, 8, 8, VP.wood)

    // Cầu tàu gỗ dài ra biển (x 20..22) + sàn cuối cầu
    for (let z = shore(21); z <= 34; z++) {
      for (let x = 20; x <= 22; x++) g.set(x, 3, z, z % 2 === 0 ? PLANK : VP.wood)
      if (z > shore(21) + 1 && z % 4 === 0)
        for (const x of [20, 22]) g.box(x, 0, z, x, 2, z, VP.woodDark)
    }
    g.box(18, 3, 31, 24, 3, 34, PLANK)
    for (const [x, z] of [
      [18, 31],
      [24, 31],
      [18, 34],
      [24, 34]
    ])
      g.box(x, 0, z, x, 2, z, VP.woodDark)
    // cọc đèn và thùng cá ở cuối cầu
    g.box(24, 4, 34, 24, 8, 34, VP.woodDark)
    g.set(24, 9, 34, VP.lanternGlow)
    g.box(18, 4, 33, 19, 5, 34, VP.wood)
    g.box(18, 5, 33, 19, 5, 34, '#6dc4d6')

    // Nhà sàn 1 (mái lá), nhà sàn 2 (tường xanh, mái ngói), nhà sàn 3 nhỏ (hồng, mái lá)
    stiltHouse(g, 5, 13, 13, 19, '#c99a62', THATCH, '#b8923f')
    stiltHouse(g, 27, 12, 36, 18, '#7fb4d1', '#c4553a', VP.tileDark)
    stiltHouse(g, 8, 23, 13, 27, '#e8a8a0', THATCH, '#b8923f')
    // lối đi ván nối cầu tàu với các nhà
    g.box(14, 3, 15, 19, 3, 16, PLANK)
    g.box(23, 3, 14, 26, 3, 15, PLANK)
    g.box(10, 3, 20, 11, 3, 22, PLANK)
    for (const x of [15, 17, 24])
      for (const z of x === 24 ? [14] : [15]) g.box(x, 0, z, x, 2, z, VP.woodDark)

    // Thuyền thúng
    basketBoat(g, 12, 31, true)
    basketBoat(g, 6, 27, false)
    basketBoat(g, 38, 21, true)
    basketBoat(g, 26, 25, false)

    // Ghe đánh cá xanh ở phía trước bên phải
    fishingBoat(g, 28, 29, 15)
  }
}
