import { describe, expect, it } from 'vitest'
import { VN_ARCHIPELAGOS, projectVn } from './vnMap'
import { TERRAIN_UNIT, buildVnHeightfield } from './vnHeightfield'

const unit = (lon: number, lat: number): { x: number; z: number } => {
  const p = projectVn(lon, lat)
  return { x: p.x / TERRAIN_UNIT, z: p.y / TERRAIN_UNIT }
}
const pad = { ...unit(108.2, 16.05), r: 5 }
const hf = buildVnHeightfield([pad])
const at = (lon: number, lat: number): number => {
  const p = unit(lon, lat)
  return hf.heightAt(p.x, p.z)
}

describe('buildVnHeightfield', () => {
  it('đất liền cao hơn mặt nước, biển ngoài khơi thấp hơn', () => {
    expect(at(106.1, 21.5)).toBeGreaterThan(0.3) // châu thổ sông Hồng
    expect(at(106.7, 10.8)).toBeGreaterThan(0.3) // TP.HCM
    expect(at(112.5, 13.5)).toBeLessThan(-1) // biển Đông
  })

  it('núi Tây Bắc cao hơn đồng bằng sông Hồng', () => {
    expect(at(103.6, 22.15)).toBeGreaterThan(at(106.1, 21.5) + 4)
  })

  it('có Phú Quốc, Hoàng Sa, Trường Sa nhô khỏi mặt nước', () => {
    expect(at(104.0, 10.25)).toBeGreaterThan(0)
    for (const a of VN_ARCHIPELAGOS) {
      const [lon, lat] = a.islets[0]
      expect(at(lon, lat), a.id).toBeGreaterThan(0)
    }
  })

  it('nền phẳng của công trình đúng độ cao và có chỗ trồng cây ở nơi khác', () => {
    expect(hf.heightAt(pad.x, pad.z)).toBeCloseTo(hf.padHeights[0], 1)
    expect(hf.heightAt(pad.x + 2, pad.z + 2)).toBeCloseTo(hf.padHeights[0], 1)
    expect(hf.trees.length / 8).toBeGreaterThan(3000)
    expect(hf.houses.length / 6).toBeGreaterThan(100)
    for (let i = 0; i < hf.trees.length; i += 8 * 97) {
      const d = Math.hypot(hf.trees[i] - pad.x, hf.trees[i + 2] - pad.z)
      expect(d).toBeGreaterThan(pad.r)
    }
  })
})
