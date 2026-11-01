// 9 kỳ quan tầng Trái Đất (docs/23-design-v2-spec.md §3): id công trình, toạ độ thật, tên châu lục. Thuần dữ liệu.
export type ContinentId =
  | 'asia'
  | 'europe'
  | 'africa'
  | 'northAmerica'
  | 'southAmerica'
  | 'oceania'
  | 'antarctica'

export interface Wonder {
  /** Trùng `place.landmark` trong nội dung, và tên ảnh game/wonders/<id>.webp */
  id: string
  lat: number
  lon: number
  continent: ContinentId
}

export const EARTH_WONDERS: readonly Wonder[] = [
  { id: 'wonder-liberty', lat: 40.69, lon: -74.04, continent: 'northAmerica' },
  { id: 'wonder-chichen', lat: 20.68, lon: -88.57, continent: 'northAmerica' },
  { id: 'wonder-machu', lat: -13.16, lon: -72.55, continent: 'southAmerica' },
  { id: 'wonder-christ', lat: -22.95, lon: -43.21, continent: 'southAmerica' },
  { id: 'wonder-colosseum', lat: 41.89, lon: 12.49, continent: 'europe' },
  { id: 'wonder-giza', lat: 29.98, lon: 31.13, continent: 'africa' },
  { id: 'wonder-taj', lat: 27.18, lon: 78.04, continent: 'asia' },
  { id: 'wonder-wall', lat: 40.43, lon: 116.57, continent: 'asia' },
  { id: 'wonder-sydney', lat: -33.86, lon: 151.21, continent: 'oceania' }
]

export const WONDER_IDS: readonly string[] = EARTH_WONDERS.map((w) => w.id)
