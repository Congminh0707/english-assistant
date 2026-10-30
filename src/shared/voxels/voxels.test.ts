import { describe, expect, it } from 'vitest'
import { isometric, isometricRects } from './isometric'
import { LANDMARKS, LANDMARK_IDS, landmarkGrid, landmarkImage } from './landmarks'
import { meshVoxels } from './mesh'
import { VoxelGrid } from './voxelGrid'

describe('VoxelGrid', () => {
  it('ghi/đọc ô, bỏ qua ngoài lưới, bảng màu dùng lại', () => {
    const g = new VoxelGrid(4, 4, 4)
    g.set(1, 2, 3, '#ff0000')
    g.set(9, 9, 9, '#ff0000')
    expect(g.get(1, 2, 3)).toBe('#ff0000')
    expect(g.get(9, 9, 9)).toBeNull()
    g.set(0, 0, 0, '#ff0000')
    expect(g.palette).toEqual(['', '#ff0000'])
    g.set(1, 2, 3, null)
    expect(g.count()).toBe(1)
  })

  it('hộp, hộp rỗng, trụ, mái', () => {
    const g = new VoxelGrid(10, 10, 10)
    g.box(0, 0, 0, 2, 1, 3, '#111111')
    expect(g.count()).toBe(3 * 2 * 4)
    const s = new VoxelGrid(5, 1, 5)
    s.shell(0, 0, 0, 4, 0, 4, '#222222')
    expect(s.count()).toBe(25 - 9)
    const c = new VoxelGrid(9, 3, 9)
    c.cylinder(4.5, 4.5, 2, 0, 2, '#333333')
    expect(c.get(4, 1, 4)).toBe('#333333')
    expect(c.get(0, 1, 0)).toBeNull()
    const r = new VoxelGrid(5, 5, 5)
    expect(r.hipRoof(0, 0, 4, 4, 0, '#444444')).toBe(2)
    expect(r.count()).toBe(25 + 9 + 1)
    const gr = new VoxelGrid(6, 5, 5)
    expect(gr.gableRoof(0, 0, 5, 4, 0, 'x', '#555555')).toBe(2)
    expect(gr.get(3, 2, 2)).toBe('#555555')
    expect(gr.get(3, 2, 0)).toBeNull()
  })

  it('chép gương theo x', () => {
    const g = new VoxelGrid(6, 1, 1)
    g.set(0, 0, 0, '#abcdef')
    g.mirrorX()
    expect(g.get(5, 0, 0)).toBe('#abcdef')
  })
})

describe('meshVoxels', () => {
  it('một khối: 6 mặt, 24 đỉnh, 36 chỉ số', () => {
    const g = new VoxelGrid(1, 1, 1)
    g.set(0, 0, 0, '#ffffff')
    const m = meshVoxels(g)
    expect(m.quads).toBe(6)
    expect(m.positions).toHaveLength(24 * 3)
    expect(m.indices).toHaveLength(36)
    expect(m.colors.slice(0, 3)).toEqual([1, 1, 1])
  })

  it('gộp mặt cùng màu: hộp 4×2×3 vẫn chỉ 6 mặt; khác màu thì tách', () => {
    const g = new VoxelGrid(4, 2, 3)
    g.box(0, 0, 0, 3, 1, 2, '#00ff00')
    expect(meshVoxels(g).quads).toBe(6)
    g.set(0, 0, 0, '#ff0000')
    expect(meshVoxels(g).quads).toBeGreaterThan(6)
  })

  it('mặt kẹp giữa hai khối không được vẽ; pháp tuyến hướng ra ngoài', () => {
    const g = new VoxelGrid(2, 1, 1)
    g.box(0, 0, 0, 1, 0, 0, '#808080')
    const m = meshVoxels(g)
    expect(m.quads).toBe(6)
    // Mặt ở x = 0 có pháp tuyến -x, mặt ở x = 2 có pháp tuyến +x
    for (let i = 0; i < m.positions.length / 3; i++) {
      const [x, nx] = [m.positions[i * 3], m.normals[i * 3]]
      if (nx === -1) expect(x).toBe(0)
      if (nx === 1) expect(x).toBe(2)
    }
  })
})

describe('isometric', () => {
  it('một khối thành hình 4×4 với ba sắc độ', () => {
    const g = new VoxelGrid(1, 1, 1)
    g.set(0, 0, 0, '#808080')
    const img = isometric(g)
    expect([img.width, img.height]).toEqual([4, 4])
    expect(new Set(img.pixels.map((p) => p.color)).size).toBe(3)
  })

  it('lưới rỗng → hình rỗng; kết quả có cache theo id', () => {
    expect(isometric(new VoxelGrid(2, 2, 2)).pixels).toEqual([])
    let builds = 0
    const build = (): VoxelGrid => {
      builds++
      const g = new VoxelGrid(1, 1, 1)
      g.set(0, 0, 0, '#123456')
      return g
    }
    isometricRects('test-cache', build)
    isometricRects('test-cache', build)
    expect(builds).toBe(1)
  })
})

describe('công trình voxel', () => {
  it('mỗi công trình dựng được, đủ chi tiết, chiếu ra hình 2D', () => {
    expect(LANDMARK_IDS.length).toBeGreaterThan(0)
    for (const id of LANDMARK_IDS) {
      const size = LANDMARKS[id].size
      for (const s of size) expect(s, id).toBeLessThanOrEqual(96)
      const g = landmarkGrid(id)!
      expect(g.count(), id).toBeGreaterThan(1000)
      const img = landmarkImage(id)!
      expect(img.rects.length, id).toBeGreaterThan(100)
      expect(meshVoxels(g).quads, id).toBeLessThan(g.count() * 6)
    }
    expect(landmarkGrid('nope')).toBeUndefined()
  })
})
