// Mộc Thần: thần rừng lông rêu, gạc là cành đa cổ thụ, mặt nạ gỗ, ngồi đài sen, sáng ngọc.
(function () {
  const { S, rnd, rr, sample, poly, brush, fur, ray, glow, add, splat, radiate, dust } = INK
  const c = document.getElementById('c').getContext('2d')
  const INKC = '#04140E', M1 = '#17503A', M2 = '#2E8A62', M3 = '#7FD6A4', CR = '#F4EBD2', WOOD = '#3A2A1E'
  const SC = ['170,255,210', '220,255,200', '255,226,150', '255,170,200']
  const g = c.createRadialGradient(500, 460, 60, 500, 500, 780); g.addColorStop(0, '#0F4A36'); g.addColorStop(0.6, '#06241A'); g.addColorStop(1, '#020C08')
  c.fillStyle = g; c.fillRect(0, 0, S, S)
  add(c, () => { glow(c, 500, 430, 560, '90,230,170', 0.3); glow(c, 500, 470, 300, '220,255,190', 0.22) })
  radiate(c, 500, 600, 7000, 210, 300, [90, 300], SC)

  // gạc cành đa hai bên
  const tips = []
  const branch = (x, y, a, L, w, d) => {
    const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L
    const pts = sample(`M${x} ${y}Q${(x + x2) / 2 + rr(-18, 18)} ${(y + y2) / 2 + rr(-18, 18)} ${x2} ${y2}`)
    const line = (W, col) => { c.strokeStyle = col; c.lineWidth = W; c.lineCap = 'round'; c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke() }
    line(w + 5, INKC); line(w, d > 2 ? WOOD : '#6A4E30')
    if (d === 0) { tips.push([x2, y2]); return }
    const n = d > 3 ? 2 : 3
    for (let i = 0; i < n; i++) branch(x2, y2, a + rr(-0.62, 0.62), L * rr(0.7, 0.84), w * 0.66, d - 1)
  }
  branch(420, 400, -2.15, 120, 26, 5); branch(580, 400, -0.99, 120, 26, 5); branch(400, 430, -2.75, 100, 18, 4); branch(600, 430, -0.4, 100, 18, 4)
  add(c, () => { for (let i = 0; i < 420; i++) { const p = tips[Math.floor(rnd() * tips.length)]; ray(c, p[0], p[1], 1.57, rr(60, 330), { f: 0.01, sx: 8, curl: 0.06, color: `rgba(170,255,210,${rr(0.05, 0.22)})`, w: rr(0.4, 0.9) }) } })
  for (const [x, y] of tips) for (let k = 0; k < 3; k++) { const px = x + rr(-16, 16), py = y + rr(-16, 16), a = rnd() * 6.3; c.fillStyle = [M2, M3, '#B9E89A'][k]; c.beginPath(); c.ellipse(px, py, rr(9, 15), rr(4, 7), a, 0, 7); c.fill() }
  add(c, () => { for (const [x, y] of tips) if (rnd() < 0.45) glow(c, x, y, rr(10, 26), rnd() < 0.7 ? '190,255,190' : '255,214,120', rr(0.25, 0.6)) })

  // đài sen
  for (const [n, R0, H] of [[9, 300, 128], [7, 230, 104]]) for (let i = 0; i < n; i++) {
    const a = (-0.5 + i / (n - 1)) * 2.5, W = 60
    const pet = (x, y) => { const c0 = Math.cos(a), s0 = Math.sin(a); return [500 + (x * c0 - y * s0) * (R0 / 170), 918 + (x * s0 + y * c0) * 0.86] }
    const pts = sample(`M0 0C${-W} ${-H * 0.4} ${-W * 0.6} ${-H * 0.9} 0 ${-H * 1.5}C${W * 0.6} ${-H * 0.9} ${W} ${-H * 0.4} 0 0Z`, pet, 3)
    const grd = c.createLinearGradient(500, 910, ...pet(0, -H * 1.5)); grd.addColorStop(0, '#C44E7E'); grd.addColorStop(1, '#FFD6E4')
    c.fillStyle = grd; c.fill(poly(pts)); brush(c, pts, 6, INKC, { head: 0.01, tail: 0.01 }); brush(c, sample(`M0 -16L0 ${-H * 1.3}`, pet), 3, 'rgba(120,30,70,.6)')
  }
  // thân lông rêu
  const body = poly(sample('M500 360C370 360 276 450 262 590C250 720 316 830 420 856L580 856C684 830 750 720 738 590C724 450 630 360 500 360Z'))
  c.fillStyle = M1; c.fill(body)
  fur(c, body, [250, 320, 750, 880], 15000, (x, y) => Math.atan2(y - 300, x - 500), (x, y) => { const d = Math.hypot(x - 430, y - 470); return d < 170 ? (rnd() < 0.5 ? M3 : M2) : rnd() < 0.55 ? M2 : rnd() < 0.6 ? M1 : INKC }, [16, 44], [1, 2.6])
  const P = sample('M500 360C370 360 276 450 262 590C250 720 316 830 420 856L580 856C684 830 750 720 738 590C724 450 630 360 500 360Z', undefined, 3)
  add(c, () => { for (let i = 0; i < P.length; i += 2) { const [x, y] = P[i], a = Math.atan2(y - 600, x - 500); ray(c, x, y, a + rr(-0.3, 0.3), rr(16, 70), { f: 0.01, sx: 4, curl: 0.2, color: `rgba(190,255,215,${rr(0.08, 0.3)})`, w: 0.7 }) } })
  // mặt sáng hình lá, mắt linh thú to, mõm nhỏ
  const mk = sample('M500 452C400 452 330 510 330 596C330 690 410 760 500 766C590 760 670 690 670 596C670 510 600 452 500 452Z')
  const mp = poly(mk); c.fillStyle = '#E7F6DC'; c.fill(mp)
  fur(c, mp, [320, 440, 680, 780], 3600, (x, y) => Math.atan2(y - 420, x - 500), () => (rnd() < 0.8 ? '#F4FBE8' : M3), [10, 24], [0.7, 1.6])
  for (const sg of [-1, 1]) {
    const x = 500 + sg * 84, y = 590
    add(c, () => glow(c, x, y, 84, '120,255,190', 0.45))
    c.fillStyle = '#071A12'; c.beginPath(); c.ellipse(x, y, 44, 52, sg * 0.14, 0, 7); c.fill()
    const ir = c.createRadialGradient(x, y + 10, 3, x, y + 10, 34); ir.addColorStop(0, '#F4FFE0'); ir.addColorStop(0.5, '#6FE0A0'); ir.addColorStop(1, '#0E5A40'); c.fillStyle = ir; c.beginPath(); c.arc(x, y + 8, 33, 0, 7); c.fill()
    c.fillStyle = '#04140E'; c.beginPath(); c.ellipse(x, y + 6, 8, 22, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 12, y - 16, 12, 0, 7); c.fill(); c.beginPath(); c.arc(x + 13, y + 20, 5, 0, 7); c.fill()
    brush(c, sample(`M${500 + sg * 22} ${y - 40}Q${x} ${y - 82} ${500 + sg * 140} ${y - 46}`), 13, INKC, { head: 0.12, tail: 0.4 })
    c.fillStyle = 'rgba(255,150,170,.5)'; c.beginPath(); c.ellipse(500 + sg * 128, 672, 28, 15, 0, 0, 7); c.fill()
    // tai lá
    const lf = poly(sample(`M${500 + sg * 190} 450Q${500 + sg * 300} 340 ${500 + sg * 360} 400Q${500 + sg * 320} 480 ${500 + sg * 230} 500Z`)); c.fillStyle = M2; c.fill(lf); brush(c, sample(`M${500 + sg * 190} 450Q${500 + sg * 300} 340 ${500 + sg * 360} 400Q${500 + sg * 320} 480 ${500 + sg * 230} 500`), 6, INKC, { head: 0.02, tail: 0.1 }); brush(c, sample(`M${500 + sg * 210} 470Q${500 + sg * 280} 420 ${500 + sg * 340} 404`), 3, M3)
  }
  c.fillStyle = INKC; c.beginPath(); c.ellipse(500, 676, 11, 8, 0, 0, 7); c.fill()
  brush(c, sample('M466 700Q484 716 500 700Q516 716 534 700'), 5, INKC, { head: 0.1, tail: 0.1 })
  // hạt mầm phát sáng trên trán, nối với cây
  add(c, () => { glow(c, 500, 496, 64, '190,255,190', 0.8); glow(c, 500, 496, 16, '250,255,240', 1) })
  splat(c, 70, 780, 720, 180, 'rgba(190,255,210,.7)'); dust(c, 240, SC[0], 2)
})()
