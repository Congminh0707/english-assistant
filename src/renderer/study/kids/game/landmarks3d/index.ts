// Công trình 3D (mịn, cùng phong cách địa hình) cho bản đồ game — id khớp `place.landmark`. Các mô hình voxel trong
// src/shared/voxels chỉ còn dùng ở bản đồ 2D và sticker. docs/19-kids-world.md §5.2
import type * as ThreeNS from 'three'
import {
  danangDragonBridge,
  hoianBridgePagoda,
  hueNgoMon,
  nhatrangTramHuong,
  dalatStation
} from './central'
import { halongTrongMai, hanoiTurtleTower, ninhbinhTrangAn, sapaTerraces } from './north'
import { canthoFloatingMarket, hcmcBenThanh, phuquocFishingVillage } from './south'

type Builder = (THREE: typeof ThreeNS) => ThreeNS.Group

export const LANDMARKS_3D: Record<string, Builder> = {
  'hanoi-turtle-tower': hanoiTurtleTower,
  'halong-trong-mai': halongTrongMai,
  'sapa-terraces': sapaTerraces,
  'ninhbinh-trang-an': ninhbinhTrangAn,
  'hue-ngo-mon': hueNgoMon,
  'danang-dragon-bridge': danangDragonBridge,
  'hoian-bridge-pagoda': hoianBridgePagoda,
  'nhatrang-tram-huong': nhatrangTramHuong,
  'dalat-station': dalatStation,
  'hcmc-ben-thanh': hcmcBenThanh,
  'cantho-floating-market': canthoFloatingMarket,
  'phuquoc-fishing-village': phuquocFishingVillage
}

/** Mô hình 3D mịn của công trình (chân ~10 đơn vị, y = 0 là mặt đất); undefined nếu chưa có */
export function buildLandmark3D(THREE: typeof ThreeNS, id: string): ThreeNS.Group | undefined {
  return LANDMARKS_3D[id]?.(THREE)
}
