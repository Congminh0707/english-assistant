// Chợ nổi Cái Răng (Cần Thơ): sông Hậu nước phù sa nâu, vài chiếc ghe gỗ mũi vẽ đôi mắt chất đầy trái cây
// (chuối, dưa hấu, dứa, cam), mỗi ghe có cây bẹo – cột tre cao treo mẫu hàng để rao; bờ sông có dừa nước, người bán
// đội nón lá. Vẽ cách điệu. docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const RIVER = '#9a7344'
const RIVER_TOP = '#ad8650'
const RIVER_GLINT = '#cfae78'
const BAMBOO = '#d1bb62'
const BAMBOO_RING = '#8f7a35'
const HAT = '#efe3a8'
const SKIN = '#e8b890'

const hash = (x: number, y: number, z: number): number =>
  ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0

/** Dừa nước: thân hơi nghiêng về phía người xem, tàu lá rủ xuống */
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
  for (const [dx, dz] of dirs) {
    const droop = [1, 1, 0, -1, -2]
    for (let s = 1; s <= 4; s++)
      g.set(x + dx * s, ty + droop[s - 1], tz + dz * s, s % 2 === 0 ? VP.leafLight : VP.leaf)
  }
  g.set(x, ty - 1, tz + 1, '#6b4a2a') // quả dừa
  g.set(x + 1, ty - 1, tz, '#6b4a2a')
}

/** Đống trái cây hình mô đất, rải màu theo mã băm để trông tự nhiên */
function pile(
  g: VoxelGrid,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  height: number,
  colors: [string, string, string]
): void {
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const rx = (x1 - x0) / 2 + 0.8
  const rz = (z1 - z0) / 2 + 0.8
  for (let z = z0; z <= z1; z++)
    for (let x = x0; x <= x1; x++) {
      const d = Math.min(1, ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2)
      const hh = Math.max(1, Math.round(height * Math.sqrt(1 - d)))
      for (let k = 0; k < hh; k++) {
        const r = hash(x, 3 + k, z) % 10
        g.set(x, 3 + k, z, r < 5 ? colors[0] : r < 8 ? colors[1] : colors[2])
      }
    }
}

/** Dưa hấu: quả tròn xanh sọc, một quả bổ lộ ruột đỏ */
function watermelons(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number): void {
  for (let z = z0; z <= z1; z += 2)
    for (let x = x0; x <= x1; x += 2) {
      const stripe = ((x + z) / 2) % 2 === 0
      g.box(x, 3, z, x + 1, 4, z + 1, stripe ? '#2e8b4a' : '#1f6b38')
    }
  for (let z = z0 + 1; z <= z1 - 1; z += 2)
    for (let x = x0 + 1; x <= x1 - 1; x += 2)
      g.box(x, 5, z, x + 1, 6, z + 1, (x + z) % 3 === 0 ? '#e0364a' : '#2e8b4a')
}

/** Dứa: thân vàng cam, ngọn lá xanh nhọn */
function pineapples(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number): void {
  for (let z = z0; z <= z1; z += 2)
    for (let x = x0; x <= x1; x += 2) {
      g.box(x, 3, z, x, 5, z, '#e8a31c')
      g.box(x, 3, z + 1, x, 5, z + 1, '#f0c040')
      g.set(x, 6, z, VP.leaf)
      g.set(x, 7, z, VP.leafLight)
    }
}

/** Cây bẹo: cột tre cao, ngọn có thanh ngang treo các dây có mẫu trái cây */
function beo(
  g: VoxelGrid,
  x: number,
  z: number,
  y0: number,
  height: number,
  fruits: [string, string, string]
): void {
  for (let i = 0; i < height; i++) g.set(x, y0 + i, z, i % 4 === 3 ? BAMBOO_RING : BAMBOO)
  const top = y0 + height
  g.box(x, top, z - 2, x, top, z + 2, BAMBOO)
  g.set(x, top + 1, z, BAMBOO)
  ;[z - 2, z, z + 2].forEach((zz, i) => {
    const len = 2 + (i % 2) * 2
    for (let k = 1; k <= len; k++) g.set(x, top - k, zz, '#e4dcc0')
    g.box(x, top - len - 2, zz, x + 1, top - len - 1, zz, fruits[i])
  })
}

/** Người bán đội nón lá ngồi trong ghe */
function seller(g: VoxelGrid, x: number, z: number, shirt: string): void {
  g.box(x, 3, z, x, 4, z, shirt)
  g.set(x, 5, z, SKIN)
  g.cylinder(x + 0.5, z + 0.5, 2.6, 6, 6, HAT)
  g.cylinder(x + 0.5, z + 0.5, 1.6, 7, 7, HAT)
  g.set(x, 8, z, '#d9c88a')
}

interface Boat {
  x0: number
  z: number
  len: number
  hull: string
  trim: string
}

/** Ghe gỗ dài, mũi nhọn ở +x, rộng 7 ô; hai bên mũi vẽ đôi mắt */
function boatHull(g: VoxelGrid, b: Boat): void {
  const { x0, z, len, hull, trim } = b
  for (let i = 0; i < len; i++) {
    const x = x0 + i
    const hw = Math.min(3, len - 1 - i, i + 2)
    for (let dz = -hw; dz <= hw; dz++) {
      const edge = Math.abs(dz) === hw
      g.set(x, 1, z + dz, edge ? trim : VP.woodDark)
      g.set(x, 2, z + dz, edge ? hull : VP.wood)
      if (edge) {
        g.set(x, 3, z + dz, hull)
        g.set(x, 4, z + dz, trim)
      }
    }
  }
  // mũi và đuôi cong vút lên
  g.box(x0 + len - 1, 2, z, x0 + len - 1, 5, z, hull)
  g.box(x0 + len - 2, 3, z - 1, x0 + len - 2, 4, z + 1, hull)
  g.box(x0, 3, z - 1, x0, 4, z + 1, hull)
  // đôi mắt: lòng trắng 2×2, con ngươi đen
  const xe = x0 + len - 5
  for (const dz of [-3, 3]) {
    g.box(xe - 1, 2, z + dz, xe, 3, z + dz, VP.white)
    g.set(xe, 2, z + dz, VP.iron)
    g.set(xe, 3, z + dz, VP.iron)
  }
}

const BOATS: Array<
  Boat & {
    pole: number
    poleH: number
    fruits: [string, string, string]
    pileA: (g: VoxelGrid, x: number, z: number) => void
    pileB: (g: VoxelGrid, x: number, z: number) => void
    shirt: string
  }
> = [
  {
    x0: 2,
    z: 11,
    len: 16,
    hull: '#2f7fb8',
    trim: '#e8b830',
    pole: 8,
    poleH: 15,
    fruits: ['#f4d03f', '#2e8b4a', '#e8a31c'],
    pileA: (g, x, z) => pile(g, x + 3, z - 2, x + 7, z + 2, 3, ['#f4d03f', '#c9a227', '#8bc34a']),
    pileB: (g, x, z) => watermelons(g, x + 9, z - 2, x + 12, z + 2),
    shirt: '#c8322b'
  },
  {
    x0: 23,
    z: 16,
    len: 15,
    hull: '#3f9a6a',
    trim: '#fbfbf6',
    pole: 8,
    poleH: 17,
    fruits: ['#e8a31c', '#e0364a', '#f4d03f'],
    pileA: (g, x, z) => pineapples(g, x + 3, z - 2, x + 6, z + 1),
    pileB: (g, x, z) => pile(g, x + 8, z - 2, x + 11, z + 2, 3, ['#f28c28', '#f4d03f', '#8bc34a']),
    shirt: '#2f7fb8'
  },
  {
    x0: 4,
    z: 24,
    len: 17,
    hull: '#c8322b',
    trim: '#e8b830',
    pole: 9,
    poleH: 14,
    fruits: ['#e0364a', '#f28c28', '#e0407e'],
    pileA: (g, x, z) => watermelons(g, x + 3, z - 2, x + 6, z + 2),
    pileB: (g, x, z) => pile(g, x + 8, z - 2, x + 12, z + 2, 3, ['#e0407e', '#f28c28', '#f4d03f']),
    shirt: '#f2c94c'
  },
  {
    x0: 26,
    z: 29,
    len: 15,
    hull: '#e8b830',
    trim: '#2f7fb8',
    pole: 8,
    poleH: 16,
    fruits: ['#f4d03f', '#e8a31c', '#2e8b4a'],
    pileA: (g, x, z) => pile(g, x + 3, z - 2, x + 6, z + 2, 3, ['#f4d03f', '#c9a227', '#8bc34a']),
    pileB: (g, x, z) => pineapples(g, x + 8, z - 2, x + 11, z + 1),
    shirt: '#3f9a6a'
  }
]

export const canthoFloatingMarket: VoxelModel = {
  id: 'cantho-floating-market',
  size: [46, 26, 34],
  build: (g) => {
    // Sông phù sa nâu, lấp lánh vài chỗ
    g.box(0, 0, 0, 45, 0, 33, RIVER)
    g.box(0, 1, 0, 45, 1, 33, RIVER_TOP)
    for (let z = 6; z < 34; z++)
      for (let x = 0; x < 46; x++)
        if (hash(x >> 2, 1, z) % 9 === 0 && x % 4 !== 3) g.set(x, 1, z, RIVER_GLINT) // gợn sóng ngang

    // Bờ sông phía xa: đất + cỏ, mép lượn sóng
    for (let x = 0; x < 46; x++) {
      const bz = 4 + Math.round(1.4 * Math.sin(x / 5))
      g.box(x, 0, 0, x, 2, bz, '#6b4a2f')
      g.box(x, 3, 0, x, 3, bz, x % 7 === 3 ? VP.grassDark : VP.grass)
    }

    // Quán nhỏ trên bờ (góc phải sau), mái lá
    g.box(36, 4, 0, 43, 4, 5, VP.wood)
    g.box(37, 5, 1, 42, 7, 4, VP.plaster)
    g.box(39, 5, 4, 40, 6, 4, VP.woodDark)
    g.box(37, 6, 4, 38, 6, 4, VP.glass)
    g.box(41, 6, 4, 42, 6, 4, VP.glass)
    g.gableRoof(35, 0, 44, 5, 8, 'x', '#d9b45b')

    // Dừa nước trên bờ
    palm(g, 3, 2, 4, 13)
    palm(g, 14, 1, 4, 11)
    palm(g, 26, 2, 4, 14)
    palm(g, 33, 1, 4, 10)

    // Ghe, trái cây, người bán, cây bẹo
    for (const b of BOATS) {
      boatHull(g, b)
      b.pileA(g, b.x0, b.z)
      b.pileB(g, b.x0, b.z)
      seller(g, b.x0 + 1, b.z, b.shirt)
      beo(g, b.x0 + b.pole, b.z - 3, 4, b.poleH, b.fruits)
    }
  }
}
