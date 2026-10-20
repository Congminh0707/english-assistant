// Danh sách hoạt ảnh: mỗi hoạt ảnh là mảng tư thế (pose) cho drawCreature + thông số phát.
// Tên hoạt ảnh được MascotBrain (renderer/mascot/engine) gọi theo trạng thái/phản ứng.
const TAU = Math.PI * 2
const S = Math.sin
const C = Math.cos
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ease = (t) => t * t * (3 - 2 * t)
/** Đường cong 0→1→0 mượt theo t ∈ [0,1] */
const hump = (t) => S(clamp(t) * Math.PI)
const seq = (n, fn) => Array.from({ length: n }, (_, i) => ({ t: i / n, ...fn(i / n, i, n) }))

export const ANIMATIONS = {
  // Nghỉ: thở, chớp mắt, đuôi đung đưa nhẹ
  idle: {
    fps: 6,
    loop: true,
    frames: seq(8, (t, i) => ({
      bob: (S(t * TAU) + 1) * 0.7,
      sq: 0.01 + 0.012 * S(t * TAU),
      open: i === 5 ? 0.55 : i === 6 ? 0.05 : i === 7 ? 0.55 : 1,
      tail: S(t * TAU) * 0.4,
      armL: 22 + S(t * TAU) * 3,
      armR: 22 - S(t * TAU) * 3,
      earL: i === 3 ? 5 : 0
    }))
  },
  // Nhìn quanh
  look: {
    fps: 8,
    loop: false,
    frames: seq(12, (t, i) => {
      const dir = i < 2 ? 0 : i < 6 ? -1 : i < 10 ? 1 : 0
      return {
        look: [dir * 3, dir === 0 ? 0 : -0.4],
        lean: dir * 1.4,
        tail: dir * 0.3,
        earL: i === 7 ? 6 : 0,
        earR: i === 3 ? 6 : 0,
        bob: 0.5
      }
    })
  },
  // Vẫy đuôi vui vẻ
  wag: {
    fps: 12,
    loop: false,
    frames: seq(8, (t, i) => ({
      tail: S(t * TAU * 2),
      eyes: i > 0 && i < 7 ? 'happy' : 'open',
      mouth: 'grin',
      blush: 0.65,
      bob: 0.8 * Math.abs(S(t * TAU * 2)),
      lean: S(t * TAU * 2) * 1.2,
      armL: 30 + S(t * TAU * 2) * 8,
      armR: 30 - S(t * TAU * 2) * 8,
      fx: i >= 3 ? [{ k: 'heart', x: 14 + (i - 3) * 2, y: -4 - (i - 3) * 4, s: 0.8 }] : []
    }))
  },
  // Ngáp
  yawn: {
    fps: 8,
    loop: false,
    frames: seq(12, (t, i) => {
      const m = hump((i - 1) / 9)
      return {
        eyes: i >= 3 && i <= 9 ? 'closed' : 'sleepy',
        open: 1,
        mouth: i >= 2 && i <= 9 ? 'yawn' : 'flat',
        mouthOpen: m,
        sq: -0.05 * m,
        armL: 22 + m * 70,
        armR: 22 + m * 70,
        bob: m * 1.6,
        earL: m * 6,
        earR: m * 6,
        fx: i >= 10 ? [{ k: 'z', x: 18, y: -4, s: 0.8 }] : []
      }
    })
  },
  // Vươn vai
  stretch: {
    fps: 8,
    loop: false,
    frames: seq(10, (t) => {
      const m = hump(t)
      return {
        sq: -0.11 * m,
        armL: 22 + m * 150,
        armR: 22 + m * 150,
        eyes: m > 0.5 ? 'happy' : 'open',
        mouth: m > 0.6 ? 'o' : 'smile',
        footL: [m * 1.6, 0],
        footR: [m * 1.6, 0],
        bob: m * 1.2,
        tail: m * 0.7
      }
    })
  },
  // Vẫy tay chào
  wave: {
    fps: 10,
    loop: false,
    frames: seq(10, (t, i) => {
      const up = ease(clamp(i / 2.5)) * (1 - ease(clamp((i - 8) / 2)))
      return {
        armR: 22 + up * (125 + S(i * 1.9) * 16),
        eyes: 'happy',
        mouth: 'grin',
        blush: 0.6,
        bob: 0.8 * Math.abs(S(t * TAU * 1.5)),
        tail: S(t * TAU * 2) * 0.6,
        lean: S(t * TAU) * 0.8,
        fx: i === 4 || i === 6 ? [{ k: 'spark', x: 30, y: 6 - i, s: 0.7 }] : []
      }
    })
  },
  // Nhảy múa
  dance: {
    fps: 12,
    loop: false,
    frames: seq(16, (t, i) => {
      const beat = (i % 8) / 8
      const hop = Math.abs(S(beat * Math.PI)) * 6
      const side = i < 8 ? 1 : -1
      return {
        jump: hop,
        dx: side * S(beat * Math.PI) * 3,
        sq: 0.08 * (1 - Math.abs(S(beat * Math.PI))),
        armL: side > 0 ? 140 : 35,
        armR: side > 0 ? 35 : 140,
        eyes: 'happy',
        mouth: 'grin',
        blush: 0.7,
        tail: S(t * TAU * 4),
        earL: S(beat * TAU) * 6,
        earR: -S(beat * TAU) * 6,
        flap: 0.5 + 0.5 * S(t * TAU * 4),
        fx: [{ k: 'note', x: side * 28, y: -2 - (i % 8) * 2.5, s: 0.9 }]
      }
    })
  },
  // Xoay vòng
  spin: {
    fps: 14,
    loop: false,
    frames: seq(12, (t, i) => {
      const c = C(t * TAU)
      return {
        spin: Math.max(0.2, Math.abs(c)),
        back: c < 0,
        jump: hump(t) * 5,
        armL: 70,
        armR: 70,
        eyes: 'happy',
        mouth: 'grin',
        tail: S(t * TAU * 2) * 0.8,
        flap: 0.6,
        fx: i % 3 === 1 ? [{ k: 'spark', x: 28 * (i % 2 ? 1 : -1), y: 8, s: 0.7 }] : []
      }
    })
  },
  // Suy nghĩ
  think: {
    fps: 8,
    loop: false,
    frames: seq(10, (t, i) => {
      const m = ease(clamp(i / 2)) * (1 - ease(clamp((i - 8) / 2)))
      return {
        handR: m > 0.05 ? [8 + (1 - m) * 18, 14 + (1 - m) * 6] : null,
        armR: 22 + m * 60,
        eyes: 'open',
        look: [-2.4 * m, -2.2 * m],
        mouth: 'flat',
        lean: 1.5 * m,
        tail: S(t * TAU) * 0.3,
        earL: m * 5,
        fx: i >= 3 && i <= 9 ? [{ k: 'ques', x: 20, y: -6 - (i % 3), s: 1 }] : []
      }
    })
  },
  // Đi bộ (lặp)
  walk: {
    fps: 12,
    loop: true,
    frames: seq(8, (t) => {
      const p = t * TAU
      return {
        footL: [Math.max(0, S(p)) * 4.2, S(p) * 3],
        footR: [Math.max(0, -S(p)) * 4.2, -S(p) * 3],
        bob: Math.abs(S(p)) * 1.8,
        lean: S(p) * 1.3,
        sq: -0.01 + 0.025 * C(p * 2),
        armL: 22 + S(p) * 22,
        armR: 22 - S(p) * 22,
        tail: S(p) * 0.7,
        earL: S(p + 0.5) * 4,
        earR: S(p + 0.5) * 4,
        flap: 0.2 + 0.2 * S(p * 2)
      }
    })
  },
  // Bị kéo lên (lặp): treo lơ lửng
  drag: {
    fps: 8,
    loop: true,
    frames: seq(4, (t, i) => ({
      jump: 4,
      sq: -0.14,
      eyes: 'wide',
      mouth: 'o',
      armL: 150 + (i % 2) * 12,
      armR: 150 - (i % 2) * 12,
      footL: [5 + (i % 2) * 2, 0],
      footR: [5 + ((i + 1) % 2) * 2, 0],
      tail: i % 2 ? 0.7 : -0.7,
      earL: -8,
      earR: -8,
      flap: i % 2,
      fx: i === 2 ? [{ k: 'sweat', x: 24, y: 4, s: 0.9 }] : []
    }))
  },
  // Rơi (lặp)
  fall: {
    fps: 8,
    loop: true,
    frames: seq(4, (t, i) => ({
      jump: 2,
      sq: -0.1,
      eyes: 'wide',
      mouth: 'o',
      armL: 165 + (i % 2) * 8,
      armR: 165 - (i % 2) * 8,
      footL: [3, -4],
      footR: [3, 4],
      tail: i % 2 ? 0.8 : -0.8,
      earL: -12,
      earR: -12,
      flap: 1,
      fx:
        i % 2 === 0 ? [{ k: 'sweat', x: -26, y: 6, s: 0.9 }] : [{ k: 'excl', x: 24, y: -4, s: 0.8 }]
    }))
  },
  // Chạm đất
  land: {
    fps: 14,
    loop: false,
    frames: [0.24, 0.3, 0.16, 0.05, -0.03, 0].map((q, i) => ({
      t: i / 6,
      sq: q,
      eyes: i < 2 ? 'closed' : 'open',
      mouth: i < 2 ? 'flat' : 'smile',
      armL: 60 - i * 8,
      armR: 60 - i * 8,
      earL: i < 3 ? 8 : 0,
      earR: i < 3 ? 8 : 0,
      fx:
        i < 4
          ? [
              { k: 'dust', x: -30 - i * 3, y: 66, s: 1 - i * 0.15 },
              { k: 'dust', x: 30 + i * 3, y: 66, s: 1 - i * 0.15 }
            ]
          : []
    }))
  },
  // Vui mừng nhảy lên
  happy: {
    fps: 12,
    loop: false,
    frames: seq(10, (t, i) => {
      const j = [0, 5, 11, 15, 14, 9, 3, 0, 0, 0][i]
      return {
        jump: j,
        sq: i === 0 || i === 7 ? 0.12 : i === 8 ? 0.06 : -0.03,
        armL: 150 + (i % 2) * 14,
        armR: 150 - (i % 2) * 14,
        eyes: 'happy',
        mouth: 'grin',
        blush: 0.7,
        tail: S(t * TAU * 3),
        earL: j > 8 ? -6 : 0,
        earR: j > 8 ? -6 : 0,
        flap: j / 15,
        fx: [
          ...(i >= 2 && i <= 6
            ? [
                { k: 'spark', x: -26, y: 2 + i, s: 0.8 },
                { k: 'spark', x: 28, y: -6 + i, s: 0.6 }
              ]
            : []),
          ...(i >= 3 && i <= 8 ? [{ k: 'heart', x: 14, y: -6 - (i - 3) * 3, s: 0.9 }] : [])
        ]
      }
    })
  },
  // Ăn
  eat: {
    fps: 8,
    loop: false,
    frames: seq(12, (t, i) => {
      const chew = i % 2
      const hold = i < 9
      return {
        handL: hold ? [7, 6 + chew * 1.5] : null,
        handR: hold ? [7, 6 + chew * 1.5] : null,
        eyes: 'happy',
        mouth: i < 2 ? 'open' : hold ? 'chew' : 'grin',
        mouthOpen: i < 2 ? 1 : 0.6,
        blush: 0.7,
        sq: chew ? 0.03 : 0,
        bob: chew ? 0.5 : 0,
        tail: S(t * TAU * 2) * 0.5,
        fx: [
          ...(i >= 2 && i <= 8 && chew
            ? [{ k: 'crumb', x: 8 + (i % 4) * 2, y: 40 + (i % 3) * 3, s: 1 }]
            : []),
          ...(i >= 9 ? [{ k: 'heart', x: 14, y: -4 - (i - 9) * 3, s: 0.9 }] : [])
        ]
      }
    })
  },
  // Ngủ (lặp): thở chậm, chữ z bay lên
  sleep: {
    fps: 3,
    loop: true,
    frames: seq(8, (t, i) => ({
      sq: 0.1 + 0.035 * S(t * TAU),
      eyes: 'closed',
      mouth: 'flat',
      blush: 0.3,
      tail: S(t * TAU) * 0.15,
      armL: 12,
      armR: 12,
      earL: 9,
      earR: 9,
      fx: [
        { k: 'z', x: 24, y: 2 - ((i * 2) % 16), s: 0.7 + (i % 8) * 0.06 },
        { k: 'z', x: 31, y: -8 - ((i * 2 + 8) % 16), s: 0.9 }
      ].slice(0, i % 2 === 0 ? 2 : 1)
    }))
  },
  // Buồn (đói/chán)
  sad: {
    fps: 6,
    loop: false,
    frames: seq(10, (t, i) => ({
      sq: 0.06 * hump(t * 1.2),
      eyes: 'sad',
      mouth: 'frown',
      blush: 0.08,
      armL: 12,
      armR: 12,
      tail: -0.9,
      earL: 11,
      earR: 11,
      lean: -S(t * TAU) * 0.6,
      fx: i >= 3 ? [{ k: 'tear', x: -12, y: 22 + (i - 3) * 3.5, s: 1 }] : []
    }))
  },
  // Giật mình
  surprised: {
    fps: 12,
    loop: false,
    frames: seq(8, (t, i) => {
      const j = [0, 8, 10, 7, 3, 0, 0, 0][i]
      return {
        jump: j,
        eyes: 'wide',
        mouth: 'o',
        armL: 100,
        armR: 100,
        sq: i === 5 ? 0.1 : -0.04,
        earL: -9,
        earR: -9,
        tail: 0.9,
        flap: j / 10,
        fx: i >= 1 && i <= 6 ? [{ k: 'excl', x: 0, y: -12, s: 1 }] : []
      }
    })
  },
  // Giận dỗi dậm chân
  angry: {
    fps: 12,
    loop: false,
    frames: seq(8, (t, i) => ({
      dx: (i % 2 ? 1 : -1) * 1.2,
      footL: [i % 4 < 2 ? 4 : 0, 0],
      footR: [i % 4 >= 2 ? 4 : 0, 0],
      eyes: 'angry',
      mouth: 'flat',
      blush: 0.85,
      armL: 40,
      armR: 40,
      sq: i % 2 ? 0.04 : 0,
      tail: i % 2 ? 0.9 : -0.9,
      earL: 8,
      earR: 8,
      fx:
        i >= 2
          ? [
              { k: 'steam', x: -22, y: 4 - (i % 3) * 3, s: 1 },
              { k: 'steam', x: 22, y: 4 - ((i + 1) % 3) * 3, s: 1 }
            ]
          : []
    }))
  },
  // Được vuốt ve / yêu thích
  love: {
    fps: 10,
    loop: false,
    frames: seq(10, (t, i) => ({
      eyes: 'happy',
      mouth: 'smile',
      blush: 0.95,
      handL: [rxHand(), 6],
      handR: [rxHand(), 6],
      lean: S(t * TAU * 2) * 1.8,
      sq: 0.02 + 0.02 * S(t * TAU * 2),
      tail: S(t * TAU * 3),
      bob: Math.abs(S(t * TAU)),
      fx: [
        { k: 'heart', x: -12 + (i % 3) * 12, y: -6 - ((i * 3) % 14), s: 0.9 },
        ...(i >= 4 ? [{ k: 'heart', x: 20, y: -12 - ((i * 2) % 10), s: 0.7 }] : [])
      ]
    }))
  }
}
function rxHand() {
  return 20
}

/** Gộp thành danh sách frame phẳng + metadata (cột sắp theo hàng) */
export function flatten(columns = 8) {
  const frames = []
  const anims = {}
  for (const [name, def] of Object.entries(ANIMATIONS)) {
    const start = frames.length
    for (const f of def.frames) frames.push(f)
    anims[name] = {
      frames: def.frames.map((_, i) => start + i),
      fps: def.fps,
      loop: def.loop,
      ...(def.loop ? {} : { next: 'idle' })
    }
  }
  return { frames, anims, columns, rows: Math.ceil(frames.length / columns) }
}
