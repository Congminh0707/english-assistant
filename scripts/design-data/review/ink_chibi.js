// Chibi cấp cuối: đầu to tròn, thân nhỏ, mắt lớn, nhưng lông, nét mực và ánh sáng chi tiết. ?p=lupoc|kitsuc|dracoc
(function () {
  const { S, rnd, rr, sample, poly, brush, hair, fur, ray, glow, add, splat, radiate, dust } = INK
  const c = document.getElementById('c').getContext('2d')
  const pet = new URLSearchParams(location.search).get('p').replace('c', '').replace('kitsu', 'kitsu')
  const name = new URLSearchParams(location.search).get('p')
  const CFG = {
    lupoc: { bg: ['#1C2650', '#0B1030', '#04061A'], glow: '150,190,255', rays: ['232,240,255', '196,216,255', '170,238,255'], ink: '#10142C', f1: '#C7D2EA', f2: '#6C7AA8', dark: '#2A3158', pale: '#F6F8FF', iris: ['#EAFBFF', '#74CFF2', '#1F5FA8'], glowEye: '140,226,255', earIn: '#E9B7CC' },
    kitsuc: { bg: ['#54183A', '#200A24', '#0A040F'], glow: '255,140,70', rays: ['255,200,120', '255,226,170', '255,150,80'], ink: '#180B14', f1: '#F08A3A', f2: '#C25A22', dark: '#8A3A1A', pale: '#FFF6EA', iris: ['#FFF3B0', '#F7A92E', '#A8421C'], glowEye: '255,190,90', earIn: '#FFD9C0' },
    dracoc: { bg: ['#3A3414', '#0B2A30', '#030F16'], glow: '255,180,80', rays: ['255,200,110', '255,232,170', '120,240,210'], ink: '#05221F', f1: '#2BAE8C', f2: '#148069', dark: '#0E5A52', pale: '#FFF2CC', iris: ['#FFF3B0', '#F7A92E', '#8A2C14'], glowEye: '255,200,90', earIn: '#5FE0B8' }
  }
  const K = CFG[name], I = K.ink
  const g = c.createRadialGradient(500, 460, 60, 500, 500, 760); g.addColorStop(0, K.bg[0]); g.addColorStop(0.6, K.bg[1]); g.addColorStop(1, K.bg[2]); c.fillStyle = g; c.fillRect(0, 0, S, S)
  add(c, () => { glow(c, 500, 470, 540, K.glow, 0.42); glow(c, 500, 440, 320, K.rays[0], 0.3) })
  radiate(c, 500, 500, 13000, 230, 330, [70, 280], K.rays)
  radiate(c, 500, 500, 9000, 200, 290, [40, 150], [K.rays[0]])

  const flow = (x, y) => Math.atan2(y - 300, x - 500)
  const tuft = 'M500 232C604 232 696 292 722 386L784 366L746 426L816 438L752 480L796 530L722 526C686 596 592 632 500 632C408 632 314 596 278 526L204 530L248 480L184 438L254 426L216 366L278 386C304 292 396 232 500 232Z'
  const round = 'M500 236C620 236 724 310 734 430C742 560 620 636 500 636C380 636 258 560 266 430C276 310 380 236 500 236Z'

  // phụ kiện phía sau
  if (name === 'lupoc') {
    const P = [[620, 860], [740, 850], [840, 760], [860, 620], [800, 500]], sp = sample(`M${P[0]}C${P[1]} ${P[2]} ${P[3]}S800 520 770 480`)
    for (let i = 0; i < 4200; i++) { const f = rnd(), k = Math.min(sp.length - 2, Math.floor(f * sp.length)), a = Math.atan2(sp[k + 1][1] - sp[k][1], sp[k + 1][0] - sp[k][0]), w = 66 * Math.sin(Math.min(1, f * 1.1 + 0.1) * 3.14) ** 0.7 * (rnd() * 2 - 1); hair(c, sp[k][0] - Math.sin(a) * w, sp[k][1] + Math.cos(a) * w, a + w * 0.005, rr(30, 84), rr(0.8, 2.4), f > 0.8 ? K.pale : rnd() < 0.5 ? K.f1 : rnd() < 0.6 ? K.pale : K.f2) }
  }
  if (name === 'kitsuc') {
    for (let t = 0; t < 9; t++) {
      const a = -3.5 + t * 0.48, L = 610 - Math.abs(t - 4) * 22, b = a + (t < 4 ? 0.2 : t > 4 ? -0.2 : 0), O = [500, 800]
      const sp = sample(`M${O[0]} ${O[1]}Q${O[0] + Math.cos(a) * L * 0.6} ${O[1] + Math.sin(a) * L * 0.6} ${O[0] + Math.cos(b) * L} ${O[1] + Math.sin(b) * L}`), T = sp.length
      for (let i = 0; i < 1500; i++) { const f = rnd(), k = Math.min(T - 2, Math.floor(f * T)), an = Math.atan2(sp[k + 1][1] - sp[k][1], sp[k + 1][0] - sp[k][0]), w = 44 * Math.sin(Math.min(1, f * 1.08 + 0.1) * 3.14) ** 0.7 * (rnd() * 2 - 1); hair(c, sp[k][0] - Math.sin(an) * w, sp[k][1] + Math.cos(an) * w, an + w * 0.006, rr(28, 70), rr(0.8, 2.2), f > 0.76 ? K.pale : f > 0.58 ? '#FFC46E' : rnd() < 0.7 ? K.f1 : K.f2) }
      const tip = sp[T - 1]; add(c, () => { glow(c, tip[0], tip[1], 60, '120,170,255', 0.85); glow(c, tip[0], tip[1], 18, '240,248,255', 1) })
    }
  }
  if (name === 'dracoc') {
    for (const sg of [-1, 1]) {
      const X = (d) => 500 + sg * d, Sh = [X(90), 700], Wr = [X(330), 270], Tp = [[X(490), 160], [X(496), 420], [X(430), 610], [X(250), 770]]
      const P = new Path2D(); P.moveTo(...Sh); P.quadraticCurveTo(X(190), 420, ...Wr); P.quadraticCurveTo(X(420), 170, ...Tp[0]); P.quadraticCurveTo(X(410), 300, ...Tp[1]); P.quadraticCurveTo(X(360), 490, ...Tp[2]); P.quadraticCurveTo(X(280), 590, ...Tp[3]); P.quadraticCurveTo(X(170), 720, ...Sh); P.closePath()
      const gr = c.createRadialGradient(Wr[0], Wr[1], 30, Wr[0], Wr[1], 540); gr.addColorStop(0, '#F0AE48'); gr.addColorStop(0.5, '#B44A22'); gr.addColorStop(1, '#3A101C'); c.fillStyle = gr; c.fill(P)
      add(c, () => { c.save(); c.clip(P); for (let i = 0; i < 5000; i++) ray(c, Wr[0] + rr(-16, 16), Wr[1] + rr(-16, 16), rnd() * 2.3 + (sg > 0 ? -0.6 : 1.45), rr(160, 560), { f: 0.003, sx: sg + 3, curl: 0.1, color: `rgba(255,190,90,${rr(0.012, 0.06)})`, w: 0.7 }); c.restore() })
      c.strokeStyle = I; c.lineWidth = 6; c.stroke(P)
      const bone = (a, k, b, w) => { const p = sample(`M${a[0]} ${a[1]}Q${k[0]} ${k[1]} ${b[0]} ${b[1]}`); brush(c, p, w + 5, I, { head: 0.02, tail: 0.25 }); brush(c, p, w, '#F2C25E', { head: 0.02, tail: 0.25 }) }
      bone(Sh, [X(190), 420], Wr, 20); for (const [q, k] of [[Tp[0], [X(420), 170]], [Tp[1], [X(400), 300]], [Tp[2], [X(350), 430]], [Tp[3], [X(270), 530]]]) bone(Wr, k, q, 10)
    }
    const tl = sample('M600 850C720 890 840 840 850 730C856 690 840 660 810 640'); brush(c, tl, 80, K.dark, { head: 0.02, tail: 0.95 })
    for (let i = 8; i < tl.length - 8; i += 16) { const [x, y] = tl[i]; c.fillStyle = '#F2C25E'; c.beginPath(); c.moveTo(x - 11, y - 6); c.lineTo(x + 8, y - 40); c.lineTo(x + 16, y - 2); c.fill() }
  }

  // thân nhỏ
  const bodyD = 'M396 590C340 650 326 760 348 846C356 888 382 906 414 906L586 906C618 906 644 888 652 846C674 760 660 650 604 590Z'
  const body = poly(sample(bodyD)); c.fillStyle = K.f1; c.fill(body)
  if (name !== 'dracoc') fur(c, body, [320, 580, 680, 910], 6500, flow, () => (rnd() < 0.55 ? K.f1 : rnd() < 0.6 ? K.f2 : K.dark), [14, 36], [0.9, 2.4])
  else { for (let y = 600; y < 910; y += 18) for (let x = 330 + (y % 36 ? 12 : 0); x < 680; x += 24) if (c.isPointInPath(body, x, y)) { c.fillStyle = x < 430 || x > 570 ? K.f2 : K.f1; c.beginPath(); c.arc(x, y, 15, 0.1, 3.24); c.closePath(); c.fill(); c.strokeStyle = 'rgba(5,34,31,.5)'; c.lineWidth = 1.2; c.stroke() } }
  const bib = poly(sample('M426 610C400 680 424 760 462 800L490 770L512 816L540 770L570 800C600 750 610 670 574 610Z')); c.fillStyle = K.pale; c.fill(bib)
  if (name !== 'dracoc') fur(c, bib, [400, 600, 610, 820], 2000, flow, () => (rnd() < 0.85 ? K.pale : K.f1), [14, 34], [0.8, 2])
  else for (let y = 640; y < 800; y += 32) brush(c, sample(`M430 ${y}Q500 ${y + 20} 572 ${y}`), 5, 'rgba(160,120,50,.8)', { tail: 0.3 })
  brush(c, sample(bodyD), 7, I, { head: 0.005, tail: 0.005 })
  if (name === 'lupoc') for (let i = 0; i < 150; i++) {
    const a = rr(0.25, 2.9), r0 = rr(120, 190), L = rr(70, 150), x = 500 + Math.cos(a) * r0 * 1.2, y = 610 + Math.sin(a) * r0 * 0.34
    brush(c, sample(`M${x} ${y}q${Math.cos(a) * L * 0.4} ${L * 0.5} ${Math.cos(a) * L * 0.9} ${L}`), rr(5, 13), i % 4 === 0 ? K.dark : i % 3 === 0 ? K.f1 : K.pale, { head: 0.1, tail: 0.85 })
  }
  // bàn chân
  for (const x of [442, 558]) {
    const col = name === 'kitsuc' ? I : name === 'dracoc' ? K.f2 : K.pale
    const paw = sample(`M${x - 56} 908Q${x - 50} 858 ${x} 856Q${x + 50} 858 ${x + 56} 908Q${x} 926 ${x - 56} 908Z`); c.fillStyle = col; c.fill(poly(paw)); brush(c, paw, 7, I, { head: 0.01, tail: 0.01 })
    for (let k = -1; k <= 1; k++) brush(c, [[x + k * 22, 888], [x + k * 23, 918]], 5, name === 'dracoc' ? K.pale : name === 'kitsuc' ? '#5A3A4A' : I, { head: 0.2, tail: 0.5 })
  }

  // tai hoặc sừng
  const ears = name === 'dracoc'
    ? [['M340 300Q250 170 130 150Q200 230 270 330Z', '#F2C25E'], ['M660 300Q750 170 870 150Q800 230 730 330Z', '#F2C25E'], ['M410 262Q370 150 300 90Q320 180 356 280Z', '#FFE9A8'], ['M590 262Q630 150 700 90Q680 180 644 280Z', '#FFE9A8']]
    : [['M300 372Q262 230 250 120Q370 150 460 256Z', K.f2], ['M700 372Q738 230 750 120Q630 150 540 256Z', K.f2]]
  for (const [d, col] of ears) { const p = sample(d); c.fillStyle = col; c.fill(poly(p)); brush(c, p, 7, I, { head: 0.005, tail: 0.005 }) }
  if (name !== 'dracoc') for (const sg of [-1, 1]) {
    const X = (d) => 500 + sg * d, ear = poly(sample(`M${X(176)} 340Q${X(222)} 240 ${X(232)} 160Q${X(140)} 190 ${X(78)} 268Z`)); c.fillStyle = '#231228'; c.fill(ear)
    fur(c, ear, [150, 120, 850, 340], 600, () => (sg < 0 ? 0.9 : 2.2), () => (rnd() < 0.7 ? K.earIn : K.pale), [10, 26], [0.6, 1.4])
    brush(c, sample(`M${X(250)} 128Q${X(236)} 170 ${X(214)} 204`), 22, I, { head: 0.02, tail: 0.8 })
  }

  // đầu
  const headD = name === 'dracoc' ? round : tuft, headP = sample(headD, undefined, 3), head = poly(headP)
  c.fillStyle = K.f1; c.fill(head)
  if (name === 'dracoc') {
    for (let y = 250; y < 640; y += 18) for (let x = 260 + (y % 36 ? 12 : 0); x < 744; x += 24) if (c.isPointInPath(head, x, y)) { c.fillStyle = y < 340 ? '#5FE0B8' : K.f1; c.beginPath(); c.arc(x, y, 15, 0.1, 3.24); c.closePath(); c.fill(); c.strokeStyle = 'rgba(5,34,31,.45)'; c.lineWidth = 1.2; c.stroke() }
    const sn = sample('M500 500C400 500 340 540 356 590C372 636 628 636 644 590C660 540 600 500 500 500Z'); c.fillStyle = K.pale; c.fill(poly(sn)); brush(c, sn, 6, I, { head: 0.01, tail: 0.01 })
    for (const x of [462, 538]) { c.fillStyle = I; c.beginPath(); c.ellipse(x, 544, 9, 6, 0, 0, 7); c.fill() }
    brush(c, sample('M420 586Q500 620 580 586'), 7, I, { tail: 0.15 }); c.fillStyle = '#FFFDF2'; for (const x of [452, 548]) { c.beginPath(); c.moveTo(x - 9, 596); c.lineTo(x, 620); c.lineTo(x + 9, 596); c.fill() }
    for (const sg of [-1, 1]) { const f = sample(`M${500 + sg * 226} 400Q${500 + sg * 330} 380 ${500 + sg * 370} 440Q${500 + sg * 310} 450 ${500 + sg * 300} 500Q${500 + sg * 260} 480 ${500 + sg * 232} 490Z`); c.fillStyle = '#5FE0B8'; c.fill(poly(f)); brush(c, f, 6, I, { head: 0.01, tail: 0.01 }) }
  } else {
    const mask = poly(sample('M270 486C330 396 430 398 500 476C570 398 670 398 730 486C700 590 600 636 500 636C400 636 300 590 270 486Z'))
    fur(c, head, [190, 230, 810, 640], 16000, flow, (x, y) => (c.isPointInPath(mask, x, y) ? (rnd() < 0.88 ? K.pale : K.f1) : rnd() < 0.5 ? K.f1 : rnd() < 0.55 ? K.f2 : K.dark), [12, 32], [0.7, 1.9])
    fur(c, poly(sample('M500 244C470 300 474 380 500 440C526 380 530 300 500 244Z')), [460, 240, 540, 450], 900, () => 1.57, () => (rnd() < 0.7 ? K.dark : K.f2), [12, 30], [1, 2.4])
    if (name === 'lupoc') { const sn = sample('M500 486C440 486 396 530 412 574C430 612 570 612 588 574C604 530 560 486 500 486Z'); c.fillStyle = K.pale; c.fill(poly(sn)); brush(c, sample('M412 574C430 612 570 612 588 574'), 5, 'rgba(16,20,44,.5)', { tail: 0.2 }); for (const [x, y] of [[446, 556], [460, 568], [554, 556], [540, 568]]) { c.fillStyle = I; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill() } }
    c.fillStyle = '#17101E'; c.beginPath(); c.moveTo(482, 524); c.quadraticCurveTo(500, 514, 518, 524); c.quadraticCurveTo(512, 548, 500, 552); c.quadraticCurveTo(488, 548, 482, 524); c.fill()
    brush(c, sample('M500 552V566'), 4, I); brush(c, sample('M462 572Q482 592 500 566Q518 592 538 572'), 5, I, { head: 0.08, tail: 0.1 }); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(528, 580); c.lineTo(534, 600); c.lineTo(542, 576); c.fill()
  }
  brush(c, headP, 8, I, { head: 0.004, tail: 0.004 })
  // mắt to, mí mực xếch nhẹ
  for (const sg of [-1, 1]) {
    const x = 500 + sg * 104, y = 462
    add(c, () => glow(c, x, y, 100, K.glowEye, 0.42))
    const e = sample(`M${x - 60} ${y + 6}C${x - 40} ${y - 56} ${x + 40} ${y - 56} ${x + 60} ${y + 2}C${x + 54} ${y + 62} ${x - 54} ${y + 66} ${x - 60} ${y + 6}Z`), ep = poly(e)
    c.fillStyle = '#10121F'; c.fill(ep)
    c.save(); c.clip(ep); const ir = c.createRadialGradient(x, y + 14, 4, x, y + 14, 50); ir.addColorStop(0, K.iris[0]); ir.addColorStop(0.5, K.iris[1]); ir.addColorStop(1, K.iris[2]); c.fillStyle = ir; c.beginPath(); c.arc(x, y + 12, 48, 0, 7); c.fill(); c.fillStyle = '#0A0C1E'; c.beginPath(); c.arc(x, y + 12, 24, 0, 7); c.fill(); c.restore()
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 18, y - 16, 15, 0, 7); c.fill(); c.beginPath(); c.arc(x + 18, y + 26, 7, 0, 7); c.fill()
    brush(c, sample(`M${x - sg * 74} ${y + sg * 0 - (sg > 0 ? -10 : -10)}C${x - sg * 40} ${y - 64} ${x + sg * 40} ${y - 62} ${x + sg * 80} ${y - 24}`), 15, I, { head: 0.1, tail: 0.3 })
    c.fillStyle = 'rgba(255,150,170,.45)'; c.beginPath(); c.ellipse(500 + sg * 170, 552, 34, 16, 0, 0, 7); c.fill()
  }
  // dấu thần thoại
  if (name === 'lupoc') { add(c, () => glow(c, 500, 332, 54, '255,238,190', 0.6)); c.fillStyle = '#FFF4CC'; c.beginPath(); c.arc(500, 332, 19, 0.6, 5.2); c.arc(509, 329, 15, 5.1, 0.7, true); c.fill() }
  if (name === 'kitsuc') { for (const sg of [-1, 1]) { brush(c, sample(`M${500 + sg * 64} 392Q${500 + sg * 130} 360 ${500 + sg * 186} 384`), 8, '#C7321F', { tail: 0.6 }); brush(c, sample(`M${500 + sg * 136} 556Q${500 + sg * 176} 566 ${500 + sg * 214} 548`), 7, '#C7321F', { tail: 0.6 }) } c.fillStyle = '#C7321F'; c.beginPath(); c.arc(500, 356, 11, 0, 7); c.fill() }
  if (name === 'dracoc') { const pr = sample('M416 262L410 196L456 232L500 176L544 232L590 196L584 262Z'); c.fillStyle = '#F2C25E'; c.fill(poly(pr)); brush(c, pr, 6, I, { head: 0.01, tail: 0.01 }); c.fillStyle = '#E2583E'; c.beginPath(); c.arc(500, 232, 13, 0, 7); c.fill() }
  add(c, () => { for (let i = 0; i < headP.length; i += 2) { const [x, y] = headP[i], a = Math.atan2(y - 440, x - 500); ray(c, x, y, a + rr(-0.3, 0.3), rr(14, 62), { f: 0.01, sx: 4, curl: 0.2, color: `rgba(${K.rays[0]},${rr(0.08, 0.3)})`, w: 0.7 }) } })
  splat(c, 70, 180, 720, 150, `rgba(${K.rays[0]},.6)`); dust(c, 240, K.rays[0], 2)
  void pet
})()
