// Vẽ một nhân vật thú cưng ở một tư thế (pose) và một giai đoạn tiến hoá. Khung 96×96.
// Thiết kế gốc của dự án — không dùng nhân vật có bản quyền. Xem docs/05-mascot-system.md.
import {
  arc,
  bezier,
  capsule,
  circle,
  createCanvas,
  ellipse,
  fill,
  fillDither,
  hex,
  line,
  mix,
  paint,
  poly,
  put,
  ramp,
  rbox,
  strokeShapes,
  W
} from './gfx.mjs'

export const GROUND = 91
const BODY_BOTTOM = 83
const rad = (deg) => (deg * Math.PI) / 180

export const STAGES = ['egg', 'baby', 'teen', 'adult', 'legend']
const DIMS = {
  egg: { rx: 19, ry: 25, arm: 0, eye: [3.6, 4.8] },
  baby: { rx: 27, ry: 23, arm: 12, eye: [4.6, 6.0] },
  teen: { rx: 29, ry: 25, arm: 13, eye: [4.8, 6.4] },
  adult: { rx: 31, ry: 27, arm: 14, eye: [5.0, 6.8] },
  legend: { rx: 32, ry: 28, arm: 15, eye: [5.2, 7.0] }
}

export const DEFAULT_POSE = {
  dx: 0, // dịch cả nhân vật theo chiều ngang
  lean: 0, // thân nghiêng so với chân (px)
  jump: 0, // nhấc lên khỏi mặt đất (px)
  sq: 0, // nén (+) / kéo giãn (−) thân
  bob: 0, // thân nhô lên (px) khi thở/nhún
  spin: 1, // hệ số thu hẹp bề ngang khi xoay
  eyes: 'open', // open | happy | closed | wide | sad | angry | sleepy
  open: 1, // độ mở mắt (chớp)
  look: [0, 0],
  mouth: 'smile', // smile | open | o | flat | frown | chew | yawn | grin
  mouthOpen: 1,
  armL: 22,
  armR: 22,
  handL: null, // [dx, dy] so với tâm thân: ghi đè góc tay (đưa tay lên miệng, má...)
  handR: null,
  back: false, // quay lưng (khi xoay): không vẽ mặt và hoa văn trước
  footL: [0, 0], // [nhấc lên, tiến tới]
  footR: [0, 0],
  tail: 0, // -1..1 vẫy đuôi
  earL: 0,
  earR: 0, // độ lệch góc tai (độ)
  flap: 0, // 0..1 vỗ cánh
  blush: 0.35,
  t: 0, // pha thời gian 0..1 (nhấp nháy ăng-ten, lửa...)
  fx: [] // hiệu ứng: { k, x, y, s?, p? }
}

// ------------------------------------------------------------------ màu từng nhân vật
const R = (h) => ramp(h)

const eggSpec = (spot, body = '#f6efd9', shade = '#dccfae') => ({
  body,
  spot,
  shade,
  foot: shade
})

/** Mỗi nhân vật: màu theo giai đoạn + cờ hình dạng. */
export const CHARACTERS = {
  bi: {
    kind: 'cat',
    stages: {
      egg: eggSpec('#9ec7ff'),
      baby: {
        body: '#ffd6a5',
        belly: '#fff0dc',
        ear: '#ffb0a0',
        foot: '#e0a37a',
        iris: '#8a5a44',
        blush: '#ff8f9a',
        tail: 'puff',
        tuft: true
      },
      teen: {
        body: '#ffc88c',
        belly: '#fff0dc',
        ear: '#ff9c86',
        foot: '#d8946a',
        iris: '#8a5a44',
        blush: '#ff8f9a',
        tail: 'puff',
        tuft: true,
        gem: '#5de6ff'
      },
      adult: {
        body: '#ffbc76',
        belly: '#fff2e0',
        ear: '#ff8f7a',
        foot: '#cf875c',
        iris: '#7a4a3a',
        blush: '#ff8f9a',
        tail: 'puff',
        tuft: true,
        gem: '#5de6ff',
        cheeks: true
      },
      legend: {
        body: '#ffe278',
        belly: '#fff8d6',
        ear: '#ffbe6e',
        foot: '#e2aa3c',
        iris: '#9a5a2a',
        blush: '#ff9aa0',
        tail: 'puff',
        tuft: true,
        star: '#ff7896',
        cheeks: true,
        sparkle: true,
        halo: false
      }
    }
  },
  webster: {
    kind: 'hero',
    stages: {
      egg: eggSpec('#e8505e'),
      baby: {
        body: '#e23c46',
        suit: '#34489f',
        foot: '#273a85',
        hand: '#e23c46',
        blush: '#ff8f96',
        web: '#8f1e2e',
        lens: '#ffffff',
        legs: 0
      },
      teen: {
        body: '#e83442',
        suit: '#2e42a8',
        foot: '#243480',
        hand: '#e83442',
        blush: '#ff8290',
        web: '#8a1a2a',
        lens: '#ffffff',
        legs: 1
      },
      adult: {
        body: '#d0263a',
        suit: '#243696',
        foot: '#1c2a70',
        hand: '#d0263a',
        blush: '#ff7885',
        web: '#7a1424',
        lens: '#ffffff',
        legs: 2,
        emblem: true
      },
      legend: {
        body: '#c41e46',
        suit: '#1e2882',
        foot: '#ffce42',
        hand: '#c41e46',
        blush: '#ff829a',
        web: '#ffce42',
        lens: '#fffbe0',
        legs: 3,
        emblem: true,
        sparkle: true,
        gold: '#ffce42'
      }
    }
  },
  draco: {
    kind: 'dragon',
    stages: {
      egg: eggSpec('#6ecd82'),
      baby: {
        body: '#78cd82',
        belly: '#faeeb4',
        foot: '#58a864',
        horn: '#ffd65a',
        wing: '#9a6edc',
        iris: '#e8902a',
        blush: '#ffaa8c',
        wings: 0
      },
      teen: {
        body: '#60c078',
        belly: '#f6e8aa',
        foot: '#4c965c',
        horn: '#ffdc64',
        wing: '#9a6edc',
        iris: '#e8902a',
        blush: '#ffaa8c',
        wings: 0.8,
        frill: true
      },
      adult: {
        body: '#46aa8c',
        belly: '#f0e6aa',
        foot: '#36826c',
        horn: '#faf0c8',
        wing: '#7a5ac8',
        iris: '#e8a030',
        blush: '#ffaa8c',
        wings: 1,
        frill: true
      },
      legend: {
        body: '#ffd65a',
        belly: '#fff5cd',
        foot: '#e2aa3c',
        horn: '#ff783c',
        wing: '#ff783c',
        iris: '#d83c28',
        blush: '#ffa08a',
        wings: 1.2,
        frill: true,
        flames: true,
        sparkle: true
      }
    }
  },
  robo: {
    kind: 'robot',
    stages: {
      egg: eggSpec('#7a8cbe', '#d6e0f0', '#a8b8d6'),
      baby: {
        body: '#a0b9d7',
        trim: '#768eb6',
        foot: '#545c80',
        horn: '#eb4650',
        visor: '#1e2846',
        glow: '#5de6ff',
        hand: '#8ea6c6'
      },
      teen: {
        body: '#78aae6',
        trim: '#507cbe',
        foot: '#465478',
        horn: '#eb4650',
        visor: '#18223e',
        glow: '#5de6ff',
        hand: '#6c98d2',
        panel: true
      },
      adult: {
        body: '#96a0be',
        trim: '#68749a',
        foot: '#3c4664',
        horn: '#ffaa3c',
        visor: '#181e38',
        glow: '#78ffbe',
        hand: '#8892b0',
        panel: true,
        gears: true
      },
      legend: {
        body: '#faf0c8',
        trim: '#e2c882',
        foot: '#e2aa3c',
        horn: '#5de6ff',
        visor: '#28284a',
        glow: '#ff7896',
        hand: '#f0e0a8',
        panel: true,
        gears: true,
        halo: true,
        sparkle: true
      }
    }
  },
  kitsu: {
    kind: 'fox',
    stages: {
      egg: eggSpec('#ffaa5a'),
      baby: {
        body: '#ffa046',
        belly: '#ffeecd',
        ear: '#ffd6aa',
        foot: '#784c36',
        tip: '#5a3228',
        iris: '#c0701e',
        blush: '#ff9678',
        tails: 1,
        tailTip: '#ffffff'
      },
      teen: {
        body: '#ff9238',
        belly: '#ffecc8',
        ear: '#ffd0a0',
        foot: '#6e4430',
        tip: '#50242a',
        iris: '#c0701e',
        blush: '#ff9678',
        tails: 1,
        tailTip: '#ffffff',
        mark: '#eb3c3c'
      },
      adult: {
        body: '#ff7a3c',
        belly: '#ffe8c4',
        ear: '#ffc896',
        foot: '#64382c',
        tip: '#462420',
        iris: '#b8601e',
        blush: '#ff8c78',
        tails: 2,
        tailTip: '#ffffff',
        mark: '#eb3c3c',
        cheeks: true
      },
      legend: {
        body: '#ffecbe',
        belly: '#fffae6',
        ear: '#ffe2aa',
        foot: '#e2aa3c',
        tip: '#78beff',
        iris: '#3c8cd2',
        blush: '#ffa0a0',
        tails: 3,
        tailTip: '#78beff',
        mark: '#eb5a5a',
        cheeks: true,
        flames: true,
        sparkle: true
      }
    }
  }
}

/** Biểu tượng thay cho con ngươi: tim (yêu), X (lỗi/buồn), sao (choáng/ngạc nhiên) */
function drawSymbol(cv, kind, x, y, r, color) {
  if (kind === 'heart') {
    fill(
      cv,
      [
        circle(x - r * 0.5, y - r * 0.2, r * 0.58),
        circle(x + r * 0.5, y - r * 0.2, r * 0.58),
        poly(
          [
            [x - r * 1.05, y + r * 0.05],
            [x + r * 1.05, y + r * 0.05],
            [x, y + r * 1.15]
          ],
          1
        )
      ],
      color
    )
  } else if (kind === 'x') {
    line(cv, x - r * 0.8, y - r * 0.8, x + r * 0.8, y + r * 0.8, 1.8, color)
    line(cv, x - r * 0.8, y + r * 0.8, x + r * 0.8, y - r * 0.8, 1.8, color)
  } else if (kind === 'star') {
    fill(
      cv,
      [
        poly(
          [
            [x, y - r * 1.2],
            [x + r * 0.35, y - r * 0.35],
            [x + r * 1.2, y],
            [x + r * 0.35, y + r * 0.35],
            [x, y + r * 1.2],
            [x - r * 0.35, y + r * 0.35],
            [x - r * 1.2, y],
            [x - r * 0.35, y - r * 0.35]
          ],
          1
        )
      ],
      color
    )
  }
}
const SYMBOL_EYES = ['heart', 'x', 'star']
const symbolColor = (kind, fallback) =>
  kind === 'heart' ? [255, 79, 122, 255] : kind === 'star' ? [255, 226, 90, 255] : fallback

// ------------------------------------------------------------------ hiệu ứng nhỏ
function drawFx(cv, f, bx, top) {
  const x = bx + f.x
  const y = top + f.y
  const s = f.s ?? 1
  switch (f.k) {
    case 'heart': {
      const r = 2.6 * s
      paint(
        cv,
        [
          circle(x - r * 0.85, y, r),
          circle(x + r * 0.85, y, r),
          poly(
            [
              [x - r * 1.75, y + r * 0.35],
              [x + r * 1.75, y + r * 0.35],
              [x, y + r * 2.4]
            ],
            r
          )
        ],
        { ramp: R('#ff5a7a'), outline: false }
      )
      put(cv, x - r, y - 1, [255, 255, 255, 255])
      break
    }
    case 'spark': {
      const r = 4 * s
      fill(
        cv,
        [
          poly(
            [
              [x, y - r],
              [x + 1.1, y - 1.1],
              [x + r, y],
              [x + 1.1, y + 1.1],
              [x, y + r],
              [x - 1.1, y + 1.1],
              [x - r, y],
              [x - 1.1, y - 1.1]
            ],
            2
          )
        ],
        f.c ?? [255, 244, 160, 255]
      )
      put(cv, x, y, [255, 255, 255, 255])
      break
    }
    case 'z': {
      const c = [96, 142, 240, 255]
      const z = 4 * s
      fill(
        cv,
        [
          capsule(x - z, y - z, x + z, y - z, 1),
          capsule(x + z, y - z, x - z, y + z, 1),
          capsule(x - z, y + z, x + z, y + z, 1)
        ],
        c
      )
      break
    }
    case 'excl': {
      fill(
        cv,
        [capsule(x, y - 6 * s, x, y + 1 * s, 1.7 * s, 1.1 * s), circle(x, y + 5 * s, 1.5 * s)],
        [235, 70, 70, 255]
      )
      break
    }
    case 'ques': {
      arc(cv, x, y - 2 * s, 3.4 * s, 3.2 * s, rad(190), rad(450), 2.4 * s, [90, 130, 235, 255])
      fill(cv, [circle(x, y + 6 * s, 1.4 * s)], [90, 130, 235, 255])
      break
    }
    case 'sweat': {
      paint(
        cv,
        [
          circle(x, y + 2.5 * s, 2.6 * s),
          poly(
            [
              [x - 2.2 * s, y + 1.5 * s],
              [x + 2.2 * s, y + 1.5 * s],
              [x, y - 4 * s]
            ],
            2
          )
        ],
        { ramp: R('#7fc4ff'), outline: false }
      )
      break
    }
    case 'steam': {
      const c = [235, 235, 245, 210]
      fill(
        cv,
        [circle(x, y, 3 * s), circle(x + 3 * s, y - 2, 2.4 * s), circle(x - 2, y - 3, 2 * s)],
        c
      )
      break
    }
    case 'note': {
      const c = [70, 70, 110, 255]
      fill(
        cv,
        [
          ellipse(x, y + 4, 2.8 * s, 2.1 * s, -0.4),
          capsule(x + 2.4 * s, y + 3, x + 2.4 * s, y - 5 * s, 0.8),
          capsule(x + 2.4 * s, y - 5 * s, x + 5.4 * s, y - 2 * s, 0.9)
        ],
        c
      )
      break
    }
    case 'crumb': {
      fill(cv, [circle(x, y, 1.1 * s)], [214, 160, 100, 255])
      break
    }
    case 'tear': {
      paint(
        cv,
        [
          circle(x, y + 2, 1.8 * s),
          poly(
            [
              [x - 1.6 * s, y + 1],
              [x + 1.6 * s, y + 1],
              [x, y - 3 * s]
            ],
            1.4
          )
        ],
        { ramp: R('#8fd0ff'), outline: false }
      )
      break
    }
    case 'flame': {
      const p = f.p ?? 0
      const h = 8 * s * (0.85 + 0.25 * Math.sin(p * Math.PI * 2))
      paint(
        cv,
        [
          ellipse(x, y, 3.4 * s, 4.4 * s),
          poly(
            [
              [x - 3.2 * s, y - 1],
              [x + 3.2 * s, y - 1],
              [x + Math.sin(p * 6.28) * 1.5, y - h]
            ],
            3
          )
        ],
        { ramp: R(f.c ?? '#ff8a2a'), outline: false }
      )
      fill(cv, [ellipse(x, y + 1, 1.6 * s, 2.4 * s)], [255, 232, 130, 255])
      break
    }
    case 'web': {
      // Sợi tơ từ tay bắn thẳng lên mép khung (anchor) hoặc một đoạn ngắn
      const sx = x
      const sy = y
      const topY = f.anchor ? 0 : sy - 14 * s
      const dark = [58, 64, 92, 255]
      const light = [240, 242, 250, 255]
      const steps = Math.max(8, Math.round(sy - topY))
      for (let k = 0; k <= steps; k++) {
        const t = k / steps
        const px = sx + Math.sin(t * 3) * 1.2
        const py = sy + (topY - sy) * t
        put(cv, px - 1, py, dark)
        put(cv, px + 1, py, dark)
        put(cv, px, py, light)
      }
      fill(cv, [circle(sx, sy, 2)], dark)
      fill(cv, [circle(sx, sy, 1)], light)
      break
    }
    case 'fire': {
      // Luồng lửa phun chếch lên bên phải miệng: nhiều ngọn nhỏ dần tăng kích thước
      const p = f.p ?? 0
      const len = 18 + p * 18
      const parts = 5
      for (let k = parts - 1; k >= 0; k--) {
        const t = k / (parts - 1)
        drawFx(
          cv,
          {
            k: 'flame',
            x: f.x + t * len * 0.9,
            y: f.y - t * len * 0.35,
            s: (0.7 + t * 0.9) * (f.s ?? 1),
            p: p + t,
            c: t > 0.6 ? '#ff6a2a' : '#ffb02a'
          },
          bx,
          top
        )
      }
      break
    }
    case 'sound': {
      const p = f.p ?? 0
      for (let k = 0; k < 3; k++) {
        const r = 5 + k * 5 + p * 5
        arc(cv, x, y, r, r, rad(-50), rad(50), 1.6, [90, 96, 130, Math.round(230 - k * 60)])
      }
      break
    }
    case 'sense': {
      // Vạch "giác quan nhện" toả ra trên đầu
      const c = [230, 60, 70, 255]
      for (const a of [-50, -25, 0, 25, 50]) {
        const ang = rad(a - 90)
        line(
          cv,
          x + Math.cos(ang) * 12,
          y + Math.sin(ang) * 12,
          x + Math.cos(ang) * 19,
          y + Math.sin(ang) * 19,
          1.6,
          c
        )
      }
      break
    }
    case 'beep': {
      const p = f.p ?? 0
      const c = [93, 230, 255, 255]
      for (let k = 0; k < 2; k++) {
        const r = 5 + p * 6 + k * 6
        arc(cv, x, y, r, r, rad(200), rad(340), 1.6, [
          c[0],
          c[1],
          c[2],
          Math.round(240 - k * 90 - p * 80)
        ])
      }
      break
    }
    case 'scan': {
      const p = f.p ?? 0
      fill(
        cv,
        [
          poly(
            [
              [x, y],
              [x - 12 - p * 4, y + 36],
              [x + 12 + p * 4, y + 36]
            ],
            2
          )
        ],
        [93, 230, 255, 120]
      )
      break
    }
    case 'dust': {
      fill(cv, [circle(x, y, 2 * s)], [230, 224, 214, 190])
      break
    }
  }
}

// ------------------------------------------------------------------ vẽ nhân vật
export function drawCreature(cv, charId, stage, pose) {
  const spec = CHARACTERS[charId]
  const S = spec.stages[stage]
  const D = DIMS[stage]
  const P = { ...DEFAULT_POSE, ...pose }
  const isEgg = stage === 'egg'
  const kind = spec.kind

  // --- hình học theo tư thế
  const sq = P.sq
  const sy = 1 - sq
  const sx = (1 + sq * 0.78) * P.spin
  const rx = D.rx * sx
  const ry = D.ry * sy
  const jump = P.jump
  const bx = 48 + P.dx + P.lean
  const fx0 = 48 + P.dx
  const cy = BODY_BOTTOM - jump - ry - P.bob
  const eyeY = cy + (isEgg ? ry * 0.12 : -ry * 0.02) + P.look[1] * 0.8
  const eyeDX = rx * (isEgg ? 0.34 : kind === 'hero' ? 0.37 : 0.4)
  const mouthY = cy + ry * (isEgg ? 0.42 : 0.4)
  const A = {
    bx,
    cy,
    rx,
    ry,
    top: cy - ry,
    eyeY,
    eyeDX,
    mouthY,
    neckY: cy + ry * 0.5,
    sx,
    sy,
    jump,
    fx0,
    hasArms: !isEgg,
    stage,
    kind
  }

  const bodyR = R(S.body)

  // --- bóng đổ dưới đất
  const sh = Math.max(0.4, 1 - jump / 30)
  fill(cv, [ellipse(fx0, GROUND - 0.5, (rx * 0.85 + 4) * sh, 3.4 * sh)], [40, 40, 70, 70])

  // --- phía sau: cánh, đuôi, chân nhện
  if (!isEgg) drawBack(cv, kind, S, A, P)

  // --- tai / sừng / ăng-ten (sau thân)
  if (!isEgg) drawHeadgear(cv, kind, S, A, P)

  // --- chân
  if (!isEgg) {
    const fr = R(S.foot ?? S.body)
    for (const [side, f] of [
      [-1, P.footL],
      [1, P.footR]
    ]) {
      const fx = fx0 + side * 12.5 * sx + f[1]
      const fy = GROUND - 4.6 - jump - f[0]
      const shape = kind === 'robot' ? rbox(fx, fy, 9, 4.8, 2.6) : ellipse(fx, fy, 9.2 * sx, 5, 0)
      paint(cv, [shape], { ramp: fr })
      if (kind === 'fox' || kind === 'cat')
        fill(cv, [ellipse(fx + 1, fy + 1, 3, 1.6)], mix(fr.base, fr.light, 0.5))
    }
  }

  // --- thân
  let bodyShapes
  if (isEgg) {
    bodyShapes = [
      ellipse(bx, cy + ry * 0.2, rx, ry * 0.8, 0, rx),
      ellipse(bx, cy - ry * 0.18, rx * 0.86, ry * 0.86, 0, rx * 0.86)
    ]
  } else if (kind === 'robot') {
    bodyShapes = [rbox(bx, cy, rx, ry, Math.min(rx, ry) * 0.56, Math.min(rx, ry) * 0.9)]
  } else {
    bodyShapes = [ellipse(bx, cy, rx, ry, 0, Math.min(rx, ry) * 0.95)]
  }
  if (!isEgg) drawArms(cv, kind, S, D, A, P, 'back')
  const body = paint(cv, bodyShapes, { ramp: bodyR })
  // vệt sáng bóng (gloss) trên đầu
  fill(
    cv,
    [ellipse(bx - rx * 0.42, cy - ry * 0.55, rx * 0.17, ry * 0.1, -0.7)],
    mix(bodyR.hl, [255, 255, 255, 255], 0.55),
    body
  )

  if (!P.back) {
    drawDecals(cv, charId, kind, stage, S, A, P, body, bodyR)
    drawFace(cv, kind, S, D, A, P, body, bodyR, isEgg)
  }
  if (!isEgg) drawArms(cv, kind, S, D, A, P, 'front')
  drawFront(cv, kind, S, A, P)

  for (const f of P.fx) drawFx(cv, f, bx, A.top)
  return A
}

// ------------------------------------------------------------------ phần sau thân
function drawBack(cv, kind, S, A, P) {
  const { bx, cy, rx, ry, fx0 } = A
  // Chân nhện (hero)
  if (kind === 'hero' && S.legs) {
    const lr = R(S.suit)
    for (const side of [-1, 1]) {
      for (let i = 0; i < S.legs; i++) {
        const y0 = cy - ry * 0.1 + i * 8
        const sway = Math.sin((P.t + i * 0.3 + (side > 0 ? 0.5 : 0)) * Math.PI * 2) * 1.5
        const a = [bx + side * (rx - 6), y0]
        const b = [bx + side * (rx + 8 + i * 1.5), y0 - 9 - i * 2 + sway]
        const c = [bx + side * (rx + 15 + i * 2), y0 + 4 + sway]
        const pts = [
          ...bezier(a, [b[0], b[1] - 3], b, 5),
          ...bezier(b, [c[0], c[1] - 6], c, 5).slice(1)
        ]
        paint(cv, strokeShapes(pts, 2.2, 1.1), { ramp: lr, outline: true, dither: false })
      }
    }
  }
  // Cánh rồng
  if (kind === 'dragon' && S.wings) {
    const wr = R(S.wing)
    const size = S.wings
    const flap = P.flap
    for (const side of [-1, 1]) {
      const sh = [bx + side * (rx * 0.6), cy - ry * 0.35]
      const ang = rad(-35 - flap * 55)
      const L = 24 * size
      const tip = [sh[0] + side * Math.cos(ang) * L, sh[1] + Math.sin(ang) * L]
      const mid = [sh[0] + side * (L * 0.82), sh[1] - 4 * size + flap * 6]
      const low = [sh[0] + side * (L * 0.58), sh[1] + 15 * size - flap * 10]
      const pts = [sh, tip, [mid[0] + side * 2, mid[1] + 5], low, [sh[0] + side * 4, sh[1] + 12]]
      paint(cv, [poly(pts, 7)], { ramp: wr })
      line(cv, sh[0], sh[1], tip[0], tip[1], 1.6, wr.line)
      line(cv, sh[0], sh[1], mid[0], mid[1], 1.2, wr.line)
      line(cv, sh[0], sh[1], low[0], low[1], 1.2, wr.line)
    }
  }
  // Đuôi
  const tw = P.tail
  const baseY = cy + ry * 0.45
  if (S.tail === 'puff') {
    const tx = bx + rx - 2 + tw * 4
    const ty = baseY - 3 - Math.abs(tw) * 3
    paint(cv, [ellipse(tx + 5, ty, 7.5, 6.5, 0.4), circle(bx + rx - 4, baseY, 4)], {
      ramp: R(S.body)
    })
  }
  if (kind === 'fox') {
    const n = S.tails
    for (let i = 0; i < n; i++) {
      const side = i === 2 ? -1 : 1
      const base = [bx + side * (rx - 3), baseY + 2]
      const a = rad(-52 - (i === 1 ? 26 : 0) + tw * 20)
      const len = 25 + (n - i) * 1.5
      const tip = [base[0] + side * Math.cos(a) * len, base[1] + Math.sin(a) * len]
      const dir = Math.atan2(tip[1] - base[1], tip[0] - base[0])
      const mid = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2]
      const tailMask = paint(cv, [ellipse(mid[0], mid[1], len * 0.54, 8.6, dir)], {
        ramp: R(S.body)
      })
      fill(
        cv,
        [ellipse(tip[0] - Math.cos(dir) * 3, tip[1] - Math.sin(dir) * 3, 8.5, 9, dir)],
        R(S.tailTip).light,
        tailMask
      )
    }
  }
  if (kind === 'dragon') {
    const tr = R(S.body)
    const a = [bx + rx - 6, baseY + 6]
    const b = [bx + rx + 10 + tw * 3, baseY + 10 + tw * -6]
    const c = [bx + rx + 20 + tw * 6, baseY - 2 - tw * 10]
    paint(cv, strokeShapes(bezier(a, b, c, 8), 6.4, 1.8), { ramp: tr })
    const hr = R(S.horn)
    paint(
      cv,
      [
        poly(
          [
            [c[0] - 3, c[1] + 2],
            [c[0] + 5, c[1] - 7],
            [c[0] + 8, c[1] + 3],
            [c[0] + 1, c[1] + 5]
          ],
          3
        )
      ],
      { ramp: hr }
    )
  }
  void fx0
}

// ------------------------------------------------------------------ tai / sừng / ăng-ten
function ear(cv, base, tipDelta, w, ramp, innerRamp, angleDeg, tipRamp) {
  const a = rad(angleDeg)
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const dx = tipDelta[0] * cos - tipDelta[1] * sin
  const dy = tipDelta[0] * sin + tipDelta[1] * cos
  const tip = [base[0] + dx, base[1] + dy]
  const len = Math.hypot(dx, dy)
  const nx = -dy / len
  const ny = dx / len
  const p1 = [base[0] + nx * w, base[1] + ny * w]
  const p2 = [base[0] - nx * w, base[1] - ny * w]
  const mask = paint(cv, [poly([p1, p2, tip], w * 0.9, 0.6)], { ramp })
  if (innerRamp) {
    const k = 0.62
    const q1 = [base[0] + nx * w * 0.55 + dx * 0.12, base[1] + ny * w * 0.55 + dy * 0.12]
    const q2 = [base[0] - nx * w * 0.55 + dx * 0.12, base[1] - ny * w * 0.55 + dy * 0.12]
    const qt = [base[0] + dx * k, base[1] + dy * k]
    paint(cv, [poly([q1, q2, qt], 3)], { ramp: innerRamp, outline: false, clip: mask })
  }
  if (tipRamp) {
    const k = 0.66
    const m1 = [base[0] + nx * w * 1.4 + dx * k, base[1] + ny * w * 1.4 + dy * k]
    const m2 = [base[0] - nx * w * 1.4 + dx * k, base[1] - ny * w * 1.4 + dy * k]
    paint(cv, [poly([m1, m2, [tip[0] + dx * 0.3, tip[1] + dy * 0.3]], 3)], {
      ramp: tipRamp,
      outline: false,
      clip: mask
    })
  }
}

function drawHeadgear(cv, kind, S, A, P) {
  const { bx, cy, rx, ry } = A
  const top = cy - ry
  const stageIdx = STAGES.indexOf(A.stage)
  const grow = 1 + stageIdx * 0.06
  if (kind === 'cat') {
    const er = R(S.body)
    const inner = R(S.ear)
    for (const side of [-1, 1]) {
      const base = [bx + side * rx * 0.55, top + ry * 0.28]
      const tipDelta = [side * 9 * grow, -17 * grow]
      ear(
        cv,
        base,
        side < 0 ? [tipDelta[0], tipDelta[1]] : tipDelta,
        10 * grow,
        er,
        inner,
        side < 0 ? P.earL : P.earR
      )
    }
  }
  if (kind === 'fox') {
    const er = R(S.body)
    const inner = R(S.ear)
    const tipR = R(S.tip)
    for (const side of [-1, 1]) {
      const base = [bx + side * rx * 0.52, top + ry * 0.3]
      ear(cv, base, [side * 7, -24 * grow], 9.5 * grow, er, inner, side < 0 ? P.earL : P.earR, tipR)
    }
  }
  if (kind === 'dragon') {
    const hr = R(S.horn)
    for (const side of [-1, 1]) {
      const a = [bx + side * rx * 0.42, top + ry * 0.22]
      const b = [bx + side * rx * 0.62, top - 10 * grow]
      const c = [bx + side * rx * 0.55, top - 19 * grow]
      paint(cv, strokeShapes(bezier(a, b, c, 6), 5, 1), { ramp: hr })
    }
    if (S.frill) {
      for (const side of [-1, 1]) {
        paint(
          cv,
          [
            poly(
              [
                [bx + side * (rx - 3), cy - 6],
                [bx + side * (rx + 9), cy - 10],
                [bx + side * (rx + 1), cy + 4]
              ],
              4
            )
          ],
          { ramp: R(S.horn) }
        )
      }
      for (const dx of [-5, 0, 5]) {
        paint(
          cv,
          [
            poly(
              [
                [bx + dx - 3, top + 3],
                [bx + dx + 3, top + 3],
                [bx + dx, top - 7]
              ],
              3
            )
          ],
          { ramp: R(S.horn) }
        )
      }
    }
  }
  if (kind === 'robot') {
    const ar = R('#8a92a8')
    const ax = bx + 5
    const ay = top - 12 * grow
    paint(
      cv,
      strokeShapes(
        [
          [bx + 2, top + 2],
          [ax, ay]
        ],
        1.6,
        1.3
      ),
      { ramp: ar, dither: false }
    )
    const pulse = 0.5 + 0.5 * Math.sin(P.t * Math.PI * 2)
    const hr = R(S.horn)
    if (pulse > 0.4)
      fillDither(cv, [circle(ax, ay, 6.5)], [...R(S.horn).hl.slice(0, 3), 255], 0.35 * pulse)
    paint(cv, [circle(ax, ay, 3.6)], { ramp: hr })
    // đinh tán tai (bolt) hai bên đầu
    for (const side of [-1, 1])
      paint(cv, [circle(bx + side * (rx + 1), cy + 1, 5.2)], { ramp: R(S.trim) })
  }
}

// ------------------------------------------------------------------ hoa văn trên thân
function drawDecals(cv, charId, kind, stage, S, A, P, body, bodyR) {
  const { bx, cy, rx, ry } = A
  const top = cy - ry
  if (stage === 'egg') {
    const sr = R(S.spot)
    const spots = [
      [-0.45, -0.1, 3.2],
      [0.5, 0.2, 3.8],
      [-0.2, 0.55, 3],
      [0.3, -0.5, 2.6],
      [-0.6, 0.35, 2.4]
    ]
    for (const [ux, uy, r] of spots)
      paint(cv, [ellipse(bx + ux * rx, cy + uy * ry, r, r * 0.85)], {
        ramp: sr,
        outline: false,
        clip: body
      })
    // vết nứt zích-zắc trên đỉnh trứng
    const c = bodyR.line
    const pts = [
      [bx - 5, top + 5],
      [bx - 1, top + 9],
      [bx - 4, top + 13],
      [bx + 2, top + 16]
    ]
    for (let i = 0; i < pts.length - 1; i++)
      line(cv, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 1.5, c, body)
    return
  }
  // vùng bụng / bộ đồ
  if (S.belly) {
    const br = R(S.belly)
    paint(cv, [ellipse(bx, cy + ry * 0.62, rx * 0.66, ry * 0.5)], {
      ramp: br,
      outline: false,
      clip: body,
      shift: -0.2
    })
  }
  if (kind === 'hero') {
    const sr = R(S.suit)
    paint(cv, [ellipse(bx, cy + ry * 1.5, rx * 1.3, ry * 1.02)], {
      ramp: sr,
      outline: false,
      clip: body
    })
    const web = hex(S.web)
    if (stage !== 'baby') {
      for (const a of [-52, -26, 0, 26, 52]) {
        const t = rad(90 + a)
        line(
          cv,
          bx,
          top + 2,
          bx + Math.cos(t) * rx * 0.95,
          top + 2 + Math.sin(t) * ry * 0.95,
          1.1,
          web,
          body
        )
      }
      for (const k of [0.3, 0.52, 0.74])
        arc(cv, bx, top + 2, rx * k, ry * k, rad(28), rad(152), 1.1, web, body)
    } else {
      line(cv, bx, top + 2, bx, top + 9, 1.3, web, body)
      arc(cv, bx, top + 2, rx * 0.28, ry * 0.28, rad(30), rad(150), 1.1, web, body)
    }
    if (S.emblem) {
      const ey = cy + ry * 0.62
      const ec = [226, 228, 240, 255]
      fill(cv, [ellipse(bx, ey, 2.4, 3.4), circle(bx, ey - 3.6, 1.7)], ec, body)
      for (const side of [-1, 1])
        for (const k of [-1, 0, 1])
          line(cv, bx + side * 1.5, ey + k * 1.2, bx + side * 7, ey + k * 3.6 - 1.4, 1, ec, body)
    }
  }
  if (kind === 'dragon') {
    // vạch bụng + mõm
    const br = R(S.belly)
    for (let i = 0; i < 4; i++)
      arc(
        cv,
        bx,
        cy + ry * 0.36 + i * 5.2,
        rx * (0.52 - i * 0.05),
        4,
        rad(15),
        rad(165),
        1.1,
        mix(br.shade, br.deep, 0.5),
        body
      )
    paint(cv, [ellipse(bx, cy + ry * 0.38, rx * 0.4, ry * 0.3)], {
      ramp: br,
      outline: false,
      clip: body,
      shift: -0.3
    })
    fill(
      cv,
      [circle(bx - 3.4, cy + ry * 0.24, 1), circle(bx + 3.4, cy + ry * 0.24, 1)],
      bodyR.deep,
      body
    )
  }
  if (kind === 'fox') {
    const br = R(S.belly)
    paint(
      cv,
      [
        ellipse(bx, cy + ry * 0.4, rx * 0.46, ry * 0.34),
        ellipse(bx - rx * 0.62, cy + ry * 0.36, rx * 0.2, ry * 0.2),
        ellipse(bx + rx * 0.62, cy + ry * 0.36, rx * 0.2, ry * 0.2)
      ],
      { ramp: br, outline: false, clip: body, shift: -0.2 }
    )
    if (S.mark)
      paint(
        cv,
        [
          poly(
            [
              [bx, top + 6],
              [bx + 3, top + 10.5],
              [bx, top + 15],
              [bx - 3, top + 10.5]
            ],
            3
          )
        ],
        { ramp: R(S.mark), outline: false }
      )
    if (S.cheeks) {
      for (const side of [-1, 1])
        paint(
          cv,
          [
            poly(
              [
                [bx + side * (rx - 1), cy + 2],
                [bx + side * (rx - 12), cy + 7],
                [bx + side * (rx - 1), cy + 11]
              ],
              3
            )
          ],
          { ramp: R(S.belly), outline: false, clip: body }
        )
    }
  }
  if (kind === 'cat') {
    if (S.tuft) {
      for (const [dx, lean] of [
        [-4, -0.5],
        [0, 0],
        [4, 0.5]
      ])
        paint(cv, [ellipse(bx + dx, top + 2, 2.4, 5.4, lean)], { ramp: bodyR, shift: 0.3 })
    }
    if (S.gem) {
      const g = R(S.gem)
      paint(
        cv,
        [
          poly(
            [
              [bx, top + 10],
              [bx + 3.6, top + 15],
              [bx, top + 20],
              [bx - 3.6, top + 15]
            ],
            3
          )
        ],
        { ramp: g, outline: true }
      )
    }
    if (S.star) {
      const g = R(S.star)
      const sx0 = bx
      const sy0 = top + 15
      paint(
        cv,
        [
          poly(
            [
              [sx0, sy0 - 6],
              [sx0 + 2, sy0 - 2],
              [sx0 + 6, sy0],
              [sx0 + 2, sy0 + 2],
              [sx0, sy0 + 6],
              [sx0 - 2, sy0 + 2],
              [sx0 - 6, sy0],
              [sx0 - 2, sy0 - 2]
            ],
            3
          )
        ],
        { ramp: g, outline: false }
      )
    }
    if (S.cheeks) {
      for (const side of [-1, 1])
        paint(
          cv,
          [
            poly(
              [
                [bx + side * (rx - 1), cy + 1],
                [bx + side * (rx - 11), cy + 6],
                [bx + side * (rx - 1), cy + 10]
              ],
              3
            )
          ],
          { ramp: R(S.belly), outline: false, clip: body }
        )
    }
  }
  if (kind === 'robot') {
    const tr = R(S.trim)
    const seam = tr.deep
    line(cv, bx - rx * 0.34, top + 3, bx - rx * 0.34, cy - ry * 0.55, 1.2, seam, body)
    line(cv, bx + rx * 0.34, top + 3, bx + rx * 0.34, cy - ry * 0.55, 1.2, seam, body)
    for (const [dx, dy] of [
      [-0.78, -0.72],
      [0.78, -0.72],
      [-0.78, 0.7],
      [0.78, 0.7]
    ]) {
      fill(cv, [circle(bx + dx * rx, cy + dy * ry, 1.5)], tr.hl, body)
    }
    // tấm ngực
    const hatch = rbox(bx, cy + ry * 0.62, rx * 0.46, ry * 0.26, 3)
    paint(cv, [hatch], { ramp: R(S.visor), outline: true })
    const glow = hex(S.glow)
    const lit = 3 + (S.panel ? 1 : 0) + (S.gears ? 1 : 0)
    for (let i = 0; i < lit; i++)
      fill(
        cv,
        [
          rbox(bx - rx * 0.32 + i * ((rx * 0.64) / Math.max(1, lit - 1)), cy + ry * 0.62, 2, 2.2, 1)
        ],
        i % 2 === 0 ? glow : hex(S.horn)
      )
    if (S.halo) {
      const a = [255, 220, 90, 255]
      arc(cv, bx, top - 15, 17, 4.2, 0, Math.PI * 2, 2.8, [150, 110, 30, 255])
      arc(cv, bx, top - 15, 17, 4.2, 0, Math.PI * 2, 1.8, a)
    }
  }
}

// ------------------------------------------------------------------ mặt
function drawEye(cv, x, y, side, P, S, D, bodyR, scale = 1) {
  const kind = P.eyes
  let rx = D.eye[0] * scale
  let ry = D.eye[1] * scale
  const lc = bodyR.line
  const iris = R(S.iris ?? '#7a5a4a')
  if (SYMBOL_EYES.includes(kind)) {
    drawSymbol(cv, kind, x, y, rx * 1.1, symbolColor(kind, lc))
    return
  }
  if (kind === 'happy') {
    arc(cv, x, y + 2, rx * 1.05, ry * 0.8, rad(200), rad(340), 2.6, lc)
    return
  }
  const open =
    kind === 'closed' || kind === 'off' ? 0 : kind === 'sleepy' ? Math.min(P.open, 0.45) : P.open
  if (open < 0.3) {
    arc(cv, x, y - 1, rx * 1.05, ry * 0.55, rad(25), rad(155), 2.4, lc)
    return
  }
  if (kind === 'wide') {
    rx *= 1.18
    ry *= 1.14
  }
  ry *= open
  const lx = P.look[0]
  fill(cv, [ellipse(x, y, rx, ry)], lc)
  if (kind === 'wide') fill(cv, [ellipse(x, y, rx * 0.84, ry * 0.86)], [250, 250, 255, 255])
  const irisR = kind === 'wide' ? 0.55 : 0.8
  fill(
    cv,
    [ellipse(x + lx * 0.9, y + ry * 0.22, rx * irisR, ry * (kind === 'wide' ? 0.55 : 0.68))],
    iris.shade,
    { at: () => true }
  )
  fill(cv, [ellipse(x + lx * 0.9, y + ry * 0.34, rx * irisR * 0.8, ry * 0.4)], iris.light)
  fill(cv, [ellipse(x + lx * 1.1, y + ry * 0.05, rx * 0.4, ry * 0.42)], lc)
  // ánh sáng trong mắt
  fill(
    cv,
    [circle(x - rx * 0.32 + lx * 0.4, y - ry * 0.34, Math.max(1.3, rx * 0.34))],
    [255, 255, 255, 255]
  )
  fill(
    cv,
    [circle(x + rx * 0.34 + lx * 0.4, y + ry * 0.42, Math.max(0.8, rx * 0.17))],
    [255, 255, 255, 235]
  )
  if (kind === 'angry') {
    line(cv, x - side * rx * 1.5, y - ry - 3.2, x + side * rx * 1.4, y - ry + 0.8, 2.4, lc)
  }
  if (kind === 'sad') {
    line(cv, x - side * rx * 1.4, y - ry + 0.6, x + side * rx * 1.4, y - ry - 3.6, 2.2, lc)
  }
}

function drawFace(cv, kind, S, D, A, P, body, bodyR, isEgg) {
  const { bx, eyeY, eyeDX, mouthY, rx, ry } = A
  const lc = bodyR.line
  // --- mắt
  if (kind === 'hero' && !isEgg) {
    // Kính trắng của mặt nạ
    const lens = R(S.lens)
    const open =
      P.eyes === 'happy' || P.eyes === 'closed' || P.eyes === 'off'
        ? 0.45
        : P.eyes === 'wide'
          ? 1.2
          : P.open
    const slant = P.eyes === 'angry' ? 0.65 : P.eyes === 'sad' ? 0.15 : 0.42
    for (const side of [-1, 1]) {
      const ex = bx + side * eyeDX
      const shape = ellipse(ex, eyeY, 8.4 * (S.gold ? 1.05 : 1), 5.6 * open, side * slant, 5)
      paint(cv, [shape], { ramp: lens, line: S.gold ? hex(S.gold) : lc })
      if (SYMBOL_EYES.includes(P.eyes)) {
        drawSymbol(cv, P.eyes, ex, eyeY, 3.4, symbolColor(P.eyes, lc))
      } else if (open > 0.6) {
        fill(cv, [circle(ex + P.look[0] * 0.8 - side * 1, eyeY + 0.5, 2.2)], [40, 36, 56, 255])
        fill(cv, [circle(ex - 1.2, eyeY - 1.8, 1)], [255, 255, 255, 255])
      } else {
        arc(cv, ex, eyeY - 1, 5, 2.5, rad(20), rad(160), 1.8, lc)
      }
    }
  } else if (kind === 'robot' && !isEgg) {
    const visor = rbox(bx, eyeY, rx * 0.84, ry * 0.3, 6, 6)
    paint(cv, [visor], { ramp: R(S.visor), outline: true })
    const glow = hex(S.glow)
    const glowDim = mix(glow, hex(S.visor), 0.55)
    for (const side of [-1, 1]) {
      const ex = bx + side * eyeDX * 1.1 + P.look[0] * 0.8
      const e = P.eyes
      if (SYMBOL_EYES.includes(e)) {
        drawSymbol(cv, e, ex, eyeY, 4.4, symbolColor(e, glow))
      } else if (e === 'off') {
        fill(cv, [rbox(ex, eyeY, 4, 0.7, 0.3)], mix(glow, hex(S.visor), 0.8))
      } else if (e === 'scan') {
        fill(cv, [rbox(ex, eyeY, 6.6, 1.6, 0.8)], glow)
        fill(cv, [rbox(ex - 2, eyeY, 1.6, 1.6, 0.4)], [255, 255, 255, 255])
      } else if (e === 'happy') {
        arc(cv, ex, eyeY + 3, 5.4, 4.6, rad(200), rad(340), 2.8, glow)
      } else if (e === 'closed' || (e !== 'wide' && P.open < 0.3)) {
        fill(cv, [rbox(ex, eyeY, 5.4, 1.1, 0.5)], glowDim)
      } else if (e === 'sad') {
        fill(cv, [rbox(ex, eyeY + 0.5, 4.6, 3.6, 1.6)], glow)
        line(cv, ex - side * 5, eyeY - 4, ex + side * 5, eyeY - 7, 1.6, glowDim)
      } else if (e === 'angry') {
        fill(cv, [rbox(ex, eyeY + 1, 4.8, 2.8, 1.2)], hex('#ff5a5a'))
        line(cv, ex - side * 5.5, eyeY - 5.2, ex + side * 5.5, eyeY - 1.6, 1.8, hex('#ff5a5a'))
      } else {
        const k = e === 'wide' ? 1.25 : 1
        fill(cv, [rbox(ex, eyeY, 4.6 * k, (4.6 * P.open + 0.4) * k, 1.8)], glow)
        fill(cv, [rbox(ex - 1.4, eyeY - 1.6, 1.3, 1.3, 0.5)], [255, 255, 255, 255])
      }
    }
  } else {
    for (const side of [-1, 1])
      drawEye(cv, bx + side * eyeDX + P.look[0] * 0.5, eyeY, side, P, S, D, bodyR)
  }

  // --- má hồng
  const blushC = hex(S.blush ?? '#ff8f9a')
  if (kind !== 'robot' && P.blush > 0.05) {
    for (const side of [-1, 1])
      fillDither(
        cv,
        [ellipse(bx + side * (eyeDX + rx * 0.2), eyeY + (isEgg ? 7 : 8.5), 5.6, 3.2)],
        blushC,
        P.blush * 1.15,
        body
      )
  }
  if (kind === 'robot' && P.blush > 0.4) {
    for (const side of [-1, 1])
      fill(cv, [circle(bx + side * (eyeDX + 8), eyeY + 8, 1.3)], hex('#ff7896'))
  }

  // --- mũi
  if (kind === 'fox' && !isEgg) {
    paint(cv, [ellipse(bx, mouthY - 8.5, 2.6, 1.9)], { ramp: R('#3a2a30'), outline: false })
    fill(cv, [circle(bx - 0.8, mouthY - 9.3, 0.6)], [255, 255, 255, 255])
  }
  if (kind === 'cat' && !isEgg) {
    fill(cv, [ellipse(bx, mouthY - 6.6, 1.9, 1.3)], hex('#d8786e'))
  }

  // --- miệng
  mouth(cv, kind, S, A, P, lc, isEgg)
}

function mouth(cv, kindIn, S, A, P, lc, isEgg) {
  const kind = isEgg ? 'egg' : kindIn
  const { bx, mouthY, rx } = A
  const m = P.mouth
  const yo = isEgg ? 1 : 0
  const my = mouthY + yo
  const inner = hex('#7a2a3a')
  const tongue = hex('#ff8a9a')
  if (kind === 'robot') {
    const glow = hex(S.glow)
    if (m === 'open' || m === 'yawn' || m === 'grin') {
      fill(
        cv,
        [rbox(bx, my, 6 + (m === 'yawn' ? 2 : 0), 3.2 * P.mouthOpen + 0.6, 1.6)],
        R(S.visor).deep
      )
      fill(cv, [rbox(bx, my, 4.4, 1.4 * P.mouthOpen, 0.6)], glow)
    } else if (m === 'frown') {
      arc(cv, bx, my + 4, 5, 3, rad(200), rad(340), 1.6, glow)
    } else {
      for (let i = -2; i <= 2; i++)
        fill(
          cv,
          [rbox(bx + i * 2.6, my, 0.9, m === 'o' ? 2.2 : 1, 0.4)],
          i % 2 === 0 ? glow : mix(glow, [255, 255, 255, 255], 0.3)
        )
    }
    return
  }
  switch (m) {
    case 'open':
    case 'chew':
    case 'grin':
    case 'yawn': {
      const big = m === 'yawn' ? 1.55 : m === 'grin' ? 1.2 : 1
      const w = (m === 'chew' ? 4 : 5.6) * big
      const h =
        (m === 'chew' ? 2.4 + Math.abs(Math.sin(P.t * 12)) * 2 : 4.2 * P.mouthOpen + 1) * big
      fill(cv, [ellipse(bx, my + h * 0.2, w, h)], lc)
      fill(cv, [ellipse(bx, my + h * 0.2, w - 1.1, h - 1.1)], inner)
      if (h > 3) fill(cv, [ellipse(bx, my + h * 0.7, w * 0.6, h * 0.4)], tongue)
      if (kind === 'dragon' && h > 3) {
        for (const s of [-1, 1])
          fill(
            cv,
            [
              poly(
                [
                  [bx + s * (w - 1.5), my - h * 0.7],
                  [bx + s * (w - 3.8), my - h * 0.7],
                  [bx + s * (w - 2.6), my + 0.4]
                ],
                1
              )
            ],
            [250, 250, 250, 255]
          )
      }
      break
    }
    case 'o': {
      fill(cv, [ellipse(bx, my + 1, 2.7, 3.2)], lc)
      fill(cv, [ellipse(bx, my + 1.4, 1.6, 2)], inner)
      break
    }
    case 'flat':
      line(cv, bx - 3.4, my + 1, bx + 3.4, my + 1, 1.7, lc)
      break
    case 'frown':
      arc(cv, bx, my + 5, 4.6, 3.4, rad(205), rad(335), 1.8, lc)
      break
    default: {
      if (kind === 'cat' || kind === 'fox') {
        // miệng "ω"
        arc(cv, bx - 2.6, my - 1, 2.8, 2.5, rad(20), rad(170), 1.6, lc)
        arc(cv, bx + 2.6, my - 1, 2.8, 2.5, rad(10), rad(160), 1.6, lc)
      } else {
        arc(cv, bx, my - 2, 4.6 * Math.min(1.3, rx / 28), 3.4, rad(25), rad(155), 1.8, lc)
      }
    }
  }
}

// ------------------------------------------------------------------ tay
function drawArms(cv, kind, S, D, A, P, pass) {
  const { bx, cy, rx, ry, sx } = A
  const handR = R(S.hand ?? S.body)
  const armR = R(kind === 'hero' ? S.body : (S.hand ?? S.body))
  const len = D.arm
  for (const [side, ang] of [
    [-1, P.armL],
    [1, P.armR]
  ]) {
    const target0 = side < 0 ? P.handL : P.handR
    if ((ang < 50 && !target0) !== (pass === 'back')) continue
    const sxp = bx + side * (rx - 3.5 * sx)
    const syp = cy + ry * 0.2
    const target = side < 0 ? P.handL : P.handR
    const a = rad(ang)
    const ex = target ? bx + side * target[0] : sxp + side * Math.sin(a) * len
    const ey = target ? cy + target[1] : syp + Math.cos(a) * len
    paint(
      cv,
      strokeShapes(
        [
          [sxp, syp],
          [(sxp + ex) / 2, (syp + ey) / 2],
          [ex, ey]
        ],
        3.9,
        3.4
      ),
      { ramp: kind === 'robot' ? R(S.trim) : armR }
    )
    const hand = kind === 'robot' ? rbox(ex, ey, 4.2, 4.2, 2) : circle(ex, ey, 4.5)
    paint(cv, [hand], { ramp: kind === 'hero' ? R(S.suit) : handR })
    if (kind === 'fox' || kind === 'cat')
      fill(cv, [circle(ex, ey + 1, 1.4)], mix(handR.base, handR.deep, 0.5))
  }
}

// ------------------------------------------------------------------ phía trước (hào quang, lửa, vầng sáng)
function drawFront(cv, kind, S, A, P) {
  const { bx, cy, rx, ry } = A
  if (S.sparkle) {
    const t = P.t
    const pts = [
      [-rx - 5, -ry * 0.9, 0],
      [rx + 6, -ry * 0.5, 0.33],
      [-rx - 2, ry * 0.5, 0.66],
      [rx + 3, ry * 0.9, 0.15]
    ]
    for (const [dx, dy, ph] of pts) {
      const s = 0.55 + 0.45 * Math.abs(Math.sin((t + ph) * Math.PI))
      drawFx(cv, { k: 'spark', x: dx, y: dy + ry, s }, bx, cy - ry)
    }
  }
  if (S.flames) {
    const c = kind === 'fox' ? '#78beff' : '#ff8a2a'
    const pts =
      kind === 'fox'
        ? [
            [-rx - 6, -ry * 0.7],
            [rx + 8, -ry * 0.9]
          ]
        : [
            [-rx - 4, ry * 0.3],
            [rx + 3, -ry * 0.1]
          ]
    pts.forEach(([dx, dy], i) =>
      drawFx(cv, { k: 'flame', x: dx, y: dy + ry, s: 1, p: P.t + i * 0.4, c }, bx, cy - ry)
    )
  }
}

// ------------------------------------------------------------------ tiện ích bên ngoài
export const newFrame = () => createCanvas(W, W)
