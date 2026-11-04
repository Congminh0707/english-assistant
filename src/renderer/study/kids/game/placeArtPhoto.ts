import type { PlaceArt } from './placeArt.generated'

// Cảnh 6 nước tầng 2 và các nơi tầng 1 đã làm lại (docs/26) dùng tranh vẽ sẵn (ảnh WebP nhúng trong
// kids-p<nơi>.art.html), không sinh từ export-art.py. Vật động của cảnh ở sceneAnim/<nơi>.json (SceneAnim.vue).
// Toạ độ viết theo ảnh gốc 1672×941, đổi sang hệ 1280×720 của PlaceScene bằng `at`. `w` chỉ để khớp kiểu
// `PlaceArt.pet` (PlaceScene vẽ thú cưng theo PET_SIZE, không dùng `w`).
const at = (x: number, y: number): { x: number; y: number; w: number } => ({
  x: Math.round((x * 1280) / 1672),
  y: Math.round((y * 720) / 941),
  w: 90
})

export const PLACE_ART_PHOTO: Readonly<Record<string, PlaceArt>> = {
  // Hồ Gươm mùa thu (2026-11-04, docs/26). Biển: Tháp Rùa, Đền Ngọc Sơn, Cầu Thê Húc, Phố cổ, Xích lô. Toạ độ là tâm
  // biển = đỉnh công trình − 24 (chấm tròn nằm dưới chữ nên rơi đúng đỉnh công trình). Xích lô là sprite trong
  // sceneAnim/hanoi.json (chân x 950, y 905, cao 225).
  hanoi: {
    art: 'kids-phanoi',
    pet: at(770, 935),
    spots: [at(1025, 238), at(610, 258), at(430, 394), at(1450, 201), at(950, 654)]
  },
  china: {
    art: 'kids-pchina',
    pet: at(700, 905),
    spots: [at(480, 215), at(210, 620), at(1100, 545), at(620, 455), at(1375, 585)]
  },
  japan: {
    art: 'kids-pjapan',
    pet: at(880, 925),
    spots: [at(150, 545), at(130, 210), at(1020, 690), at(1250, 630), at(1400, 785)]
  },
  australia: {
    art: 'kids-paustralia',
    pet: at(780, 905),
    spots: [at(950, 560), at(170, 240), at(1170, 830), at(1300, 690), at(850, 420)]
  },
  kenya: {
    art: 'kids-pkenya',
    pet: at(800, 925),
    spots: [at(1560, 250), at(230, 110), at(1560, 420), at(1400, 520), at(1340, 290)]
  },
  france: {
    art: 'kids-pfrance',
    pet: at(860, 925),
    spots: [at(330, 730), at(110, 470), at(1380, 610), at(1600, 520), at(1250, 430)]
  },
  usa: {
    art: 'kids-pusa',
    pet: at(1000, 925),
    spots: [at(1500, 160), at(560, 870), at(330, 770), at(700, 690), at(130, 730)]
  }
}
