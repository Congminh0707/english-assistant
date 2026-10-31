// Art thần thoại cấp cuối 5 thú cưng: nền + sợi sáng vẽ procedural bằng canvas additive, thân nhân vật là SVG vector.
// Chọn nhân vật qua ?pet=lupo|kitsu|draco|bi|robo. Nhỏ gọn để chụp ảnh tĩnh; khi vào app sẽ nướng thành ảnh/sprite.
(function () {
  const pet = new URLSearchParams(location.search).get('pet') || 'lupo'
  const S = 1000
  const under = document.getElementById('under').getContext('2d')
  const over = document.getElementById('over').getContext('2d')
  let seed = 7331
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const rr = (a, b) => a + (b - a) * rnd()
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
  const noise = (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g)
    const m = (a, b, t) => a + (b - a) * t
    return m(m(hash(i, j), hash(i + 1, j), u), m(hash(i, j + 1), hash(i + 1, j + 1), u), v)
  }
  const fbm = (x, y) => noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.28 + noise(x * 4.3, y * 4.3) * 0.12
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

  function bg(top, bot) { const g = under.createLinearGradient(0, 0, 0, S); g.addColorStop(0, top); g.addColorStop(1, bot); under.fillStyle = g; under.fillRect(0, 0, S, S) }
  function glow(ctx, x, y, r, c, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2) }
  // sợi sáng: đi theo hướng ban đầu, bẻ dần bằng trường nhiễu; mờ dần về cuối
  function strand(ctx, x, y, ang, len, o) {
    const n = Math.max(6, Math.floor(len / 7)), step = len / n
    ctx.beginPath(); ctx.moveTo(x, y)
    let a = ang
    for (let i = 0; i < n; i++) {
      a += (fbm(x * o.f + o.sx, y * o.f) - 0.5) * o.curl + (o.bias || 0)
      x += Math.cos(a) * step; y += Math.sin(a) * step
      ctx.lineTo(x, y)
    }
    ctx.strokeStyle = o.color; ctx.lineWidth = o.w; ctx.stroke()
    return [x, y]
  }
  function motes(ctx, n, c, box, big) {
    for (let i = 0; i < n; i++) {
      const x = rr(box[0], box[2]), y = rr(box[1], box[3]), r = Math.pow(rnd(), 7) * big + 0.35
      ctx.fillStyle = rgba(c, rr(0.25, 0.95)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
      if (r > big * 0.7) glow(ctx, x, y, r * 6, c, 0.3)
    }
  }
  function add(ctx, f) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; f(); ctx.restore() }
  function ridge(ctx, base, amp, c, f) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, S); for (let x = 0; x <= S; x += 6) ctx.lineTo(x, base - fbm(x * f, base) * amp); ctx.lineTo(S, S); ctx.fill() }

  const SCENES = {
    lupo() {
      // Ngân Lang: sói ngồi ngẩng về trăng, thân dệt từ hàng vạn sợi bạc
      bg('#040720', '#0C1540')
      const mx = 196, my = 200, R = 140
      add(under, () => { glow(under, mx, my, 900, [70, 110, 220], 0.5); glow(under, mx, my, 430, [170, 200, 255], 0.5) })
      const m = under.createRadialGradient(mx - 50, my - 56, 20, mx, my, R)
      m.addColorStop(0, '#FFFFFF'); m.addColorStop(0.7, '#DDE8FF'); m.addColorStop(1, '#AFC4F2')
      under.fillStyle = m; under.beginPath(); under.arc(mx, my, R, 0, 7); under.fill()
      for (const [x, y, r] of [[-70, -60, 34], [50, -96, 20], [84, 10, 40], [-96, 34, 22], [-20, 78, 26]]) { under.fillStyle = 'rgba(150,172,222,.3)'; under.beginPath(); under.arc(mx + x, my + y, r, 0, 7); under.fill() }
      add(under, () => { for (let k = 0; k < 4; k++) { under.strokeStyle = `rgba(214,228,255,${0.3 - k * 0.06})`; under.lineWidth = 1.1; under.beginPath(); under.arc(mx, my, R + 22 + k * 30, 0, 7); under.stroke() } })
      // núi và sương
      ridge(under, 900, 230, '#0A1236', 0.004); ridge(under, 960, 170, '#070C29', 0.007); ridge(under, 1010, 90, '#04071C', 0.011)
      add(under, () => { for (let i = 0; i < 2600; i++) strand(under, rr(-40, 1040), rr(800, 980), rr(-0.1, 0.1), rr(100, 380), { f: 0.003, sx: 13, curl: 0.2, color: rgba([150, 180, 240], rr(0.008, 0.04)), w: 0.9 }) })
      const body = new Path2D('M286 322Q296 296 338 272Q364 256 392 252L404 176Q440 200 452 248L488 190Q520 226 520 276C556 330 600 420 640 520C690 590 742 680 744 770C748 850 716 890 664 894L706 906L566 906C590 880 590 830 566 770C552 740 540 730 524 730C520 790 524 850 534 896L546 906L452 906L468 896C462 800 458 720 440 640C420 570 396 520 392 470C382 420 340 382 292 352Q280 336 286 322Z')
      const inside = (x, y) => under.isPointInPath(body, x, y)
      const flow = (x, y) => Math.atan2(y - 260, x - 300)
      const g = under.createLinearGradient(300, 240, 760, 900); g.addColorStop(0, '#C9D7F6'); g.addColorStop(0.55, '#7C8FC6'); g.addColorStop(1, '#3B4A86')
      under.fillStyle = g; under.fill(body)
      const seedPts = (n, fn) => { let t = 0, c = 0; while (c < n && t++ < n * 40) { const x = rr(270, 770), y = rr(170, 910); if (inside(x, y)) { fn(x, y); c++ } } }
      // đuôi lớn cuộn lên + bờm cuốn gió, vẽ trước thân
      add(under, () => {
        const pal = [[236, 243, 255], [196, 216, 255], [170, 238, 255], [255, 244, 222]]
        // đuôi: sợi bám theo xương sống cong, thuôn dần về ngọn
        const P = [[700, 850], [800, 840], [890, 760], [920, 640], [880, 520], [800, 450]], sp = []
        for (let k = 0; k < P.length - 1; k++) for (let t = 0; t < 30; t++) { const u = t / 30, a = P[Math.max(0, k - 1)], b = P[k], c = P[k + 1], d = P[Math.min(P.length - 1, k + 2)], q = (e) => 0.5 * (2 * b[e] + (c[e] - a[e]) * u + (2 * a[e] - 5 * b[e] + 4 * c[e] - d[e]) * u * u + (3 * b[e] - a[e] - 3 * c[e] + d[e]) * u * u * u); sp.push([q(0), q(1)]) }
        const T = sp.length
        for (let i = 0; i < 15000; i++) {
          const f = rnd(), k = Math.min(T - 2, Math.floor(f * (T - 1))), w = 74 * Math.sin(Math.min(1, f * 1.15 + 0.08) * 3.14) ** 0.8 * (rnd() * 2 - 1)
          const dx = sp[k + 1][0] - sp[k][0], dy = sp[k + 1][1] - sp[k][1], a = Math.atan2(dy, dx)
          strand(under, sp[k][0] - Math.sin(a) * w, sp[k][1] + Math.cos(a) * w, a + rr(-0.12, 0.12) - w * 0.0008, rr(40, 210), { f: 0.006, sx: 17, curl: 0.2, bias: -0.006, color: rgba(pal[rnd() < 0.8 ? 0 : 2], rr(0.03, 0.13)), w: rr(0.4, 0.85) })
        }
        // bờm gió từ gáy
        for (let i = 0; i < 5200; i++) {
          const u = rnd(), x = 500 + u * 130, y = 270 + u * 240
          strand(under, x, y, rr(-1.0, 0.75), rr(30, 80 + 130 * (1 - u)), { f: 0.0045, sx: 5, curl: 0.42, bias: -0.004, color: rgba(pal[rnd() < 0.75 ? 0 : rnd() < 0.6 ? 1 : 3], rr(0.014, 0.06)), w: rr(0.4, 0.9) })
        }
      })
      under.fillStyle = g; under.fill(body)
      add(over, () => {
        const pal = [[244, 248, 255], [206, 224, 255], [168, 238, 255]]
        seedPts(42000, (x, y) => {
          const lit = Math.max(0, 1 - Math.hypot(x - mx, y - my) / 880)
          const fine = rnd() < 0.7
          strand(over, x, y, flow(x, y) + rr(-0.22, 0.22), fine ? rr(14, 46) : rr(50, 120), { f: 0.012, sx: 3, curl: 0.3, color: rgba(pal[rnd() < 0.8 ? 0 : rnd() < 0.7 ? 1 : 2], (0.03 + lit * 0.17) * rr(0.5, 1)), w: rr(0.4, 0.8) })
        })
        // sợi tơ dài trôi trong không khí
        for (let i = 0; i < 70; i++) strand(over, rr(0, 1000), rr(60, 980), rr(-1.3, -0.5), rr(120, 380), { f: 0.002, sx: 19, curl: 0.12, color: rgba([214, 232, 255], rr(0.1, 0.34)), w: rr(0.35, 0.7) })
      })
      // đường tách chân, mắt, má, mũi, trăng non trên trán
      const o = over
      o.strokeStyle = 'rgba(16,24,70,.5)'; o.lineWidth = 3; o.lineCap = 'round'
      o.beginPath(); o.moveTo(650, 894); o.quadraticCurveTo(684, 800, 620, 720); o.stroke()
      // bàn chân + lông xoà che mép cắt
      o.fillStyle = '#AFC0E8'; for (const [x, y, r] of [[488, 902, 44], [618, 900, 40], [680, 900, 34]]) { o.beginPath(); o.ellipse(x, y, r, 15, 0, 0, 7); o.fill() }
      add(o, () => { for (let i = 0; i < 3600; i++) strand(o, rr(430, 720), rr(880, 912), rr(1.2, 1.95), rr(14, 44), { f: 0.02, sx: 2, curl: 0.5, color: rgba([232, 240, 255], rr(0.06, 0.26)), w: 0.55 }) })
      o.strokeStyle = '#141B4C'; o.lineWidth = 6
      o.beginPath(); o.moveTo(352, 306); o.quadraticCurveTo(372, 290, 394, 304); o.stroke()
      o.fillStyle = 'rgba(255,160,190,.5)'; o.beginPath(); o.ellipse(392, 336, 22, 12, -0.3, 0, 7); o.fill()
      o.fillStyle = '#141B4C'; o.beginPath(); o.ellipse(296, 322, 12, 9, -0.5, 0, 7); o.fill()
      o.strokeStyle = 'rgba(20,27,76,.7)'; o.lineWidth = 2.6; o.beginPath(); o.moveTo(300, 338); o.quadraticCurveTo(330, 346, 352, 338); o.stroke()
      add(o, () => { glow(o, 432, 262, 60, [255, 236, 180], 0.7) })
      o.fillStyle = '#FFF3C8'; o.beginPath(); o.arc(432, 262, 13, 0.6, 5.2); o.arc(438, 260, 10, 5.0, 0.8, true); o.fill()
      add(o, () => { glow(o, mx, my, 620, [180, 210, 255], 0.14); motes(o, 520, [226, 238, 255], [0, 0, S, S], 2.2) })
    },
    kitsu() {
      bg('#12071F', '#38122C')
      add(under, () => { glow(under, 500, 430, 620, [255, 96, 60], 0.42); glow(under, 500, 430, 300, [255, 196, 120], 0.45) })
      // cổng torii in bóng phía sau
      under.fillStyle = '#1B0A1C'
      under.fillRect(170, 330, 44, 640); under.fillRect(786, 330, 44, 640); under.fillRect(150, 380, 700, 30)
      under.beginPath(); under.moveTo(100, 288); under.quadraticCurveTo(500, 332, 900, 288); under.lineTo(880, 340); under.quadraticCurveTo(500, 372, 120, 340); under.fill()
      ridge(under, 1000, 150, '#16081A', 0.006)
      const tails = 9, cx = 500, cy = 835
      for (let t = 0; t < tails; t++) {
        const ang = -Math.PI / 2 + (t - 4) * 0.27, L = 560 - Math.abs(t - 4) * 26
        const sway = (t - 4) * 0.0035
        const spine = []
        let x = cx, y = cy, a = ang
        for (let i = 0; i <= 80; i++) { spine.push([x, y, a]); a += sway + Math.sin(i * 0.09 + t) * 0.012; x += Math.cos(a) * L / 80; y += Math.sin(a) * L / 80 }
        // thân đuôi đặc để đọc rõ hình, sợi lông phủ lên
        under.beginPath()
        const wid = (u) => 12 + 86 * Math.sin(Math.min(1, u * 1.06) * Math.PI) ** 0.7
        spine.forEach(([px, py, pa], i) => { const u = i / 80, w = wid(u); const qx = px + Math.cos(pa + 1.57) * w, qy = py + Math.sin(pa + 1.57) * w; i ? under.lineTo(qx, qy) : under.moveTo(qx, qy) })
        for (let i = 80; i >= 0; i--) { const [px, py, pa] = spine[i]; const w = wid(i / 80); under.lineTo(px - Math.cos(pa + 1.57) * w, py - Math.sin(pa + 1.57) * w) }
        const tip = spine[80], g = under.createLinearGradient(cx, cy, tip[0], tip[1])
        g.addColorStop(0, '#D2622A'); g.addColorStop(0.62, '#F4A259'); g.addColorStop(0.83, '#FFE9C8'); g.addColorStop(1, '#FFFFFF')
        under.fillStyle = g; under.fill()
        add(under, () => {
          for (let i = 0; i < 1500; i++) {
            const u = rnd(), k = Math.floor(u * 76), [px, py, pa] = spine[k], w = wid(u) * rr(-1.04, 1.04)
            const c = u > 0.76 ? [255, 244, 224] : u > 0.5 ? [255, 190, 110] : [255, 136, 60]
            strand(under, px + Math.cos(pa + 1.57) * w, py + Math.sin(pa + 1.57) * w, pa + rr(-0.16, 0.16), rr(40, 150), { f: 0.01, sx: t, curl: 0.3, color: rgba(c, rr(0.05, 0.22)), w: rr(0.45, 1) })
          }
          glow(under, tip[0], tip[1], 66, [150, 190, 255], 0.75)
          glow(under, tip[0], tip[1], 22, [240, 248, 255], 1)
        })
      }
      add(over, () => {
        for (let i = 0; i < 2600; i++) { const a = rnd() * 6.3; strand(over, 500 + Math.cos(a) * 170, 650 + Math.sin(a) * 130, a, rr(8, 36), { f: 0.02, sx: 5, curl: 0.5, color: rgba([255, 214, 150], rr(0.05, 0.26)), w: 0.55 }) }
        motes(over, 300, [255, 206, 140], [0, 0, S, S], 3)
        // hoshi no tama: ngọc lửa hồ ly trước ngực
        glow(over, 300, 850, 90, [120, 170, 255], 0.7); glow(over, 300, 850, 26, [240, 248, 255], 1)
      })
    },
    draco() {
      bg('#04131F', '#0D2A36')
      add(under, () => { glow(under, 500, 300, 640, [255, 170, 70], 0.42); glow(under, 500, 220, 240, [255, 226, 150], 0.5) })
      // mây xoắn kiểu trống đồng + sóng dưới chân
      add(under, () => {
        for (let i = 0; i < 26; i++) {
          const x = rr(-20, 1020), y = rr(40, 680), r = rr(26, 74); under.lineWidth = 1.4; under.strokeStyle = `rgba(255,214,140,${rr(0.1, 0.3)})`; under.beginPath()
          for (let a = 0; a < 15; a += 0.2) { const q = r * (1 - a / 16); under.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) } under.stroke()
        }
        for (let i = 0; i < 26; i++) { strand(under, rr(0, S), rr(0, 460), rr(1.2, 1.9), rr(120, 420), { f: 0.02, sx: i, curl: 1.2, color: rgba([200, 226, 255], rr(0.08, 0.35)), w: rr(0.6, 1.3) }) }
      })
      for (let k = 0; k < 4; k++) { under.fillStyle = ['#0B3A4C', '#0D4C5E', '#0F5E6E', '#127080'][k]; under.beginPath(); under.moveTo(0, S); for (let x = 0; x <= S; x += 8) under.lineTo(x, 850 + k * 40 + Math.sin(x * 0.03 + k * 2) * 18 + Math.sin(x * 0.011 + k) * 22); under.lineTo(S, S); under.fill() }
      // đôi cánh rồng phương Tây dệt bằng sợi vàng
      for (const sg of [-1, 1]) {
        const X = (d) => 500 + sg * d, Sh = [X(70), 730], Wr = [X(285), 300], T = [[X(490), 230], [X(492), 470], [X(405), 640], [X(235), 760]]
        const p = new Path2D(); p.moveTo(...Sh); p.quadraticCurveTo(X(170), 470, Wr[0], Wr[1]); p.quadraticCurveTo(X(390), 200, T[0][0], T[0][1])
        p.quadraticCurveTo(X(400), 350, T[1][0], T[1][1]); p.quadraticCurveTo(X(350), 520, T[2][0], T[2][1]); p.quadraticCurveTo(X(270), 610, T[3][0], T[3][1]); p.quadraticCurveTo(X(150), 720, Sh[0], Sh[1]); p.closePath()
        const g = under.createRadialGradient(Wr[0], Wr[1], 40, Wr[0], Wr[1], 520); g.addColorStop(0, '#E9A23C'); g.addColorStop(0.5, '#A8421F'); g.addColorStop(1, '#4A1420')
        under.fillStyle = g; under.fill(p)
        add(under, () => {
          under.save(); under.clip(p)
          for (let i = 0; i < 9000; i++) strand(under, Wr[0] + rr(-20, 20), Wr[1] + rr(-20, 20), rnd() * 2.2 + (sg > 0 ? -0.5 : 1.45), rr(160, 560), { f: 0.003, sx: sg + 3, curl: 0.12, color: rgba(rnd() < 0.7 ? [255, 190, 90] : [255, 110, 60], rr(0.012, 0.06)), w: rr(0.4, 0.9) })
          under.restore()
          under.strokeStyle = 'rgba(255,214,130,.55)'; under.lineWidth = 2; under.stroke(p)
        })
        under.strokeStyle = '#F2C25E'; under.lineCap = 'round'; under.lineWidth = 9
        under.beginPath(); under.moveTo(...Sh); under.quadraticCurveTo(X(170), 470, Wr[0], Wr[1]); under.stroke()
        under.lineWidth = 5
        for (const [q, c] of [[T[0], [X(390), 200]], [T[1], [X(380), 340]], [T[2], [X(330), 440]], [T[3], [X(250), 520]]]) { under.beginPath(); under.moveTo(...Wr); under.quadraticCurveTo(c[0], c[1], q[0], q[1]); under.stroke() }
        add(under, () => glow(under, Wr[0], Wr[1], 60, [255, 226, 150], 0.8))
      }
      // bờm lửa + đuôi lửa
      add(under, () => {
        for (let i = 0; i < 13000; i++) {
          const a = -Math.PI / 2 + rr(-0.9, 0.9), x = 500 + Math.cos(a) * 110, y = 610 + Math.sin(a) * 80
          const u = rnd(), c = u < 0.5 ? [255, 170, 60] : u < 0.82 ? [255, 214, 120] : [255, 96, 50]
          strand(under, x, y, a, rr(110, 420), { f: 0.0065, sx: 9, curl: 0.6, bias: 0, color: rgba(c, rr(0.022, 0.1)), w: rr(0.5, 1.1) })
        }
        for (let i = 0; i < 7000; i++) strand(under, rr(770, 800), rr(740, 770), rr(-1.5, -0.7), rr(80, 300), { f: 0.006, sx: 4, curl: 0.5, color: rgba([255, 190, 80], rr(0.03, 0.12)), w: 0.7 })
      })
      add(over, () => {
        for (let i = 0; i < 2800; i++) { const a = rnd() * 6.3; strand(over, 500 + Math.cos(a) * 180, 650 + Math.sin(a) * 135, a, rr(8, 34), { f: 0.02, sx: 5, curl: 0.5, color: rgba([255, 226, 150], rr(0.05, 0.24)), w: 0.55 }) }
        motes(over, 360, [255, 216, 140], [0, 0, S, S], 3.2)
        glow(over, 500, 150, 150, [255, 214, 130], 0.7); glow(over, 500, 150, 52, [255, 252, 230], 1)
      })
      const c = over; c.fillStyle = '#FFF4CC'; c.beginPath(); c.arc(500, 150, 30, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(490, 140, 8, 0, 7); c.fill()
    },
    bi() {
      bg('#03130E', '#0A2E22')
      add(under, () => { glow(under, 500, 330, 640, [90, 230, 170], 0.3); glow(under, 500, 300, 280, [230, 255, 190], 0.28) })
      // cây đa cổ thụ phía sau: cành đệ quy, rễ phụ buông thành sợi
      const leaves = []
      const branch = (x, y, a, L, w, d) => {
        const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L
        under.strokeStyle = d > 5 ? '#2F7A5A' : '#256A4C'; under.lineWidth = w; under.lineCap = 'round'
        under.beginPath(); under.moveTo(x, y); under.quadraticCurveTo((x + x2) / 2 + rr(-14, 14), (y + y2) / 2 + rr(-14, 14), x2, y2); under.stroke()
        if (d === 0) { leaves.push([x2, y2]); return }
        const n = d > 4 ? 2 : 3
        for (let i = 0; i < n; i++) branch(x2, y2, a + rr(-0.62, 0.62), L * rr(0.68, 0.82), w * 0.68, d - 1)
      }
      for (const a of [-1.57, -2.05, -1.1, -2.6, -0.55]) branch(500, 800, a, 170, 62, 7)
      add(under, () => {
        for (let i = 0; i < 620; i++) { const p = leaves[Math.floor(rnd() * leaves.length)]; strand(under, p[0], p[1], 1.57, rr(120, 620), { f: 0.008, sx: 8, curl: 0.08, color: rgba([170, 255, 210], rr(0.04, 0.2)), w: rr(0.45, 1) }) }
        for (const [x, y] of leaves) { const u = rnd(), c = u < 0.55 ? [120, 240, 170] : u < 0.82 ? [255, 214, 120] : [255, 150, 190]; glow(under, x + rr(-10, 10), y + rr(-10, 10), rr(3, 9), c, rr(0.08, 0.34)) }
      })
      ridge(under, 1000, 130, '#06241A', 0.006)
      add(over, () => {
        for (let i = 0; i < 2400; i++) { const a = rnd() * 6.3; strand(over, 500 + Math.cos(a) * 165, 770 + Math.sin(a) * 125, a, rr(8, 30), { f: 0.02, sx: 5, curl: 0.5, color: rgba([200, 255, 220], rr(0.05, 0.22)), w: 0.55 }) }
        motes(over, 320, [190, 255, 210], [0, 0, S, S], 3); motes(over, 80, [255, 196, 216], [0, 0, S, S], 2.6)
      })
    },
    robo() {
      bg('#03051A', '#0D1238')
      add(under, () => {
        for (let i = 0; i < 16; i++) glow(under, rr(0, S), rr(0, S), rr(120, 360), [[90, 70, 220], [40, 150, 220], [190, 80, 200]][i % 3], 0.1)
        for (let i = 0; i < 260; i++) strand(under, rr(0, S), rr(0, S), rnd() * 6.3, rr(60, 300), { f: 0.01, sx: 3, curl: 0.7, color: rgba([140, 170, 255], rr(0.02, 0.1)), w: 0.6 })
        motes(under, 500, [220, 232, 255], [0, 0, S, S], 2.6)
      })
      const cx = 500, cy = 500
      // thiên cầu: các vòng lồng nhau có vạch khắc, hành tinh
      const ring = (ctx, rx, ry, rot, a, c, ticks) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot)
        ctx.strokeStyle = rgba(c, a); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.stroke()
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(c, a * 0.5); ctx.beginPath(); ctx.ellipse(0, 0, rx - 9, ry - 7, 0, 0, 7); ctx.stroke()
        for (let i = 0; i < ticks; i++) { const t = (i / ticks) * 6.283, x = Math.cos(t) * rx, y = Math.sin(t) * ry; ctx.strokeStyle = rgba(c, a * 0.8); ctx.lineWidth = i % 6 ? 0.8 : 1.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 0.975, y * 0.975); ctx.stroke() }
        ctx.restore()
      }
      add(under, () => {
        glow(under, cx, cy, 460, [90, 220, 240], 0.3); glow(under, cx, cy, 230, [255, 214, 130], 0.3)
        ring(under, 455, 455, 0, 0.8, [255, 214, 130], 120); ring(under, 430, 150, -0.42, 0.7, [120, 232, 245], 96); ring(under, 430, 150, 0.42, 0.7, [120, 232, 245], 96); ring(under, 150, 430, 0.3, 0.55, [255, 214, 130], 96)
        // cánh ánh sáng bằng sợi
        for (const sg of [-1, 1]) for (let i = 0; i < 7000; i++) { const u = rnd(); strand(under, 500 + sg * rr(110, 160), rr(480, 580), -Math.PI / 2 + sg * (0.5 + u * 1.2), rr(120, 360), { f: 0.003, sx: sg + 2, curl: 0.2, bias: sg * 0.0065, color: rgba(u > 0.7 ? [255, 226, 160] : [150, 236, 245], rr(0.014, 0.06)), w: rr(0.45, 1) }) }
        for (const [x, y, r, c] of [[56, 500, 16, [255, 180, 110]], [944, 500, 12, [150, 236, 245]], [160, 240, 11, [255, 226, 160]], [860, 760, 15, [190, 150, 255]]]) { glow(under, x, y, r * 6, c, 0.65); glow(under, x, y, r, [255, 255, 255], 1) }
      })
      add(over, () => {
        ring(over, 430, 150, -0.42, 0.34, [120, 232, 245], 0)
        for (let i = 0; i < 2200; i++) { const a = rnd() * 6.3; strand(over, 500 + Math.cos(a) * 196, 520 + Math.sin(a) * 150, a, rr(8, 30), { f: 0.02, sx: 5, curl: 0.5, color: rgba([190, 244, 250], rr(0.05, 0.22)), w: 0.55 }) }
        motes(over, 200, [226, 240, 255], [0, 0, S, S], 3)
      })
    }
  }
  SCENES[pet]()
})()
