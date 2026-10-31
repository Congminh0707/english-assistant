// Thiên Cơ: thần máy giáp ngà viền vàng, cánh lông thép, đứng trong thiên cầu.
(function () {
  const { S, rnd, rr, sample, poly, brush, ray, glow, add, splat, radiate, dust } = INK
  const c = document.getElementById('c').getContext('2d')
  const INKC = '#080B22', IV = '#F2EEDF', IV2 = '#BDB7A2', GO = '#E8B84A', GL = '#FFE7A8', CY = '#6FF0F5'
  const SC = ['150,236,245', '226,240,255', '255,226,160', '190,150,255']
  const g = c.createRadialGradient(500, 460, 60, 500, 500, 780); g.addColorStop(0, '#1E2A66'); g.addColorStop(0.6, '#0A0E30'); g.addColorStop(1, '#03051A')
  c.fillStyle = g; c.fillRect(0, 0, S, S)
  add(c, () => { glow(c, 500, 460, 540, '90,220,240', 0.28); glow(c, 500, 430, 280, '255,214,130', 0.2) })
  radiate(c, 500, 500, 6500, 260, 360, [80, 300], SC)
  const ring = (rx, ry, rot, a, col, ticks) => { c.save(); c.translate(500, 480); c.rotate(rot); c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = 2.4; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.stroke(); c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, rx - 9, ry - 7, 0, 0, 7); c.stroke(); for (let i = 0; i < ticks; i++) { const t = (i / ticks) * 6.283, x = Math.cos(t) * rx, y = Math.sin(t) * ry; c.lineWidth = i % 6 ? 0.8 : 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x * 0.975, y * 0.975); c.stroke() } c.restore() }
  add(c, () => { ring(450, 450, 0, 0.8, '255,214,130', 144); ring(440, 150, -0.42, 0.7, '120,232,245', 96); ring(440, 150, 0.42, 0.7, '120,232,245', 96); ring(150, 440, 0.32, 0.5, '255,214,130', 96); for (const [x, y, r, cc] of [[60, 480, 15, '255,180,110'], [944, 470, 12, '150,236,245'], [170, 170, 10, '255,226,160'], [846, 800, 14, '190,150,255']]) { glow(c, x, y, r * 6, cc, 0.65); glow(c, x, y, r, '255,255,255', 1) } })

  // cánh lông thép: mỗi bên 3 tầng
  for (const sg of [-1, 1]) for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + sg * (0.42 + i * 0.2), L = (430 - row * 100) * (1 - i * 0.05), x0 = 500 + sg * 110, y0 = 560
    const ex = x0 + Math.cos(a) * L, ey = y0 + Math.sin(a) * L
    const pts = sample(`M${x0} ${y0}Q${x0 + Math.cos(a - sg * 0.3) * L * 0.6} ${y0 + Math.sin(a - sg * 0.3) * L * 0.6} ${ex} ${ey}`)
    const W = 44 - row * 8
    brush(c, pts, W + 7, INKC, { head: 0.35, tail: 0.35 }); brush(c, pts, W, row === 0 ? '#CFE4EE' : row === 1 ? IV : GL, { head: 0.35, tail: 0.35 }); brush(c, pts, 3, row === 0 ? '#2A6F8C' : '#9A7420', { head: 0.1, tail: 0.3 })
  }
  add(c, () => { for (let i = 0; i < 3000; i++) { const sg = rnd() < 0.5 ? -1 : 1, a = -Math.PI / 2 + sg * rr(0.4, 2.1); ray(c, 500 + sg * 110 + Math.cos(a) * rr(80, 360), 560 + Math.sin(a) * rr(80, 360), a, rr(30, 170), { f: 0.008, sx: 3, curl: 0.2, color: `rgba(170,240,250,${rr(0.03, 0.13)})`, w: 0.7 }) } })

  const plate = (d, fill, sw = 7) => { const pts = sample(d, undefined, 3), p = poly(pts); c.fillStyle = fill; c.fill(p); brush(c, pts, sw, INKC, { head: 0.005, tail: 0.005 }); return p }
  // thân + chân
  plate('M430 660L570 660Q610 720 590 800Q540 840 500 840Q460 840 410 800Q390 720 430 660Z', IV)
  plate('M450 830L490 830L484 930Q466 944 444 930Z', IV2); plate('M510 830L550 830L556 930Q534 944 516 930Z', IV2)
  add(c, () => { for (const x of [464, 536]) for (let i = 0; i < 800; i++) ray(c, x + rr(-16, 16), 934, 1.57 + rr(-0.2, 0.2), rr(16, 66), { f: 0.02, sx: 2, curl: 0.3, color: `rgba(120,240,245,${rr(0.04, 0.18)})`, w: 0.7 }) })
  plate('M334 640Q398 610 430 668L420 748Q370 770 336 720Z', IV); plate('M666 640Q602 610 570 668L580 748Q630 770 664 720Z', IV)
  brush(c, sample('M352 660Q388 640 416 676'), 7, GO); brush(c, sample('M648 660Q612 640 584 676'), 7, GO)
  const core = plate('M500 690L544 730L500 790L456 730Z', '#141A44', 6)
  add(c, () => { glow(c, 500, 736, 90, '120,240,245', 0.8); glow(c, 500, 736, 22, '240,255,255', 1) })
  brush(c, sample('M430 700Q470 700 500 690Q530 700 570 700'), 6, GO, { head: 0.1, tail: 0.1 })
  // đầu mũ giáp
  const hd = 'M500 214C600 214 682 268 696 372C706 450 690 520 650 570C600 620 400 620 350 570C310 520 294 450 304 372C318 268 400 214 500 214Z'
  const hp = poly(sample(hd, undefined, 3)); const hg = c.createLinearGradient(380, 220, 640, 620); hg.addColorStop(0, '#FFFDF4'); hg.addColorStop(0.6, IV); hg.addColorStop(1, IV2); c.fillStyle = hg; c.fill(hp); brush(c, sample(hd, undefined, 3), 9, INKC, { head: 0.005, tail: 0.005 })
  // đường khắc
  for (const d of ['M330 330Q420 268 500 262Q580 268 670 330', 'M500 214L500 262', 'M316 470Q300 520 352 560', 'M684 470Q700 520 648 560']) brush(c, sample(d), 5, GO, { head: 0.05, tail: 0.1 })
  for (let i = 0; i < 26; i++) { const x = rr(330, 670), y = rr(250, 320); if (c.isPointInPath(hp, x, y) && (Math.hypot(x - 500, y - 280) > 40)) { c.strokeStyle = 'rgba(120,100,50,.5)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + rr(-18, 18), y); c.lineTo(x + rr(-18, 18), y + rr(4, 12)); c.stroke() } }
  // kính mặt + mắt khe sáng
  const vis = plate('M350 356Q500 300 650 356Q672 430 640 500Q500 548 360 500Q328 430 350 356Z', '#0A0F30', 8)
  c.save(); c.clip(vis); add(c, () => { glow(c, 500, 430, 240, '60,120,200', 0.4); c.strokeStyle = 'rgba(120,232,245,.12)'; c.lineWidth = 1; for (let y = 330; y < 540; y += 9) { c.beginPath(); c.moveTo(320, y); c.lineTo(680, y); c.stroke() } }); c.restore()
  for (const sg of [-1, 1]) {
    const x = 500 + sg * 78, y = 428, p = poly(sample(`M${x - 46 * sg} ${y + 14}Q${x} ${y - 40} ${x + 52 * sg} ${y - 16}Q${x + 20 * sg} ${y + 30} ${x - 46 * sg} ${y + 14}Z`, undefined, 2))
    add(c, () => glow(c, x, y, 100, '120,240,245', 0.7)); c.fillStyle = CY; c.fill(p); c.fillStyle = '#F2FFFF'; c.beginPath(); c.ellipse(x, y - 2, 18, 8, sg * -0.25, 0, 7); c.fill()
  }
  brush(c, sample('M474 488Q500 502 526 488'), 5, CY)
  // gạc anten + vầng hào quang bánh răng
  add(c, () => { c.strokeStyle = 'rgba(255,226,160,.9)'; c.lineWidth = 3; c.beginPath(); c.arc(500, 240, 104, 3.5, 5.92); c.stroke(); for (let i = 0; i <= 22; i++) { const a = 3.5 + (i / 22) * 2.42; c.beginPath(); c.moveTo(500 + Math.cos(a) * 104, 240 + Math.sin(a) * 104); c.lineTo(500 + Math.cos(a) * 124, 240 + Math.sin(a) * 124); c.stroke() } })
  for (const sg of [-1, 1]) { const p = plate(`M${500 + sg * 180} 300L${500 + sg * 260} 170L${500 + sg * 232} 340Z`, GO, 6); void p }
  plate('M480 150L520 150L512 218L488 218Z', GO, 6)
  add(c, () => { glow(c, 500, 130, 70, '255,226,160', 0.8); glow(c, 500, 130, 24, '255,255,240', 1) })
  splat(c, 70, 200, 780, 150, 'rgba(170,240,250,.6)'); dust(c, 220, SC[0], 2)
})()
