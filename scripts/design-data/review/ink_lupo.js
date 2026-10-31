// Ngân Lang: sói tru, tranh mực sắc nét, đầu to kiểu chibi, ánh bạc toả ra xung quanh.
(function () {
  const { S, rnd, rr, sample, poly, xform, brush, hair, fur, ray, glow, add, wash, splat, drip, radiate, dust } = INK
  const c = document.getElementById('c').getContext('2d')
  const INKC = '#0E1124', MID = '#2C3354', SIL = '#B9C5E0', WHI = '#F3F6FF'
  const SC = ['226,236,255', '188,212,255', '160,236,255', '255,246,226']
  const g = c.createRadialGradient(500, 440, 60, 500, 500, 760); g.addColorStop(0, '#1C2650'); g.addColorStop(0.6, '#0B1030'); g.addColorStop(1, '#04061A')
  c.fillStyle = g; c.fillRect(0, 0, S, S)
  add(c, () => { glow(c, 500, 470, 560, '110,145,235', 0.38); glow(c, 500, 450, 330, '200,218,255', 0.3) })
  // vòng trăng mảnh phía sau
  add(c, () => { for (const [r, a, w] of [[352, 0.5, 2], [368, 0.2, 1], [410, 0.1, 1]]) { c.strokeStyle = `rgba(226,236,255,${a})`; c.lineWidth = w; c.beginPath(); c.arc(520, 400, r, 0, 7); c.stroke() } })
  wash(c, 16, [60, 560, 940, 1000], 'rgba(40,52,100,.5)', 26)
  radiate(c, 490, 490, 9000, 230, 330, [90, 300], SC)
  radiate(c, 480, 500, 15000, 200, 300, [60, 200], ['236,244,255', '205,226,255'])

  const T = xform(520, 395, -0.82, 1.02)
  const P = (d, st) => sample(d, T, st)

  // đuôi
  const tail = sample('M270 860C170 880 70 800 80 680C86 610 130 560 190 530')
  for (let i = 0; i < 2600; i++) {
    const f = rnd(), k = Math.min(tail.length - 2, Math.floor(f * tail.length)), a = Math.atan2(tail[k + 1][1] - tail[k][1], tail[k + 1][0] - tail[k][0])
    const w = 62 * Math.sin(Math.min(1, f * 1.1 + 0.1) * 3.14) ** 0.7 * (rnd() * 2 - 1)
    hair(c, tail[k][0] - Math.sin(a) * w, tail[k][1] + Math.cos(a) * w, a + w * 0.006, rr(36, 96), rr(1, 3), f > 0.72 ? INKC : rnd() < 0.5 ? SIL : rnd() < 0.5 ? WHI : MID)
  }

  // thân chibi ngồi
  const body = poly(sample('M322 548C262 620 226 736 262 846C276 890 310 906 352 906L606 906C622 880 612 800 596 736C586 680 576 620 548 566Z'))
  c.fillStyle = '#7F8DB4'; c.fill(body)
  fur(c, body, [220, 530, 640, 910], 9000, (x, y) => Math.atan2(y - 480, x - 420), (x, y) => (x < 400 ? (rnd() < 0.55 ? MID : SIL) : rnd() < 0.72 ? WHI : SIL), [16, 42], [1, 2.6])
  // hai chân trước + móng
  for (const [x0, x1] of [[470, 532], [544, 606]]) {
    const leg = poly(sample(`M${x0} 700C${x0 - 6} 780 ${x0 - 2} 860 ${x0 - 12} 898Q${(x0 + x1) / 2} 924 ${x1 + 10} 898C${x1} 860 ${x1 + 2} 780 ${x1 - 4} 700Z`))
    c.fillStyle = '#C9D3EA'; c.fill(leg)
    fur(c, leg, [x0 - 16, 690, x1 + 14, 920], 1500, () => 1.57, () => (rnd() < 0.8 ? WHI : SIL), [10, 26], [0.8, 1.8])
    brush(c, sample(`M${x0} 740C${x0 - 4} 800 ${x0 - 2} 860 ${x0 - 12} 898`), 5, INKC)
    for (let k = 1; k < 4; k++) brush(c, [[x0 - 12 + k * 21, 892], [x0 - 11 + k * 21, 914]], 5, INKC, { head: 0.2, tail: 0.5 })
  }
  brush(c, sample('M262 846C276 890 310 906 352 906'), 6, INKC)
  brush(c, sample('M322 700C350 740 372 800 360 880'), 5, 'rgba(14,17,36,.7)')

  // tai sau
  const ear2 = poly(P('M-20 -130Q10 -270 42 -320Q84 -240 74 -110Z')); c.fillStyle = MID; c.fill(ear2)
  fur(c, ear2, [300, 40, 800, 520], 1400, (x, y) => -0.82 - 1.57 + 0.0, () => (rnd() < 0.7 ? INKC : MID), [10, 26])

  // bờm quanh cổ: nét lớn sắc, sáng tối xen kẽ
  for (let i = 0; i < 260; i++) {
    const a = rr(2.0, 4.15), r0 = rr(70, 150), L = rr(70, 180), x = 430 + Math.cos(a) * r0, y = 520 + Math.sin(a) * r0 * 0.8
    const pts = sample(`M${x} ${y}q${Math.cos(a) * L * 0.5} ${Math.sin(a) * L * 0.5 + rr(0, 40)} ${Math.cos(a) * L} ${Math.sin(a) * L + rr(30, 100)}`)
    brush(c, pts, rr(3, 11), i % 4 === 0 ? INKC : i % 3 === 0 ? MID : rnd() < 0.6 ? SIL : WHI, { head: 0.1, tail: 0.85 })
  }
  // yếm lông trắng trước ngực, chồng lên gốc hai chân
  const bib = poly(sample('M420 560C380 620 420 700 470 760L500 720L524 780L556 716L586 750C600 690 590 620 560 566Z'))
  c.fillStyle = '#E6ECFA'; c.fill(bib)
  fur(c, bib, [380, 550, 610, 790], 3000, (x, y) => Math.atan2(y - 500, x - 480), () => (rnd() < 0.85 ? WHI : SIL), [16, 40], [0.9, 2.2])

  // tách hai chân trước + bàn chân
  brush(c, sample('M538 740L540 900'), 11, INKC)
  for (const x of [502, 580]) {
    const paw = poly(sample(`M${x - 46} 906Q${x - 40} 872 ${x} 870Q${x + 40} 872 ${x + 46} 906Q${x} 922 ${x - 46} 906Z`)); c.fillStyle = WHI; c.fill(paw)
    fur(c, paw, [x - 50, 868, x + 50, 924], 400, () => 1.57, () => (rnd() < 0.85 ? WHI : SIL), [8, 18], [0.7, 1.5])
    brush(c, sample(`M${x - 46} 906Q${x - 40} 872 ${x} 870Q${x + 40} 872 ${x + 46} 906`), 7, INKC, { head: 0.1, tail: 0.15 })
    for (let k = -1; k <= 1; k++) brush(c, [[x + k * 20, 896], [x + k * 21, 918]], 5, INKC, { head: 0.2, tail: 0.5 })
  }

  // đầu: hồ sơ quay phải trong hệ cục bộ, rồi xoay ngẩng lên
  const headD = 'M222 -12Q150 -46 96 -78Q52 -128 -18 -146L-44 -322Q-96 -256 -122 -132L-170 -98L-250 -84L-196 -44L-286 -14L-196 18L-268 74L-176 84L-214 158L-124 118L-104 196L-54 128L-8 176L18 116Q84 132 164 118Q176 96 150 84Q96 82 62 44Q134 48 214 28Q236 12 222 -12Z'
  const headP = P(headD, 3), head = poly(headP)
  const hg = c.createLinearGradient(...T(-200, -200), ...T(120, 160)); hg.addColorStop(0, '#59648C'); hg.addColorStop(0.5, '#AEBBDA'); hg.addColorStop(1, '#EEF2FF')
  c.fillStyle = hg; c.fill(head)
  // miệng mở
  const mouth = poly(P('M214 28Q134 48 62 44Q96 82 150 84Q168 62 214 28Z')); c.fillStyle = '#2A0F24'; c.fill(mouth)
  const tongue = poly(P('M84 58Q120 56 150 76Q118 86 92 66Z')); c.fillStyle = '#D9607E'; c.fill(tongue)
  const mask = poly(P('M214 -18Q150 -52 96 -80Q52 -130 -18 -148L-122 -132L-180 -92L-214 -20Q-120 -36 -50 -30Q10 -14 70 -28Q140 -30 214 -18Z'))
  const box = [120, 30, 900, 720]
  const lf = (x, y) => { const [tx, ty] = T(240, -6); return Math.atan2(y - ty, x - tx) + 0.05 }
  fur(c, head, box, 17000, lf, (x, y) => { const m = c.isPointInPath(mask, x, y); return m ? (rnd() < 0.62 ? INKC : rnd() < 0.55 ? MID : SIL) : rnd() < 0.72 ? WHI : rnd() < 0.7 ? SIL : MID }, [12, 34], [0.7, 1.9])
  c.fillStyle = '#2A0F24'; c.fill(mouth); c.fillStyle = '#D9607E'; c.fill(tongue)
  // má, cằm trắng
  const cheek = poly(P('M-90 22Q-30 -6 40 8Q96 10 150 2Q190 -4 214 2Q184 22 134 40Q70 40 40 62Q10 110 -60 100Q-120 70 -90 22Z'))
  c.save(); c.globalAlpha = 0.5; c.fillStyle = WHI; c.fill(cheek); c.restore()
  fur(c, cheek, box, 3400, lf, () => (rnd() < 0.88 ? WHI : SIL), [10, 28], [0.7, 1.7])
  // tai trước
  const ear = poly(P('M-30 -146L-44 -322Q-96 -256 -122 -132Z')); c.fillStyle = '#6E7AA4'; c.fill(ear)
  const earIn = poly(P('M-50 -160L-52 -272Q-84 -226 -100 -146Z')); c.fillStyle = '#22142E'; c.fill(earIn)
  fur(c, earIn, box, 500, () => -0.82 + 1.2, () => (rnd() < 0.6 ? '#E8B4C8' : WHI), [10, 28], [0.6, 1.4])
  // viền mực thuôn
  brush(c, P('M222 -12Q150 -46 96 -78Q52 -128 -18 -146'), 9, INKC, { head: 0.04, tail: 0.3 })
  brush(c, P('M-18 -146L-44 -322'), 7, INKC); brush(c, P('M-44 -322Q-96 -256 -122 -132'), 8, INKC, { tail: 0.3 })
  brush(c, P('M-122 -132L-170 -98L-250 -84'), 7, INKC); brush(c, P('M-196 18L-268 74L-176 84'), 6, INKC); brush(c, P('M-214 158L-124 118'), 6, INKC)
  brush(c, P('M18 116Q84 132 164 118Q176 96 150 84'), 8, INKC, { tail: 0.2 })
  brush(c, P('M62 44Q134 48 214 28'), 8, INKC, { head: 0.1, tail: 0.15 }); brush(c, P('M62 44Q96 82 150 84'), 7, INKC)
  // răng nanh
  for (const d of ['M176 36L184 66L194 30Z', 'M124 46L130 66L138 44Z', 'M136 84L142 62L150 84Z']) { c.fillStyle = WHI; c.fill(poly(P(d, 2))) }
  // mũi
  const nose = poly(P('M196 -22Q226 -28 240 -8Q244 12 216 14Q196 10 188 -4Z')); c.fillStyle = '#0A0C1E'; c.fill(nose)
  add(c, () => { const q = T(216, -14); glow(c, q[0], q[1], 16, '220,232,255', 0.75) })
  for (const [x, y] of [[150, 2], [166, 8], [140, 14], [158, 18], [176, 16]]) { const q = T(x, y); c.fillStyle = INKC; c.beginPath(); c.arc(q[0], q[1], 2.3, 0, 7); c.fill() }
  // mắt to, xếch, phát sáng băng bạc
  const eye = poly(P('M-4 -46Q34 -86 88 -72Q78 -28 36 -26Q8 -28 -4 -46Z')); c.fillStyle = '#EAF4FF'; c.fill(eye)
  const ec = T(46, -52)
  add(c, () => glow(c, ec[0], ec[1], 90, '150,226,255', 0.45))
  const iris = c.createRadialGradient(ec[0], ec[1], 3, ec[0], ec[1], 30); iris.addColorStop(0, '#E9FBFF'); iris.addColorStop(0.5, '#6FCDF2'); iris.addColorStop(1, '#1D5FA8')
  c.save(); c.clip(eye); c.fillStyle = iris; c.beginPath(); c.arc(ec[0], ec[1], 26, 0, 7); c.fill(); c.fillStyle = '#0A0C1E'; c.beginPath(); c.ellipse(ec[0], ec[1], 6, 18, 0.75, 0, 7); c.fill()
  c.fillStyle = '#fff'; c.beginPath(); c.arc(ec[0] - 9, ec[1] - 8, 6, 0, 7); c.fill(); c.beginPath(); c.arc(ec[0] + 10, ec[1] + 11, 3.5, 0, 7); c.fill(); c.restore()
  brush(c, P('M-24 -30Q26 -104 112 -76'), 15, INKC, { head: 0.12, tail: 0.4 }); brush(c, P('M-4 -46Q8 -28 36 -26Q68 -26 86 -60'), 5, INKC)
  brush(c, P('M-20 -28Q-46 -6 -72 -8'), 5, INKC)
  // trăng non trên trán
  const mc = T(26, -112); c.save(); add(c, () => glow(c, mc[0], mc[1], 34, '255,238,190', 0.45)); c.fillStyle = '#FFF4CC'; c.beginPath(); c.arc(mc[0], mc[1], 11, 0.5, 5.1); c.arc(mc[0] + 5, mc[1] - 2, 9, 5, 0.6, true); c.fill(); c.restore()

  // viền bạc phát sáng + mực bắn
  add(c, () => { for (let i = 0; i < headP.length; i += 2) { const [x, y] = headP[i], a = Math.atan2(y - 420, x - 500); ray(c, x, y, a + rr(-0.3, 0.3), rr(16, 70), { f: 0.01, sx: 4, curl: 0.2, color: `rgba(${SC[0]},${rr(0.08, 0.3)})`, w: rr(0.4, 0.9) }) } })
  splat(c, 90, 240, 300, 200, 'rgba(14,17,36,.8)'); splat(c, 120, 780, 640, 220, 'rgba(226,236,255,.7)')
  for (let i = 0; i < 11; i++) drip(c, rr(180, 720), rr(900, 930), rr(30, 90), rr(3, 7), 'rgba(14,17,36,.9)')
  dust(c, 260, SC[0], 2)
})()
