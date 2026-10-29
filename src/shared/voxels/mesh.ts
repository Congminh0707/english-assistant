// Chuyển lưới voxel thành hình học tam giác gọn (greedy meshing): chỉ giữ mặt lộ ra ngoài, gộp các mặt kề nhau
// cùng màu cùng hướng thành hình chữ nhật lớn. Đầu ra là mảng số thuần (vị trí, pháp tuyến, màu theo đỉnh, chỉ số)
// để three.js dựng BufferGeometry, hoặc script build ghi vào gói. docs/19-kids-world.md §5.2
import type { VoxelGrid } from './voxelGrid'

export interface VoxelMesh {
  positions: number[]
  normals: number[]
  /** RGB 0–1 theo từng đỉnh */
  colors: number[]
  indices: number[]
  /** Số mặt chữ nhật sau khi gộp */
  quads: number
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
}

export function meshVoxels(grid: VoxelGrid): VoxelMesh {
  const out: VoxelMesh = { positions: [], normals: [], colors: [], indices: [], quads: 0 }
  const dims = [grid.sx, grid.sy, grid.sz]
  const at = (p: number[]): string | null => grid.get(p[0], p[1], p[2])

  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3
    const v = (d + 2) % 3
    const pos = [0, 0, 0]
    const step = [0, 0, 0]
    step[d] = 1
    // mask: màu của mặt tại lát cắt, dấu cho biết mặt hướng âm/dương
    const mask: Array<{ color: string; back: boolean } | null> = new Array(dims[u] * dims[v])
    for (pos[d] = -1; pos[d] < dims[d];) {
      let n = 0
      for (pos[v] = 0; pos[v] < dims[v]; pos[v]++)
        for (pos[u] = 0; pos[u] < dims[u]; pos[u]++) {
          const a = pos[d] >= 0 ? at(pos) : null
          const b =
            pos[d] < dims[d] - 1 ? at([pos[0] + step[0], pos[1] + step[1], pos[2] + step[2]]) : null
          mask[n++] =
            a && !b ? { color: a, back: false } : !a && b ? { color: b, back: true } : null
        }
      pos[d]++
      n = 0
      for (let j = 0; j < dims[v]; j++)
        for (let i = 0; i < dims[u];) {
          const m = mask[n]
          if (!m) {
            i++
            n++
            continue
          }
          const same = (k: number): boolean =>
            !!mask[k] && mask[k]!.color === m.color && mask[k]!.back === m.back
          let w = 1
          while (i + w < dims[u] && same(n + w)) w++
          let h = 1
          grow: while (j + h < dims[v]) {
            for (let k = 0; k < w; k++) if (!same(n + k + h * dims[u])) break grow
            h++
          }
          const base = [0, 0, 0]
          base[d] = pos[d]
          base[u] = i
          base[v] = j
          const du = [0, 0, 0]
          du[u] = w
          const dv = [0, 0, 0]
          dv[v] = h
          addQuad(out, base, du, dv, d, m.back, rgb(m.color))
          for (let l = 0; l < h; l++) for (let k = 0; k < w; k++) mask[n + k + l * dims[u]] = null
          i += w
          n += w
        }
    }
  }
  return out
}

function addQuad(
  out: VoxelMesh,
  base: number[],
  du: number[],
  dv: number[],
  axis: number,
  back: boolean,
  color: [number, number, number]
): void {
  const start = out.positions.length / 3
  const corners = [
    base,
    [base[0] + du[0], base[1] + du[1], base[2] + du[2]],
    [base[0] + du[0] + dv[0], base[1] + du[1] + dv[1], base[2] + du[2] + dv[2]],
    [base[0] + dv[0], base[1] + dv[1], base[2] + dv[2]]
  ]
  const normal = [0, 0, 0]
  normal[axis] = back ? -1 : 1
  for (const c of corners) {
    out.positions.push(c[0], c[1], c[2])
    out.normals.push(normal[0], normal[1], normal[2])
    out.colors.push(...color)
  }
  // Thứ tự đỉnh ngược chiều kim đồng hồ khi nhìn từ phía pháp tuyến
  if (back) out.indices.push(start, start + 2, start + 1, start, start + 3, start + 2)
  else out.indices.push(start, start + 1, start + 2, start, start + 2, start + 3)
  out.quads++
}
