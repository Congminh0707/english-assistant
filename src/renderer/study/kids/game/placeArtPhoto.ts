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
  // 11 nơi tầng 1 làm lại bằng ChatGPT Image (2026-11-04, docs/26). Toạ độ biển = đỉnh vật − 24; thứ tự theo
  // `kids.game.spots.<nơi>` (i18n). Vật động ở sceneAnim/<nơi>.json (dựng bởi scripts/design-data/scene_build.py).
  hcmc: {
    art: 'kids-phcmc',
    pet: at(760, 925),
    spots: [at(883, 40), at(1150, 415), at(260, 60), at(1460, 476), at(1210, 515)]
  },
  halong: {
    art: 'kids-phalong',
    pet: at(760, 905),
    spots: [at(1125, 368), at(1000, 520), at(730, 360), at(140, 355), at(400, 505)]
  },
  hoian: {
    art: 'kids-phoian',
    pet: at(960, 905),
    spots: [at(970, 262), at(222, 180), at(560, 593), at(940, 626), at(400, 160)]
  },
  ninhbinh: {
    art: 'kids-pninhbinh',
    pet: at(900, 905),
    spots: [at(1090, 22), at(1100, 358), at(300, 480), at(1135, 523), at(300, 606)]
  },
  sapa: {
    art: 'kids-psapa',
    pet: at(900, 885),
    spots: [at(1180, 58), at(850, 330), at(200, 192), at(1130, 626), at(1420, 540)]
  },
  danang: {
    art: 'kids-pdanang',
    pet: at(600, 905),
    spots: [at(930, 350), at(1300, 300), at(900, 600), at(255, 333), at(1600, 476)]
  },
  hue: {
    art: 'kids-phue',
    pet: at(800, 905),
    spots: [at(1005, 200), at(180, 620), at(200, 640), at(130, 480), at(640, 556)]
  },
  nhatrang: {
    art: 'kids-pnhatrang',
    pet: at(950, 905),
    spots: [at(225, 100), at(885, 410), at(800, 600), at(1000, 560), at(700, 820)]
  },
  dalat: {
    art: 'kids-pdalat',
    pet: at(900, 905),
    spots: [at(885, 210), at(900, 660), at(640, 200), at(1560, 540), at(80, 745)]
  },
  cantho: {
    art: 'kids-pcantho',
    pet: at(900, 905),
    spots: [at(1240, 381), at(1263, 472), at(700, 570), at(1080, 503), at(1465, 262)]
  },
  phuquoc: {
    art: 'kids-pphuquoc',
    pet: at(1100, 905),
    spots: [at(835, 200), at(260, 305), at(1450, 240), at(120, 665), at(130, 447)]
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
