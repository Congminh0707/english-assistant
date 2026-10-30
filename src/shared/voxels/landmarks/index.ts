// Công trình nổi bật của từng nơi trên bản đồ thế giới (mô hình voxel vẽ bằng code, license proprietary-own).
// Id khớp `place.landmark` trong content/curated/kids/world/places/*.json. docs/19-kids-world.md §2.2, §5.2
import { buildModel, type VoxelGrid, type VoxelModel } from '../voxelGrid'
import { isometricRects } from '../isometric'
import { canthoFloatingMarket } from './canthoFloatingMarket'
import { dalatStation } from './dalatStation'
import { danangDragonBridge } from './danangDragonBridge'
import { halongTrongMai } from './halongTrongMai'
import { hanoiTurtleTower } from './hanoiTurtleTower'
import { hcmcBenThanh } from './hcmcBenThanh'
import { hoianBridgePagoda } from './hoianBridgePagoda'
import { hueNgoMon } from './hueNgoMon'
import { ninhbinhTrangAn } from './ninhbinhTrangAn'
import { nhatrangTramHuong } from './nhatrangTramHuong'
import { phuquocFishingVillage } from './phuquocFishingVillage'
import { sapaTerraces } from './sapaTerraces'
import { chinaGreatWall } from './chinaGreatWall'
import { earthPolar } from './earthPolar'
import { earthVolcanoIsle } from './earthVolcanoIsle'
import { earthWorkshopTower } from './earthWorkshopTower'
import { japanFuji } from './japanFuji'
import { kenyaSavanna } from './kenyaSavanna'
import { parisEiffel } from './parisEiffel'
import { sydneyOpera } from './sydneyOpera'
import { usaLiberty } from './usaLiberty'

export const LANDMARKS: Record<string, VoxelModel> = Object.fromEntries(
  [
    hanoiTurtleTower,
    halongTrongMai,
    sapaTerraces,
    ninhbinhTrangAn,
    hueNgoMon,
    danangDragonBridge,
    hoianBridgePagoda,
    nhatrangTramHuong,
    dalatStation,
    hcmcBenThanh,
    canthoFloatingMarket,
    phuquocFishingVillage,
    chinaGreatWall,
    earthPolar,
    earthVolcanoIsle,
    earthWorkshopTower,
    japanFuji,
    kenyaSavanna,
    parisEiffel,
    sydneyOpera,
    usaLiberty
  ].map((m) => [m.id, m])
)

export const LANDMARK_IDS: readonly string[] = Object.keys(LANDMARKS)

export function landmarkGrid(id: string): VoxelGrid | undefined {
  const model = LANDMARKS[id]
  return model ? buildModel(model) : undefined
}

/** Hình 2D isometric của công trình (bản đồ 2D, sticker); undefined nếu chưa có mô hình */
export function landmarkImage(id: string): ReturnType<typeof isometricRects> | undefined {
  const model = LANDMARKS[id]
  return model ? isometricRects(id, () => buildModel(model)) : undefined
}
