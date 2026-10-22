// Hoạt ảnh RIÊNG từng nhân vật.
//  • TWEAKS[nhân vật][tên hoạt ảnh] = (pose, i, n, t) → các trường pose bổ sung: đổi biểu cảm/hiệu ứng của hoạt ảnh
//    dùng chung (vd Robo "love" mắt thành trái tim, Draco "angry" có khói lửa).
//  • QUIRKS[nhân vật] = các hoạt ảnh đặc trưng `quirk_*` — MascotBrain tự chọn ngẫu nhiên khi nhân vật rảnh.
// Kiểu mắt mới: heart, x, off, scan, star. Hiệu ứng mới: web, fire, sound, sense, beep, scan (xem creature.mjs).
import { C, ease, hump, S, seq, TAU, clamp } from './animutil.mjs'

const once = (fps, frames) => ({ fps, loop: false, frames })

// ============================================================ Bi — mèo con tròn
const bi = {
  tweaks: {
    idle: (_p, i) => ({ tail: S((i / 8) * TAU) * 0.7, earR: i === 6 ? 5 : 0 }),
    happy: () => ({ eyes: 'happy', mouth: 'grin' }),
    love: (_p, i) => ({ fx: i % 3 === 0 ? [{ k: 'heart', x: 0, y: -14, s: 1 }] : [] })
  },
  quirks: {
    // Ngồi liếm chân rửa mặt
    quirk_groom: once(
      8,
      seq(12, (t, i) => {
        const lick = i >= 3 && i <= 10
        return {
          sq: 0.09,
          eyes: lick ? 'closed' : 'open',
          handR: lick ? [8, 11 + (i % 2) * 2.5] : null,
          armR: 40,
          mouth: lick ? 'open' : 'smile',
          mouthOpen: 0.4,
          tail: S(t * TAU) * 0.3,
          earL: lick ? 4 : 0
        }
      })
    ),
    // Rình mồi rồi vồ
    quirk_pounce: once(
      12,
      seq(12, (t, i) => {
        const crouch = i <= 5
        const air = i >= 6 && i <= 9
        return {
          sq: crouch ? 0.12 + (i % 2) * 0.02 : i === 10 ? 0.14 : 0,
          eyes: 'wide',
          tail: crouch ? S(i * 2.2) : 0.9,
          jump: air ? [0, 0, 0, 0, 0, 0, 7, 12, 12, 6][i] : 0,
          dx: air ? (i - 5) * 2.2 : i === 10 ? 9 : 0,
          handL: air ? [35, -4] : null,
          handR: air ? [35, -4] : null,
          earL: crouch ? -6 : 0,
          earR: crouch ? -6 : 0,
          fx: i === 10 ? [{ k: 'dust', x: 6, y: 64, s: 1 }] : []
        }
      })
    ),
    // Nằm co thành ổ bánh mì, kêu gừ gừ
    quirk_loaf: once(
      6,
      seq(12, (t, i) => ({
        sq: 0.2,
        eyes: i % 6 === 5 ? 'open' : 'closed',
        mouth: 'smile',
        blush: 0.7,
        armL: 6,
        armR: 6,
        bob: Math.abs(S(t * TAU * 3)) * 0.6,
        tail: S(t * TAU) * 0.2,
        earL: 7,
        earR: 7,
        fx: i % 4 === 2 ? [{ k: 'heart', x: 16, y: -6, s: 0.7 }] : []
      }))
    )
  }
}

// ============================================================ Webby — nhện hero
const webster = {
  tweaks: {
    idle: (_p, i) => ({
      armL: 55,
      armR: 55,
      footL: [i % 4 === 1 ? 1 : 0, 0],
      footR: [i % 4 === 3 ? 1 : 0, 0]
    }),
    happy: (_p, i) => ({
      fx: i >= 3 && i <= 7 ? [{ k: 'web', x: i % 2 ? -22 : 22, y: 12, s: 1 }] : []
    }),
    surprised: (_p, i) => ({
      fx: i >= 1 && i <= 6 ? [{ k: 'sense', x: 0, y: -4, s: 1 }] : []
    }),
    walk: (_p, i) => ({ sq: 0.05, footL: [i % 2 ? 3 : 0, 0], footR: [i % 2 ? 0 : 3, 0] })
  },
  quirks: {
    // Bắn tơ lên cao rồi đu lên
    quirk_web: once(
      10,
      seq(14, (t, i) => {
        const shoot = i >= 2 && i <= 10
        const up = i >= 6 && i <= 10 ? hump((i - 5) / 6) * 16 : 0
        return {
          armR: 150,
          eyes: 'happy',
          mouth: 'grin',
          jump: up,
          sq: i >= 6 && i <= 10 ? -0.08 : 0,
          footL: [up > 0 ? 3 : 0, 0],
          footR: [up > 0 ? 3 : 0, 0],
          fx: shoot ? [{ k: 'web', x: 24, y: 8, s: 1 + (i > 5 ? 0.5 : 0), anchor: true }] : []
        }
      })
    ),
    // Tạo dáng anh hùng: tay chống hông, ưỡn ngực
    quirk_hero: once(
      8,
      seq(10, (t, i) => {
        const m = ease(clamp(i / 3)) * (1 - ease(clamp((i - 8) / 2)))
        return {
          handL: [22 + (1 - m) * 6, 8],
          handR: [22 + (1 - m) * 6, 8],
          sq: -0.05 * m,
          eyes: 'open',
          mouth: 'grin',
          bob: m * 1.5,
          fx:
            i >= 4 && i <= 7
              ? [
                  { k: 'spark', x: -12, y: 22, s: 0.9 },
                  { k: 'spark', x: 12, y: 24, s: 0.7 }
                ]
              : []
        }
      })
    ),
    // Bò ngang kiểu nhện, chân quét lia lịa
    quirk_crawl: once(
      12,
      seq(12, (t, i) => ({
        sq: 0.1,
        dx: S(t * TAU * 2) * 4,
        footL: [i % 2 ? 4 : 0, 2],
        footR: [i % 2 ? 0 : 4, -2],
        armL: 80,
        armR: 80,
        eyes: 'wide',
        lean: S(t * TAU * 2) * 1.5
      }))
    )
  }
}

// ============================================================ Draco — rồng nhỏ
const draco = {
  tweaks: {
    idle: (_p, i) => ({
      flap: 0.15 + 0.2 * S((i / 8) * TAU),
      tail: S((i / 8) * TAU + 1) * 0.6,
      fx: i === 5 ? [{ k: 'steam', x: -6, y: 22, s: 0.5 }] : []
    }),
    angry: (_p, i) => ({
      fx: i >= 2 ? [{ k: 'flame', x: 0, y: -8, s: 0.8, p: i / 8, c: '#ff8a2a' }] : []
    }),
    sleep: (_p, i) => ({
      tail: 0.1,
      fx: i % 4 === 0 ? [{ k: 'steam', x: -7, y: 26, s: 0.5 }] : []
    }),
    happy: (_p, i) => ({
      flap: i >= 2 && i <= 7 ? 1 : 0.3,
      fx: i === 4 ? [{ k: 'flame', x: 16, y: 20, s: 0.7, p: 0.2 }] : []
    }),
    walk: (_p, i) => ({ flap: 0.1 + 0.5 * Math.abs(S((i / 8) * Math.PI)) })
  },
  quirks: {
    // Hít vào rồi phun lửa
    quirk_fire: once(
      10,
      seq(14, (t, i) => {
        const inhale = i <= 5
        const breathe = i >= 6 && i <= 11
        return {
          sq: inhale ? -0.02 * i : 0.03,
          mouth: inhale ? 'o' : breathe ? 'yawn' : 'smile',
          mouthOpen: breathe ? 1 : 0.4,
          eyes: breathe ? 'angry' : 'open',
          flap: inhale ? i / 5 : 0.5,
          lean: breathe ? -2 : 0,
          fx: breathe
            ? [{ k: 'fire', x: 14, y: 36, s: 1.4, p: (i - 6) / 6 }]
            : inhale && i >= 3
              ? [{ k: 'steam', x: -6, y: 22, s: 0.5 }]
              : []
        }
      })
    ),
    // Ngửa đầu gầm lên, xoè cánh
    quirk_roar: once(
      10,
      seq(12, (t, i) => {
        const m = hump(t)
        return {
          jump: m * 4,
          sq: -0.06 * m,
          mouth: 'yawn',
          mouthOpen: m,
          eyes: 'angry',
          flap: m,
          armL: 70 + m * 40,
          armR: 70 + m * 40,
          lean: -m * 2,
          fx: i >= 4 && i <= 9 ? [{ k: 'sound', x: 26, y: 30, s: 1, p: (i - 4) / 5 }] : []
        }
      })
    ),
    // Quật đuôi, ngoái nhìn đuôi mình
    quirk_tailswish: once(
      8,
      seq(10, (t, i) => ({
        tail: S(t * TAU * 2.5),
        look: [3, 2],
        lean: S(t * TAU * 2.5) * 1.4,
        mouth: 'smile',
        eyes: i > 6 ? 'happy' : 'open',
        flap: 0.3,
        footL: [i % 4 < 2 ? 1 : 0, 0]
      }))
    )
  }
}

// ============================================================ Robo — robot
const robo = {
  tweaks: {
    idle: (_p, i) => ({ eyes: i === 6 ? 'closed' : 'open', mouth: i % 4 === 0 ? 'o' : 'smile' }),
    happy: (_p, i) => ({
      eyes: 'happy',
      fx: i % 3 === 0 ? [{ k: 'spark', x: i % 2 ? -26 : 26, y: 6 + i, s: 0.8 }] : []
    }),
    love: () => ({ eyes: 'heart' }),
    sad: () => ({ eyes: 'x', mouth: 'frown' }),
    sleep: () => ({ eyes: 'off' }),
    angry: (_p, i) => ({ dx: (i % 2 ? 1 : -1) * 0.8, eyes: 'angry' }),
    surprised: () => ({ eyes: 'star', mouth: 'o' })
  },
  quirks: {
    // Quét xung quanh bằng mắt
    quirk_scan: once(
      10,
      seq(14, (t) => {
        const dir = Math.sin(t * TAU * 1.5)
        return {
          eyes: 'scan',
          look: [dir * 3.5, 0],
          lean: dir * 1.2,
          armL: 30,
          armR: 30,
          mouth: 'flat',
          fx: [{ k: 'scan', x: dir * 22, y: 18, s: 1, p: t }]
        }
      })
    ),
    // Nhảy robot: từng nhịp cứng, tay gập góc vuông
    quirk_robodance: once(
      8,
      seq(16, (t, i) => {
        const step = Math.floor(i / 2) % 4
        return {
          armL: [90, 0, 140, 40][step],
          armR: [0, 90, 40, 140][step],
          bob: step % 2 ? 2 : 0,
          dx: [-2, 0, 2, 0][step],
          eyes: step === 3 ? 'happy' : 'open',
          mouth: step % 2 ? 'o' : 'smile',
          fx: i % 4 === 0 ? [{ k: 'note', x: step % 2 ? 26 : -26, y: 4, s: 0.9 }] : []
        }
      })
    ),
    // Bíp bíp: đèn ăng-ten chớp, sóng âm toả ra
    quirk_beep: once(
      10,
      seq(10, (t, i) => ({
        eyes: 'happy',
        mouth: 'o',
        bob: i % 2 ? 1 : 0,
        t: i % 2 ? 0.25 : 0.75,
        fx: [{ k: 'beep', x: 5, y: -12, s: 1, p: (i % 5) / 5 }]
      }))
    ),
    // Khởi động lại: tắt, chập chờn, bật lên
    quirk_reboot: once(
      8,
      seq(14, (t, i) => ({
        eyes: i < 3 ? 'open' : i < 6 ? 'off' : i < 8 ? 'x' : i < 10 ? 'scan' : 'open',
        dx: i >= 3 && i < 10 ? (i % 2 ? 1 : -1) * 1.2 : 0,
        sq: i >= 3 && i < 6 ? 0.06 : 0,
        mouth: i >= 3 && i < 8 ? 'flat' : 'smile',
        fx: i >= 6 && i < 10 ? [{ k: 'spark', x: i % 2 ? -22 : 22, y: 10, s: 0.7 }] : []
      }))
    )
  }
}

// ============================================================ Kitsu — cáo
const kitsu = {
  tweaks: {
    idle: (_p, i) => ({
      tail: S((i / 8) * TAU) * 0.9,
      earL: i === 2 ? 7 : 0,
      earR: i === 5 ? 7 : 0
    }),
    happy: (_p, i) => ({
      dx: S(i * 1.3) * 3,
      earL: -5,
      earR: -5,
      fx: i >= 3 && i <= 6 ? [{ k: 'flame', x: 24, y: 6, s: 0.6, p: i / 6, c: '#78beff' }] : []
    }),
    love: (_p, i) => ({ tail: S((i / 10) * TAU * 3) * 1.1 }),
    sleep: () => ({ sq: 0.16, tail: 0.1 })
  },
  quirks: {
    // Rình rồi nhảy cao chụp mồi
    quirk_pounce: once(
      12,
      seq(14, (t, i) => {
        const wiggle = i <= 4
        const air = i >= 5 && i <= 10
        return {
          sq: wiggle ? 0.14 : i === 11 ? 0.16 : 0,
          eyes: 'wide',
          tail: wiggle ? S(i * 3) : -0.6,
          jump: air ? hump((i - 5) / 6) * 18 : 0,
          dx: air ? (i - 5) * 1.6 : 0,
          earL: wiggle ? -8 : 0,
          earR: wiggle ? -8 : 0,
          handL: air ? [36, -6] : null,
          handR: air ? [36, -6] : null,
          fx: i === 11 ? [{ k: 'dust', x: 8, y: 66, s: 1 }] : []
        }
      })
    ),
    // Xoè các đuôi như chiếc quạt
    quirk_tailfan: once(
      8,
      seq(14, (t, i) => ({
        tail: S(t * TAU * 2) * 1.2,
        eyes: 'happy',
        mouth: 'grin',
        bob: 0.8 * Math.abs(S(t * TAU * 2)),
        earL: S(t * TAU * 2) * 4,
        earR: -S(t * TAU * 2) * 4,
        fx: i % 3 === 1 ? [{ k: 'spark', x: i % 2 ? 30 : -30, y: 14, s: 0.8 }] : []
      }))
    ),
    // Hắt hơi ra đốm lửa ma
    quirk_sneeze: once(
      8,
      seq(10, (t, i) => ({
        sq: i < 5 ? -0.05 * i : i === 6 ? 0.18 : 0,
        eyes: i < 6 ? 'closed' : i === 6 ? 'closed' : 'open',
        mouth: i < 5 ? 'o' : i >= 6 && i <= 7 ? 'open' : 'smile',
        mouthOpen: 1,
        jump: i === 6 ? 3 : 0,
        earL: i < 6 ? -8 : 4,
        earR: i < 6 ? -8 : 4,
        fx:
          i >= 6 && i <= 8
            ? [{ k: 'flame', x: 12, y: 24, s: 0.6, p: (i - 6) / 3, c: '#78beff' }]
            : []
      }))
    ),
    // Ngồi ngay ngắn vẫy đuôi
    quirk_sit: once(
      8,
      seq(12, (t, i) => ({
        sq: 0.1,
        handL: [10, 14],
        handR: [10, 14],
        eyes: i % 6 === 5 ? 'closed' : 'happy',
        mouth: 'smile',
        tail: S(t * TAU * 3),
        earL: i === 4 ? 6 : 0,
        blush: 0.6
      }))
    )
  }
}

// ============================================================ Tương tác: bấm / kéo / thả / rơi / cho ăn
// CLICKS: hoạt ảnh `click_*` khi người dùng bấm vào nhân vật (MascotBrain chọn ngẫu nhiên, cùng với happy/love chung).
// INTERACTION_TWEAKS: chỉnh các hoạt ảnh drag / fall / land / eat theo tính cách từng nhân vật.
const CLICKS = {
  bi: {
    // Gừ gừ: mắt nhắm, má hồng, trái tim nổi lên
    click_purr: once(
      8,
      seq(10, (t, i) => ({
        eyes: 'closed',
        mouth: 'smile',
        blush: 0.95,
        sq: 0.04 + 0.03 * S(t * TAU * 3),
        tail: S(t * TAU * 2),
        earL: 6,
        earR: 6,
        fx: [{ k: 'heart', x: -10 + (i % 3) * 10, y: -6 - ((i * 3) % 12), s: 0.9 }]
      }))
    ),
    // Chạm mũi: giật mình, tai cụp, rồi cười
    click_boop: once(
      10,
      seq(8, (t, i) => ({
        eyes: i < 3 ? 'wide' : 'happy',
        mouth: i < 3 ? 'o' : 'grin',
        sq: i === 1 ? 0.12 : 0,
        jump: i === 2 ? 4 : 0,
        earL: i < 4 ? -9 : 0,
        earR: i < 4 ? -9 : 0,
        tail: i < 3 ? 0.9 : S(t * TAU * 3),
        fx: i === 1 ? [{ k: 'excl', x: 0, y: -10, s: 0.8 }] : []
      }))
    )
  },
  webster: {
    // Giác quan nhện: giật mình rồi tạo dáng
    click_spidey: once(
      10,
      seq(10, (t, i) => ({
        eyes: i < 4 ? 'wide' : 'happy',
        mouth: i < 4 ? 'o' : 'grin',
        jump: i >= 1 && i <= 3 ? [0, 5, 8, 4][i] : 0,
        handL: i >= 5 ? [22, 8] : null,
        handR: i >= 5 ? [22, 8] : null,
        fx:
          i >= 1 && i <= 4
            ? [{ k: 'sense', x: 0, y: -4, s: 1 }]
            : i >= 6
              ? [{ k: 'spark', x: 14, y: 22, s: 0.8 }]
              : []
      }))
    ),
    // Lộn nhào ăn mừng kèm sợi tơ
    click_flip: once(
      12,
      seq(12, (t, i) => ({
        // Lộn nhào: bật lên (kéo giãn), co tròn ở đỉnh, duỗi ra khi rơi
        jump: hump(t) * 18,
        sq: i < 4 ? -0.14 : i < 8 ? 0.2 : -0.1,
        armL: i >= 4 && i < 8 ? 40 : 150,
        armR: i >= 4 && i < 8 ? 40 : 150,
        footL: [i >= 4 && i < 8 ? 6 : 0, 0],
        footR: [i >= 4 && i < 8 ? 6 : 0, 0],
        eyes: i >= 4 && i < 8 ? 'closed' : 'happy',
        mouth: 'grin',
        fx: i >= 2 && i <= 8 ? [{ k: 'web', x: i % 2 ? 26 : -26, y: 10, s: 1 }] : []
      }))
    )
  },
  draco: {
    // Phụt một đốm lửa nhỏ vui vẻ
    click_puff: once(
      10,
      seq(10, (t, i) => ({
        eyes: 'happy',
        mouth: i >= 3 && i <= 6 ? 'open' : 'smile',
        flap: 0.5 + 0.4 * S(t * TAU * 2),
        jump: i >= 3 && i <= 5 ? 3 : 0,
        tail: S(t * TAU * 2),
        fx: i >= 3 && i <= 7 ? [{ k: 'flame', x: 16, y: 36, s: 0.9, p: (i - 3) / 5 }] : []
      }))
    ),
    // Vỗ cánh nhảy cẫng lên
    click_flapjoy: once(
      12,
      seq(10, (t, i) => ({
        jump: hump(t) * 12,
        flap: i % 2 ? 1 : 0.2,
        eyes: 'happy',
        mouth: 'grin',
        armL: 140,
        armR: 140,
        tail: S(t * TAU * 3)
      }))
    )
  },
  robo: {
    // Bíp-bùm: mắt trái tim, ăng-ten kêu bíp
    click_beepboop: once(
      10,
      seq(10, (t, i) => ({
        eyes: i < 2 ? 'wide' : 'heart',
        mouth: 'o',
        bob: i % 2 ? 1.2 : 0,
        t: i % 2 ? 0.25 : 0.75,
        fx: [{ k: 'beep', x: 5, y: -12, s: 1, p: (i % 5) / 5 }]
      }))
    ),
    // Chập mạch: giật cục, mắt nhấp nháy
    click_glitch: once(
      12,
      seq(10, (t, i) => ({
        eyes: ['open', 'x', 'scan', 'off', 'x', 'open', 'star', 'open', 'happy', 'happy'][i],
        dx: i % 2 ? 1.6 : -1.6,
        sq: i % 3 === 0 ? 0.05 : 0,
        mouth: i % 2 ? 'flat' : 'o',
        fx: i % 2 ? [{ k: 'spark', x: i % 4 === 1 ? -24 : 24, y: 8, s: 0.7 }] : []
      }))
    )
  },
  kitsu: {
    // Xoay một vòng, toả đốm lửa ma
    click_foxfire: once(
      12,
      seq(12, (t, i) => ({
        jump: hump(t) * 12,
        dx: S(t * TAU) * 4,
        sq: i === 0 || i === 11 ? 0.1 : -0.04,
        eyes: 'happy',
        mouth: 'grin',
        tail: S(t * TAU * 2) * 1.1,
        armL: 140,
        armR: 140,
        fx:
          i % 2
            ? [{ k: 'flame', x: i % 4 === 1 ? 26 : -26, y: 6, s: 0.6, p: i / 12, c: '#78beff' }]
            : []
      }))
    ),
    // Vui quá vẫy đuôi tít, tai dựng
    click_tailwag: once(
      10,
      seq(10, (t, i) => ({
        eyes: 'happy',
        mouth: 'grin',
        blush: 0.8,
        sq: 0.04 * S(t * TAU * 3),
        tail: S(t * TAU * 5) * 1.2,
        earL: -6,
        earR: -6,
        fx: i % 3 === 0 ? [{ k: 'heart', x: 16, y: -8, s: 0.8 }] : []
      }))
    )
  }
}

const INTERACTION_TWEAKS = {
  // Bi: bị xách gáy như mèo con — mềm oặt; rơi xuống luôn tiếp đất bằng bốn chân
  bi: {
    drag: (_p, i) => ({
      armL: 10,
      armR: 10,
      tail: -0.6,
      earL: -10,
      earR: -10,
      eyes: 'sad',
      mouth: 'o',
      footL: [i % 2 ? 2 : 6, 0],
      footR: [i % 2 ? 6 : 2, 0]
    }),
    fall: () => ({ armL: 60, armR: 60, eyes: 'wide', tail: 0.8 }),
    land: (_p, i) => ({
      sq: [0.1, 0.16, 0.08, 0.02, 0, 0][i] ?? 0,
      mouth: 'smile',
      eyes: i < 2 ? 'wide' : 'happy'
    }),
    eat: () => ({ tail: 0.9 })
  },
  // Webby: bắn tơ bám trần khi rơi, tiếp đất tư thế anh hùng
  webster: {
    // Bị kéo lên: treo lủng lẳng trên sợi tơ như anh hùng nhện
    drag: (_p, i) => ({
      eyes: 'wide',
      armL: 150,
      armR: 150,
      fx: [
        { k: 'web', x: 0, y: -2, s: 1, anchor: true },
        ...(i % 2 ? [{ k: 'sense', x: 0, y: -4, s: 0.8 }] : [])
      ]
    }),
    fall: (_p, i) => ({
      armR: 150,
      eyes: 'wide',
      fx: [
        { k: 'web', x: 24, y: 8, s: 1, anchor: true },
        ...(i % 2 ? [{ k: 'sense', x: 0, y: -4, s: 0.8 }] : [])
      ]
    }),
    land: (_p, i) => ({
      handL: i >= 1 && i <= 4 ? [20, 12] : null,
      handR: i >= 1 && i <= 4 ? [20, 12] : null,
      sq: [0.22, 0.28, 0.16, 0.06, 0, 0][i] ?? 0,
      mouth: 'grin',
      eyes: i < 2 ? 'closed' : 'open'
    }),
    eat: () => ({ eyes: 'happy' })
  },
  // Draco: dang cánh khi rơi, tiếp đất rung cả đất; ăn xong ợ khói
  draco: {
    drag: () => ({ flap: 1, eyes: 'wide', mouth: 'o' }),
    fall: (_p, i) => ({ flap: i % 2 ? 1 : 0.4, armL: 60, armR: 60 }),
    land: (_p, i) => ({
      flap: 0.6,
      tail: i < 3 ? 1 : 0,
      fx:
        i < 3
          ? [
              { k: 'dust', x: -34, y: 66, s: 1.2 },
              { k: 'dust', x: 34, y: 66, s: 1.2 }
            ]
          : []
    }),
    eat: (_p, i) => ({ fx: i >= 10 ? [{ k: 'steam', x: -8, y: 28, s: 0.6 }] : [] })
  },
  // Robo: kéo lên thì chập chờn tia lửa; rơi báo động; tiếp đất khởi động lại
  robo: {
    drag: (_p, i) => ({
      eyes: i % 2 ? 'x' : 'wide',
      fx: i % 2 ? [{ k: 'spark', x: -24, y: 10, s: 0.7 }] : []
    }),
    fall: (_p, i) => ({
      eyes: i % 2 ? 'scan' : 'x',
      mouth: 'o',
      fx: [{ k: 'beep', x: 5, y: -12, s: 1, p: (i % 4) / 4 }]
    }),
    land: (_p, i) => ({
      eyes: i < 2 ? 'off' : i < 4 ? 'scan' : 'open',
      fx: i < 3 ? [{ k: 'spark', x: i % 2 ? -22 : 22, y: 12, s: 0.8 }] : []
    }),
    eat: () => ({ eyes: 'scan', mouth: 'open' })
  },
  // Kitsu: bị nhấc lên thì xù đuôi cụp tai; tiếp đất nhẹ như cáo
  kitsu: {
    drag: (_p, i) => ({ tail: i % 2 ? 1 : -1, earL: -12, earR: -12, eyes: 'wide', mouth: 'o' }),
    fall: () => ({ tail: 1, armL: 90, armR: 90 }),
    land: (_p, i) => ({
      sq: [0.1, 0.12, 0.06, 0.02, 0, 0][i] ?? 0,
      tail: i < 3 ? 0.8 : 0,
      eyes: i < 2 ? 'wide' : 'happy',
      mouth: 'grin'
    }),
    eat: () => ({ tail: 0.8, earL: -4, earR: -4 })
  }
}

/** Gộp hai nhóm chỉnh: nếu cùng một hoạt ảnh thì áp lần lượt, hiệu ứng (fx) cộng dồn */
function mergeTweaks(...groups) {
  const out = {}
  for (const g of groups) {
    for (const [name, fn] of Object.entries(g ?? {})) {
      const prev = out[name]
      out[name] = prev
        ? (pose, i, n, t) => {
            const a = prev(pose, i, n, t)
            const b = fn({ ...pose, ...a }, i, n, t)
            return { ...a, ...b, fx: [...(a.fx ?? []), ...(b.fx ?? [])] }
          }
        : fn
    }
  }
  return out
}

const CHARS = { bi, webster, draco, robo, kitsu }
export const TWEAKS = Object.fromEntries(
  Object.entries(CHARS).map(([id, c]) => [id, mergeTweaks(c.tweaks, INTERACTION_TWEAKS[id])])
)
export const QUIRKS = Object.fromEntries(
  Object.entries(CHARS).map(([id, c]) => [id, { ...c.quirks, ...CLICKS[id] }])
)
void C
