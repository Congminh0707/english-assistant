// Tháp Trầm Hương (Nha Trang): tháp trắng ngà hình búp sen / khối trầm hương thon cao, thân có các cánh sen nổi gân,
// đứng trên quảng trường tròn; bên cạnh là bãi cát, biển có sóng và một cây dừa. Vẽ cách điệu.
// docs/19-kids-world.md §2.2
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const CREAM = '#efe3c6'
const CREAM_DARK = '#d6c9a8'
const TROUGH = '#e4d3a8'
const WET_SAND = '#d9c28a'
const TOWER_Y0 = 3
const TOWER_H = 38

/** Bán kính thân tháp theo độ cao u (0..1): phình ra ở khoảng 30% rồi thon dần thành búp */
function radius(u: number): number {
  if (u < 0.3) return 3.9 + 1.5 * Math.sin((u / 0.3) * (Math.PI / 2))
  return 0.5 + 4.9 * Math.cos(((u - 0.3) / 0.7) * (Math.PI / 2)) ** 1.2
}

function palm(g: VoxelGrid, bx: number, bz: number, y0: number): void {
  let tx = bx
  let tz = bz
  let ty = y0
  for (let i = 0; i < 10; i++) {
    tx = bx + i * 0.25
    tz = bz + i * 0.2
    ty = y0 + i
    g.set(Math.round(tx), ty, Math.round(tz), i % 2 === 0 ? VP.wood : VP.woodDark)
  }
  const cx = Math.round(tx)
  const cz = Math.round(tz)
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1]
  ]
  for (const [dx, dz] of dirs) {
    for (let s = 1; s <= 5; s++) {
      g.set(
        cx + dx * s,
        ty + 1 - Math.floor(s * 0.45),
        cz + dz * s,
        s % 2 === 0 ? VP.leafLight : VP.leaf
      )
    }
  }
  g.set(cx, ty + 1, cz, VP.leaf)
  g.set(cx, ty, cz + 1, VP.woodDark) // dừa
  g.set(cx + 1, ty, cz, VP.woodDark)
}

export const nhatrangTramHuong: VoxelModel = {
  id: 'nhatrang-tram-huong',
  size: [32, 44, 32],
  build: (g) => {
    const cx = 12
    const cz = 11

    // Bãi cát, dải cỏ phía sau, biển phía trước
    g.box(0, 0, 0, 31, 1, 23, VP.sand)
    g.box(0, 0, 0, 31, 1, 3, VP.grass)
    g.box(0, 0, 23, 31, 0, 24, WET_SAND)
    g.box(0, 0, 25, 31, 0, 31, VP.waterDeep)
    g.box(0, 0, 24, 31, 0, 24, VP.water)
    // Sóng bọt trắng
    for (let x = 0; x < 32; x++) {
      g.set(x, 0, 24 + Math.round(Math.sin(x * 0.9)), VP.white)
      if (x % 5 === 0) g.set(x, 0, 28 + (x % 3), VP.white)
      if (x % 4 === 1) g.set(x, 0, 27 + (x % 2) * 3, VP.water)
    }

    // Quảng trường tròn + bệ
    g.cylinder(cx, cz, 10.5, 0, 1, CREAM)
    g.fill(
      (x, _y, z) => Math.hypot(x - cx, z - cz) > 9 && Math.hypot(x - cx, z - cz) <= 10.5,
      CREAM_DARK,
      [0, 1, 0, 32, 2, 32]
    )
    g.fill(
      (x, _y, z) => Math.hypot(x - cx, z - cz) > 6.5 && Math.hypot(x - cx, z - cz) <= 7.5,
      CREAM_DARK,
      [0, 1, 0, 32, 2, 32]
    )
    g.cylinder(cx, cz, 7.5, 2, 2, VP.white)
    g.cylinder(cx, cz, 6.2, 3, 3, VP.stone) // bệ tháp (hàng dưới cùng)

    // Thân tháp: tiết diện tròn có gân cánh sen (8 gân), trắng xen kem
    for (let y = TOWER_Y0; y < TOWER_Y0 + TOWER_H; y++) {
      const u = (y - TOWER_Y0 + 0.5) / TOWER_H
      const r = radius(u)
      const band = Math.floor((y - TOWER_Y0) / 6) % 2 === 1
      g.fill(
        (x, _yy, z) => {
          const th = Math.atan2(z - cz, x - cx)
          return Math.hypot(x - cx, z - cz) <= r * (1 + 0.2 * Math.cos(8 * th))
        },
        VP.white,
        [cx - 9, y, cz - 9, cx + 9, y + 1, cz + 9]
      )
      // Tô màu kem cho phần lõm giữa hai gân
      g.fill(
        (x, _yy, z) => {
          const th = Math.atan2(z - cz, x - cx)
          const d = Math.hypot(x - cx, z - cz)
          return d <= r * (1 + 0.2 * Math.cos(8 * th)) && Math.cos(8 * th) < -0.2 && d > r * 0.55
        },
        band ? CREAM_DARK : TROUGH,
        [cx - 9, y, cz - 9, cx + 9, y + 1, cz + 9]
      )
    }
    // Chóp vàng nhỏ
    g.box(cx - 1, TOWER_Y0 + TOWER_H, cz - 1, cx - 1, TOWER_Y0 + TOWER_H + 2, cz - 1, VP.gold)
    g.set(cx - 1, TOWER_Y0 + TOWER_H + 3, cz - 1, VP.gold)

    // Cửa vòm ở chân tháp
    g.box(cx + 4, 3, cz + 1, cx + 5, 6, cz + 1, VP.woodDark)

    // Cây dừa trên cát + bụi cây nhỏ
    palm(g, 25, 16, 2)
    palm(g, 4, 18, 2)
    for (const [x, z] of [
      [28, 6],
      [2, 8]
    ])
      g.ellipsoid(x, 3, z, 2, 1.6, 2, VP.leaf)
  }
}
