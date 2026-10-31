// Sinh bởi scripts/design-data/export-art.py --kids, không sửa tay. Toạ độ theo tranh 1280×720.
export interface PlaceArt {
  art: string
  pet: { x: number; y: number; w: number }
  /** Chỗ đặt biển chạm, theo thứ tự trên bảng */
  spots: ReadonlyArray<{ x: number; y: number }>
}

export const PLACE_ART: Readonly<Record<string, PlaceArt>> = {
  cantho: {
    art: 'kids-pcantho',
    pet: { x: 232, y: 704, w: 108 },
    spots: [
      { x: 587, y: 186 }, // Cây bẹo
      { x: 720, y: 392 }, // Dưa hấu
      { x: 300, y: 216 }, // Chợ nổi
      { x: 1000, y: 262 }, // Trái thơm
      { x: 120, y: 418 } // Bến Ninh Kiều
    ]
  },
  dalat: {
    art: 'kids-pdalat',
    pet: { x: 760, y: 708, w: 92 },
    spots: [
      { x: 500, y: 156 }, // Ga Đà Lạt
      { x: 1096, y: 320 }, // Tàu hơi nước
      { x: 1076, y: 196 }, // Đồi thông
      { x: 280, y: 512 }, // Hồ Xuân Hương
      { x: 960, y: 560 } // Hoa
    ]
  },
  danang: {
    art: 'kids-pdanang',
    pet: { x: 236, y: 708, w: 92 },
    spots: [
      { x: 344, y: 142 }, // Cầu Rồng
      { x: 1120, y: 44 }, // Lửa rồng
      { x: 84, y: 498 }, // Sông Hàn
      { x: 62, y: 78 }, // Cao ốc
      { x: 1150, y: 226 } // Cầu quay
    ]
  },
  halong: {
    art: 'kids-phalong',
    pet: { x: 330, y: 704, w: 92 },
    spots: [
      { x: 340, y: 214 }, // Đảo đá
      { x: 780, y: 300 }, // Thuyền buồm
      { x: 1010, y: 330 }, // Hang đá
      { x: 84, y: 352 }, // Làng chài
      { x: 300, y: 496 } // Lồng cá
    ]
  },
  hanoi: {
    art: 'kids-phanoi',
    pet: { x: 500, y: 690, w: 92 },
    spots: [
      { x: 824, y: 160 }, // Tháp Rùa
      { x: 232, y: 196 }, // Đền Ngọc Sơn
      { x: 610, y: 344 }, // Cầu Thê Húc
      { x: 1120, y: 130 }, // Phố cổ
      { x: 880, y: 530 } // Xích lô
    ]
  },
  hcmc: {
    art: 'kids-phcmc',
    pet: { x: 620, y: 712, w: 104 },
    spots: [
      { x: 642, y: 18 }, // Tháp đồng hồ
      { x: 456, y: 300 }, // Chợ Bến Thành
      { x: 120, y: 320 }, // Cây sao
      { x: 1046, y: 410 }, // Xe buýt
      { x: 640, y: 520 } // Xe máy
    ]
  },
  hue: {
    art: 'kids-phue',
    pet: { x: 236, y: 704, w: 92 },
    spots: [
      { x: 470, y: 112 }, // Ngọ Môn
      { x: 318, y: 512 }, // Sông Hương
      { x: 700, y: 476 }, // Thuyền rồng
      { x: 1090, y: 396 }, // Cầu Tràng Tiền
      { x: 396, y: 590 } // Áo dài
    ]
  },
  nhatrang: {
    art: 'kids-pnhatrang',
    pet: { x: 718, y: 708, w: 92 },
    spots: [
      { x: 424, y: 40 }, // Tháp Bà
      { x: 760, y: 268 }, // Hòn đảo
      { x: 930, y: 372 }, // Biển
      { x: 1040, y: 522 }, // Thuyền thúng
      { x: 300, y: 590 } // Bãi cát
    ]
  },
  ninhbinh: {
    art: 'kids-pninhbinh',
    pet: { x: 150, y: 616, w: 92 },
    spots: [
      { x: 640, y: 112 }, // Núi đá
      { x: 838, y: 372 }, // Hang
      { x: 176, y: 392 }, // Ruộng lúa
      { x: 596, y: 516 }, // Chèo chân
      { x: 328, y: 340 } // Trâu
    ]
  },
  phuquoc: {
    art: 'kids-pphuquoc',
    pet: { x: 590, y: 672, w: 106 },
    spots: [
      { x: 790, y: 236 }, // Hoàng hôn
      { x: 270, y: 214 }, // Làng chài
      { x: 400, y: 300 }, // Nhà sàn
      { x: 1010, y: 590 }, // Thuyền thúng
      { x: 760, y: 462 } // Lưới cá
    ]
  },
  sapa: {
    art: 'kids-psapa',
    pet: { x: 292, y: 660, w: 92 },
    spots: [
      { x: 760, y: 86 }, // Núi mây
      { x: 214, y: 400 }, // Ruộng bậc thang
      { x: 650, y: 318 }, // Bản làng
      { x: 676, y: 512 }, // Trâu
      { x: 1090, y: 620 } // Ruộng nước
    ]
  },
  hoian: {
    art: 'kids-r5arrive',
    pet: { x: 1000, y: 472, w: 92 },
    spots: [
      { x: 640, y: 40 }, // Chùa Cầu
      { x: 70, y: 250 }, // Đèn lồng
      { x: 330, y: 620 }, // Hoa đăng
      { x: 760, y: 540 }, // Thuyền
      { x: 1180, y: 96 } // Nhà cổ
    ]
  }
}

/** Biển tên trên bản đồ tầng 2 (PAsia) */
export const ASIA_ART = {
  art: 'kids-pasia',
  pet: { x: 1170, y: 348, w: 62 },
  spots: {
    vn: { x: 490, y: 532 },
    china: { x: 640, y: 354 },
    japan: { x: 1130, y: 384 },
    france: { x: 120, y: 150 },
    kenya: { x: 120, y: 440 },
    australia: { x: 1060, y: 676 },
    usa: { x: 1180, y: 490 }
  } as Readonly<Record<string, { x: number; y: number }>>
}
