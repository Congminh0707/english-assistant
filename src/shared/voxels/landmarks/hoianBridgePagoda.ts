// Chùa Cầu (Hội An) — vẽ ở độ phân giải ×2 (88 × 56 × 48) để nhìn gần vẫn đủ chi tiết: cầu đá vòm bắc qua lạch, hành lang
// gỗ có mái ngói âm dương uốn theo thân cầu, gian chùa ở giữa mái hai tầng đầu đao cong, cột lim sơn đỏ, lan can chấn
// song, đèn lồng, bậc đá hai đầu, nhà ven sông, liễu rủ và thuyền nan. Vẽ cách điệu, trang trọng (nơi thờ tự).
// docs/19-kids-world.md §2.2, §5.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'
import { noise } from './scenery'

const W = 88
const H = 56
const D = 48
const WATER_TOP = 2
const BANK_TOP = 8
const Z0 = 12 // thân cầu từ z = Z0 … Z1
const Z1 = 31
const MID = 44

const STONE_LIGHT = '#cfc8b8'
const STONE_MOSS = '#8aa070'
const ROOF_A = '#8b5a46'
const ROOF_B = '#6b4234'
const ROOF_RIDGE = '#4a2e26'
const WALL = '#f3c64a'
const WALL_SHADE = '#e0b038'
const WOOD_LIGHT = '#a8703e'
const PAPER = '#fff3d0'

/** Độ cao sàn cầu: võng nhẹ lên giữa (cầu cong) */
const deck = (x: number): number =>
  BANK_TOP + Math.round(5 * Math.sin(((Math.min(80, Math.max(8, x)) - 8) / 72) * Math.PI))

function willow(g: VoxelGrid, x: number, z: number, h: number): void {
  g.box(x, BANK_TOP, z, x + 1, BANK_TOP + h, z + 1, VP.woodDark)
  g.ellipsoid(x + 1, BANK_TOP + h + 1, z + 1, 5.5, 2.6, 5.5, VP.leaf)
  g.ellipsoid(x + 1.6, BANK_TOP + h + 2.2, z + 1.2, 3.4, 1.6, 3.4, VP.leafLight)
  // cành rủ
  for (let a = 0; a < 14; a++) {
    const ang = (a / 14) * Math.PI * 2
    const px = Math.round(x + 1 + Math.cos(ang) * 5.2)
    const pz = Math.round(z + 1 + Math.sin(ang) * 5.2)
    const len = 4 + Math.floor(noise(a, 3, x) * 5)
    for (let k = 0; k < len; k++)
      g.set(px, BANK_TOP + h - k, pz, k % 3 === 2 ? VP.leafLight : VP.leaf)
  }
}

function house(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number): void {
  g.box(x0, BANK_TOP, z0, x1, BANK_TOP + 7, z1, VP.plaster)
  g.box(x0, BANK_TOP, z1, x1, BANK_TOP, z1, STONE_LIGHT)
  for (let x = x0 + 2; x < x1 - 1; x += 4) {
    g.box(x, BANK_TOP + 3, z1, x + 1, BANK_TOP + 5, z1, VP.woodDark) // cửa sổ
    g.box(x, BANK_TOP + 5, z1, x + 1, BANK_TOP + 5, z1, WOOD_LIGHT)
  }
  const top = g.gableRoof(x0 - 1, z0 - 1, x1 + 1, z1 + 1, BANK_TOP + 8, 'x', VP.tile)
  g.box(x0 - 1, top, (z0 + z1) >> 1, x1 + 1, top, (z0 + z1) >> 1, ROOF_RIDGE)
}

export const hoianBridgePagoda: VoxelModel = {
  id: 'hoian-bridge-pagoda',
  size: [W, H, D],
  build: (g) => {
    // --- Lạch nước + hai bờ kè đá ---
    g.box(0, 0, 0, W - 1, 0, D - 1, VP.waterDeep)
    g.box(0, 1, 0, W - 1, WATER_TOP - 1, D - 1, VP.water)
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(noise(i, 1, 4) * W)
      const z = Math.floor(noise(i, 2, 4) * D)
      if (x > 12 && x < 76) g.set(x, WATER_TOP - 1, z, noise(i, 3, 4) > 0.5 ? '#8fd0ee' : '#e6f6ff')
    }
    for (const [x0, x1] of [
      [0, 13],
      [74, W - 1]
    ]) {
      g.box(x0, 0, 0, x1, BANK_TOP - 2, D - 1, VP.stone)
      for (let y = 2; y < BANK_TOP - 1; y += 2) g.box(x0, y, 0, x1, y, D - 1, VP.stoneDark) // mạch đá
      g.box(x0, BANK_TOP - 1, 0, x1, BANK_TOP - 1, D - 1, VP.soil)
      g.box(x0, BANK_TOP, 0, x1, BANK_TOP, D - 1, VP.grass)
      for (let z = 0; z < D; z += 3) g.set(x0 === 0 ? x1 : x0, BANK_TOP - 2, z, STONE_MOSS) // rêu chân kè
    }

    // --- Thân cầu: dầm đá + vòm ---
    for (let x = 8; x <= 80; x++) {
      const y = deck(x)
      for (let z = Z0; z <= Z1; z++) {
        g.box(x, 2, z, x, y - 1, z, (x + z) % 5 === 0 ? VP.stoneDark : VP.stone)
        g.set(x, y, z, x % 4 < 2 ? VP.wood : WOOD_LIGHT) // ván sàn
      }
      g.set(x, y - 1, Z0, STONE_LIGHT)
      g.set(x, y - 1, Z1, STONE_LIGHT)
    }
    // vòm lớn ở giữa + hai vòm nhỏ hai bên, hở để thấy nước
    const arch = (cx: number, rx: number, ry: number): void => {
      g.fill((x, y) => ((x - cx) / rx) ** 2 + ((y - WATER_TOP) / ry) ** 2 <= 1, null, [
        cx - rx - 1,
        WATER_TOP,
        Z0 - 1,
        cx + rx + 1,
        WATER_TOP + ry + 1,
        Z1 + 2
      ])
      g.box(cx - rx, 1, Z0, cx + rx, 1, Z1, VP.water)
    }
    arch(MID, 17, 8)
    arch(20, 6, 4)
    arch(68, 6, 4)

    // --- Cột lim sơn đỏ + xà ngang + lan can chấn song ---
    for (let x = 10; x <= 78; x += 4) {
      const y = deck(x)
      for (const z of [Z0 + 1, Z1 - 1]) {
        g.box(x, y + 1, z, x, y + 10, z, VP.lacquer)
        g.set(x, y + 1, z, VP.woodDark) // đế cột
        g.set(x, y + 10, z, VP.gold) // mũ cột
      }
      g.box(x, y + 10, Z0 + 1, x, y + 10, Z1 - 1, VP.woodRed) // xà ngang
    }
    for (let x = 9; x <= 79; x++) {
      const y = deck(x)
      for (const z of [Z0 + 1, Z1 - 1]) {
        g.set(x, y + 1, z, VP.woodDark)
        g.set(x, y + 4, z, VP.woodDark)
        if (x % 2 === 0) g.box(x, y + 2, z, x, y + 3, z, VP.woodRed)
        g.set(x, y + 10, z, VP.woodRed) // xà dọc
        g.set(x, y + 8, z, x % 4 === 0 ? VP.gold : VP.woodDark) // hoa văn dưới xà
      }
    }

    // --- Mái ngói âm dương: hai mái chạy dọc cầu, uốn theo sàn ---
    for (let x = 6; x <= 82; x++) {
      const y = deck(x) + 11
      const edge = x <= 8 || x >= 80
      for (let k = 0; k <= 10; k++) {
        const color = k === 10 ? ROOF_RIDGE : (k + (x >> 1)) % 2 === 0 ? ROOF_A : ROOF_B
        const lift = k === 0 ? 1 : 0 // mép mái cong nhẹ lên
        g.set(x, y + k + lift, Z0 - 1 + k, color)
        g.set(x, y + k + lift, Z1 + 1 - k, color)
        if (k > 0 && k < 10) {
          g.set(x, y + k - 1 + lift, Z0 - 1 + k, ROOF_B)
          g.set(x, y + k - 1 + lift, Z1 + 1 - k, ROOF_B)
        }
      }
      g.box(x, y + 10, (Z0 + Z1) >> 1, x, y + 10, ((Z0 + Z1) >> 1) + 1, ROOF_RIDGE)
      if (edge) g.set(x, y + 11, (Z0 + Z1) >> 1, VP.gold)
    }

    // --- Gian chùa giữa cầu: tường vàng, cửa gỗ, mái hai tầng đầu đao cong ---
    const py = deck(MID)
    const hx0 = MID - 10
    const hx1 = MID + 10
    g.box(hx0, py + 1, Z0 + 2, hx1, py + 12, Z1 - 2, WALL)
    g.box(hx0, py + 1, Z1 - 2, hx1, py + 12, Z1 - 2, WALL_SHADE)
    for (const x of [hx0, hx1, MID - 5, MID + 5])
      g.box(x, py + 1, Z1 - 1, x, py + 12, Z1 - 1, VP.lacquer)
    g.box(MID - 3, py + 1, Z1 - 1, MID + 3, py + 8, Z1 - 1, VP.woodDark) // cửa gỗ lim
    g.box(MID - 3, py + 1, Z1 - 1, MID, py + 8, Z1 - 1, VP.wood)
    g.box(MID, py + 1, Z1 - 1, MID, py + 8, Z1 - 1, VP.gold) // đường giữa cánh cửa
    g.box(MID - 4, py + 9, Z1 - 1, MID + 4, py + 11, Z1 - 1, VP.woodRed) // bảng hoành phi
    g.box(MID - 3, py + 10, Z1 - 1, MID + 3, py + 10, Z1 - 1, VP.gold)
    for (const x of [MID - 8, MID + 8]) {
      g.box(x - 1, py + 4, Z1 - 1, x + 1, py + 8, Z1 - 1, VP.woodDark) // cửa sổ tròn/vuông hai bên
      g.set(x, py + 6, Z1 - 1, PAPER)
    }
    // mái tầng dưới (đầu đao vươn ra), mái tầng trên nhỏ hơn
    const r1 = g.hipRoof(hx0 - 4, Z0 - 2, hx1 + 4, Z1 + 2, py + 13, ROOF_A)
    for (let x = hx0 - 4; x <= hx1 + 4; x++)
      for (const z of [Z0 - 2, Z1 + 2]) g.set(x, py + 13, z, x % 2 ? ROOF_B : ROOF_A)
    for (const [x, z] of [
      [hx0 - 4, Z0 - 2],
      [hx1 + 4, Z0 - 2],
      [hx0 - 4, Z1 + 2],
      [hx1 + 4, Z1 + 2]
    ]) {
      g.set(x, py + 14, z, ROOF_RIDGE)
      g.set(x + (x < MID ? -1 : 1), py + 15, z + (z < 20 ? -1 : 1), VP.gold) // đầu đao cong lên
    }
    g.box(MID - 6, r1 + 1, Z0 + 4, MID + 6, r1 + 3, Z1 - 4, WALL)
    g.box(MID - 5, r1 + 2, Z1 - 4, MID + 5, r1 + 2, Z1 - 4, VP.lacquer)
    const r2 = g.hipRoof(MID - 9, Z0 + 1, MID + 9, Z1 - 1, r1 + 4, ROOF_B)
    g.box(MID - 1, r2 + 1, 20, MID + 1, r2 + 1, 23, ROOF_RIDGE)
    g.box(MID, r2 + 2, 21, MID, r2 + 5, 21, VP.gold) // nậm nóc
    g.set(MID, r2 + 6, 21, VP.lanternGlow)

    // --- Đèn lồng đỏ treo dọc mái hiên hai bên ---
    for (let x = 12; x <= 76; x += 6) {
      if (Math.abs(x - MID) < 11) continue
      const y = deck(x) + 11
      for (const z of [Z0 - 1, Z1 + 1]) {
        g.set(x, y - 1, z, VP.gold)
        g.box(x, y - 4, z, x, y - 2, z, VP.lantern)
        g.set(x, y - 3, z, VP.lanternGlow)
        g.set(x, y - 5, z, VP.gold)
      }
    }

    // --- Bậc đá lên cầu ở hai đầu ---
    for (let s = 0; s < 6; s++) {
      g.box(2 + s, BANK_TOP, Z0 + 1, 2 + s, BANK_TOP + s, Z1 - 1, s % 2 ? STONE_LIGHT : VP.stone)
      g.box(
        W - 3 - s,
        BANK_TOP,
        Z0 + 1,
        W - 3 - s,
        BANK_TOP + s,
        Z1 - 1,
        s % 2 ? STONE_LIGHT : VP.stone
      )
    }
    // hai tượng chó đá canh đầu cầu
    for (const [x, z] of [
      [9, Z1 + 1],
      [79, Z1 + 1]
    ]) {
      g.box(x, BANK_TOP + 1, z, x + 1, BANK_TOP + 3, z + 2, VP.stoneDark)
      g.box(x, BANK_TOP + 4, z, x + 1, BANK_TOP + 4, z + 1, STONE_LIGHT)
    }

    // --- Nhà ven sông, liễu rủ ---
    house(g, 1, 36, 10, 44)
    house(g, 77, 4, 86, 10)
    willow(g, 4, 6, 9)
    willow(g, 80, 36, 8)
    // đường lát trên bờ
    g.box(0, BANK_TOP, 22, 12, BANK_TOP, 25, VP.sand)
    g.box(75, BANK_TOP, 22, W - 1, BANK_TOP, 25, VP.sand)

    // --- Thuyền nan nhỏ có đèn lồng ---
    const bx = 30
    const bz = 38
    g.box(bx, WATER_TOP, bz, bx + 9, WATER_TOP, bz + 2, VP.woodDark)
    g.box(bx - 1, WATER_TOP + 1, bz, bx + 10, WATER_TOP + 1, bz + 2, VP.wood)
    g.box(bx + 9, WATER_TOP + 2, bz + 1, bx + 11, WATER_TOP + 2, bz + 1, VP.woodDark) // mũi cong
    g.box(bx + 3, WATER_TOP + 2, bz + 1, bx + 5, WATER_TOP + 4, bz + 1, ROOF_A) // mui
    g.box(bx + 8, WATER_TOP + 2, bz + 1, bx + 8, WATER_TOP + 5, bz + 1, VP.woodDark)
    g.set(bx + 8, WATER_TOP + 6, bz + 1, VP.lantern)
    g.set(bx + 8, WATER_TOP + 5, bz + 1, VP.lanternGlow)
  }
}
