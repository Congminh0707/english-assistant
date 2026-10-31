// Long Vương: rồng cánh lớn gầm lên, vảy ngọc, viền mực, lửa vàng.
(function () {
  const { S, rnd, rr, sample, poly, xform, brush, ray, glow, add, splat, radiate, dust } = INK
  const c = document.getElementById('c').getContext('2d')
  const INKC = '#04201F', J1 = '#0E5A52', J2 = '#1E9A80', J3 = '#5FE0B8', GO = '#F2C25E', GL = '#FFE9A8', CR = '#FFF2CC'
  const SC = ['255,200,110', '255,232,170', '255,130,60', '120,240,210']
  const g = c.createRadialGradient(500, 440, 60, 500, 500, 780); g.addColorStop(0, '#3A3414'); g.addColorStop(0.55, '#0B2A30'); g.addColorStop(1, '#030F16')
  c.fillStyle = g; c.fillRect(0, 0, S, S)
  add(c, () => { glow(c, 500, 430, 560, '255,170,70', 0.32); for (let i = 0; i < 22; i++) { const x = rr(-20, 1020), y = rr(30, 620), r = rr(24, 66); c.lineWidth = 1.3; c.strokeStyle = `rgba(255,214,140,${rr(0.08, 0.24)})`; c.beginPath(); for (let a = 0; a < 15; a += 0.2) { const q = r * (1 - a / 16); c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) } c.stroke() } })
  radiate(c, 500, 500, 6000, 260, 360, [80, 300], SC)
  // sóng
  for (let k = 0; k < 4; k++) { c.fillStyle = ['#0B3A4C', '#0D4C5E', '#0F5E6E', '#127080'][k]; c.beginPath(); c.moveTo(0, S); for (let x = 0; x <= S; x += 8) c.lineTo(x, 866 + k * 34 + Math.sin(x * 0.03 + k * 2) * 16 + Math.sin(x * 0.011 + k) * 20); c.lineTo(S, S); c.fill() }

  // cánh
  for (const sg of [-1, 1]) {
    const X = (d) => 480 + sg * d, Sh = [X(60), 620], Wr = [X(300), 220], Tp = [[X(470), 120], [X(486), 400], [X(420), 590], [X(240), 740]]
    const P = new Path2D(); P.moveTo(...Sh); P.quadraticCurveTo(X(170), 400, ...Wr); P.quadraticCurveTo(X(400), 120, ...Tp[0]); P.quadraticCurveTo(X(400), 280, ...Tp[1]); P.quadraticCurveTo(X(350), 470, ...Tp[2]); P.quadraticCurveTo(X(270), 570, ...Tp[3]); P.quadraticCurveTo(X(150), 700, ...Sh); P.closePath()
    const gr = c.createRadialGradient(Wr[0], Wr[1], 30, Wr[0], Wr[1], 560); gr.addColorStop(0, '#E9A23C'); gr.addColorStop(0.5, '#A8421F'); gr.addColorStop(1, '#3A101C')
    c.fillStyle = gr; c.fill(P)
    add(c, () => { c.save(); c.clip(P); for (let i = 0; i < 7000; i++) ray(c, Wr[0] + rr(-16, 16), Wr[1] + rr(-16, 16), rnd() * 2.3 + (sg > 0 ? -0.6 : 1.45), rr(160, 600), { f: 0.003, sx: sg + 3, curl: 0.1, color: `rgba(255,${rnd() < 0.7 ? 190 : 110},80,${rr(0.012, 0.06)})`, w: rr(0.4, 0.9) }); c.restore() })
    c.strokeStyle = INKC; c.lineWidth = 6; c.stroke(P)
    const bone = (a, ctl, b, w) => { const pts = sample(`M${a[0]} ${a[1]}Q${ctl[0]} ${ctl[1]} ${b[0]} ${b[1]}`); brush(c, pts, w + 5, INKC, { head: 0.02, tail: 0.25 }); brush(c, pts, w, GO, { head: 0.02, tail: 0.25 }) }
    bone(Sh, [X(170), 400], Wr, 20); for (const [q, k] of [[Tp[0], [X(400), 120]], [Tp[1], [X(390), 270]], [Tp[2], [X(340), 390]], [Tp[3], [X(250), 470]]]) bone(Wr, k, q, 11)
    c.fillStyle = GL; c.beginPath(); c.moveTo(Wr[0] - 8, Wr[1]); c.lineTo(Wr[0] + sg * 6, Wr[1] - 44); c.lineTo(Wr[0] + 12, Wr[1] + 2); c.fill()
  }

  // vảy: hàng cung chồng nhau
  function scales(region, box, size, col, dir) {
    for (let y = box[1]; y < box[3]; y += size * 0.72) for (let x = box[0] + ((y / size) % 2 ? size / 2 : 0); x < box[2]; x += size) {
      if (!c.isPointInPath(region, x, y)) continue
      c.fillStyle = col(x, y); c.beginPath(); c.arc(x, y, size * 0.62, dir, dir + Math.PI); c.closePath(); c.fill()
      c.strokeStyle = 'rgba(4,32,31,.55)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, size * 0.62, dir, dir + Math.PI); c.stroke()
    }
  }
  // đuôi gai
  const tailS = sample('M640 850C760 880 880 830 900 720C910 660 880 620 840 610')
  brush(c, tailS, 88, J1, { head: 0.02, tail: 0.95 }); for (let i = 6; i < tailS.length - 8; i += 15) { const [x, y] = tailS[i]; c.fillStyle = GO; c.beginPath(); c.moveTo(x - 12, y - 8); c.lineTo(x + 8, y - 44); c.lineTo(x + 18, y - 4); c.fill() }
  const tt = tailS[tailS.length - 1]; add(c, () => { for (let i = 0; i < 2600; i++) ray(c, tt[0], tt[1], -2 + rr(-0.7, 0.7), rr(40, 220), { f: 0.012, sx: 4, curl: 0.5, color: `rgba(255,190,80,${rr(0.03, 0.14)})`, w: 0.7 }) })
  // thân
  const body = poly(sample('M380 520C318 610 300 740 330 850C342 896 372 908 410 908L640 908C668 860 672 780 646 700C630 640 610 580 580 530Z'))
  c.fillStyle = J1; c.fill(body); scales(body, [290, 500, 690, 920], 26, (x) => (x < 430 ? J1 : J2), 0.1)
  const belly = poly(sample('M444 560C414 640 420 780 462 870L600 870C630 780 620 640 572 560Z')); c.fillStyle = CR; c.fill(belly)
  for (let y = 590; y < 870; y += 34) brush(c, sample(`M${450 - (y - 590) * 0.01} ${y}Q520 ${y + 22} ${596} ${y}`), 5, 'rgba(160,120,50,.8)', { tail: 0.3 })
  brush(c, sample('M444 560C414 640 420 780 462 870'), 6, INKC, { tail: 0.2 }); brush(c, sample('M572 560C620 640 630 780 600 870'), 6, INKC, { tail: 0.2 })
  for (const [x0, r] of [[440, 62], [610, 58]]) { c.fillStyle = J2; c.beginPath(); c.ellipse(x0, 880, r, 34, 0, 0, 7); c.fill(); c.strokeStyle = INKC; c.lineWidth = 5; c.stroke(); for (let k = -1; k <= 1; k++) { c.fillStyle = CR; c.beginPath(); c.moveTo(x0 + k * 26 - 9, 900); c.lineTo(x0 + k * 26, 930); c.lineTo(x0 + k * 26 + 9, 900); c.fill() } }

  // đầu gầm ngẩng
  const T = xform(510, 340, -0.46, 1.02), Pp = (d, st) => sample(d, T, st)
  for (const [d, cc] of [['M-90 -90Q-210 -210 -330 -210Q-240 -150 -176 -60Z', GO], ['M-40 -110Q-120 -270 -250 -310Q-170 -220 -110 -90Z', GL]]) { const h = poly(Pp(d)); c.fillStyle = cc; c.fill(h); c.strokeStyle = INKC; c.lineWidth = 5; c.stroke(h) }
  // bờm lửa
  add(c, () => { const q = T(-120, -20); for (let i = 0; i < 9000; i++) { const a = rr(1.6, 4.3); ray(c, q[0] + Math.cos(a) * rr(30, 130), q[1] + Math.sin(a) * rr(30, 130), a + rr(-0.3, 0.3), rr(80, 300), { f: 0.007, sx: 9, curl: 0.5, color: `rgba(255,${rnd() < 0.6 ? 170 : 214},${rnd() < 0.6 ? 60 : 120},${rr(0.02, 0.1)})`, w: rr(0.5, 1.1) }) } })
  const headD = 'M260 -10Q272 -52 226 -62Q170 -72 120 -92Q60 -150 -40 -146Q-150 -130 -190 -40Q-214 60 -130 124Q-50 170 40 138Q120 150 200 118Q226 104 204 78Q140 72 96 44Q170 44 236 24Q262 12 260 -10Z'
  const head = poly(Pp(headD, 3))
  c.fillStyle = J2; c.fill(head); scales(head, [120, 40, 900, 620], 22, (x, y) => { const q = T(40, -90); return Math.hypot(x - q[0], y - q[1]) < 140 ? J3 : J2 }, 0.6)
  const mouth = poly(Pp('M236 24Q170 44 96 44Q140 72 204 78Q218 56 236 24Z')); c.fillStyle = '#3A0A14'; c.fill(mouth)
  const jaw = poly(Pp('M-30 90Q60 66 96 44Q140 72 204 78Q226 104 200 118Q120 150 40 138Q-10 130 -30 90Z')); c.fillStyle = CR; c.fill(jaw)
  brush(c, Pp(headD, 3), 8, INKC, { head: 0.01, tail: 0.01 })
  brush(c, Pp('M236 24Q170 44 96 44'), 7, INKC, { tail: 0.2 }); brush(c, Pp('M96 44Q140 72 204 78'), 6, INKC)
  for (const d of ['M214 30L222 66L236 26Z', 'M160 42L166 72L180 40Z', 'M112 44L118 64L130 44Z', 'M190 76L196 50L206 76Z']) { c.fillStyle = '#FFFDF2'; c.fill(poly(Pp(d, 2))) }
  const nos = T(236, -36); c.fillStyle = INKC; c.beginPath(); c.ellipse(nos[0], nos[1], 11, 6, -0.9, 0, 7); c.fill()
  // râu rồng + vây tai
  for (const d of ['M214 -60Q300 -130 420 -110', 'M240 -40Q330 -60 410 -10']) { const p = Pp(d); brush(c, p, 9, INKC, { head: 0.02, tail: 0.9 }); brush(c, p, 5, GL, { head: 0.02, tail: 0.9 }) }
  const fin = poly(Pp('M-120 -40Q-230 -60 -300 10Q-220 10 -210 50Q-160 30 -110 40Z')); c.fillStyle = J3; c.fill(fin); c.strokeStyle = INKC; c.lineWidth = 5; c.stroke(fin)
  // mắt
  const eye = poly(Pp('M20 -76Q70 -116 124 -86Q106 -50 64 -50Q34 -52 20 -76Z')); c.fillStyle = '#FFF3B0'; c.fill(eye); const ec = T(72, -80)
  add(c, () => glow(c, ec[0], ec[1], 90, '255,200,90', 0.5))
  c.save(); c.clip(eye); const ir = c.createRadialGradient(ec[0], ec[1], 3, ec[0], ec[1], 26); ir.addColorStop(0, '#FFF3B0'); ir.addColorStop(0.55, '#F7A92E'); ir.addColorStop(1, '#8A2C14'); c.fillStyle = ir; c.beginPath(); c.arc(ec[0], ec[1], 26, 0, 7); c.fill(); c.fillStyle = '#080404'; c.beginPath(); c.ellipse(ec[0], ec[1], 5, 19, -0.46, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ec[0] - 8, ec[1] - 8, 5.5, 0, 7); c.fill(); c.restore()
  brush(c, Pp('M4 -66Q64 -136 144 -84'), 16, INKC, { head: 0.12, tail: 0.4 }); brush(c, Pp('M20 -76Q34 -52 64 -50Q100 -50 120 -80'), 5, INKC)
  // ngọc rồng + lửa phun
  add(c, () => { const m = T(330, -30); for (let i = 0; i < 5000; i++) ray(c, m[0] + rr(-40, 0), m[1] + rr(0, 30), -0.96 + rr(-0.34, 0.34), rr(40, 300), { f: 0.008, sx: 2, curl: 0.5, color: `rgba(255,${rnd() < 0.6 ? 190 : 230},${rnd() < 0.6 ? 80 : 150},${rr(0.03, 0.13)})`, w: 0.8 }) })
  splat(c, 70, 200, 720, 160, 'rgba(255,214,130,.7)'); dust(c, 240, SC[0], 2)
})()
