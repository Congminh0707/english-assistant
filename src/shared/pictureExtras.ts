// Hình minh hoạ bổ sung lấy từ Twemoji (jdecked/twemoji, đồ hoạ CC-BY 4.0 — ghi công ở Cài đặt → Giấy phép & ghi công,
// docs/08 §8). Chỉ chọn emoji có nghĩa đúng 1-1 với từ. Khoá = id hình (cũng là từ tiếng Anh viết liền); `code` =
// codepoint Unicode của emoji (tên file SVG). Thuần dữ liệu: dùng chung giữa script tải, main và renderer.

export interface PictureExtra {
  en: string
  vi: string
  /** Codepoint emoji (hex thường), tên file `<code>.svg` của Twemoji */
  code: string
}

export const PICTURE_EXTRAS: Record<string, PictureExtra> = {
  // Động vật
  lion: { en: 'lion', vi: 'con sư tử', code: '1f981' },
  tiger: { en: 'tiger', vi: 'con hổ', code: '1f42f' },
  giraffe: { en: 'giraffe', vi: 'hươu cao cổ', code: '1f992' },
  snake: { en: 'snake', vi: 'con rắn', code: '1f40d' },
  turtle: { en: 'turtle', vi: 'con rùa', code: '1f422' },
  butterfly: { en: 'butterfly', vi: 'con bướm', code: '1f98b' },
  bee: { en: 'bee', vi: 'con ong', code: '1f41d' },
  owl: { en: 'owl', vi: 'con cú', code: '1f989' },
  penguin: { en: 'penguin', vi: 'chim cánh cụt', code: '1f427' },
  sheep: { en: 'sheep', vi: 'con cừu', code: '1f411' },
  chicken: { en: 'chicken', vi: 'con gà', code: '1f414' },
  mouse: { en: 'mouse', vi: 'con chuột', code: '1f42d' },
  deer: { en: 'deer', vi: 'con nai', code: '1f98c' },
  dolphin: { en: 'dolphin', vi: 'cá heo', code: '1f42c' },
  whale: { en: 'whale', vi: 'cá voi', code: '1f433' },
  shark: { en: 'shark', vi: 'cá mập', code: '1f988' },
  octopus: { en: 'octopus', vi: 'con bạch tuộc', code: '1f419' },
  crab: { en: 'crab', vi: 'con cua', code: '1f980' },
  snail: { en: 'snail', vi: 'con ốc sên', code: '1f40c' },
  ant: { en: 'ant', vi: 'con kiến', code: '1f41c' },
  kangaroo: { en: 'kangaroo', vi: 'chuột túi', code: '1f998' },
  panda: { en: 'panda', vi: 'gấu trúc', code: '1f43c' },
  koala: { en: 'koala', vi: 'gấu koala', code: '1f428' },
  camel: { en: 'camel', vi: 'con lạc đà', code: '1f42a' },
  wolf: { en: 'wolf', vi: 'con sói', code: '1f43a' },
  goat: { en: 'goat', vi: 'con dê', code: '1f410' },
  swan: { en: 'swan', vi: 'thiên nga', code: '1f9a2' },
  // Rau củ quả
  carrot: { en: 'carrot', vi: 'củ cà rốt', code: '1f955' },
  tomato: { en: 'tomato', vi: 'quả cà chua', code: '1f345' },
  potato: { en: 'potato', vi: 'củ khoai tây', code: '1f954' },
  corn: { en: 'corn', vi: 'bắp ngô', code: '1f33d' },
  cherry: { en: 'cherry', vi: 'quả anh đào', code: '1f352' },
  pear: { en: 'pear', vi: 'quả lê', code: '1f350' },
  coconut: { en: 'coconut', vi: 'quả dừa', code: '1f965' },
  kiwi: { en: 'kiwi', vi: 'quả kiwi', code: '1f95d' },
  avocado: { en: 'avocado', vi: 'quả bơ', code: '1f951' },
  broccoli: { en: 'broccoli', vi: 'súp lơ xanh', code: '1f966' },
  mushroom: { en: 'mushroom', vi: 'cây nấm', code: '1f344' },
  cucumber: { en: 'cucumber', vi: 'quả dưa chuột', code: '1f952' },
  onion: { en: 'onion', vi: 'củ hành', code: '1f9c5' },
  garlic: { en: 'garlic', vi: 'củ tỏi', code: '1f9c4' },
  // Đồ ăn
  sandwich: { en: 'sandwich', vi: 'bánh sandwich', code: '1f96a' },
  hotdog: { en: 'hot dog', vi: 'bánh mì xúc xích', code: '1f32d' },
  cookie: { en: 'cookie', vi: 'bánh quy', code: '1f36a' },
  donut: { en: 'donut', vi: 'bánh vòng', code: '1f369' },
  candy: { en: 'candy', vi: 'kẹo', code: '1f36c' },
  chocolate: { en: 'chocolate', vi: 'sô cô la', code: '1f36b' },
  popcorn: { en: 'popcorn', vi: 'bắp rang', code: '1f37f' },
  pancake: { en: 'pancake', vi: 'bánh kếp', code: '1f95e' },
  soup: { en: 'soup', vi: 'món súp', code: '1f372' },
  sushi: { en: 'sushi', vi: 'món sushi', code: '1f363' },
  honey: { en: 'honey', vi: 'mật ong', code: '1f36f' },
  fries: { en: 'fries', vi: 'khoai tây chiên', code: '1f35f' },
  salad: { en: 'salad', vi: 'món salad', code: '1f957' },
  // Đồ vật
  scissors: { en: 'scissors', vi: 'cái kéo', code: '2702' },
  clock: { en: 'clock', vi: 'đồng hồ báo thức', code: '23f0' },
  bell: { en: 'bell', vi: 'cái chuông', code: '1f514' },
  camera: { en: 'camera', vi: 'máy ảnh', code: '1f4f7' },
  guitar: { en: 'guitar', vi: 'đàn ghi-ta', code: '1f3b8' },
  drum: { en: 'drum', vi: 'cái trống', code: '1f941' },
  bicycle: { en: 'bicycle', vi: 'xe đạp', code: '1f6b2' },
  bus: { en: 'bus', vi: 'xe buýt', code: '1f68c' },
  train: { en: 'train', vi: 'tàu hoả', code: '1f686' },
  airplane: { en: 'airplane', vi: 'máy bay', code: '2708' },
  boat: { en: 'boat', vi: 'thuyền buồm', code: '26f5' },
  rocket: { en: 'rocket', vi: 'tên lửa', code: '1f680' },
  balloon: { en: 'balloon', vi: 'quả bóng bay', code: '1f388' },
  gift: { en: 'gift', vi: 'hộp quà', code: '1f381' },
  flag: { en: 'flag', vi: 'lá cờ', code: '1f6a9' },
  lightbulb: { en: 'light bulb', vi: 'bóng đèn', code: '1f4a1' },
  door: { en: 'door', vi: 'cánh cửa', code: '1f6aa' },
  shoe: { en: 'shoe', vi: 'chiếc giày', code: '1f45f' },
  hat: { en: 'hat', vi: 'cái mũ', code: '1f3a9' },
  glasses: { en: 'glasses', vi: 'kính mắt', code: '1f453' },
  spoon: { en: 'spoon', vi: 'cái thìa', code: '1f944' },
  fork: { en: 'fork', vi: 'cái nĩa', code: '1f374' },
  toothbrush: { en: 'toothbrush', vi: 'bàn chải đánh răng', code: '1faa5' },
  hammer: { en: 'hammer', vi: 'cái búa', code: '1f528' },
  television: { en: 'television', vi: 'ti vi', code: '1f4fa' },
  piano: { en: 'piano', vi: 'đàn piano', code: '1f3b9' },
  trophy: { en: 'trophy', vi: 'cúp vô địch', code: '1f3c6' },
  headphones: { en: 'headphones', vi: 'tai nghe', code: '1f3a7' },
  tshirt: { en: 't-shirt', vi: 'áo phông', code: '1f455' },
  dress: { en: 'dress', vi: 'cái váy', code: '1f457' },
  socks: { en: 'socks', vi: 'đôi tất', code: '1f9e6' },
  // Thiên nhiên
  rainbow: { en: 'rainbow', vi: 'cầu vồng', code: '1f308' },
  snowman: { en: 'snowman', vi: 'người tuyết', code: '26c4' },
  fire: { en: 'fire', vi: 'ngọn lửa', code: '1f525' },
  raindrop: { en: 'raindrop', vi: 'giọt nước', code: '1f4a7' },
  mountain: { en: 'mountain', vi: 'ngọn núi', code: '26f0' },
  volcano: { en: 'volcano', vi: 'núi lửa', code: '1f30b' },
  wave: { en: 'wave', vi: 'con sóng', code: '1f30a' },
  lightning: { en: 'lightning', vi: 'tia chớp', code: '26a1' },
  snowflake: { en: 'snowflake', vi: 'bông tuyết', code: '2744' },
  earth: { en: 'earth', vi: 'trái đất', code: '1f30d' },
  cactus: { en: 'cactus', vi: 'cây xương rồng', code: '1f335' },
  sunflower: { en: 'sunflower', vi: 'hoa hướng dương', code: '1f33b' },
  rose: { en: 'rose', vi: 'hoa hồng', code: '1f339' },
  tulip: { en: 'tulip', vi: 'hoa tulip', code: '1f337' }
}

export const PICTURE_EXTRA_IDS: readonly string[] = Object.keys(PICTURE_EXTRAS)

/** Ghi công bắt buộc của Twemoji (CC-BY 4.0) — hiển thị ở Cài đặt → Giấy phép & ghi công */
export const TWEMOJI_CREDIT = {
  name: 'Twemoji',
  author: 'Twitter, Inc. and other contributors (fork: jdecked/twemoji)',
  license: 'CC-BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  source: 'https://github.com/jdecked/twemoji'
} as const
