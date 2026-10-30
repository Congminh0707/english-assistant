import { describe, expect, it } from 'vitest'
import { VN_ARCHIPELAGOS, projectVn } from '../vnMap'
import { meshVoxels } from './mesh'
import { SEA_TOP, buildVnTerrain, terrainHeightAt } from './vnTerrain'

const terrain = buildVnTerrain()
const at = (lon: number, lat: number): number => terrainHeightAt(terrain, projectVn(lon, lat))

describe('buildVnTerrain', () => {
  it('đất liền cao hơn mặt biển, biển ngoài khơi thì không', () => {
    expect(at(105.85, 21.03)).toBeGreaterThan(SEA_TOP) // Hà Nội
    expect(at(106.7, 10.8)).toBeGreaterThan(SEA_TOP) // TP.HCM
    const sea = projectVn(112.5, 13.5)
    const col = Math.floor(sea.x / 45)
    const row = Math.floor(sea.y / 45)
    expect(terrain.heights[row * terrain.cols + col]).toBe(0)
  })

  it('vùng núi Tây Bắc cao hơn đồng bằng sông Hồng', () => {
    expect(at(103.6, 22.15)).toBeGreaterThan(at(105.85, 21.03))
  })

  it('có Phú Quốc, Hoàng Sa, Trường Sa', () => {
    expect(at(104.0, 10.25)).toBeGreaterThan(0)
    for (const a of VN_ARCHIPELAGOS) {
      const [lon, lat] = a.islets[0]
      const p = projectVn(lon, lat)
      expect(
        terrain.heights[Math.floor(p.y / 45) * terrain.cols + Math.floor(p.x / 45)],
        a.id
      ).toBeGreaterThan(0)
    }
  })

  it('chia mặt được và gọn', () => {
    const quads = meshVoxels(terrain.grid).quads
    expect(quads).toBeGreaterThan(1000)
    expect(quads).toBeLessThan(terrain.grid.count() * 6)
  })
})
