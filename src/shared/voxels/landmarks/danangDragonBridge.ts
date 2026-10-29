// Cầu Rồng (Đà Nẵng) bắc qua sông Hàn: thân rồng thép vàng uốn lượn thành nhiều vòng cung trên mặt cầu, đầu rồng
// ngẩng cao ở đầu cầu phía người xem, đuôi cong ở đầu kia; dưới là nước và hai bờ kè. Vẽ cách điệu.
// docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const ROAD = '#5b5f6b'
const DRAGON_RED = '#d9482c'
const DRAGON_GOLD = '#f2b52a'
const DECK = 6 // độ cao mặt đường

/** Thân rồng 2×2 chạy dọc z: độ cao tâm theo hàm `yAt`; lấp theo chiều đứng để các đoạn dốc không bị đứt */
function body(g: VoxelGrid, z0: number, z1: number, yAt: (z: number) => number): void {
  for (let z = z0; z <= z1; z++) {
    const ys = [yAt(z - 1), yAt(z), yAt(z + 1)]
    const lo = Math.round(Math.min(...ys))
    const hi = Math.round(Math.max(...ys))
    const color = Math.floor(z / 2) % 2 === 0 ? DRAGON_GOLD : VP.gold
    g.box(11, lo, z, 12, hi + 1, z, color)
    // Vảy/cánh lưng đỏ
    if (z % 2 === 0) g.set(11, hi + 2, z, DRAGON_RED)
    // Viền sáng phía trên
    g.set(12, hi + 1, z, VP.plasterYellow)
  }
}

export const danangDragonBridge: VoxelModel = {
  id: 'danang-dragon-bridge',
  size: [26, 26, 48],
  build: (g) => {
    // Sông + hai bờ kè đá
    g.box(0, 0, 7, 25, 0, 40, VP.waterDeep)
    g.box(0, 1, 7, 25, 2, 40, VP.water)
    for (const [a, b] of [
      [0, 6],
      [41, 47]
    ]) {
      g.box(0, 0, a, 25, 4, b, VP.stone)
      g.box(0, 5, a, 25, 5, b, VP.stoneDark)
      g.box(0, 6, a, 25, 6, b, VP.grass)
    }
    // Sóng lăn tăn
    for (let x = 1; x < 25; x += 4)
      for (let z = 9; z < 40; z += 5) g.set(x + (z % 2), 2, z, VP.white)

    // Dầm cầu + hai trụ
    g.box(6, 4, 7, 17, 5, 40, VP.white)
    for (const z of [15, 31]) g.box(8, 0, z, 15, 3, z + 1, VP.stoneDark)

    // Mặt đường: lề đá hai bên, nhựa ở giữa, vạch trắng, dải phân cách
    g.box(6, DECK, 0, 17, DECK, 47, ROAD)
    for (const x of [6, 17]) g.box(x, DECK, 0, x, DECK, 47, VP.stone)
    g.box(11, DECK, 0, 12, DECK, 47, VP.stoneDark)
    for (const x of [8, 15])
      for (let z = 1; z < 47; z += 4) g.box(x, DECK, z, x, DECK, z + 1, VP.white)

    // Lan can trắng + trụ đèn
    for (const x of [6, 17]) {
      g.box(x, DECK + 1, 7, x, DECK + 1, 40, VP.white)
      for (let z = 8; z <= 40; z += 4) g.box(x, DECK + 1, z, x, DECK + 3, z, VP.white)
    }
    for (const z of [10, 24, 38]) {
      for (const x of [6, 17]) {
        g.box(x, DECK + 1, z, x, DECK + 6, z, VP.iron)
        g.set(x, DECK + 7, z, VP.lanternGlow)
      }
    }

    // Thân rồng: 5 vòng cung, cao nhất ở giữa
    const amp = [5, 7, 8, 7, 5]
    const len = 6
    const start = 9
    body(g, start, start + len * amp.length - 1, (z) => {
      const t = (z - start + 0.5) / len
      const i = Math.min(amp.length - 1, Math.max(0, Math.floor(t)))
      return DECK + 1 + amp[i] * Math.abs(Math.sin(Math.PI * (t - i)))
    })
    // Đuôi cong lên
    body(g, 3, start - 1, (z) => DECK + 1 + 5 * ((start - z) / (start - 3)) ** 2)
    g.box(11, DECK + 6, 3, 12, DECK + 7, 3, DRAGON_RED)
    g.box(11, DECK + 8, 2, 12, DECK + 8, 2, DRAGON_RED)
    // Cổ ngẩng lên
    const neck0 = start + len * amp.length
    body(g, neck0, neck0 + 5, (z) => DECK + 1 + 10 * ((z - neck0) / 5) ** 1.5)

    // Đầu rồng quay về phía người xem (+z)
    const hz = neck0 + 6 // 45? giữ trong lưới
    const z0 = Math.min(hz - 2, 43)
    g.box(10, 15, z0, 13, 19, z0 + 2, DRAGON_GOLD) // sọ
    g.box(10, 18, z0 + 3, 13, 19, 47, VP.gold) // hàm trên
    g.box(10, 15, z0 + 3, 13, 16, 46, VP.gold) // hàm dưới
    g.box(11, 17, z0 + 3, 12, 17, 46, DRAGON_RED) // miệng
    g.box(10, 20, 47, 13, 20, 47, DRAGON_GOLD) // mũi
    for (const z of [z0 + 4, z0 + 5]) {
      g.set(10, 17, z, VP.white) // răng
      g.set(13, 17, z, VP.white)
    }
    // Mắt
    g.set(14, 19, z0 + 1, VP.white)
    g.set(14, 18, z0 + 1, VP.iron)
    g.set(9, 19, z0 + 1, VP.white)
    // Sừng + bờm
    for (const x of [10, 13]) g.box(x, 20, z0, x, 21, z0, DRAGON_RED)
    g.box(11, 20, z0 - 1, 12, 20, z0 + 1, DRAGON_RED)
    // Râu trắng
    g.box(9, 16, z0 + 3, 9, 16, 47, VP.white)
    g.box(14, 16, z0 + 3, 14, 16, 47, VP.white)

    // Vài toà nhà nhỏ xa xa
    for (const [x0, z0b, w, d, h, c] of [
      [0, 0, 4, 5, 9, VP.plaster],
      [19, 0, 6, 5, 12, VP.white],
      [0, 42, 4, 5, 7, VP.plasterYellow]
    ] as Array<[number, number, number, number, number, string]>) {
      g.box(x0, 7, z0b, x0 + w - 1, 6 + h, z0b + d - 1, c)
      g.box(x0, 7 + h, z0b, x0 + w - 1, 7 + h, z0b + d - 1, VP.tile)
      for (let y = 9; y < 6 + h; y += 3)
        g.box(x0 + 1, y, z0b + d - 1, x0 + w - 2, y, z0b + d - 1, VP.glass)
    }
  }
}
