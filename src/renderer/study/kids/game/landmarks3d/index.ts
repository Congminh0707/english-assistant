// Công trình 3D (mịn, cùng phong cách địa hình) cho bản đồ game — id khớp `place.landmark`. Các mô hình voxel trong
// src/shared/voxels chỉ còn dùng ở bản đồ 2D và sticker. docs/19-kids-world.md §5.2
import type * as ThreeNS from 'three'
import { dragonBridge, halongBay, sapaValley, trangAn } from './detailed2'
import { hanoiHoGuom, hcmcBenThanh2, hoianChuaCau, hueNgoMon2 } from './detailed'
import { caiRang, dalatStation2, hamNinh, ponagar } from './detailed3'

type Builder = (THREE: typeof ThreeNS) => ThreeNS.Group

export const LANDMARKS_3D: Record<string, Builder> = {
  'hanoi-turtle-tower': hanoiHoGuom,
  'halong-trong-mai': halongBay,
  'sapa-terraces': sapaValley,
  'ninhbinh-trang-an': trangAn,
  'hue-ngo-mon': hueNgoMon2,
  'danang-dragon-bridge': dragonBridge,
  'hoian-bridge-pagoda': hoianChuaCau,
  'nhatrang-tram-huong': ponagar,
  'dalat-station': dalatStation2,
  'hcmc-ben-thanh': hcmcBenThanh2,
  'cantho-floating-market': caiRang,
  'phuquoc-fishing-village': hamNinh
}

/**
 * Mặt nền của mô hình (đơn vị cục bộ): `top` = độ cao mặt nền (bờ kè, sân…), `channel` = lòng sông/hồ trong mô hình.
 * Bản đồ nâng đất quanh công trình ngang `top` và chừa lòng sông, để công trình như nằm lọt trong bản đồ.
 */
const PLATES: Record<
  string,
  { top: number; channel?: { cx: number; cz: number; hx: number; hz: number } }
> = {
  'hoian-bridge-pagoda': { top: 0.83, channel: { cx: 0, cz: 0.4, hx: 2.7, hz: 2.0 } },
  'danang-dragon-bridge': { top: 0.36, channel: { cx: 0, cz: 0, hx: 5.4, hz: 2.3 } }
  // mô hình có viền bờ/nền mỏng (Hồ Gươm, Bến Thành…) KHÔNG nâng đất — nâng sẽ lấp mất viền bờ hồ
}

/** Mô hình 3D mịn của công trình (chân ~10 đơn vị, y = 0 là mặt đất); undefined nếu chưa có */
export function buildLandmark3D(THREE: typeof ThreeNS, id: string): ThreeNS.Group | undefined {
  const g = LANDMARKS_3D[id]?.(THREE)
  if (g && PLATES[id]) g.userData.plate = PLATES[id]
  return g
}
