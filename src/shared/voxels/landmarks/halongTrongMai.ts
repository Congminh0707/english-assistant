// Hòn Trống Mái (Vịnh Hạ Long): hai khối đá vôi cao nghiêng vào nhau như đôi gà âu yếm, mọc lên từ mặt biển,
// đỉnh phủ cây xanh; phía trước một chiếc thuyền buồm truyền thống cánh nâu đỏ. docs/19-kids-world.md §2.3
import { VP } from '../palette'
import type { VoxelModel } from '../voxelGrid'

const ROCK_LIGHT = '#8f9b92'
const ROCK_WARM = '#a39f8e'
const ROCK_SHADOW = '#5d6861'
const SAIL_BROWN = '#a0643a'
const SAIL_RED = '#b8402e'
const FOAM = '#e6f6ff'

/** Nhiễu giả ngẫu nhiên cố định theo toạ độ, trong [0, 1) */
function noise(x: number, y: number, z: number): number {
  let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(z + 7, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1103515245)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

interface Pillar {
  x0: number
  x1: number
  z0: number
  z1: number
  y0: number
  y1: number
  r0: number
  r1: number
}

export const halongTrongMai: VoxelModel = {
  id: 'halong-trong-mai',
  size: [40, 36, 30],
  build: (g) => {
    // Biển
    g.box(0, 0, 0, 39, 0, 29, VP.waterDeep)
    g.box(0, 1, 0, 39, 1, 29, VP.water)
    for (let i = 0; i < 36; i++) {
      const x = Math.floor(noise(i, 1, 2) * 40)
      const z = Math.floor(noise(i, 3, 4) * 30)
      if (noise(x, 5, z) > 0.5) g.set(x, 1, z, FOAM)
    }

    // Chân đá chung (đảo nhỏ) nối hai hòn + bọt sóng quanh chân
    g.ellipsoid(20, 3, 15, 13, 3.2, 8.5, ROCK_SHADOW)
    g.fill(
      (x, y, z) => ((x - 20) / 11.5) ** 2 + ((y - 3.4) / 3) ** 2 + ((z - 15) / 7.2) ** 2 <= 1,
      VP.rock,
      [8, 2, 8, 33, 7, 23]
    )
    g.fill(
      (x, y, z) =>
        y > 2 &&
        noise(Math.floor(x), Math.floor(y), Math.floor(z)) > 0.75 &&
        g.get(Math.floor(x), Math.floor(y), Math.floor(z)) !== null,
      ROCK_LIGHT,
      [6, 2, 6, 34, 7, 24]
    )
    g.fill(
      (x, _y, z) => {
        const d = ((x - 20) / 14) ** 2 + ((z - 15) / 9.6) ** 2
        return d > 0.9 && d < 1.12 && noise(Math.floor(x), 7, Math.floor(z)) > 0.3
      },
      FOAM,
      [4, 1, 4, 37, 2, 28]
    )

    // Hai trụ đá nghiêng vào nhau: Trống (cao, phía sau trái) và Mái (thấp hơn, phía trước phải)
    const pillars: Pillar[] = [
      { x0: 12.5, x1: 18, z0: 20, z1: 14.5, y0: 4, y1: 33, r0: 5.2, r1: 2.1 },
      { x0: 28, x1: 21.8, z0: 10, z1: 13.4, y0: 4, y1: 27, r0: 4.6, r1: 1.7 }
    ]
    for (const p of pillars) {
      for (let y = p.y0; y <= p.y1; y++) {
        const t = (y - p.y0) / (p.y1 - p.y0)
        const lean = t ** 1.25
        const cx = p.x0 + (p.x1 - p.x0) * lean
        const cz = p.z0 + (p.z1 - p.z0) * lean
        const waist = 1 + 0.12 * Math.sin(t * 9) // thân gồ ghề, có chỗ thắt
        const r = (p.r0 + (p.r1 - p.r0) * t ** 0.85) * waist
        for (let z = 0; z < 30; z++)
          for (let x = 0; x < 40; x++) {
            const dx = x + 0.5 - cx
            const dz = (z + 0.5 - cz) / 0.86
            const rr = r + (noise(x, y, z) - 0.5) * 1.3
            if (Math.hypot(dx, dz) > rr) continue
            const n = noise(x + 3, y, z + 5)
            let color = y % 5 === 0 ? ROCK_LIGHT : VP.rock
            if (n > 0.86) color = ROCK_WARM
            else if (n < 0.14) color = ROCK_SHADOW
            if (dx < -0.4 * rr) color = ROCK_SHADOW // mặt khuất bên trái tối hơn
            g.set(x, y, z, color)
          }
      }
      // mũ cây xanh trên đỉnh + vài chỏm cây bám vách
      const top = p.y1
      const tcx = p.x1
      g.ellipsoid(tcx, top + 0.6, p.z1, p.r1 + 1.6, 1.8, p.r1 * 0.9 + 1.4, VP.leaf)
      g.ellipsoid(tcx + 0.4, top + 1.6, p.z1 + 0.3, p.r1 + 0.4, 1.2, p.r1 * 0.8 + 0.4, VP.leafLight)
    }
    // cây bám vách
    for (let y = 8; y < 30; y++)
      for (let z = 0; z < 30; z++)
        for (let x = 0; x < 40; x++) {
          const c = g.get(x, y, z)
          if (c === null || c === VP.leaf || c === VP.leafLight) continue
          if (g.get(x, y + 1, z) === null && noise(x, y, z + 11) > 0.55)
            g.set(x, y, z, VP.grassDark)
        }

    // Thuyền buồm truyền thống: thân gỗ cong, hai cánh buồm nâu và đỏ
    const bx = 21
    const bz = 26
    g.box(bx + 1, 2, bz, bx + 10, 2, bz + 2, VP.woodDark)
    g.box(bx, 3, bz, bx + 11, 3, bz + 2, VP.wood)
    g.box(bx - 1, 4, bz, bx + 12, 4, bz + 2, VP.woodDark)
    g.box(bx - 1, 4, bz + 1, bx + 12, 4, bz + 1, VP.wood)
    g.box(bx + 12, 5, bz, bx + 13, 5, bz + 2, VP.woodDark) // mũi cong lên
    g.box(bx + 1, 3, bz + 3, bx + 10, 3, bz + 3, VP.woodRed) // dải sơn đỏ dọc mạn
    g.box(bx - 2, 5, bz + 1, bx - 2, 5, bz + 1, VP.woodDark) // đuôi
    // buồm
    const sail = (mx: number, h: number, color: string, w: number): void => {
      g.box(mx, 5, bz + 1, mx, 5 + h + 1, bz + 1, VP.woodDark) // cột
      for (let dx = 0; dx < w; dx++) {
        const top = 5 + h - (w - 1 - dx) * 0.5
        for (let y = 6; y <= top; y++) {
          const batten = (y - 6) % 2 === 1
          g.set(mx + 1 + dx, y, bz + 1, batten ? VP.woodDark : color)
        }
      }
    }
    sail(bx + 3, 11, SAIL_BROWN, 6)
    sail(bx + 9, 8, SAIL_RED, 4)
    g.set(bx + 3, 5 + 12, bz + 1, VP.lacquer) // cờ nhỏ
  }
}
