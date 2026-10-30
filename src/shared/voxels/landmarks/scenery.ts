// Vật trang trí dùng chung cho công trình tầng 2–3 (cây, cọ, đá, thú voxel nhỏ). docs/19-kids-world.md §5.2
import { VP } from '../palette'
import type { VoxelGrid } from '../voxelGrid'

/** Nhiễu giả ngẫu nhiên cố định theo toạ độ, trong [0, 1) */
export function noise(x: number, y: number, z: number): number {
  let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(z + 7, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1103515245)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

/** Nền phẳng (đất/cỏ/nước) kín đáy: lớp dưới sẫm, lớp mặt sáng */
export function ground(
  g: VoxelGrid,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  top: string,
  under: string,
  y = 0
): void {
  g.box(x0, y, z0, x1, y, z1, under)
  g.box(x0, y + 1, z0, x1, y + 1, z1, top)
}

/** Cây tròn tán: thân gỗ + tán hai tông xanh */
export function tree(g: VoxelGrid, x: number, y: number, z: number, h = 6, r = 3): void {
  g.box(x, y, z, x, y + h - 2, z, VP.wood)
  g.ellipsoid(x + 0.5, y + h, z + 0.5, r, r * 0.8, r, VP.leaf)
  g.ellipsoid(x + 0.9, y + h + 0.8, z + 0.9, r * 0.7, r * 0.5, r * 0.7, VP.leafLight)
}

/** Cây cọ: thân nghiêng nhẹ, vài tàu lá toả ra */
export function palm(g: VoxelGrid, x: number, y: number, z: number, h = 9): void {
  for (let i = 0; i < h; i++) g.set(x + Math.floor(i / 5), y + i, z, VP.wood)
  const tx = x + Math.floor(h / 5)
  const ty = y + h
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ]) {
    for (let k = 1; k <= 3; k++) g.set(tx + dx * k, ty - (k > 2 ? 1 : 0), z + dz * k, k === 3 ? VP.leafLight : VP.leaf)
  }
  g.set(tx, ty, z, VP.leaf)
}

/** Tảng đá nhỏ */
export function boulder(g: VoxelGrid, x: number, y: number, z: number, r = 2): void {
  g.ellipsoid(x, y + r * 0.5, z, r, r * 0.7, r, VP.stoneDark)
  g.ellipsoid(x - 0.3, y + r * 0.7, z - 0.3, r * 0.6, r * 0.4, r * 0.6, VP.stone)
}

/** Hộp có mái hai mái: nhà nhỏ (tường, mái, cửa) */
export function hut(
  g: VoxelGrid,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y: number,
  wall: string,
  roof: string
): void {
  const h = 3
  g.box(x0, y, z0, x1, y + h - 1, z1, wall)
  g.gableRoof(x0 - 1, z0 - 1, x1 + 1, z1 + 1, y + h, 'x', roof)
  const mid = Math.floor((x0 + x1) / 2)
  g.box(mid, y, z1, mid, y + 1, z1, VP.woodDark)
}
