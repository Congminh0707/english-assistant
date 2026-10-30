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

/** Mô hình 3D mịn của công trình (chân ~10 đơn vị, y = 0 là mặt đất); undefined nếu chưa có */
export function buildLandmark3D(THREE: typeof ThreeNS, id: string): ThreeNS.Group | undefined {
  return LANDMARKS_3D[id]?.(THREE)
}
