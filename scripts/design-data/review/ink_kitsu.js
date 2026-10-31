// Cửu Vĩ Hồ: cáo chín đuôi, mực sắc, ánh lửa cam vàng và hồ hoả xanh.
(function () {
  const { S, rnd, rr, sample, poly, xform, brush, hair, fur, ray, glow, add, splat, drip, radiate, dust } = INK
  const c = document.getElementById('c').getContext('2d')
  const INKC = '#160B14', OR = '#E8762C', OD = '#A8421C', GO = '#FFC46E', WHI = '#FFF6EA', RED = '#C7321F'
  const SC = ['255,196,110', '255,226,170', '255,140,70', '150,190,255']
  const g = c.createRadialGradient(500, 460, 60, 500, 500, 760); g.addColorStop(0, '#4A1730'); g.addColorStop(0.6, '#1E0A22'); g.addColorStop(1, '#0A040F')
  c.fillStyle = g; c.fillRect(0, 0, S, S)
  add(c, () => { glow(c, 500, 480, 560, '255,110,60', 0.34); glow(c, 500, 450, 300, '255,196,120', 0.26) })
  // cổng torii in bóng
  c.fillStyle = '#12060F'; c.fillRect(120, 300, 40, 700); c.fillRect(840, 300, 40, 700); c.fillRect(100, 356, 800, 26)
  c.beginPath(); c.moveTo(50, 262); c.quadraticCurveTo(500, 306, 950, 262); c.lineTo(930, 312); c.quadraticCurveTo(500, 346, 70, 312); c.fill()
  radiate(c, 480, 520, 7000, 240, 340, [80, 280], SC)

  // chín đuôi
  const O = [450, 760]
  for (let t = 0; t < 9; t++) {
    const a = -3.3 + t * 0.34, L = 500 - Math.abs(t - 4) * 8, b = a + (t < 4 ? 0.3 : -0.3)
    const sp = sample(`M${O[0]} ${O[1]}Q${O[0] + Math.cos(a) * L * 0.6} ${O[1] + Math.sin(a) * L * 0.6} ${O[0] + Math.cos(b) * L} ${O[1] + Math.sin(b) * L}`)
    const T = sp.length
    for (let i = 0; i < 1250; i++) {
      const f = rnd(), k = Math.min(T - 2, Math.floor(f * T)), an = Math.atan2(sp[k + 1][1] - sp[k][1], sp[k + 1][0] - sp[k][0])
      const w = 46 * Math.sin(Math.min(1, f * 1.08 + 0.1) * 3.14) ** 0.7 * (rnd() * 2 - 1)
      const col = f > 0.78 ? (rnd() < 0.85 ? WHI : GO) : f > 0.6 ? GO : rnd() < 0.72 ? OR : rnd() < 0.7 ? '#F7A95E' : OD
      hair(c, sp[k][0] - Math.sin(an) * w, sp[k][1] + Math.cos(an) * w, an + w * 0.006, rr(30, 76), rr(0.8, 2.2), col)
    }
    const tip = sp[T - 1]
    add(c, () => { glow(c, tip[0], tip[1], 64, '120,170,255', 0.8); glow(c, tip[0], tip[1], 20, '240,248,255', 1); for (let i = 0; i < 80; i++) ray(c, tip[0], tip[1], -1.57 + rr(-0.8, 0.8), rr(30, 110), { f: 0.02, sx: t, curl: 0.5, color: `rgba(170,205,255,${rr(0.1, 0.35)})`, w: 0.7 }) })
  }

  // thân
  const body = poly(sample('M400 560C360 640 350 750 372 860C382 896 400 906 430 906L640 906C654 860 648 780 628 720C616 660 600 610 572 566Z'))
  c.fillStyle = OR; c.fill(body)
  fur(c, body, [270, 540, 660, 910], 8000, (x, y) => Math.atan2(y - 470, x - 440), () => (rnd() < 0.6 ? OR : rnd() < 0.6 ? '#F39A4E' : OD), [16, 40], [1, 2.6])
  // chân tất đen
  for (const [x0, x1] of [[486, 548], [560, 620]]) {
    const leg = poly(sample(`M${x0} 700C${x0 - 4} 780 ${x0} 860 ${x0 - 12} 892Q${(x0 + x1) / 2} 918 ${x1 + 10} 892C${x1} 860 ${x1 + 2} 780 ${x1 - 4} 700Z`))
    c.fillStyle = OR; c.fill(leg)
    fur(c, leg, [x0 - 16, 690, x1 + 14, 920], 1500, () => 1.57, (x, y) => (y > 790 ? (rnd() < 0.85 ? INKC : '#3A2030') : rnd() < 0.7 ? OR : '#F39A4E'), [10, 26], [0.8, 1.8])
  }
  brush(c, sample('M552 740L556 900'), 10, INKC)
  for (const x of [518, 592]) { const paw = poly(sample(`M${x - 44} 906Q${x - 38} 874 ${x} 872Q${x + 38} 874 ${x + 44} 906Q${x} 920 ${x - 44} 906Z`)); c.fillStyle = INKC; c.fill(paw); for (let k = -1; k <= 1; k++) brush(c, [[x + k * 18, 898], [x + k * 19, 916]], 4, '#5A3A4A', { head: 0.2, tail: 0.5 }) }
  const bib = poly(sample('M430 570C400 640 440 720 486 770L516 730L540 790L572 726L600 760C612 690 604 620 572 570Z'))
  c.fillStyle = WHI; c.fill(bib)
  fur(c, bib, [400, 560, 620, 800], 2800, (x, y) => Math.atan2(y - 510, x - 500), () => (rnd() < 0.86 ? WHI : '#F2D4AE'), [16, 40], [0.9, 2.2])

  // đầu ngoảnh nghiêng
  const T = xform(520, 395, -0.2, 0.98), P = (d, st) => sample(d, T, st)
  const ear2 = poly(P('M0 -110L34 -336Q92 -240 96 -74Z')); c.fillStyle = OD; c.fill(ear2)
  fur(c, ear2, [300, 30, 800, 420], 1100, () => -1.75, () => (rnd() < 0.6 ? OD : rnd() < 0.6 ? OR : INKC), [12, 28], [0.8, 1.8])
  brush(c, P('M34 -336Q92 -240 96 -74'), 7, INKC, { tail: 0.3 })
  const headD = 'M238 14Q170 -24 96 -54Q60 -104 -8 -118L-30 -340Q-104 -250 -132 -104L-184 -80L-262 -60L-204 -24L-296 8L-204 36L-280 92L-180 96L-214 170L-120 126L-96 200L-48 134L-2 176L24 112Q110 104 214 44Q246 30 238 14Z'
  const headP = P(headD, 3), head = poly(headP)
  c.fillStyle = OR; c.fill(head)
  const mask = poly(P('M-110 -10Q-40 -36 30 -10Q110 -14 234 22Q190 56 110 92Q40 124 -40 120Q-120 90 -110 -10Z'))
  const box = [150, 20, 880, 700]
  const lf = (x, y) => { const [tx, ty] = T(250, 16); return Math.atan2(y - ty, x - tx) + 0.05 }
  fur(c, head, box, 16000, lf, (x, y) => (c.isPointInPath(mask, x, y) ? (rnd() < 0.85 ? WHI : '#F2D4AE') : rnd() < 0.6 ? OR : rnd() < 0.6 ? '#F7A95E' : OD), [12, 32], [0.7, 1.9])
  const ear = poly(P('M-8 -118L-30 -340Q-104 -250 -132 -104Z')); c.fillStyle = OR; c.fill(ear)
  const earIn = poly(P('M-40 -140L-40 -286Q-84 -226 -106 -124Z')); c.fillStyle = '#2A0E1C'; c.fill(earIn)
  fur(c, earIn, box, 500, () => 0.9, () => (rnd() < 0.7 ? '#FFD9C0' : WHI), [10, 28], [0.6, 1.4])
  const tipE = poly(P('M-30 -340Q-58 -300 -70 -262L-14 -240Z')); c.fillStyle = INKC; c.fill(tipE)
  brush(c, P('M238 14Q170 -24 96 -54Q60 -104 -8 -118'), 8, INKC, { tail: 0.3 }); brush(c, P('M-8 -118L-30 -340'), 7, INKC); brush(c, P('M-30 -340Q-104 -250 -132 -104'), 8, INKC, { tail: 0.3 })
  brush(c, P('M238 18Q190 48 110 84Q70 100 30 112'), 7, INKC, { head: 0.1, tail: 0.3 })
  brush(c, P('M-132 -104L-184 -80L-262 -60'), 6, INKC); brush(c, P('M-204 36L-280 92L-180 96'), 6, INKC)
  const nose = poly(P('M212 -2Q240 -8 250 10Q250 28 226 30Q206 24 204 10Z')); c.fillStyle = '#0A050C'; c.fill(nose)
  brush(c, P('M214 34Q170 38 132 30Q116 28 104 16'), 5, INKC)
  // mắt xếch vàng + nét son kumadori
  const eye = poly(P('M0 -22Q44 -62 104 -30Q86 2 40 2Q14 0 0 -22Z')); c.fillStyle = '#FFF3C8'; c.fill(eye)
  const ec = T(56, -26)
  add(c, () => glow(c, ec[0], ec[1], 80, '255,190,90', 0.5))
  c.save(); c.clip(eye); const ir = c.createRadialGradient(ec[0], ec[1], 3, ec[0], ec[1], 26); ir.addColorStop(0, '#FFF3B0'); ir.addColorStop(0.55, '#F7A92E'); ir.addColorStop(1, '#A8421C'); c.fillStyle = ir; c.beginPath(); c.arc(ec[0], ec[1], 26, 0, 7); c.fill(); c.fillStyle = '#0A050C'; c.beginPath(); c.ellipse(ec[0], ec[1], 5, 19, -0.2, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ec[0] - 8, ec[1] - 8, 5.5, 0, 7); c.fill(); c.restore()
  brush(c, P('M-16 -14Q40 -84 124 -30'), 15, INKC, { head: 0.12, tail: 0.4 }); brush(c, P('M0 -22Q14 0 40 2Q78 4 100 -26'), 5, INKC)
  for (const d of ['M-20 -40Q20 -96 70 -84', 'M-8 -56Q24 -110 56 -112', 'M20 24Q60 36 100 30', 'M30 44Q60 52 88 48']) brush(c, P(d), 7, RED, { head: 0.1, tail: 0.6 })
  const ch = T(-40, -60); add(c, () => glow(c, ch[0], ch[1], 26, '255,120,90', 0.4))
  add(c, () => { for (let i = 0; i < headP.length; i += 2) { const [x, y] = headP[i], a = Math.atan2(y - 420, x - 500); ray(c, x, y, a + rr(-0.3, 0.3), rr(16, 64), { f: 0.01, sx: 4, curl: 0.2, color: `rgba(255,214,150,${rr(0.08, 0.3)})`, w: 0.7 }) } })
  // bảo châu hoshi no tama
  add(c, () => { glow(c, 250, 880, 90, '120,170,255', 0.75); glow(c, 250, 880, 30, '240,248,255', 1) })
  splat(c, 90, 780, 700, 200, 'rgba(255,196,120,.7)'); dust(c, 240, SC[0], 2)
})()
