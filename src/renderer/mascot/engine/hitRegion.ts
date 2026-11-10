/**
 * Vùng bấm của thú cưng vector. Hình nằm trong Shadow DOM nên không đọc được alpha từng điểm: mỗi con/giai đoạn
 * được xấp xỉ bằng vài elip trong hệ toạ độ hình vẽ (thân chuẩn: đầu tâm (80,72), chân chạm đất y=150),
 * khớp với scripts/design-data/mascot (chars4.py) và cách PetFigure đặt viewBox (xMidYMax meet).
 */
export interface Ellipse {
  cx: number
  cy: number
  rx: number
  ry: number
}

export interface Box {
  left: number
  bottom: number
  width: number
  height: number
}

/** viewBox của PetFigure: [x, y, rộng, cao] — khớp `vb` trong pet.json (export.py) */
const VIEW_BOX = {
  fig: [-16, -8, 192, 168],
  legend: [-40, -36, 240, 196]
} as const

/** Tỉ lệ thân theo giai đoạn, co quanh điểm chạm đất (80,150) — khớp `scale` trong pet.json */
const STAGE_SCALE: Record<string, number> = {
  egg: 1,
  baby: 0.72,
  teen: 0.84,
  adult: 0.92,
  legend: 1
}

const e = (cx: number, cy: number, rx: number, ry: number): Ellipse => ({ cx, cy, rx, ry })

const EGG: Ellipse[] = [e(80, 100, 43, 55)]
/** Đầu + thân (kèm tay, chân) chung cho mọi con */
const BODY: Ellipse[] = [e(80, 72, 54, 46), e(80, 128, 33, 27)]

/** Phần riêng từng con: `all` cho mọi giai đoạn sau trứng, rồi thêm theo giai đoạn (đuôi, cánh, sừng...) */
const EXTRA: Record<string, Record<string, Ellipse[]>> = {
  bi: {
    all: [e(80, 38, 52, 28)],
    teen: [e(80, 16, 14, 20), e(80, 112, 52, 22)],
    adult: [e(80, 12, 18, 22), e(80, 112, 66, 30)],
    legend: [e(80, 14, 50, 24), e(80, 104, 88, 44), e(80, 146, 44, 14)]
  },
  kitsu: {
    all: [e(80, 36, 50, 34)],
    baby: [e(122, 126, 26, 18)],
    teen: [e(80, 104, 84, 40)],
    adult: [e(80, 98, 96, 50)],
    legend: [e(80, 86, 110, 70), e(80, 20, 44, 44)]
  },
  draco: {
    all: [e(80, 36, 52, 34), e(126, 134, 32, 18)],
    teen: [e(80, 100, 64, 30)],
    adult: [e(80, 96, 86, 40)],
    legend: [e(80, 20, 54, 30), e(80, 92, 112, 46)]
  },
  robo: {
    all: [e(80, 74, 58, 46), e(80, 20, 12, 18)],
    teen: [e(80, 96, 50, 22)],
    adult: [e(80, 92, 66, 30)],
    legend: [e(80, 16, 32, 22), e(80, 84, 86, 40), e(80, 164, 24, 18)]
  },
  lupo: {
    all: [e(80, 34, 48, 34), e(122, 116, 26, 30)],
    adult: [e(80, 132, 40, 24)],
    legend: [e(132, 108, 36, 40)]
  }
}

/** Các elip phủ bóng dáng của nhân vật ở giai đoạn này (toạ độ hình vẽ, chưa co theo giai đoạn) */
export function hitShapes(character: string, stage: string): Ellipse[] {
  if (stage === 'egg') return EGG
  const own = EXTRA[character] ?? {}
  return [...BODY, ...(own.all ?? []), ...(own[stage] ?? [])]
}

/** Đổi điểm trên màn hình (cùng hệ với `box`) sang toạ độ hình vẽ; `flipped` = hình đang lật ngang */
export function toFigure(
  point: { x: number; y: number },
  box: Box,
  stage: string,
  flipped = false
): { x: number; y: number } {
  const [vx, vy, vw, vh] = stage === 'legend' ? VIEW_BOX.legend : VIEW_BOX.fig
  const k = Math.min(box.width / vw, box.height / vh)
  const left = box.left + (box.width - vw * k) / 2
  const top = box.bottom - vh * k
  const s = STAGE_SCALE[stage] ?? 1
  // viewBox đối xứng quanh x = 80 nên lật ngang chỉ là đổi dấu quanh trục đó
  const x = vx + (point.x - left) / k
  const y = vy + (point.y - top) / k
  const fx = 80 + (x - 80) / s
  return { x: flipped ? 160 - fx : fx, y: 150 + (y - 150) / s }
}

/** Con trỏ có nằm trên thú cưng không */
export function isOverPet(
  point: { x: number; y: number },
  box: Box,
  character: string,
  stage: string,
  flipped = false
): boolean {
  const p = toFigure(point, box, stage, flipped)
  return hitShapes(character, stage).some(
    (s) => ((p.x - s.cx) / s.rx) ** 2 + ((p.y - s.cy) / s.ry) ** 2 <= 1
  )
}
