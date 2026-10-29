// Chùa Cầu (Hội An): cây cầu gỗ có mái ngói bắc qua lạch nước, gian chùa nhô ra giữa phía sau, đèn lồng đỏ.
// Vẽ cách điệu, trang trọng (nơi thờ tự). docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'

export const hoianBridgePagoda: VoxelModel = {
  id: 'hoian-bridge-pagoda',
  size: [44, 26, 24],
  build: (g) => {
    // Lạch nước + hai bờ đá
    g.box(0, 0, 0, 43, 0, 21, VP.waterDeep)
    g.box(0, 1, 0, 43, 1, 21, VP.water)
    g.box(0, 0, 0, 6, 3, 21, VP.stone)
    g.box(37, 0, 0, 43, 3, 21, VP.stone)
    g.box(0, 4, 0, 6, 4, 21, VP.grass)
    g.box(37, 4, 0, 43, 4, 21, VP.grass)

    // Thân cầu cong: vòm đá dưới, sàn gỗ phía trên
    const deck = (x: number): number => 4 + Math.round(2 * Math.sin(((x - 4) / 35) * Math.PI))
    for (let x = 4; x <= 39; x++) {
      const y = deck(x)
      g.box(x, y - 1, 6, x, y - 1, 15, VP.stoneDark)
      g.box(x, y, 6, x, y, 15, VP.wood)
    }
    // Vòm hở phía dưới để thấy nước chảy qua
    g.fill((x, y) => ((x - 22) / 12) ** 2 + ((y - 1) / 4) ** 2 <= 1, null, [10, 0, 6, 35, 6, 16])
    g.box(10, 0, 6, 34, 1, 15, null)
    g.box(10, 0, 6, 34, 0, 15, VP.waterDeep)
    g.box(10, 1, 6, 34, 1, 15, VP.water)

    // Cột sơn đỏ + lan can gỗ hai bên
    for (let x = 6; x <= 38; x += 4) {
      const y = deck(x)
      for (const z of [6, 15]) g.box(x, y + 1, z, x, y + 6, z, VP.lacquer)
    }
    for (let x = 5; x <= 39; x++) {
      const y = deck(x)
      for (const z of [6, 15]) g.box(x, y + 1, z, x, y + 2, z, VP.woodDark)
      // xà ngang trên đầu cột
      for (const z of [6, 15]) g.set(x, y + 7, z, VP.woodRed)
    }

    // Mái ngói hai mái chạy dọc cầu, uốn theo thân cầu
    for (let x = 3; x <= 40; x++) {
      const y = deck(Math.min(39, Math.max(4, x))) + 8
      for (let k = 0; k <= 6; k++) {
        const color = k === 6 ? VP.tileDark : k % 2 === 0 ? VP.tile : VP.tileDark
        g.set(x, y + k, 4 + k, color)
        g.set(x, y + k, 17 - k, color)
      }
      g.box(x, y + 6, 10, x, y + 6, 11, VP.tileDark)
    }

    // Gian chùa nhô ra phía trước (về phía người xem) ở giữa cầu, tường vàng, mái cao hơn mái cầu
    const py = deck(22)
    g.box(17, py, 16, 27, py, 21, VP.wood)
    g.box(17, py + 1, 17, 27, py + 9, 21, VP.plasterYellow)
    g.box(20, py + 1, 21, 24, py + 6, 21, VP.woodDark) // cửa
    g.box(21, py + 7, 21, 23, py + 8, 21, VP.gold) // hoành phi
    for (const x of [17, 27]) g.box(x, py + 1, 21, x, py + 9, 21, VP.lacquer)
    const top = g.hipRoof(15, 15, 29, 23, py + 10, VP.tile)
    g.box(20, top + 1, 18, 24, top + 1, 20, VP.tileDark)
    for (const [x, z] of [
      [15, 23],
      [29, 23]
    ])
      g.set(x, py + 11, z, VP.tileDark) // đầu đao cong lên

    // Đèn lồng đỏ treo dưới mái
    for (const x of [9, 16, 28, 35]) {
      const y = deck(x) + 7
      for (const z of [5, 16]) {
        g.set(x, y - 1, z, VP.gold)
        g.box(x, y - 3, z, x, y - 2, z, VP.lantern)
        g.set(x, y - 4, z, VP.gold)
      }
    }
  }
}
