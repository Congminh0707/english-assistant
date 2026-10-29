// Ngọ Môn (Huế): cổng chính của Đại Nội — đài đá rộng với ba cổng vòm (giữa lớn nhất), phía trên là Lầu Ngũ Phụng
// hai tầng mái ngói vàng đầu đao cong, cột son; trước cổng có hào nước và sen. Vẽ cách điệu, trang trọng.
// docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const GOLD_LIGHT = '#f6d35a'
const GOLD_RIDGE = '#d98a1f'
const PINK = '#f2a3c4'
const DARK_PANEL = '#5a2a20'

/** Mái ngói vàng nhiều bậc (mỗi tầng thu vào 1 ô, màu xen kẽ), nóc màu cam đậm; trả về độ cao nóc */
function goldRoof(g: VoxelGrid, x0: number, z0: number, x1: number, z1: number, y: number): number {
  let top = y
  for (let k = 0; x0 + k <= x1 - k && z0 + k <= z1 - k; k++) {
    top = y + k
    const last = x0 + k + 1 > x1 - k - 1 || z0 + k + 1 > z1 - k - 1
    g.box(
      x0 + k,
      top,
      z0 + k,
      x1 - k,
      top,
      z1 - k,
      last ? GOLD_RIDGE : k % 2 === 0 ? VP.gold : GOLD_LIGHT
    )
  }
  return top
}

/** Khoét cổng vòm: tâm cx (toạ độ liên tục), nửa rộng w, cao h ô, xuyên từ z0 tới z1 */
function carveArch(g: VoxelGrid, cx: number, w: number, h: number, z0: number, z1: number): void {
  const ys = h - w + 1
  g.fill((x, y) => Math.abs(x - cx) <= w && (y <= ys || Math.hypot(x - cx, y - ys) <= w), null, [
    cx - w - 1,
    1,
    z0,
    cx + w + 1,
    h + 2,
    z1 + 1
  ])
}

export const hueNgoMon: VoxelModel = {
  id: 'hue-ngo-mon',
  size: [46, 30, 26],
  build: (g) => {
    // Đất cỏ phía sau, hào nước phía trước
    g.box(0, 0, 0, 45, 0, 18, VP.grass)
    g.box(0, 0, 19, 45, 0, 25, VP.waterDeep)
    g.box(0, 0, 19, 45, 0, 19, VP.water)

    // Đài đá + hai cánh nhô ra phía trước
    g.box(2, 1, 6, 43, 8, 15, VP.stone)
    for (const [a, b] of [
      [2, 8],
      [37, 43]
    ])
      g.box(a, 1, 6, b, 8, 17, VP.stone)
    g.box(2, 1, 6, 43, 1, 17, VP.stoneDark) // chân đài
    g.box(9, 1, 16, 36, 1, 18, VP.stone) // sân lát đá trước cổng
    g.box(2, 8, 6, 43, 8, 15, VP.stoneDark)
    for (const [a, b] of [
      [2, 8],
      [37, 43]
    ])
      g.box(a, 8, 6, b, 8, 17, VP.stoneDark)
    // Hàng gạch trên thân đài
    for (let x = 2; x <= 43; x += 3) g.box(x, 4, 15, x, 4, 15, VP.stoneDark)

    // Ba cổng vòm
    carveArch(g, 23, 3, 7, 7, 15)
    carveArch(g, 14, 2, 5, 7, 15)
    carveArch(g, 32, 2, 5, 7, 15)
    for (const [cx, w] of [
      [23, 3],
      [14, 2],
      [32, 2]
    ])
      g.fill((x, y) => Math.abs(x - cx) <= w && y > 1, VP.woodDark, [
        cx - w - 1,
        1,
        6,
        cx + w + 1,
        9,
        7
      ])
    // Sàn trong cổng
    g.box(20, 1, 7, 25, 1, 15, VP.stoneDark)

    // Cầu đá bắc qua hào + lan can
    g.box(20, 0, 19, 25, 1, 25, VP.stone)
    for (const x of [20, 25]) g.box(x, 2, 19, x, 2, 25, VP.stoneDark)

    // Gian thấp hai cánh (lầu nhỏ hai đầu)
    for (const [a, b] of [
      [3, 7],
      [38, 42]
    ]) {
      g.box(a, 9, 8, b, 11, 15, VP.woodRed)
      for (const x of [a, b]) for (const z of [8, 15]) g.box(x, 9, z, x, 11, z, VP.lacquer)
      g.box(a + 1, 9, 15, b - 1, 10, 15, DARK_PANEL)
      goldRoof(g, a - 1, 7, b + 1, 16, 12)
    }

    // Lầu Ngũ Phụng — tầng dưới: cột son, gian tối xen kẽ
    g.shell(12, 9, 7, 33, 13, 14, VP.woodRed)
    for (const x of [12, 16, 20, 25, 29, 33]) {
      g.box(x, 9, 14, x, 13, 14, VP.lacquer)
      g.box(x, 9, 7, x, 13, 7, VP.lacquer)
    }
    for (let x = 13; x <= 32; x++) {
      if ([16, 20, 25, 29].includes(x)) continue
      g.box(x, 9, 14, x, 12, 14, DARK_PANEL)
      g.set(x, 13, 14, VP.gold)
    }
    g.box(12, 9, 15, 33, 9, 15, VP.stoneDark) // lan can đá mép đài
    // Mái dưới ba bậc
    for (let k = 0; k < 3; k++) {
      g.box(10 + k, 14 + k, 5 + k, 35 - k, 14 + k, 16 - k, k % 2 === 0 ? VP.gold : GOLD_LIGHT)
    }
    // Đầu đao cong lên
    for (const [x, z] of [
      [9, 17],
      [36, 17],
      [9, 4],
      [36, 4]
    ])
      g.box(x, 15, z, x, 15, z, GOLD_RIDGE)
    for (const [x, z] of [
      [8, 18],
      [37, 18]
    ])
      g.set(x, 16, z, GOLD_RIDGE)

    // Tầng trên: cột son + dải vàng
    g.shell(13, 17, 8, 32, 21, 13, VP.woodRed)
    for (const x of [13, 17, 21, 24, 28, 32]) {
      g.box(x, 17, 13, x, 21, 13, VP.lacquer)
      g.box(x, 17, 8, x, 21, 8, VP.lacquer)
    }
    for (let x = 14; x <= 31; x++) {
      if ([17, 21, 24, 28].includes(x)) continue
      g.box(x, 17, 13, x, 19, 13, DARK_PANEL)
      g.box(x, 20, 13, x, 21, 13, VP.gold)
    }
    // Mái trên: cao nhất, bậc cao
    const top = goldRoof(g, 11, 6, 34, 15, 22)
    for (const [x, z] of [
      [10, 16],
      [35, 16],
      [10, 5],
      [35, 5]
    ])
      g.set(x, 23, z, GOLD_RIDGE)
    for (const [x, z] of [
      [9, 17],
      [36, 17]
    ])
      g.set(x, 24, z, GOLD_RIDGE)
    // Đầu nóc (kìm) hai đầu
    for (const x of [14, 31]) g.box(x, top + 1, 10, x, top + 2, 11, VP.lacquer)

    // Sen và lá sen trong hào
    for (const [x, z, flower] of [
      [6, 21, true],
      [10, 23, false],
      [13, 20, true],
      [30, 22, false],
      [34, 20, true],
      [38, 24, true],
      [41, 21, false],
      [3, 24, false]
    ] as Array<[number, number, boolean]>) {
      g.box(x - 1, 1, z, x + 1, 1, z, VP.leaf)
      g.box(x, 1, z - 1, x, 1, z + 1, VP.leaf)
      if (flower) g.set(x, 2, z, PINK)
    }
  }
}
