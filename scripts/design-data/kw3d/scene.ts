import { mountVnMap3D } from './map3dx'
import { geoLayout, smoothSegments } from '@shared/kidsWorldLayout'
import { VN_SIZE, isVnLand, projectVn } from '@shared/vnMap'
import { TERRAIN_UNIT } from '@shared/vnHeightfield'
import { PLACES } from './places'
import MERGED from '../vn_merged.json'

const q = new URLSearchParams(location.search)
const W = +(q.get('w') ?? 1600)
const H = +(q.get('h') ?? 900)
const places = (PLACES as any[]).sort((a, b) => a.order - b.order)
const C = Math.cos((16 * Math.PI) / 180)
const pxToStage = (x: number, y: number) => projectVn(102 + x / (C * 66), 23.5 - y / 66)

interface Sky {
  top: string
  bot: string
  mul: [number, number, number]
  add: [number, number, number]
  sun: [number, number]
  hemi: number
  fog: number
  stars: number
  moon: boolean
  cloud?: number
}
const SKY: Record<string, Sky> = {
  dawn: { top: '#FFB59A', bot: '#FFE9B8', mul: [1.08, 1.0, 1.02], add: [0.07, 0.02, 0.03], sun: [0xffc8a0 as any, 1.8], hemi: 1.1, fog: 0xffd9c0, stars: 0.25, moon: false },
  noon: { top: '#8FD3F4', bot: '#D6F0FB', mul: [1, 1, 1], add: [0, 0, 0], sun: [0xfff0d8 as any, 2.5], hemi: 1.35, fog: 0xcfe9fb, stars: 0, moon: false },
  dusk: { top: '#6B5BA8', bot: '#FFB07A', mul: [1.12, 0.98, 1.05], add: [0.09, 0.015, 0.04], sun: [0xff9a6a as any, 1.7], hemi: 0.95, fog: 0xffc6a0, stars: 0.35, moon: false },
  night: { top: '#0B1230', bot: '#2C3C7A', mul: [0.42, 0.5, 0.82], add: [0.01, 0.02, 0.07], sun: [0x8fa6ff as any, 0.7], hemi: 0.75, fog: 0x2a3768, stars: 1, moon: true },
  rain: { top: '#7F8FA0', bot: '#C5CFD8', mul: [0.8, 0.86, 0.93], add: [0, 0, 0.01], sun: [0xdde6ee as any, 1.2], hemi: 1.0, fog: 0xb9c6d2, stars: 0, moon: false, cloud: 0x7d8895 },
  snow: { top: '#C9DAE8', bot: '#F0F6FB', mul: [0.96, 0.99, 1.06], add: [0.02, 0.03, 0.05], sun: [0xf2f6ff as any, 1.6], hemi: 1.25, fog: 0xe3edf5, stars: 0, moon: false, cloud: 0xdfe6ee },
  fog: { top: '#B9C7C9', bot: '#E5ECEA', mul: [0.95, 0.98, 0.98], add: [0.03, 0.03, 0.03], sun: [0xf0f0e0 as any, 1.3], hemi: 1.1, fog: 0xd8e2e0, stars: 0, moon: false },
  nightrain: { top: '#0A1024', bot: '#2A3358', mul: [0.38, 0.45, 0.72], add: [0.01, 0.015, 0.05], sun: [0x8fa6ff as any, 0.5], hemi: 0.6, fog: 0x232c52, stars: 0.2, moon: false, cloud: 0x3b4468 }
}

async function main() {
  const host = document.getElementById('host') as HTMLDivElement
  host.style.width = W + 'px'
  host.style.height = H + 'px'
  const skyName = q.get('sky') ?? 'noon'
  const sky = SKY[skyName]
  const wx = q.get('wx') ?? (skyName === 'rain' || skyName === 'nightrain' ? 'rain' : skyName === 'snow' ? 'snow' : 'none')
  host.style.background = `linear-gradient(180deg, ${sky.top}, ${sky.bot})`
  if (sky.stars > 0) {
    let dots = ''
    let sd = 7
    const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 90; i++) {
      const r = rnd() * 2 + 0.8
      dots += `<i style="position:absolute;left:${rnd() * 100}%;top:${rnd() * 55}%;width:${r}px;height:${r}px;border-radius:50%;background:#fff;opacity:${(0.4 + rnd() * 0.6) * sky.stars}"></i>`
    }
    host.insertAdjacentHTML('afterbegin', `<div style="position:absolute;inset:0;pointer-events:none">${dots}</div>`)
  }
  if (sky.moon) host.insertAdjacentHTML('afterbegin', `<div style="position:absolute;left:${W * 0.78}px;top:${H * 0.1}px;width:90px;height:90px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFFBE8,#F3E7B8);box-shadow:0 0 60px 20px rgba(255,248,210,.35)"><i style="position:absolute;left:52px;top:22px;width:18px;height:18px;border-radius:50%;background:rgba(200,185,130,.35)"></i><i style="position:absolute;left:24px;top:52px;width:12px;height:12px;border-radius:50%;background:rgba(200,185,130,.3)"></i></div>`)

  const layout = geoLayout(places.map((p) => ({ id: p.id, ...projectVn(p.geo.lon, p.geo.lat), via: p.via?.map(([lo, la]: number[]) => projectVn(lo, la)), ferry: p.ferry })), VN_SIZE, (p: any) => isVnLand(p))
  const pts = layout.anchors.map((a: any, i: number) => ({ id: places[i].id, x: a.x, y: a.y }))
  const routes = places.slice(1).map((p: any, i: number) => {
    const via = (p.via ?? []).map(([lo, la]: number[]) => projectVn(lo, la))
    const raw = [pts[i], ...via, pts[i + 1]]
    const out: any[] = [{ x: raw[0].x, y: raw[0].y }]
    smoothSegments(raw).forEach((seg: any, k: number) => {
      const sea = !!p.ferry && k === raw.length - 2
      for (let t = 1; t <= 16; t++) {
        const u = t / 16, v = 1 - u
        out.push({ x: v * v * v * seg.p0.x + 3 * v * v * u * seg.c1.x + 3 * v * u * u * seg.c2.x + u * u * u * seg.p1.x, y: v * v * v * seg.p0.y + 3 * v * v * u * seg.c1.y + 3 * v * u * u * seg.c2.y + u * u * u * seg.p1.y, sea })
      }
    })
    return out
  })
  const doneSet = new Set((q.get('done') ?? 'hanoi,halong,sapa').split(','))
  let G: any = null
  let petEl: HTMLElement | null = null
  if (q.get('pet') === '1') { host.insertAdjacentHTML('beforeend', '<svg id="petsvg" viewBox="-20 -20 200 180" style="position:absolute"><ellipse cx="80" cy="146" rx="30" ry="4" fill="#2B2B3A" opacity=".0"/><g transform="translate(80 143) scale(.9) translate(-80 -143)"><use href="#tails3"/><use href="#fbody"/><use href="#eopen"/><use href="#kbib"/></g></svg>'); petEl = document.getElementById('petsvg') as any }
  const provLabels: Array<{ el: HTMLElement; v3: any }> = []
  let rain: any = null
  let snow: any = null
  const h = await mountVnMap3D(host, {
    width: W, height: H, pixelRatio: +(q.get('pr') ?? 1), reduceMotion: true, routes,
    places: places.map((p: any) => { const pt = pts.find((z: any) => z.id === p.id)!; return { id: p.id, title: p.title, vi: p.vi, landmark: p.landmark, x: pt.x, y: pt.y, done: doneSet.has(p.id) } }),
    onSelect: () => {}, onPet: (s: any) => { if (!petEl) return; const size = s.k * +(q.get('petk') ?? 1.1); petEl.style.cssText = `position:absolute;z-index:5;pointer-events:none;width:${size}px;height:${size * 0.9}px;left:${s.x - size / 2}px;top:${s.y - size * 0.9 + size * 0.07}px`; },
    hooks: {
      ready(g: any) {
        G = g
        const { THREE, scene, sun, hemi, pass } = g
        if (q.get('nolbl') === '1') g.labelScene.children.forEach((c: any) => { c.visible = false })
        sun.color.setHex(sky.sun[0] as any); sun.intensity = sky.sun[1]; hemi.intensity = sky.hemi
        scene.fog.color.setHex(sky.fog); if (+(q.get('dist') ?? 0) > 150) { scene.fog.near = 400; scene.fog.far = 1300 }
        pass.material.uniforms.tintMul.value.set(...sky.mul)
        pass.material.uniforms.tintAdd.value.set(...sky.add)
        if (wx === 'snow') pass.material.uniforms.snowAmt.value = +(q.get('snow') ?? 0.72)
        if (sky.cloud !== undefined) g.clouds.forEach((c: any) => c.traverse((o: any) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.setHex(sky.cloud!) } }))
        const mul = +(q.get('cloudk') ?? 1)
        if (mul !== 1) g.clouds.forEach((c: any) => c.scale.multiplyScalar(mul))
        // mưa: nét sọc rơi trong hộp quanh camera; tuyết: chấm trắng
        const box = Math.max(8, g.cam.dist * 0.9)
        if (wx === 'rain') {
          const n = 1800
          const pos = new Float32Array(n * 6)
          for (let i = 0; i < n; i++) {
            const x = (Math.random() - 0.5) * box * 1.8, y = Math.random() * box * 0.9, z = (Math.random() - 0.5) * box * 1.8
            pos.set([x, y, z, x - 0.02 * box * 0.1, y - 0.3 * box * 0.1, z], i * 6)
          }
          const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
          rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xeaf4ff, transparent: true, opacity: 0.55, fog: false }))
          rain.frustumCulled = false
          g.labelScene.add(rain)
        }
        if (wx === 'snow') {
          const n = 1400
          const pos = new Float32Array(n * 3)
          for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * box * 1.8, Math.random() * box * 0.9, (Math.random() - 0.5) * box * 1.8], i * 3)
          const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
          const cv = document.createElement('canvas'); cv.width = cv.height = 32
          const c2 = cv.getContext('2d')!; const gr = c2.createRadialGradient(16, 16, 0, 16, 16, 15); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = gr; c2.fillRect(0, 0, 32, 32)
          snow = new THREE.Points(geo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(cv), size: box * 0.03, transparent: true, depthWrite: false, fog: false }))
          snow.frustumCulled = false
          g.labelScene.add(snow)
        }
        if (skyName === 'night' || skyName === 'nightrain') {
          const cv = document.createElement('canvas'); cv.width = cv.height = 64
          const c2 = cv.getContext('2d')!; const gr = c2.createRadialGradient(32, 32, 0, 32, 32, 31); gr.addColorStop(0, 'rgba(255,230,150,1)'); gr.addColorStop(0.35, 'rgba(255,190,90,.55)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); c2.fillStyle = gr; c2.fillRect(0, 0, 64, 64)
          const tex = new THREE.CanvasTexture(cv)
          let sd = 3; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647)
          for (const p of places) {
            const an = g.anchors.get(p.id); if (!an) continue
            const cx = an.x, cz = an.z
            for (let i = 0; i < 9; i++) {
              const gx = cx + (rnd() - 0.5) * 3.2, gz = cz + (rnd() - 0.5) * 2.6
              const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
              sp.position.set(gx, g.groundAt(gx, gz) + 0.5 + rnd() * 0.8, gz); const sc = 0.5 + rnd() * 0.5; sp.scale.set(sc, sc, 1)
              g.labelScene.add(sp)
            }
          }
        }
        if (q.get('pins') === '1') {
          places.forEach((p: any, i: number) => {
            const an = g.anchors.get(p.id); if (!an) return
            const el = document.createElement('div')
            const done = doneSet.has(p.id)
            el.innerHTML = `<div style="width:30px;height:30px;border-radius:50%;background:${done ? '#2F8F52' : '#3F6FE0'};border:3px solid #fff;box-shadow:0 2px 0 rgba(43,43,58,.45);color:#fff;font:800 14px 'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-100%)">${done ? '&#10003;' : i + 1}</div>`
            el.style.cssText = 'position:absolute;pointer-events:none'
            host.appendChild(el)
            provLabels.push({ el, v3: new THREE.Vector3(an.x, an.y + 1.2, an.z) })
          })
        }
        // đường biên 34 tỉnh sau sáp nhập, phủ lên địa hình (chỉ đoạn nằm trên đất liền của bản đồ game)
        if (q.get('prov') === '1') {
          const verts: number[] = []
          for (const [name, v] of Object.entries<any>((MERGED as any).prov)) {
            for (const ring of v.d.split('M').filter(Boolean)) {
              const pp = ring.replace('Z', '').split('L').map((s: string) => s.trim().split(' ').map(Number))
              for (let i = 0; i < pp.length; i++) {
                const a = pxToStage(pp[i][0], pp[i][1]), b = pxToStage(pp[(i + 1) % pp.length][0], pp[(i + 1) % pp.length][1])
                if (!isVnLand(a as any) || !isVnLand(b as any)) continue
                for (let k = 0; k < 3; k++) {
                  const t0 = k / 3, t1 = (k + 1) / 3
                  for (const t of [t0, t1]) {
                    const x = (a.x + (b.x - a.x) * t) / TERRAIN_UNIT, z = (a.y + (b.y - a.y) * t) / TERRAIN_UNIT
                    verts.push(x, g.groundAt(x, z) + 0.06, z)
                  }
                }
              }
            }
          }
          const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
          scene.add(Object.assign(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, fog: false })), { frustumCulled: false }))
        }
        if (q.get('lbl') === '1') {
          const fs = +(q.get('lblk') ?? 11)
          for (const [name, v] of Object.entries<any>((MERGED as any).prov)) {
            const s2 = pxToStage(v.c[0], v.c[1])
            if (!isVnLand(s2 as any)) continue
            const el = document.createElement('div')
            el.textContent = name === 'TP.HCM' ? 'TP.HCM' : name
            el.style.cssText = `position:absolute;transform:translate(-50%,-50%);font:700 ${fs}px 'Segoe UI',system-ui,sans-serif;color:#fff;text-shadow:0 0 3px #1c3a2a,0 0 3px #1c3a2a,0 1px 2px #1c3a2a;white-space:nowrap;pointer-events:none;letter-spacing:.2px`
            host.appendChild(el)
            const gx = s2.x / TERRAIN_UNIT, gz = s2.y / TERRAIN_UNIT
            provLabels.push({ el, v3: new THREE.Vector3(gx, g.groundAt(gx, gz) + 0.4, gz) })
          }
        }
      },
      frame(dt: number) {
        if (!G) return
        const { cam } = G
        for (const o of [rain, snow]) if (o) o.position.set(cam.x, 0, cam.z)
        for (const l of provLabels) { G.camera.updateMatrixWorld(); const p = l.v3.clone().project(G.camera); l.el.style.display = p.z > 1 || p.z < -1 ? 'none' : 'block'; l.el.style.left = (p.x * 0.5 + 0.5) * W + 'px'; l.el.style.top = (-p.y * 0.5 + 0.5) * H + 'px' }
      }
    }
  })
  const g = G
  const at = q.get('at') ?? 'all'
  const st = (id: string) => pts.find((z: any) => z.id === id)!
  if (at === 'all') {
    h.follow(VN_SIZE.width * (+(q.get('fx') ?? 0.5)), VN_SIZE.height * (+(q.get('fy') ?? 0.5)), +(q.get('dist') ?? 150))
  } else if (at.startsWith('f:')) {
    h.focus(at.slice(2))
    if (q.get('dist')) g.goal.dist = +q.get('dist')!
  } else {
    const p = st(at)
    h.follow(p.x, p.y, +(q.get('dist') ?? 9))
  }
  if (q.get('pitch')) g.goal.pitch = +q.get('pitch')!
  if (q.get('yaw')) g.goal.yaw = +q.get('yaw')!
  Object.assign(g.cam, g.goal)
  // phương tiện
  const kind = q.get('veh')
  if (kind) {
    const from = q.get('from') ?? 'hoian', to = q.get('to') ?? 'nhatrang'
    const r = h.route(from, to)
    const u = +(q.get('u') ?? 0.4)
    const i = Math.min(r.length - 2, Math.floor(u * (r.length - 1)))
    const a = r[i], b = r[i + 1]
    const f = u * (r.length - 1) - i
    const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f
    h.setPet({ x, y, hop: kind === 'plane' ? +(q.get('alt') ?? 3) : 0, kind: kind as any, heading: Math.atan2(b.y - a.y, b.x - a.x) })
    if (q.get('track') !== '0') h.follow(x, y, +(q.get('dist') ?? 7))
    Object.assign(g.cam, g.goal)
  }
  g.setDirty()
  document.title = 'ready'
}
main().catch((e) => { document.title = 'ERR ' + e; document.body.append(String(e)) })
