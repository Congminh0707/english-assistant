// Bộ cọ mực cho art cấp cuối: nét thuôn, lông theo hướng, loang mực, tia sáng cộng màu. Dùng chung cho cả 5 thú cưng.
const INK = (() => {
  const S = 1000
  let seed = 4242
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const rr = (a, b) => a + (b - a) * rnd()
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
  const noise = (x, y) => { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g), m = (a, b, t) => a + (b - a) * t; return m(m(hash(i, j), hash(i + 1, j), u), m(hash(i, j + 1), hash(i + 1, j + 1), u), v) }
  const fbm = (x, y) => noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.28 + noise(x * 4.3, y * 4.3) * 0.12
  const NS = 'http://www.w3.org/2000/svg'
  // lấy mẫu một path SVG, qua phép biến đổi T(x,y)
  function sample(d, T = (x, y) => [x, y], step = 4) {
    const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d)
    const L = p.getTotalLength(), n = Math.max(2, Math.ceil(L / step)), out = []
    for (let i = 0; i <= n; i++) { const q = p.getPointAtLength((i / n) * L); out.push(T(q.x, q.y)) }
    return out
  }
  const poly = (pts) => { const p = new Path2D(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); p.closePath(); return p }
  const xform = (cx, cy, rot, s = 1) => { const c = Math.cos(rot), n = Math.sin(rot); return (x, y) => [cx + (x * c - y * n) * s, cy + (x * n + y * c) * s] }
  // nét cọ: rộng giữa, nhọn hai đầu, rung nhẹ theo nhiễu
  function brush(ctx, pts, w, color, o = {}) {
    const n = pts.length, L = [], R = [], a = o.head ?? 0.08, b = o.tail ?? 0.5, sd = rr(0, 90)
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), p = pts[i], q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)]
      const dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1
      const env = Math.min(1, t / a) * Math.min(1, (1 - t) / b) ** 0.8
      const wob = 0.65 + fbm(i * 0.05 + sd, 3) * 0.7
      const h = (w * env * wob) / 2
      L.push([p[0] - (dy / l) * h, p[1] + (dx / l) * h]); R.push([p[0] + (dy / l) * h, p[1] - (dx / l) * h])
    }
    ctx.fillStyle = color; ctx.fill(poly(L.concat(R.reverse())))
  }
  // một sợi lông: tam giác cong
  function hair(ctx, x, y, a, len, w, color) {
    const bend = rr(-0.3, 0.3), x2 = x + Math.cos(a + bend) * len, y2 = y + Math.sin(a + bend) * len, mx = x + Math.cos(a) * len * 0.55, my = y + Math.sin(a) * len * 0.55
    const nx = -Math.sin(a) * w, ny = Math.cos(a) * w
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + nx, y + ny); ctx.quadraticCurveTo(mx + nx * 0.6, my + ny * 0.6, x2, y2); ctx.quadraticCurveTo(mx - nx * 0.6, my - ny * 0.6, x - nx, y - ny); ctx.fill()
  }
  // phủ lông vào vùng: flow(x,y) trả góc, tone(x,y) trả màu
  function fur(ctx, region, box, n, flow, tone, len = [12, 34], w = [0.8, 2.2]) {
    let c = 0, t = 0
    while (c < n && t++ < n * 30) {
      const x = rr(box[0], box[2]), y = rr(box[1], box[3])
      if (!ctx.isPointInPath(region, x, y)) continue
      hair(ctx, x, y, flow(x, y) + rr(-0.2, 0.2), rr(len[0], len[1]), rr(w[0], w[1]), tone(x, y)); c++
    }
  }
  function ray(ctx, x, y, ang, len, o) {
    const n = Math.max(6, Math.floor(len / 8)), st = len / n
    ctx.beginPath(); ctx.moveTo(x, y); let a = ang
    for (let i = 0; i < n; i++) { a += (fbm(x * o.f + o.sx, y * o.f) - 0.5) * o.curl; x += Math.cos(a) * st; y += Math.sin(a) * st; ctx.lineTo(x, y) }
    ctx.strokeStyle = o.color; ctx.lineWidth = o.w; ctx.stroke()
  }
  const glow = (ctx, x, y, r, c, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2) }
  const add = (ctx, f) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; f(); ctx.restore() }
  // loang mực + vệt chảy
  function wash(ctx, n, box, color, blur, r = [30, 140]) { ctx.save(); ctx.filter = `blur(${blur}px)`; ctx.fillStyle = color; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.ellipse(rr(box[0], box[2]), rr(box[1], box[3]), rr(r[0], r[1]), rr(r[0], r[1]) * 0.6, rnd() * 3, 0, 7); ctx.fill() } ctx.restore() }
  function splat(ctx, n, cx, cy, spread, color) { ctx.fillStyle = color; for (let i = 0; i < n; i++) { const a = rnd() * 6.3, d = Math.pow(rnd(), 0.5) * spread; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.pow(rnd(), 3) * 7 + 0.5, 0, 7); ctx.fill() } }
  function drip(ctx, x, y, len, w, color) { const pts = []; for (let i = 0; i <= 30; i++) pts.push([x + Math.sin(i * 0.2) * 1.5, y + (i / 30) * len]); brush(ctx, pts, w, color, { head: 0.3, tail: 0.5 }) }
  // ánh sáng toả từ viền hình ra xung quanh
  function radiate(ctx, cx, cy, n, r0, r1, len, cols) {
    add(ctx, () => {
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.283, d = rr(r0, r1), c = cols[rnd() < 0.78 ? 0 : Math.floor(rnd() * cols.length)]
        ray(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.96, a + rr(-0.08, 0.08), rr(len[0], len[1]) * (rnd() < 0.08 ? 1.7 : 1), { f: 0.0034, sx: 2, curl: 0.09, color: `rgba(${c},${rr(0.016, 0.085)})`, w: rr(0.4, 1) })
      }
    })
  }
  function dust(ctx, n, c, big = 2.2) { add(ctx, () => { for (let i = 0; i < n; i++) { const r = Math.pow(rnd(), 6) * big + 0.35, x = rr(0, S), y = rr(0, S); ctx.fillStyle = `rgba(${c},${rr(0.3, 0.95)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); if (r > big * 0.6) glow(ctx, x, y, r * 6, c, 0.3) } }) }
  return { S, rnd, rr, fbm, sample, poly, xform, brush, hair, fur, ray, glow, add, wash, splat, drip, radiate, dust }
})()
