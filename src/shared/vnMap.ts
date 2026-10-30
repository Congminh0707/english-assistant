// Bản đồ Việt Nam giản lược cho màn game bé (docs/19-kids-world.md §5.4, decisions #37): đường bờ/biên giới đất liền
// lấy điểm thưa theo kinh độ/vĩ độ (tự soạn, proprietary-own — chỉ để bé nhận ra hình chữ S, không phải bản đồ chính
// xác), các đảo lớn, hai quần đảo Hoàng Sa và Trường Sa, hai con sông lớn. Không vẽ nước láng giềng hay đường biên.
// Toạ độ [kinh độ, vĩ độ].
export type LonLat = readonly [number, number]

export const VN_MAINLAND: readonly LonLat[] = [
  // Biên giới phía bắc, tây → đông
  [102.14, 22.4],
  [102.4, 22.7],
  [102.85, 22.62],
  [103.15, 22.78],
  [103.55, 22.62],
  [103.97, 22.52],
  [104.35, 22.72],
  [104.75, 22.82],
  [105.05, 23.1],
  [105.33, 23.38],
  [105.65, 23.22],
  [105.9, 22.95],
  [106.3, 22.92],
  [106.7, 22.85],
  [106.6, 22.4],
  [106.75, 22.05],
  [107.05, 21.85],
  [107.45, 21.65],
  [107.98, 21.53],
  // Bờ biển, bắc → nam
  [107.75, 21.35],
  [107.4, 21.02],
  [107.15, 20.85],
  [106.8, 20.72],
  [106.62, 20.45],
  [106.35, 20.15],
  [106.05, 19.95],
  [105.85, 19.65],
  [105.75, 19.15],
  [105.75, 18.8],
  [106.0, 18.45],
  [106.4, 18.05],
  [106.62, 17.5],
  [106.95, 17.15],
  [107.3, 16.8],
  [107.65, 16.55],
  [108.0, 16.25],
  [108.25, 16.08],
  [108.38, 15.85],
  [108.7, 15.45],
  [108.9, 15.1],
  [109.05, 14.6],
  [109.2, 14.0],
  [109.25, 13.6],
  [109.32, 13.1],
  [109.46, 12.7],
  [109.25, 12.3],
  [109.2, 11.9],
  [109.05, 11.55],
  [108.75, 11.2],
  [108.35, 10.95],
  [107.9, 10.75],
  [107.45, 10.5],
  [107.1, 10.35],
  [106.8, 10.35],
  [106.7, 10.1],
  [106.55, 9.8],
  [106.35, 9.55],
  [106.1, 9.35],
  [105.75, 9.15],
  [105.4, 8.85],
  [105.05, 8.65],
  [104.75, 8.6],
  // Bờ tây Cà Mau → Hà Tiên
  [104.8, 8.95],
  [104.85, 9.4],
  [104.95, 9.8],
  [105.05, 10.0],
  [104.75, 10.2],
  [104.5, 10.4],
  // Biên giới phía tây, nam → bắc
  [104.85, 10.55],
  [105.1, 10.85],
  [105.45, 10.95],
  [105.85, 10.85],
  [106.15, 11.05],
  [106.2, 11.4],
  [106.45, 11.7],
  [106.85, 11.95],
  [107.35, 12.2],
  [107.55, 12.65],
  [107.55, 13.2],
  [107.45, 13.7],
  [107.6, 14.2],
  [107.55, 14.7],
  [107.35, 15.1],
  [107.2, 15.55],
  [107.45, 15.9],
  [107.2, 16.2],
  [106.85, 16.4],
  [106.65, 16.6],
  [106.55, 16.95],
  [106.25, 17.25],
  [105.9, 17.6],
  [105.6, 18.0],
  [105.2, 18.4],
  [104.75, 18.75],
  [104.25, 19.05],
  [104.05, 19.35],
  [104.45, 19.7],
  [104.85, 19.95],
  [104.6, 20.3],
  [104.4, 20.7],
  [104.05, 20.9],
  [103.6, 20.75],
  [103.25, 20.95],
  [103.05, 21.3],
  [102.9, 21.7],
  [102.65, 21.85],
  [102.5, 22.1]
]

/** Đảo vẽ thành hình (Phú Quốc) */
export const VN_ISLANDS: ReadonlyArray<readonly LonLat[]> = [
  [
    [103.85, 10.45],
    [104.05, 10.42],
    [104.08, 10.2],
    [104.02, 10.02],
    [103.92, 10.05],
    [103.88, 10.25]
  ]
]

/** Đảo nhỏ vẽ thành chấm: [kinh độ, vĩ độ, bán kính theo độ] */
export const VN_ISLETS: ReadonlyArray<readonly [number, number, number]> = [
  [106.6, 8.68, 0.07],
  [107.03, 20.8, 0.06],
  [107.72, 20.13, 0.03],
  [109.1, 15.38, 0.03],
  [108.65, 10.52, 0.04]
]

/** Quần đảo: tên (khoá i18n), vị trí nhãn, các đảo */
export const VN_ARCHIPELAGOS: ReadonlyArray<{
  id: 'paracel' | 'spratly'
  label: LonLat
  islets: readonly LonLat[]
}> = [
  {
    id: 'paracel',
    label: [111.95, 15.75],
    islets: [
      [111.6, 16.5],
      [111.75, 16.55],
      [112.0, 16.45],
      [112.25, 16.85],
      [112.35, 16.97],
      [112.72, 16.66],
      [111.2, 15.8],
      [111.5, 16.05]
    ]
  },
  {
    id: 'spratly',
    label: [113.4, 9.5],
    islets: [
      [114.3, 10.4],
      [114.1, 10.9],
      [113.8, 10.2],
      [112.9, 9.9],
      [114.4, 11.45],
      [111.9, 8.65],
      [113.3, 8.85],
      [114.0, 9.4],
      [112.8, 8.1],
      [114.6, 10.0]
    ]
  }
]

export const VN_RIVERS: ReadonlyArray<readonly LonLat[]> = [
  // Sông Hồng
  [
    [103.97, 22.52],
    [104.5, 22.0],
    [104.95, 21.6],
    [105.45, 21.25],
    [105.85, 21.03],
    [106.2, 20.62],
    [106.5, 20.3]
  ],
  // Sông Cửu Long (Tiền)
  [
    [105.1, 10.85],
    [105.45, 10.45],
    [105.78, 10.12],
    [106.15, 9.85],
    [106.5, 9.65]
  ]
]

/** Nhãn biển (khoá i18n) */
export const VN_SEA_LABEL: LonLat = [110.6, 13.3]

/** Vùng núi (đặt hình núi): [kinh độ, vĩ độ, bán kính theo độ] */
export const VN_MOUNTAINS: ReadonlyArray<readonly [number, number, number]> = [
  [103.6, 22.15, 0.45],
  [104.3, 21.7, 0.4],
  [105.2, 22.5, 0.4],
  [104.6, 20.6, 0.35],
  [105.5, 18.5, 0.3],
  [106.6, 16.6, 0.25],
  [107.75, 14.5, 0.45],
  [108.0, 13.0, 0.4],
  [107.9, 12.0, 0.3]
]

// --- Phép chiếu (đơn vị sân khấu) ---

export const VN_LON0 = 101.2
export const VN_LAT_TOP = 24.3
export const VN_LON1 = 115.5
export const VN_LAT_BOTTOM = 7.3
/** Đơn vị sân khấu cho một độ vĩ / một độ kinh (≈ cos 16°) */
export const VN_PER_LAT = 300
export const VN_PER_LON = 290

export function projectVn(lon: number, lat: number): { x: number; y: number } {
  return { x: (lon - VN_LON0) * VN_PER_LON, y: (VN_LAT_TOP - lat) * VN_PER_LAT }
}

export const VN_SIZE = {
  width: (VN_LON1 - VN_LON0) * VN_PER_LON,
  height: (VN_LAT_TOP - VN_LAT_BOTTOM) * VN_PER_LAT
}

export function pointInPolygon(
  p: { x: number; y: number },
  poly: ReadonlyArray<{ x: number; y: number }>
): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

let landPolys: Array<Array<{ x: number; y: number }>> | null = null

/** Điểm (đơn vị sân khấu) nằm trên đất liền hoặc đảo lớn; `margin` cho phép lệch ra biển một chút */
export function isVnLand(p: { x: number; y: number }, margin = 0): boolean {
  landPolys ??= [VN_MAINLAND, ...VN_ISLANDS].map((poly) =>
    poly.map(([lo, la]) => projectVn(lo, la))
  )
  const probes =
    margin > 0
      ? [
          [0, 0],
          [margin, 0],
          [-margin, 0],
          [0, margin],
          [0, -margin]
        ]
      : [[0, 0]]
  return probes.some(([dx, dy]) =>
    landPolys!.some((poly) => pointInPolygon({ x: p.x + dx, y: p.y + dy }, poly))
  )
}
