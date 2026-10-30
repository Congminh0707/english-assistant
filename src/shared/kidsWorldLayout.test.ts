import { describe, expect, it } from 'vitest'
import type { KidsPlaceFile } from './schemas/kidsWorld'
import { isVnLand, pointInPolygon, projectVn, VN_ISLANDS, VN_MAINLAND, VN_SIZE } from './vnMap'
import {
  bezier,
  clampCameraX,
  clampCameraY,
  geoLayout,
  levelPathLayout,
  PLACE_BOX,
  placesOverlap,
  polylineSampler,
  STAGE_H,
  STAGE_W,
  walkPoints
} from './kidsWorldLayout'

const IDS = Array.from({ length: 12 }, (_, i) => `p${i + 1}`)

describe('bố cục đường màn chơi', () => {
  const layout = levelPathLayout(IDS)

  it('không nơi nào đè lên nơi khác', () => {
    for (let i = 0; i < layout.points.length; i++) {
      for (let j = i + 1; j < layout.points.length; j++) {
        expect(placesOverlap(layout.points[i], layout.points[j])).toBe(false)
      }
    }
  })

  it('mọi nơi nằm trọn trong bề ngang sân khấu và trong chiều cao bản đồ', () => {
    for (const p of layout.points) {
      expect(p.x - PLACE_BOX.left).toBeGreaterThanOrEqual(0)
      expect(p.x + PLACE_BOX.right).toBeLessThanOrEqual(STAGE_W)
      expect(p.y - PLACE_BOX.top).toBeGreaterThanOrEqual(0)
      expect(p.y + PLACE_BOX.bottom).toBeLessThanOrEqual(layout.height)
    }
  })

  it('đường cong đi qua đúng từng nơi theo thứ tự', () => {
    expect(layout.legs).toHaveLength(IDS.length - 1)
    layout.legs.forEach((leg, i) => {
      expect(bezier(leg[0], 0)).toEqual({ x: layout.points[i].x, y: layout.points[i].y })
      expect(bezier(leg[leg.length - 1], 1)).toEqual({
        x: layout.points[i + 1].x,
        y: layout.points[i + 1].y
      })
    })
  })

  it('đường đi giữa hai nơi xa theo cả hai chiều, đầu cuối đúng chỗ', () => {
    const down = walkPoints(layout, 0, 3)
    const up = walkPoints(layout, 3, 0)
    expect(down[0]).toMatchObject({ x: layout.points[0].x, y: layout.points[0].y })
    expect(down[down.length - 1]).toMatchObject({ x: layout.points[3].x, y: layout.points[3].y })
    expect(up[up.length - 1]).toMatchObject({ x: layout.points[0].x, y: layout.points[0].y })
    expect(walkPoints(layout, 2, 2)).toHaveLength(1)
  })

  it('lấy mẫu theo quãng đường: u = 0 / 0,5 / 1', () => {
    const s = polylineSampler([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ])
    expect(s.length).toBe(200)
    expect(s.at(0)).toMatchObject({ x: 0, y: 0 })
    expect(s.at(0.5)).toMatchObject({ x: 100, y: 0 })
    expect(s.at(1)).toMatchObject({ x: 100, y: 100 })
  })

  it('bố cục theo bản đồ Việt Nam: đúng vị trí thật, tách vừa đủ để không đè', () => {
    const geo: Record<string, [number, number]> = {
      sapa: [22.34, 103.84],
      hanoi: [21.03, 105.85],
      halong: [20.95, 107.08],
      ninhbinh: [20.25, 105.97],
      hue: [16.46, 107.59],
      danang: [16.05, 108.2],
      hoian: [15.88, 108.33],
      nhatrang: [12.24, 109.19],
      dalat: [11.94, 108.44],
      hcmc: [10.78, 106.66],
      cantho: [10.03, 105.78],
      phuquoc: [10.23, 103.96]
    }
    const land = [VN_MAINLAND, ...VN_ISLANDS].map((poly) =>
      poly.map(([lo, la]) => projectVn(lo, la))
    )
    const places = Object.entries(geo).map(([id, [lat, lon]]) => ({ id, ...projectVn(lon, lat) }))
    for (const p of places) {
      expect(
        land.some((poly) => pointInPolygon(p, poly)),
        p.id
      ).toBe(true)
    }
    const vn = geoLayout(places, VN_SIZE)
    for (let i = 0; i < vn.points.length; i++) {
      for (let j = i + 1; j < vn.points.length; j++) {
        expect(
          placesOverlap(vn.points[i], vn.points[j]),
          `${vn.points[i].id}/${vn.points[j].id}`
        ).toBe(false)
      }
      // Không bị đẩy quá xa chỗ thật (~1,5 độ)
      const d = Math.hypot(vn.points[i].x - vn.anchors[i].x, vn.points[i].y - vn.anchors[i].y)
      expect(d, vn.points[i].id).toBeLessThan(450)
    }
    // Thứ tự bắc → nam vẫn giữ: Sa Pa ở trên cùng, Phú Quốc/Cần Thơ ở dưới
    const y = Object.fromEntries(vn.points.map((p) => [p.id, p.y]))
    expect(y.sapa).toBeLessThan(y.hue)
    expect(y.hue).toBeLessThan(y.hcmc)
    expect(clampCameraX(-1e6, vn)).toBeGreaterThan(0)
  })

  it('đường đi bám đất liền theo bản đồ (trừ tuyến phà), nối đúng mọi nơi theo thứ tự', () => {
    const files = import.meta.glob<KidsPlaceFile>(
      '../../content/curated/kids/world/places/*.json',
      {
        eager: true,
        import: 'default'
      }
    )
    const vnPlaces = Object.values(files)
      .map((f) => f.place)
      .filter((p) => p.tier === 'vn')
      .sort((a, b) => a.order - b.order)
    expect(vnPlaces.length).toBeGreaterThan(1)
    const vn = geoLayout(
      vnPlaces.map((p) => ({
        id: p.id,
        ...projectVn(p.geo?.lon ?? 0, p.geo?.lat ?? 0),
        via: p.via?.map(([lo, la]) => projectVn(lo, la)),
        ferry: p.ferry
      })),
      VN_SIZE,
      (p) => isVnLand(p)
    )
    // Bệ nằm trên đất/đảo; đường bộ lệch tối đa ~0,1 độ (bờ biển vẽ đơn giản hoá)
    for (const p of vn.points) expect(isVnLand(p, 30), p.id).toBe(true)
    vn.legs.forEach((leg, i) => {
      const name = `${vnPlaces[i].id} → ${vnPlaces[i + 1].id}`
      for (const s of leg) {
        if (s.sea) continue
        for (let k = 0; k <= 20; k++) expect(isVnLand(bezier(s, k / 20), 30), name).toBe(true)
      }
    })
    expect(vn.legs.flat().some((s) => s.sea)).toBe(true)
  })

  it('camera không trượt ra ngoài bản đồ', () => {
    expect(clampCameraY(-500, layout)).toBe(STAGE_H / 2)
    expect(clampCameraY(1e6, layout)).toBe(layout.height - STAGE_H / 2)
    const tiny = levelPathLayout(['a'])
    expect(clampCameraY(999, tiny)).toBe(STAGE_H / 2)
  })
})
