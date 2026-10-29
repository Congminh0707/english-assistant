// Tràng An (Ninh Bình): núi đá vôi dựng đứng phủ cây xanh, hang xuyên núi (vòm hang) cho thuyền chui qua dòng sông,
// phía trước một chiếc thuyền nan có người đội nón lá đang chèo. Vẽ cách điệu. docs/19-kids-world.md §2.5
import { VP } from '../palette'
import type { VoxelGrid, VoxelModel } from '../voxelGrid'

const RIVER = '#4fb0c4'
const RIVER_DEEP = '#2f8fa8'
const LIMESTONE = '#a8a898'
const LIMESTONE_LIGHT = '#c4c2b0'
const LIMESTONE_DARK = '#7f8478'
const CAVE = '#4a4f48'
const MOSS = '#5a9e3e'
const FOAM = '#e6f6ff'
const HAT = '#ecdca0'
const SHIRT = '#d4663a'
const SKIN = '#f0c8a0'
const BOAT = '#3b6ea8'

/** Nhiễu giả ngẫu nhiên cố định theo toạ độ, trong [0, 1) */
function noise(x: number, y: number, z: number): number {
  let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(z + 7, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1103515245)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

interface Karst {
  cx: number
  cz: number
  rx: number
  rz: number
  h: number
}

const SX = 44
const SZ = 30

/** Bỏ các ô nằm kín bên trong (cả 6 mặt đều có ô khác) cho nhẹ — nhìn bên ngoài không đổi */
function hollow(g: VoxelGrid): void {
  const kill: Array<[number, number, number]> = []
  for (const { x, y, z } of g.voxels())
    if (
      g.get(x - 1, y, z) !== null &&
      g.get(x + 1, y, z) !== null &&
      g.get(x, y - 1, z) !== null &&
      g.get(x, y + 1, z) !== null &&
      g.get(x, y, z - 1) !== null &&
      g.get(x, y, z + 1) !== null
    )
      kill.push([x, y, z])
  for (const [x, y, z] of kill) g.set(x, y, z, null)
}

export const ninhbinhTrangAn: VoxelModel = {
  id: 'ninhbinh-trang-an',
  size: [SX, 34, SZ],
  build: (g) => {
    // Dòng sông
    g.box(0, 0, 0, SX - 1, 0, SZ - 1, RIVER_DEEP)
    g.box(0, 1, 0, SX - 1, 1, SZ - 1, RIVER)
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(noise(i, 1, 2) * SX)
      const z = Math.floor(noise(i, 3, 4) * SZ)
      if (noise(x, 5, z) > 0.5) g.set(x, 1, z, FOAM)
    }

    // Các ngọn núi đá vôi dựng đứng: núi lớn có hang ở giữa, hai ngọn bên cạnh, một ngọn nhỏ phía sau phải
    const peaks: Karst[] = [
      { cx: 21, cz: 9, rx: 10.5, rz: 9, h: 27 },
      { cx: 4, cz: 11, rx: 5.5, rz: 6, h: 19 },
      { cx: 37, cz: 8, rx: 6.5, rz: 7, h: 33 },
      { cx: 38, cz: 21, rx: 4.5, rz: 4.5, h: 11 }
    ]
    const heightAt = (x: number, z: number): number => {
      let best = 0
      for (const p of peaks) {
        // chân núi gần vuông (vách đứng), đỉnh tròn
        const d = (Math.abs(x + 0.5 - p.cx) / p.rx) ** 3 + (Math.abs(z + 0.5 - p.cz) / p.rz) ** 3
        if (d >= 1) continue
        const v = p.h * (1 - d ** 2) ** 0.45 + (noise(x, 0, z) - 0.5) * 1.6
        if (v > best) best = v
      }
      return Math.round(best)
    }
    // vòm hang xuyên dọc theo z, giữa núi lớn
    const inCave = (x: number, y: number): boolean =>
      ((x + 0.5 - 21) / 6.2) ** 2 + ((y - 1.5) / 9) ** 2 <= 1
    const caveZ1 = 19

    for (let z = 0; z < SZ; z++)
      for (let x = 0; x < SX; x++) {
        const h = heightAt(x, z)
        for (let y = 2; y <= h; y++) {
          if (z <= caveZ1 && inCave(x, y) && x > 12 && x < 30) continue
          const n = noise(x, y, z)
          let color = y % 6 === 0 ? LIMESTONE_LIGHT : LIMESTONE
          if (n > 0.85) color = LIMESTONE_LIGHT
          else if (n < 0.15) color = LIMESTONE_DARK
          if (y < 4) color = MOSS // rêu chân núi sát mặt nước
          g.set(x, y, z, color)
        }
        // cây phủ mặt trên và sườn thoải: lớp trên cùng xanh
        if (h >= 3) {
          const nearTop = y0Top(heightAt, x, z, h)
          if (nearTop) {
            g.set(x, h, z, noise(x, h, z) > 0.5 ? VP.leaf : VP.leafLight)
            if (noise(x, h + 1, z) > 0.6) g.set(x, h + 1, z, VP.leaf)
          }
        }
      }
    // Mảng cây bám sườn núi
    for (let y = 5; y < 32; y++)
      for (let z = 0; z < SZ; z++)
        for (let x = 0; x < SX; x++) {
          const c = g.get(x, y, z)
          if (c === null || c === VP.leaf || c === VP.leafLight || c === CAVE) continue
          if (
            noise(x + 5, y, z + 9) > 0.93 &&
            (g.get(x, y + 1, z) === null || g.get(x, y, z + 1) === null)
          ) {
            g.set(x, y, z, noise(x, y + 3, z) > 0.5 ? VP.grassDark : MOSS)
          }
        }
    // Vách trong hang tối hơn
    for (let z = 0; z <= caveZ1; z++)
      for (let y = 2; y < 14; y++)
        for (let x = 12; x < 30; x++) {
          if (g.get(x, y, z) === null) continue
          const near = inCave(x - 1, y) || inCave(x + 1, y) || inCave(x, y + 1)
          if (near && (x - 21) ** 2 < 40)
            g.set(x, y, z, noise(x, y, z) > 0.7 ? LIMESTONE_DARK : CAVE)
        }
    // Mặt hang: nước phía trong tối hơn
    for (let z = 0; z <= caveZ1; z++)
      for (let x = 14; x < 28; x++) if (g.get(x, 1, z) === RIVER) g.set(x, 1, z, RIVER_DEEP)

    // Bãi cây ven sông phía trước
    for (const [x, z] of [
      [3, 26],
      [4, 26],
      [3, 25],
      [40, 27],
      [41, 27],
      [41, 26]
    ]) {
      g.box(x, 2, z, x, 3, z, VP.grassDark)
      g.set(x, 4, z, VP.leaf)
    }

    // Thuyền nan trước cửa hang, mũi hướng về hang (-z); dài theo trục z
    const bx = 9
    const bz = 20
    g.box(bx, 2, bz + 1, bx + 2, 2, bz + 7, BOAT)
    g.box(bx - 1, 3, bz, bx + 3, 3, bz + 8, BOAT)
    g.box(bx, 3, bz + 1, bx + 2, 3, bz + 7, null)
    g.box(bx, 2, bz + 1, bx + 2, 2, bz + 7, VP.woodDark)
    g.set(bx + 1, 4, bz - 1, BOAT) // mũi nhọn nhô lên
    g.set(bx + 1, 4, bz + 9, BOAT)
    g.box(bx - 1, 3, bz, bx + 3, 3, bz, VP.wood)
    g.box(bx - 1, 3, bz + 8, bx + 3, 3, bz + 8, VP.wood)
    // ghế ngang
    g.box(bx, 3, bz + 3, bx + 2, 3, bz + 3, VP.wood)
    // người chèo: chân, thân áo, đầu, nón lá hình chóp
    const px = bx + 1
    const pz = bz + 5
    g.box(px, 3, pz, px, 4, pz, VP.iron)
    g.box(px, 5, pz, px, 6, pz, SHIRT)
    g.set(px, 7, pz, SKIN)
    g.cylinder(px + 0.5, pz + 0.5, 1.9, 8, 8, HAT)
    g.cylinder(px + 0.5, pz + 0.5, 1.1, 9, 9, HAT)
    g.set(px, 10, pz, HAT)
    // hai tay + mái chèo thò ra hai bên xuống nước
    for (let k = 1; k <= 4; k++) {
      g.set(px - k, 6 - Math.min(k, 3) - (k > 3 ? 1 : 0) + 1, pz, VP.wood)
      g.set(px + k, 6 - Math.min(k, 3) - (k > 3 ? 1 : 0) + 1, pz, VP.wood)
    }
    g.set(px - 4, 2, pz, VP.wood)
    g.set(px + 4, 2, pz, VP.wood)
    // vệt sóng sau thuyền
    for (const [dx, dz] of [
      [0, 10],
      [1, 11],
      [-1, 11],
      [0, 12]
    ])
      g.set(bx + 1 + dx, 1, bz + dz, FOAM)
    hollow(g)
  }
}

/** Ô có phải là mặt trên của khối núi (cột bên cạnh thấp hơn hoặc bằng) — dùng để phủ cây */
function y0Top(
  heightAt: (x: number, z: number) => number,
  x: number,
  z: number,
  h: number
): boolean {
  return (
    heightAt(x + 1, z) <= h ||
    heightAt(x - 1, z) <= h ||
    heightAt(x, z + 1) <= h ||
    heightAt(x, z - 1) <= h
  )
}
