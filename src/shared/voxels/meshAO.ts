// Chia mặt voxel có "che sáng" (ambient occlusion) theo đỉnh: mỗi mặt lộ ra là một ô vuông riêng, bốn đỉnh tối dần khi
// sát tường/góc lõm → vật trông có khối, không phẳng như greedy mesh. Có thể thêm nhiễu màu nhẹ theo ô cho bề mặt đỡ trơn.
// Đầu ra là mảng kiểu số (Float32/Uint32) cho three.js. Thuần dữ liệu. docs/19-kids-world.md §5.2
import type { VoxelGrid } from './voxelGrid'

export interface VoxelMeshAO {
  positions: Float32Array
  normals: Float32Array
  /** RGB tuyến tính (đã nhân độ sáng AO) */
  colors: Float32Array
  indices: Uint32Array
  quads: number
}

export interface AOOptions {
  /** Độ lệch sáng ngẫu nhiên theo ô (0 = không), vd 0.05 */
  jitter?: number
  /** Độ tối của AO ở góc kín nhất (0–1), mặc định 0.5 */
  strength?: number
}

const lin = (hex: string): [number, number, number] =>
  [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2)) as [
    number,
    number,
    number
  ]

function hash(x: number, y: number, z: number): number {
  let n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(z + 7, 1274126177)
  n = Math.imul(n ^ (n >>> 13), 1103515245)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

/** Mặt trên sáng hơn, mặt bên tối hơn một chút (ánh sáng chính từ trên) */
const FACE_LIGHT = [0.86, 1, 0.9] // theo trục d: x, y, z (hướng dương) — hướng âm nhân thêm FACE_NEG
const FACE_NEG = [0.74, 0.62, 0.8]

export function meshVoxelsAO(grid: VoxelGrid, opts: AOOptions = {}): VoxelMeshAO {
  const jitter = opts.jitter ?? 0
  const strength = opts.strength ?? 0.5
  const dims = [grid.sx, grid.sy, grid.sz]
  const solid = (x: number, y: number, z: number): number => (grid.get(x, y, z) ? 1 : 0)

  // đếm mặt trước để cấp mảng một lần
  let faces = 0
  for (const v of grid.voxels()) {
    for (let d = 0; d < 3; d++)
      for (const s of [-1, 1]) {
        const n = [v.x, v.y, v.z]
        n[d] += s
        if (!solid(n[0], n[1], n[2])) faces++
      }
  }
  const out: VoxelMeshAO = {
    positions: new Float32Array(faces * 12),
    normals: new Float32Array(faces * 12),
    colors: new Float32Array(faces * 12),
    indices: new Uint32Array(faces * 6),
    quads: faces
  }
  const cache = new Map<string, [number, number, number]>()
  let q = 0
  const brightness = [1 - strength, 1 - strength * 0.62, 1 - strength * 0.3, 1]
  for (const v of grid.voxels()) {
    let base = cache.get(v.color)
    if (!base) {
      base = lin(v.color)
      cache.set(v.color, base)
    }
    const jit = jitter > 0 ? 1 + (hash(v.x, v.y, v.z) - 0.5) * 2 * jitter : 1
    const p = [v.x, v.y, v.z]
    for (let d = 0; d < 3; d++) {
      const u = (d + 1) % 3
      const w = (d + 2) % 3
      for (const s of [-1, 1]) {
        const n = [p[0], p[1], p[2]]
        n[d] += s
        if (solid(n[0], n[1], n[2])) continue
        const light = (s > 0 ? FACE_LIGHT[d] : FACE_LIGHT[d] * FACE_NEG[d]) * jit
        const ao: number[] = []
        const corner = [0, 0, 0]
        const idxs: Array<[number, number]> = [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1]
        ]
        for (const [i, j] of idxs) {
          const su = i ? 1 : -1
          const sw = j ? 1 : -1
          const at = (a: number, b: number): number => {
            corner[d] = n[d]
            corner[u] = n[u] + a
            corner[w] = n[w] + b
            return solid(corner[0], corner[1], corner[2])
          }
          const s1 = at(su, 0)
          const s2 = at(0, sw)
          const c = at(su, sw)
          ao.push(s1 && s2 ? 0 : 3 - (s1 + s2 + c))
        }
        const vi = q * 4
        for (let k = 0; k < 4; k++) {
          const [i, j] = idxs[k]
          const pos = [p[0], p[1], p[2]]
          pos[d] += s > 0 ? 1 : 0
          pos[u] += i
          pos[w] += j
          const o = (vi + k) * 3
          out.positions[o] = pos[0]
          out.positions[o + 1] = pos[1]
          out.positions[o + 2] = pos[2]
          out.normals[o + d] = s
          const b = brightness[ao[k]] * light
          out.colors[o] = base[0] * b
          out.colors[o + 1] = base[1] * b
          out.colors[o + 2] = base[2] * b
        }
        // chọn đường chéo theo AO để không lộ vệt; chiều quay đảo khi s < 0 để mặt hướng ra ngoài
        const flip = ao[0] + ao[2] > ao[1] + ao[3]
        const t = flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3]
        const ii = q * 6
        for (let k = 0; k < 6; k++) {
          const idx = s > 0 ? t[k] : t[5 - k]
          out.indices[ii + k] = vi + idx
        }
        q++
      }
    }
  }
  void dims
  return out
}
