import type { PlaceArt } from './placeArt.generated'

// Cảnh 6 nước tầng 2 dùng tranh vẽ sẵn (ảnh WebP nhúng trong kids-p<nước>.art.html), không sinh từ export-art.py.
// Toạ độ viết theo ảnh gốc 1672×941, đổi sang hệ 1280×720 của PlaceScene bằng `at`.
const at = (x: number, y: number): { x: number; y: number } => ({
  x: Math.round((x * 1280) / 1672),
  y: Math.round((y * 720) / 941)
})

export const PLACE_ART_PHOTO: Readonly<Record<string, PlaceArt>> = {
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
