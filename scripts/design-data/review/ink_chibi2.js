// Mộc Thần và Thiên Cơ bản chibi mềm, sạch: ?p=bic|roboc
(function () {
  const { S, rnd, rr, sample, poly, brush, ray, glow, add, radiate, dust } = INK
  const c = document.getElementById('c').getContext('2d')
  const name = new URLSearchParams(location.search).get('p')
  const eye = (x, y, rx, ry, cols, gl) => {
    add(c, () => glow(c, x, y, rx * 1.9, gl, 0.4))
    c.fillStyle = '#12201F'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill()
    const ir = c.createRadialGradient(x, y + ry * 0.45, 3, x, y + ry * 0.3, rx * 0.95); ir.addColorStop(0, cols[0]); ir.addColorStop(0.6, cols[1]); ir.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = ir; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill()
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x - rx * 0.32, y - ry * 0.36, rx * 0.34, 0, 7); c.fill(); c.beginPath(); c.arc(x + rx * 0.34, y + ry * 0.34, rx * 0.15, 0, 7); c.fill()
  }

  if (name === 'bic') {
    const I = '#134A3C'
    const g = c.createRadialGradient(500, 440, 60, 500, 500, 760); g.addColorStop(0, '#2F9C7C'); g.addColorStop(0.55, '#0F5240'); g.addColorStop(1, '#062A21'); c.fillStyle = g; c.fillRect(0, 0, S, S)
    add(c, () => { glow(c, 500, 300, 420, '240,255,190', 0.42); glow(c, 500, 560, 520, '120,240,190', 0.3) })
    radiate(c, 500, 480, 9000, 240, 330, [60, 240], ['220,255,200', '255,240,170', '170,255,220'])
    // đồi mờ xa
    c.fillStyle = 'rgba(8,50,40,.8)'; c.beginPath(); c.moveTo(0, S); c.quadraticCurveTo(240, 780, 500, 880); c.quadraticCurveTo(760, 780, S, 900); c.lineTo(S, S); c.fill()
    // đài sen cao
    for (const [n, sc, spread] of [[7, 1.16, 1.25], [6, 0.92, 0.95]]) for (let i = 0; i < n; i++) {
      const a = (-0.5 + i / (n - 1)) * 2 * spread
      const pet = (x, y) => { const cs = Math.cos(a), sn = Math.sin(a); return [500 + (x * cs - y * sn) * sc * 1.25, 950 + (x * sn + y * cs) * sc * 0.72] }
      const pts = sample('M0 0C-92 -70 -70 -170 0 -250C70 -170 92 -70 0 0Z', pet, 3)
      const gr = c.createLinearGradient(500, 950, ...pet(0, -250)); gr.addColorStop(0, '#F27FA8'); gr.addColorStop(1, '#FFE6EE'); c.fillStyle = gr; c.fill(poly(pts)); brush(c, pts, 5, '#B94A7A', { head: 0.01, tail: 0.01 })
    }
    // lá tai
    for (const sg of [-1, 1]) {
      const X = (d) => 500 + sg * d, lf = sample(`M${X(216)} 430C${X(300)} 340 ${X(410)} 340 ${X(446)} 410C${X(400)} 500 ${X(290)} 520 ${X(216)} 470Z`)
      const gr = c.createLinearGradient(X(216), 430, X(446), 410); gr.addColorStop(0, '#3FB98A'); gr.addColorStop(1, '#A6EFB4'); c.fillStyle = gr; c.fill(poly(lf)); brush(c, lf, 6, I, { head: 0.01, tail: 0.01 })
      brush(c, sample(`M${X(226)} 450Q${X(330)} 420 ${X(436)} 412`), 4, I, { tail: 0.6 }); for (const k of [270, 320, 370]) brush(c, sample(`M${X(k)} ${440 - (k - 270) * 0.14}Q${X(k + 22)} ${404 - (k - 270) * 0.12} ${X(k + 36)} ${392 - (k - 270) * 0.06}`), 3, I)
    }
    // thân quả lê liền đầu
    const bd = 'M500 236C646 236 744 336 744 468C744 556 696 620 640 648C690 704 694 800 640 852C590 894 410 894 360 852C306 800 310 704 360 648C304 620 256 556 256 468C256 336 354 236 500 236Z', bp = sample(bd, undefined, 3)
    const bg2 = c.createLinearGradient(380, 240, 620, 880); bg2.addColorStop(0, '#CFF7E8'); bg2.addColorStop(0.55, '#86E0C8'); bg2.addColorStop(1, '#4DBFA6'); c.fillStyle = bg2; c.fill(poly(bp))
    const belly = sample('M500 648C430 648 392 700 400 770C410 846 590 846 600 770C608 700 570 648 500 648Z'); c.fillStyle = '#F2FFF6'; c.fill(poly(belly))
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(390, 320, 66, 26, -0.55, 0, 7); c.fill()
    brush(c, bp, 7, I, { head: 0.004, tail: 0.004 })
    for (const sg of [-1, 1]) { const a = sample(`M${500 + sg * 156} 690C${500 + sg * 210} 700 ${500 + sg * 218} 760 ${500 + sg * 176} 780C${500 + sg * 150} 780 ${500 + sg * 142} 740 ${500 + sg * 144} 716`); c.fillStyle = '#6FD2BC'; c.fill(poly(a)); brush(c, a, 6, I, { tail: 0.15 }); const f = sample(`M${500 + sg * 130} 888Q${500 + sg * 62} 900 ${500 + sg * 60} 862Q${500 + sg * 130} 830 ${500 + sg * 180} 862Q${500 + sg * 180} 890 ${500 + sg * 130} 888Z`); c.fillStyle = '#6FD2BC'; c.fill(poly(f)); brush(c, f, 6, I, { head: 0.01, tail: 0.01 }) }
    // mặt
    for (const sg of [-1, 1]) { eye(500 + sg * 100, 470, 50, 60, ['#E9FFD6', '#3FC58C'], '150,255,190'); c.fillStyle = 'rgba(255,140,165,.6)'; c.beginPath(); c.ellipse(500 + sg * 168, 546, 36, 19, 0, 0, 7); c.fill() }
    brush(c, sample('M470 546Q500 576 530 546'), 7, I, { head: 0.1, tail: 0.1 })
    // chồi cây nhỏ trên đầu, tán tròn lấp lánh
    brush(c, sample('M500 244C494 200 506 170 500 118'), 18, '#7A5230', { head: 0.02, tail: 0.1 })
    for (const sg of [-1, 1]) brush(c, sample(`M500 186Q${500 + sg * 44} 160 ${500 + sg * 74} 132`), 10, '#7A5230', { head: 0.02, tail: 0.2 })
    for (let i = 0; i < 90; i++) { const a = rnd() * 6.3, d = Math.sqrt(rnd()) * 96, x = 500 + Math.cos(a) * d * 1.3, y = 102 + Math.sin(a) * d * 0.62; c.fillStyle = ['#2FA574', '#57C985', '#8EE39A', '#C6F2A2'][Math.floor(rnd() * 4)]; c.beginPath(); c.ellipse(x, y, rr(17, 26), rr(9, 14), rnd() * 3, 0, 7); c.fill() }
    add(c, () => { for (let i = 0; i < 26; i++) glow(c, 500 + rr(-114, 114), 102 + rr(-50, 50), rr(8, 20), rnd() < 0.5 ? '255,240,170' : '255,190,210', rr(0.4, 0.8)) })
    // vòng hoa trên trán
    for (let i = 0; i < 9; i++) { const a = -2.5 + i * 0.235, x = 500 + Math.cos(a) * 208, y = 462 + Math.sin(a) * 196, col = ['#FFB3C9', '#FFE08A', '#FFFFFF'][i % 3]; for (let k = 0; k < 5; k++) { const b = k * 1.257; c.fillStyle = col; c.beginPath(); c.arc(x + Math.cos(b) * 13, y + Math.sin(b) * 13, 10, 0, 7); c.fill() } c.fillStyle = '#F2A83C'; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill() }
    add(c, () => { for (let i = 0; i < 70; i++) { const x = rr(30, 970), y = rr(120, 900); if (Math.abs(x - 500) < 300 && y < 860) continue; glow(c, x, y, rr(9, 22), '230,255,170', rr(0.3, 0.75)) } })
    for (let i = 0; i < 40; i++) { const x = rr(40, 960), y = rr(160, 900); if (Math.abs(x - 500) < 300 && y < 880) continue; c.fillStyle = 'rgba(255,190,210,.85)'; c.beginPath(); c.ellipse(x, y, 9, 5, rnd() * 3, 0, 7); c.fill() }
    dust(c, 60, '230,255,200', 1.6)
  }

  if (name === 'roboc') {
    const g = c.createRadialGradient(500, 440, 60, 500, 500, 780); g.addColorStop(0, '#16224F'); g.addColorStop(0.6, '#0A0F2C'); g.addColorStop(1, '#04061A'); c.fillStyle = g; c.fillRect(0, 0, S, S)
    add(c, () => { glow(c, 500, 440, 520, '70,200,255', 0.3); glow(c, 720, 240, 340, '190,80,255', 0.16); glow(c, 260, 720, 320, '60,240,220', 0.14) })
    // sàn lưới phối cảnh
    add(c, () => { c.lineWidth = 1; for (let i = -14; i <= 14; i++) { c.strokeStyle = `rgba(90,220,255,${0.3 - Math.abs(i) * 0.016})`; c.beginPath(); c.moveTo(500 + i * 18, 790); c.lineTo(500 + i * 170, 1000); c.stroke() } for (let k = 0; k < 8; k++) { const y = 790 + 210 * (k / 8) ** 1.8; c.strokeStyle = `rgba(90,220,255,${0.12 + k * 0.03})`; c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke() } })
    dust(c, 170, '200,232,255', 1.6)
    // vòng HUD
    add(c, () => { for (const [r, a0, a1, w, col] of [[400, -2.7, -0.4, 3, '110,230,255'], [424, 0.5, 2.6, 2, '110,230,255'], [440, -1, 0.2, 5, '200,110,255'], [372, 2.8, 3.9, 5, '200,110,255']]) { c.strokeStyle = `rgba(${col},.75)`; c.lineWidth = w; c.beginPath(); c.arc(500, 470, r, a0, a1); c.stroke() } for (let i = 0; i < 72; i++) { const a = (i / 72) * 6.283, l = i % 6 ? 8 : 16; c.strokeStyle = 'rgba(110,230,255,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(500 + Math.cos(a) * 456, 470 + Math.sin(a) * 456); c.lineTo(500 + Math.cos(a) * (456 + l), 470 + Math.sin(a) * (456 + l)); c.stroke() } })
    // cánh năng lượng: lá phẳng góc cạnh
    for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) {
      const X = (d) => 500 + sg * d, y0 = 560 - i * 66, L = 330 - i * 26, P = new Path2D()
      P.moveTo(X(190), y0 + 30); P.lineTo(X(190 + L), y0 - 96 - i * 16); P.lineTo(X(170 + L * 0.8), y0 - 30 - i * 8); P.lineTo(X(200), y0 + 66); P.closePath()
      const gr = c.createLinearGradient(X(190), y0, X(190 + L), y0 - 96); gr.addColorStop(0, 'rgba(90,230,255,.75)'); gr.addColorStop(1, 'rgba(190,100,255,.2)')
      add(c, () => { c.fillStyle = gr; c.fill(P); c.strokeStyle = 'rgba(190,245,255,.9)'; c.lineWidth = 1.8; c.stroke(P) })
    }
    // chùm đẩy dưới thân
    add(c, () => { const gr = c.createLinearGradient(0, 800, 0, 960); gr.addColorStop(0, 'rgba(110,235,255,.75)'); gr.addColorStop(1, 'rgba(110,235,255,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(440, 800); c.lineTo(560, 800); c.lineTo(610, 960); c.lineTo(390, 960); c.fill(); for (const [ry, a] of [[16, 0.8], [20, 0.5], [24, 0.3]]) { c.strokeStyle = `rgba(150,240,255,${a})`; c.lineWidth = 2.4; c.beginPath(); c.ellipse(500, 862 + (ry - 16) * 7, 96 + (ry - 16) * 16, ry, 0, 0, 7); c.stroke() } })
    const pearl = (x0, y0, x1, y1) => { const gr = c.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.6, '#E6ECF6'); gr.addColorStop(1, '#AEBBD2'); return gr }
    // thân viên nang
    const bd = sample('M500 640C590 640 630 690 620 750C608 816 560 836 500 836C440 836 392 816 380 750C370 690 410 640 500 640Z', undefined, 3)
    c.fillStyle = pearl(420, 640, 590, 836); c.fill(poly(bd))
    c.fillStyle = '#0D1740'; c.beginPath(); c.roundRect(444, 688, 112, 86, 30); c.fill(); add(c, () => { glow(c, 500, 730, 60, '100,235,255', 0.8); c.strokeStyle = '#7CF0FF'; c.lineWidth = 6; c.beginPath(); c.arc(500, 730, 24, 0, 7); c.stroke(); glow(c, 500, 730, 14, '240,255,255', 1) })
    // tay rời bay
    for (const sg of [-1, 1]) {
      const x = 500 + sg * 186, y = 724
      const h = sample(`M${x} ${y - 58}C${x + 44} ${y - 58} ${x + 50} ${y + 50} ${x} ${y + 58}C${x - 50} ${y + 50} ${x - 44} ${y - 58} ${x} ${y - 58}Z`, undefined, 3)
      c.fillStyle = pearl(x - 40, y - 50, x + 40, y + 50); c.fill(poly(h))
      c.strokeStyle = '#1E9FD0'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 30, y - 8); c.quadraticCurveTo(x, y + 8, x + 30, y - 8); c.stroke()
    }
    // đầu trứng
    const hd = sample('M500 196C650 196 748 300 748 424C748 552 640 618 500 618C360 618 252 552 252 424C252 300 350 196 500 196Z', undefined, 3)
    c.fillStyle = pearl(340, 200, 660, 620); c.fill(poly(hd))
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(380, 262, 72, 24, -0.5, 0, 7); c.fill()
    // đĩa tai phát sáng
    for (const sg of [-1, 1]) { const x = 500 + sg * 246, y = 424; c.fillStyle = '#C9D4E8'; c.beginPath(); c.ellipse(x, y, 26, 60, 0, 0, 7); c.fill(); add(c, () => { c.strokeStyle = '#7CF0FF'; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y, 13, 38, 0, 0, 7); c.stroke(); glow(c, x, y, 54, '100,235,255', 0.4) }) }
    // đường nối sáng trên vỏ
    c.strokeStyle = '#1E9FD0'; c.lineWidth = 3; c.beginPath(); c.moveTo(500, 196); c.lineTo(500, 262); c.stroke(); c.beginPath(); c.arc(500, 276, 11, 0, 7); c.stroke()
    // kính mặt liền, mắt LED tròn dễ thương
    const vd = sample('M500 300C610 300 684 332 690 424C694 512 610 560 500 560C390 560 306 512 310 424C316 332 390 300 500 300Z', undefined, 3), vp = poly(vd)
    const vg = c.createLinearGradient(500, 300, 500, 560); vg.addColorStop(0, '#0B1336'); vg.addColorStop(1, '#16255E'); c.fillStyle = vg; c.fill(vp)
    c.save(); c.clip(vp); c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.moveTo(310, 300); c.lineTo(470, 300); c.lineTo(330, 560); c.lineTo(250, 560); c.fill(); c.restore()
    for (const sg of [-1, 1]) { const x = 500 + sg * 98, y = 424; add(c, () => { glow(c, x, y, 96, '100,235,255', 0.75); c.fillStyle = '#7CF0FF'; c.beginPath(); c.ellipse(x, y, 40, 48, 0, 0, 7); c.fill() }); c.fillStyle = '#EFFFFF'; c.beginPath(); c.ellipse(x, y, 25, 32, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 12, y - 16, 10, 0, 7); c.fill(); add(c, () => { c.fillStyle = 'rgba(255,110,190,.55)'; c.beginPath(); c.ellipse(500 + sg * 150, 498, 28, 12, 0, 0, 7); c.fill() }) }
    add(c, () => { c.strokeStyle = '#7CF0FF'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(468, 498); c.quadraticCurveTo(500, 526, 532, 498); c.stroke() })
    // vòng hào quang bay trên đầu
    add(c, () => { glow(c, 500, 150, 150, '190,110,255', 0.28); for (const [w, col, a] of [[14, '110,230,255', 0.25], [6, '170,245,255', 0.95]]) { c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = w; c.beginPath(); c.ellipse(500, 150, 152, 34, 0, 0, 7); c.stroke() } })
  }
})()
