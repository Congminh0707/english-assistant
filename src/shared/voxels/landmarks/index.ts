// Công trình nổi bật của từng nơi trên bản đồ thế giới (mô hình voxel vẽ bằng code, license proprietary-own).
// Id khớp `place.landmark` trong content/curated/kids/world/places/*.json. docs/19-kids-world.md §2.2, §5.2
import { buildModel, VoxelGrid, type VoxelModel } from '../voxelGrid'
import { VP } from '../palette'
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

/** Màu nền (nước, cỏ, đất, cát) — phần "bệ diorama" của mô hình, không phải công trình */
const PLATE_COLORS = new Set<string>([
  VP.water,
  VP.waterDeep,
  VP.grass,
  VP.grassDark,
  VP.soil,
  VP.sand,
  '#8fd0ee',
  '#e6f6ff',
  '#e6f7ff',
  '#4aa8d8',
  '#2f7fb8'
])

/**
 * Công trình bỏ bệ nền: cắt các lớp dưới cùng gần như chỉ là nước/cỏ/đất phủ kín chân mô hình rồi dời xuống y = 0,
 * để bản đồ 3D đặt công trình thẳng lên địa hình (không còn tấm nền chữ nhật dán lên đất). Giữ nguyên mô hình nếu
 * không có bệ rõ ràng (đồi, núi đá…). Nước còn sót ở tầng thấp (kênh, hào) cũng bỏ để lộ địa hình bên dưới.
 */
export function stripPlate(grid: VoxelGrid): VoxelGrid {
  const area = grid.sx * grid.sz
  const layer = new Array<{ n: number; plate: number }>(grid.sy).fill({ n: 0, plate: 0 })
  const counts = layer.map(() => ({ n: 0, plate: 0 }))
  for (const v of grid.voxels()) {
    counts[v.y].n++
    if (PLATE_COLORS.has(v.color)) counts[v.y].plate++
  }
  let cut = 0
  while (
    cut < Math.min(10, grid.sy - 1) &&
    counts[cut].n >= area * 0.45 &&
    counts[cut].plate >= counts[cut].n * 0.9
  )
    cut++
  if (cut === 0 || cut >= grid.sy * 0.4) return grid
  const out = new VoxelGrid(grid.sx, grid.sy - cut, grid.sz)
  for (const v of grid.voxels()) {
    if (v.y < cut) continue
    if (
      v.y < cut + 3 &&
      v.color !== VP.grass &&
      v.color !== VP.grassDark &&
      PLATE_COLORS.has(v.color)
    ) {
      if (
        v.color === VP.water ||
        v.color === VP.waterDeep ||
        v.color.startsWith('#8f') ||
        v.color.startsWith('#e6f')
      )
        continue
    }
    out.set(v.x, v.y - cut, v.z, v.color)
  }
  return out
}

/** Công trình cho bản đồ 3D: không có bệ nền */
export function landmarkBuilding(id: string): VoxelGrid | undefined {
  const g = landmarkGrid(id)
  return g ? stripPlate(g) : undefined
}
