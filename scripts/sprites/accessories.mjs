// Phụ kiện vẽ chồng lên nhân vật (cùng khung 96×96, bám theo tư thế qua anchor A của drawCreature).
// Mỗi phụ kiện có lớp trước (acc-<id>.png) và/hoặc lớp sau lưng (accb-<id>.png: áo choàng, cánh).
import {
  arc,
  capsule,
  circle,
  ellipse,
  fill,
  line,
  mix,
  paint,
  poly,
  ramp,
  rbox,
  strokeShapes,
  bezier
} from './gfx.mjs'
import { GROUND } from './creature.mjs'

const rad = (d) => (d * Math.PI) / 180
const R = (h) => ramp(h)
const DARK = [43, 43, 58, 255]
const WHITE = [255, 255, 255, 255]

/** id → { front?(cv, A, P), back?(cv, A, P) }; id trùng với shared/shop.ts (bỏ tiền tố 'acc:') */
export const ACCESSORY_DRAW = {
  bow: {
    front(cv, A) {
      const x = A.bx + A.rx * 0.5
      const y = A.top + 7
      const r = R('#e6466a')
      paint(cv, [ellipse(x - 6.5, y, 6.4, 4.4, -0.45), ellipse(x + 6.5, y, 6.4, 4.4, 0.45)], {
        ramp: r
      })
      paint(cv, [circle(x, y, 3.4)], { ramp: r, shift: -0.1 })
      fill(cv, [circle(x - 7, y - 1.4, 1.2)], [255, 190, 205, 255])
    }
  },
  glasses: {
    front(cv, A) {
      const lc = DARK
      for (const side of [-1, 1]) {
        const x = A.bx + side * A.eyeDX
        arc(cv, x, A.eyeY, 8.6, 8.6, 0, Math.PI * 2, 2, lc)
        fill(cv, [ellipse(x - 3.5, A.eyeY - 4, 2, 1.1, -0.7)], [255, 255, 255, 200])
      }
      line(cv, A.bx - A.eyeDX + 8, A.eyeY - 1, A.bx + A.eyeDX - 8, A.eyeY - 1, 1.8, lc)
      for (const side of [-1, 1])
        line(
          cv,
          A.bx + side * (A.eyeDX + 8),
          A.eyeY - 1,
          A.bx + side * (A.rx - 1),
          A.eyeY - 3,
          1.5,
          lc
        )
    }
  },
  scarf: {
    front(cv, A, P) {
      const r = R('#d8364e')
      const y = A.neckY - 1
      paint(cv, [ellipse(A.bx, y, A.rx * 0.9, 7.2)], { ramp: r })
      for (let i = -4; i <= 4; i++)
        line(cv, A.bx + i * (A.rx * 0.2), y - 6, A.bx + i * (A.rx * 0.2) + 1, y + 5, 1.2, r.deep)
      const sway = (P.tail ?? 0) * 3
      paint(cv, [rbox(A.bx + A.rx * 0.55 + sway, y + 13, 5.2, 10, 2)], { ramp: r })
      line(
        cv,
        A.bx + A.rx * 0.55 + sway - 4,
        y + 18,
        A.bx + A.rx * 0.55 + sway + 4,
        y + 18,
        1.2,
        r.deep
      )
    }
  },
  hat: {
    front(cv, A) {
      const r = R('#2e2e44')
      const x = A.bx
      const y = A.top + 3
      paint(cv, [ellipse(x, y, 18.5, 4.4)], { ramp: r })
      paint(cv, [rbox(x, y - 11, 11.6, 11.5, 2.2)], { ramp: r })
      const band = R('#d8364e')
      paint(cv, [rbox(x, y - 3.4, 11.8, 2.8, 1)], { ramp: band, outline: false })
      fill(cv, [rbox(x - 5, y - 15, 1.1, 5, 0.5)], [150, 150, 190, 255])
    }
  },
  crown: {
    front(cv, A) {
      const g = R('#ffcc3c')
      const x = A.bx
      const y = A.top + 2
      paint(cv, [rbox(x, y, 14.5, 4.4, 1.6)], { ramp: g })
      const tips = [-12, -6, 0, 6, 12]
      for (const dx of tips)
        paint(
          cv,
          [
            poly(
              [
                [x + dx - 3.4, y - 3],
                [x + dx + 3.4, y - 3],
                [x + dx, y - (dx === 0 ? 14 : 10)]
              ],
              3
            )
          ],
          { ramp: g }
        )
      fill(cv, [circle(x, y, 2)], [93, 230, 255, 255])
      for (const dx of [-8, 8]) fill(cv, [circle(x + dx, y, 1.5)], [235, 70, 90, 255])
      for (const dx of tips)
        fill(cv, [circle(x + dx, y - (dx === 0 ? 14 : 10), 1.3)], [255, 245, 200, 255])
    }
  },
  flower: {
    front(cv, A) {
      const x = A.bx - A.rx * 0.5
      const y = A.top + 9
      const pr = R('#ff8fba')
      for (let i = 0; i < 5; i++) {
        const a = rad(i * 72 - 90)
        paint(cv, [circle(x + Math.cos(a) * 4.8, y + Math.sin(a) * 4.8, 3.6)], { ramp: pr })
      }
      paint(cv, [circle(x, y, 3)], { ramp: R('#ffd84a') })
    }
  },
  'party-hat': {
    front(cv, A) {
      const x = A.bx + 4
      const y = A.top + 4
      const r = R('#e851b4')
      paint(
        cv,
        [
          poly(
            [
              [x - 12, y + 2],
              [x + 12, y + 2],
              [x + 2, y - 28]
            ],
            8,
            0.5
          )
        ],
        { ramp: r }
      )
      const yel = [255, 226, 90, 255]
      for (const [k, w] of [
        [0.32, 8.4],
        [0.6, 5.4]
      ])
        line(cv, x - w + 3 - k * 2, y + 2 - 30 * k, x + w + 1, y + 2 - 30 * k + 0.5, 1.8, yel)
      paint(cv, [circle(x + 2, y - 29, 3.4)], { ramp: R('#ffffff') })
      paint(cv, [ellipse(x, y + 2, 12.4, 2.4)], { ramp: R('#ffd84a') })
    }
  },
  headphones: {
    front(cv, A) {
      const r = R('#3a3a52')
      const cx = A.bx
      const cy = A.cy - 2
      // gọng
      const pts = []
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI + (Math.PI * i) / 14
        pts.push([cx + Math.cos(a) * (A.rx + 2.5), cy + Math.sin(a) * (A.ry + 2.5)])
      }
      paint(cv, strokeShapes(pts, 2.6, 2.6), { ramp: r, dither: false })
      const red = R('#e6466a')
      for (const side of [-1, 1]) {
        paint(cv, [rbox(cx + side * (A.rx + 2.5), cy + 2, 5.2, 9, 3)], { ramp: red })
        fill(cv, [rbox(cx + side * (A.rx + 3.5), cy + 2, 2, 5.5, 1)], mix(red.deep, red.base, 0.4))
      }
    }
  },
  sunglasses: {
    front(cv, A) {
      const lc = R('#1c1c2c')
      for (const side of [-1, 1]) {
        const x = A.bx + side * A.eyeDX
        paint(cv, [rbox(x, A.eyeY, 10.2, 7.6, 4)], { ramp: lc, dither: false })
        fill(cv, [ellipse(x - 3.5, A.eyeY - 3, 3.2, 1, -0.5)], [150, 190, 255, 255])
        fill(cv, [ellipse(x + 2.5, A.eyeY + 2.5, 2, 0.8, -0.5)], [110, 150, 220, 255])
      }
      line(cv, A.bx - A.eyeDX + 9, A.eyeY - 2, A.bx + A.eyeDX - 9, A.eyeY - 2, 2, DARK)
    }
  },
  cape: {
    back(cv, A, P) {
      const r = R('#d8364e')
      const sway = (P.tail ?? 0) * 3 + (P.lean ?? 0)
      const top = A.cy - A.ry * 0.25
      const bottom = GROUND - 6
      const w = A.rx * 1.5
      paint(
        cv,
        [
          poly(
            [
              [A.bx - A.rx * 0.95, top],
              [A.bx + A.rx * 0.95, top],
              [A.bx + w + sway, bottom],
              [A.bx - w + sway, bottom]
            ],
            12,
            1
          )
        ],
        { ramp: r }
      )
      for (const k of [-0.6, -0.2, 0.2, 0.6])
        line(cv, A.bx + k * A.rx, top + 6, A.bx + k * w + sway, bottom - 2, 1.2, r.deep)
    },
    front(cv, A) {
      const r = R('#d8364e')
      const y = A.neckY - 1
      paint(cv, [ellipse(A.bx, y, A.rx * 0.78, 5)], { ramp: r })
      paint(cv, [circle(A.bx, y + 2, 3.2)], { ramp: R('#ffcc3c') })
    }
  },
  cap: {
    front(cv, A) {
      const r = R('#3a6ee8')
      const x = A.bx
      const y = A.top + 7
      paint(cv, [ellipse(x, y, 19, 11.5)], { ramp: r })
      paint(cv, [ellipse(x + 15, y + 5, 13, 3.6)], { ramp: R('#2c56c0') })
      fill(cv, [rbox(x, y - 4, 17, 1.4, 0.6)], [255, 255, 255, 255])
      paint(cv, [circle(x, y - 11, 2.6)], { ramp: R('#ffffff') })
    }
  },
  'witch-hat': {
    front(cv, A) {
      const r = R('#5a3a8a')
      const x = A.bx
      const y = A.top + 4
      paint(cv, [ellipse(x, y, 23, 5.4)], { ramp: r })
      paint(
        cv,
        [
          poly(
            [
              [x - 13, y],
              [x + 13, y],
              [x + 2, y - 33]
            ],
            8,
            0.5
          )
        ],
        { ramp: r }
      )
      paint(cv, [rbox(x, y - 4, 13.6, 3, 1)], { ramp: R('#ffcc3c'), outline: false })
      fill(cv, [rbox(x, y - 4, 3, 3.4, 0.8)], [90, 60, 20, 255])
    }
  },
  halo: {
    front(cv, A) {
      const y = A.top - 12
      for (let k = 0; k < 8; k++)
        fill(cv, [ellipse(A.bx, y, 22 - k * 0.2, 5.8 - k * 0.1)], [255, 240, 140, k < 3 ? 40 : 14])
      arc(cv, A.bx, y, 17, 4.2, 0, Math.PI * 2, 4, [150, 110, 30, 255])
      arc(cv, A.bx, y, 17, 4.2, 0, Math.PI * 2, 2.4, [255, 224, 90, 255])
      arc(cv, A.bx, y, 17, 4.2, Math.PI * 1.1, Math.PI * 1.7, 1.2, [255, 250, 210, 255])
    }
  },
  bowtie: {
    front(cv, A) {
      const r = R('#d83a6a')
      const x = A.bx
      const y = A.neckY + 2
      paint(
        cv,
        [
          poly(
            [
              [x - 2, y],
              [x - 15, y - 8],
              [x - 15, y + 8]
            ],
            5,
            0.4
          )
        ],
        { ramp: r }
      )
      paint(
        cv,
        [
          poly(
            [
              [x + 2, y],
              [x + 15, y - 8],
              [x + 15, y + 8]
            ],
            5,
            0.4
          )
        ],
        { ramp: r }
      )
      paint(cv, [circle(x, y, 3.4)], { ramp: R('#a82050') })
    }
  },
  medal: {
    front(cv, A) {
      const x = A.bx
      const y = A.neckY + 4
      const rib = R('#3a6ee8')
      paint(
        cv,
        [
          poly(
            [
              [x - 6, y - 14],
              [x - 1, y - 14],
              [x + 3, y + 1],
              [x - 2, y + 1]
            ],
            3
          )
        ],
        { ramp: rib }
      )
      paint(
        cv,
        [
          poly(
            [
              [x + 6, y - 14],
              [x + 1, y - 14],
              [x - 3, y + 1],
              [x + 2, y + 1]
            ],
            3
          )
        ],
        { ramp: R('#d83a6a') }
      )
      const g = R('#ffcc3c')
      paint(cv, [circle(x, y + 5, 6.6)], { ramp: g })
      fill(
        cv,
        [
          poly(
            [
              [x, y + 0.5],
              [x + 1.6, y + 4],
              [x + 5, y + 4.2],
              [x + 2.4, y + 6.6],
              [x + 3.4, y + 10],
              [x, y + 8],
              [x - 3.4, y + 10],
              [x - 2.4, y + 6.6],
              [x - 5, y + 4.2],
              [x - 1.6, y + 4]
            ],
            1
          )
        ],
        [200, 140, 30, 255]
      )
    }
  },
  eyepatch: {
    front(cv, A) {
      const x = A.bx + A.eyeDX
      const y = A.eyeY
      const c = [30, 28, 40, 255]
      line(cv, x - 9, y - 6, A.bx - A.rx * 0.8, y - 14, 1.6, c)
      line(cv, x + 9, y - 5, A.bx + A.rx * 0.92, y - 11, 1.6, c)
      paint(cv, [ellipse(x, y, 9.4, 8.2)], { ramp: R('#2a2838'), dither: false })
      fill(cv, [ellipse(x - 3, y - 3, 2.4, 1.2, -0.6)], [120, 120, 150, 255])
    }
  },
  mask: {
    front(cv, A) {
      // Mặt nạ domino kiểu hoạt hình: dải màu quanh mắt, hai lỗ trắng có con ngươi
      const r = R('#2a2a48')
      const x = A.bx
      const y = A.eyeY
      const hw = A.eyeDX + 13
      paint(
        cv,
        [
          rbox(x, y, hw, 9.5, 6),
          poly(
            [
              [x - 6, y + 4],
              [x + 6, y + 4],
              [x, y + 12]
            ],
            3
          )
        ],
        { ramp: r, dither: false }
      )
      for (const side of [-1, 1]) {
        const ex = x + side * A.eyeDX
        fill(cv, [ellipse(ex, y, 7.2, 6.4, side * 0.25)], [250, 250, 255, 255])
        fill(cv, [circle(ex - side * 0.5, y + 0.8, 3.1)], [34, 30, 52, 255])
        fill(cv, [circle(ex - 1.4, y - 1, 1.1)], [255, 255, 255, 255])
        fill(
          cv,
          [ellipse(x + side * (A.eyeDX + 8), y - 8, 3.4, 0.9, side * 0.4)],
          [150, 150, 200, 255]
        )
      }
    }
  },
  backpack: {
    back(cv, A) {
      const r = R('#3a9a5a')
      for (const side of [-1, 1]) {
        paint(cv, [ellipse(A.bx + side * (A.rx * 0.9), A.cy + A.ry * 0.3, 9, 14, side * 0.15)], {
          ramp: r
        })
      }
      paint(cv, [rbox(A.bx, A.cy + A.ry * 0.2, A.rx * 0.8, A.ry * 0.7, 8)], { ramp: R('#2e7e48') })
    },
    front(cv, A) {
      const c = [90, 56, 30, 255]
      for (const side of [-1, 1]) {
        line(
          cv,
          A.bx + side * A.rx * 0.5,
          A.cy - A.ry * 0.25,
          A.bx + side * A.rx * 0.62,
          A.cy + A.ry * 0.62,
          3,
          c
        )
        fill(
          cv,
          [rbox(A.bx + side * A.rx * 0.6, A.cy + A.ry * 0.3, 1.8, 2.4, 0.6)],
          [230, 190, 90, 255]
        )
      }
    }
  },
  'cat-ears': {
    front(cv, A) {
      const r = R('#2e2e44')
      const inner = R('#ff8fba')
      for (const side of [-1, 1]) {
        const bx = A.bx + side * A.rx * 0.45
        const by = A.top + 6
        paint(
          cv,
          [
            poly(
              [
                [bx - 9, by],
                [bx + 9, by],
                [bx + side * 5, by - 19]
              ],
              7,
              0.5
            )
          ],
          { ramp: r }
        )
        paint(
          cv,
          [
            poly(
              [
                [bx - 5, by - 1],
                [bx + 5, by - 1],
                [bx + side * 3, by - 12]
              ],
              3
            )
          ],
          { ramp: inner, outline: false }
        )
      }
      const band = []
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (Math.PI * i) / 12
        band.push([A.bx + Math.cos(a) * (A.rx * 0.62), A.top + 12 + Math.sin(a) * 9])
      }
      for (let i = 0; i < band.length - 1; i++)
        line(cv, band[i][0], band[i][1], band[i + 1][0], band[i + 1][1], 2.6, [60, 60, 90, 255])
    }
  },
  wings: {
    back(cv, A, P) {
      const r = R('#eaf4ff')
      const flap = P.flap ?? 0.2
      const idle = 0.5 + 0.5 * Math.sin((P.t ?? 0) * Math.PI * 2)
      const f = Math.min(1, flap * 0.8 + idle * 0.25)
      for (const side of [-1, 1]) {
        const base = [A.bx + side * (A.rx * 0.7), A.cy - A.ry * 0.15]
        const baseAng = rad(-25 - f * 55)
        // 4 lông vũ xoè quạt
        for (let i = 3; i >= 0; i--) {
          const ang = baseAng + rad(i * 17)
          const len = 34 - i * 3.5
          const tip = [base[0] + side * Math.cos(ang) * len, base[1] + Math.sin(ang) * len]
          const mid = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2]
          paint(
            cv,
            [
              ellipse(mid[0], mid[1], len * 0.56, 7, Math.atan2(tip[1] - base[1], tip[0] - base[0]))
            ],
            { ramp: i % 2 ? r : R('#d4e8ff') }
          )
        }
      }
    }
  }
}
void capsule
void bezier
void WHITE
