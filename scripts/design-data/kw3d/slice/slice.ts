// Lát mẫu KidsWorld v3: vùng Hội An dựng mới hoàn toàn (nguyên mẫu thiết kế, không phải code app).
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { Kit } from 'D:/Gonbi/Projects/App/english-assistant/src/renderer/study/kids/game/landmarks3d/kit'
import { GLB } from './assets'

const q = new URLSearchParams(location.search)
const W = +(q.get('w') ?? 1280), H = +(q.get('h') ?? 720)
const SKY = q.get('sky') ?? 'noon'
const night = SKY === 'night', dusk = SKY === 'dusk', warm = night || dusk
const P = {
  grassA: 0x8fce62, grassB: 0x6cb955, grassC: 0xb4dd72, sand: 0xf4dfa6, wetSand: 0xdcc184, dirt: 0xd9b27c, rock: 0xa49c94,
  wall: 0xf2c54b, wall2: 0xeeb23c, wallLow: 0xc9a163, wood: 0x6e4630, woodD: 0x4b2f26, red: 0xc23a2c, tile: 0xb4603e, tileD: 0x8e4a33,
  asphalt: 0x77727e, curb: 0xe9e2d3, line: 0xfff6dc, stone: 0xcdb99b, shutter: 0x3f7f73
}

// --- tiện ích ---
const mats = new Map<string, THREE.Material>()
const mat = (c: number, o: any = {}) => {
  const k = c + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: c, ...o }))
  return mats.get(k)!
}
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const mix = (a: number, b: number, t: number) => a + (b - a) * t
let seed = 12345
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
const vnoise = (x: number, y: number) => {
  const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j
  const u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g)
  return mix(mix(hash(i, j), hash(i + 1, j), u), mix(hash(i, j + 1), hash(i + 1, j + 1), u), v)
}
const fbm = (x: number, y: number) => vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15
const scene = new THREE.Scene()
const add = (m: THREE.Object3D, shadow = true) => { m.traverse((o: any) => { if (o.isMesh) { o.castShadow = shadow; o.receiveShadow = true } }); scene.add(m); return m }
const mesh = (g: THREE.BufferGeometry, c: number, o?: any) => new THREE.Mesh(g, mat(c, o))
const at = (m: THREE.Object3D, x: number, y: number, z: number, parent?: THREE.Object3D) => { m.position.set(x, y, z); parent?.add(m); return m }

// --- địa lý ---
const riverZ = (x: number) => 15 + 5 * Math.sin(x * 0.05) + 2 * Math.sin(x * 0.13 + 1)
const coastX = (z: number) => 66 + 8 * Math.sin(z * 0.04) + 3 * Math.sin(z * 0.11)
const canalX = (z: number) => -6 + 1.6 * Math.sin(z * 0.2)
const SEA = -1.6
function baseH(x: number, z: number) {
  let h = 1.25 + (fbm(x * 0.03 + 5, z * 0.03) - 0.5) * 1.4
  const town = sstep(50, 30, Math.abs(x + 5)) * sstep(30, 16, Math.abs(z + 8))
  h = mix(h, 1.3, town)
  // núi nền phía bắc + Ngũ Hành Sơn
  const nm = sstep(-46, -80, z) * (1 + fbm(x * 0.05, z * 0.05) * 2)
  h += nm * 11 * sstep(10, -70, x)
  for (const [cx, cz, r, a] of [[46, -56, 9, 11], [33, -64, 7, 8]] as number[][]) { const d = Math.hypot(x - cx, z - cz) / r; h += a * Math.exp(-d * d) * (0.8 + fbm(x * 0.2, z * 0.2) * 0.5) }
  const dr = Math.abs(z - riverZ(x))
  h = mix(SEA, h, sstep(5.5, 11, dr))
  if (z < riverZ(x) && z > -30) { const dc = Math.abs(x - canalX(z)), w = sstep(-30, -22, z); h = mix(mix(h, SEA, w), h, sstep(1.8, 4.4, dc)) }
  h = mix(SEA - 0.4, h, sstep(-2, 11, coastX(z) - x))
  return h
}

// --- đường ---
const v3 = (x: number, z: number) => new THREE.Vector3(x, 0, z)
const mainRoad = new THREE.CatmullRomCurve3([[44, -96], [34, -60], [27, -34], [26, -8], [27, 6], [28, 34], [14, 58], [-18, 76], [-60, 96]].map(([x, z]) => v3(x, z)))
const streetRoad = new THREE.CatmullRomCurve3([[26, -8], [12, -7], [-3, -8], [-9, -8], [-24, -9], [-46, -14], [-74, -32], [-120, -40]].map(([x, z]) => v3(x, z)))
const sampleRoad = (c: THREE.CatmullRomCurve3, step = 1) => {
  const n = Math.round(c.getLength() / step), out: { p: THREE.Vector3; t: THREE.Vector3 }[] = []
  for (let i = 0; i <= n; i++) out.push({ p: c.getPointAt(i / n), t: c.getTangentAt(i / n) })
  return out
}
const roads = [{ s: sampleRoad(mainRoad), w: 2.5, kind: 'main' }, { s: sampleRoad(streetRoad), w: 2.3, kind: 'street' }]
for (const r of roads) {
  for (const a of r.s) a.p.y = Math.max(baseH(a.p.x, a.p.z), 1.25)
  for (let k = 0; k < 30; k++) { const ys = r.s.map((a) => a.p.y); for (let i = 1; i + 1 < ys.length; i++) r.s[i].p.y = (ys[i - 1] + ys[i] * 2 + ys[i + 1]) / 4 }
  for (const a of r.s) {
    const river = Math.exp(-(((a.p.z - riverZ(a.p.x)) / 11) ** 2))
    if (r.kind === 'main') a.p.y = Math.max(a.p.y, 1.3 + river * 2.1)
  }
}
const TS = 240, TD = 240
function nearestRoad(x: number, z: number) {
  let best = 1e9, y = 0, w = 0
  for (const r of roads) for (let i = 0; i < r.s.length; i += 2) { const p = r.s[i].p; const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; y = p.y; w = r.w } }
  return { d: Math.sqrt(best), y, w }
}
const GX = 420, GZ = 400, SX = 360, SZ = 300
const HF = new Float32Array((GX + 1) * (GZ + 1))
const ix = (x: number) => ((x + SX * 0.52) / SX) * GX, iz = (z: number) => ((z + SZ * 0.5) / SZ) * GZ
for (let j = 0; j <= GZ; j++) for (let i = 0; i <= GX; i++) {
  const x = (i / GX) * SX - SX * 0.52, z = (j / GZ) * SZ - SZ * 0.5
  let h = baseH(x, z)
  if (Math.abs(x) < 130 && Math.abs(z) < 110) { const r = nearestRoad(x, z); const on = sstep(r.w + 5, r.w + 0.8, r.d); if (h > 0) h = mix(h, r.y - 0.32, on) }
  HF[j * (GX + 1) + i] = h
}
const heightAt = (x: number, z: number) => {
  const fx = Math.min(GX - 1, Math.max(0, ix(x))), fz = Math.min(GZ - 1, Math.max(0, iz(z))), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j
  const a = HF[j * (GX + 1) + i], b = HF[j * (GX + 1) + i + 1], c = HF[(j + 1) * (GX + 1) + i], d = HF[(j + 1) * (GX + 1) + i + 1]
  return mix(mix(a, b, u), mix(c, d, u), v)
}

// --- ruộng lúa: ô thửa theo lưới hơi xoay ---
const paddy = (x: number, z: number) => {
  if (x > -6 || x < -120 || z < riverZ(x) + 14 || z > 100) return null
  const u = x * 0.96 + z * 0.28, v = -x * 0.28 + z * 0.96
  const cu = Math.floor(u / 13), cv = Math.floor(v / 9), fu = u / 13 - cu, fv = v / 9 - cv
  return { c: hash(cu, cv), dike: fu < 0.05 || fv < 0.07, row: Math.sin(u * 5) }
}

// --- địa hình ---
{
  const g = new THREE.PlaneGeometry(SX, SZ, GX, GZ); g.rotateX(-Math.PI / 2); g.translate(SX * (0.5 - 0.52), 0, 0)
  const pos = g.attributes.position as THREE.BufferAttribute, col = new Float32Array(pos.count * 3)
  const A = new THREE.Color(P.grassA), B = new THREE.Color(P.grassB), C2 = new THREE.Color(P.grassC), S = new THREE.Color(P.sand), Wt = new THREE.Color(P.wetSand), R = new THREE.Color(P.rock), Dt = new THREE.Color(P.dirt), T = new THREE.Color()
  const pal = [new THREE.Color(0x9fd764), new THREE.Color(0x7cc95c), new THREE.Color(0xc8dc6a), new THREE.Color(0x76c8b0), new THREE.Color(0xe7cf6e)]
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), j = i, h = HF[j]
    pos.setY(i, h)
    const n = fbm(x * 0.09, z * 0.09), n2 = fbm(x * 0.4 + 9, z * 0.4)
    T.copy(A).lerp(B, sstep(0.35, 0.65, n)).lerp(C2, sstep(0.55, 0.8, n2) * 0.6)
    T.lerp(R, sstep(5, 10, h) * 0.8)
    T.lerp(Wt, sstep(1, 0.2, h)); T.lerp(S, sstep(0.75, 0.25, h) * 0.5)
    const sandy = sstep(16, 6, coastX(z) - x); T.lerp(S, sandy)
    if (h < -0.1) T.lerp(Wt, 1)
    const pd = paddy(x, z)
    if (pd && h > 0.3) T.set(0xa9cf6c)
    const r = Math.abs(x) < 130 && Math.abs(z) < 110 ? nearestRoad(x, z) : { d: 99, w: 0 }
    if (h > 0.2) T.lerp(Dt, sstep(r.w + 2.2, r.w + 0.6, r.d) * 0.8)
    T.toArray(col, i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals()
  add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })), false)
}

// --- nước: màu theo độ sâu, bọt ven bờ, gợn ---
const hTex = new THREE.DataTexture(HF, GX + 1, GZ + 1, THREE.RedFormat, THREE.FloatType); hTex.minFilter = hTex.magFilter = THREE.LinearFilter; hTex.needsUpdate = true
const waterMat = new THREE.ShaderMaterial({
  uniforms: { h: { value: hTex }, t: { value: +(q.get('time') ?? 3.1) }, shallow: { value: new THREE.Color(warm ? (night ? 0x2f5b8c : 0xe9a585) : 0x7fdcc8) }, deep: { value: new THREE.Color(warm ? (night ? 0x13234f : 0x7a5f9e) : 0x3e9fd0) }, foam: { value: new THREE.Color(night ? 0x9fb7da : 0xffffff) }, area: { value: new THREE.Vector4(SX, SZ, -SX * 0.02, 0) } },
  vertexShader: 'varying vec3 w; void main(){ vec4 p = modelMatrix*vec4(position,1.); w=p.xyz; gl_Position=projectionMatrix*viewMatrix*p; }',
  fragmentShader: `varying vec3 w; uniform sampler2D h; uniform float t; uniform vec3 shallow,deep,foam; uniform vec4 area;
  float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); } float n(vec2 p){ vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f); return 2.*mix(mix(hs(i),hs(i+vec2(1,0)),u.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),u.x),u.y)-1.; }
  void main(){ vec2 uv=vec2((w.x-area.z)/area.x+.5,(w.z)/area.y+.5); float g=texture2D(h,uv).r; float d=clamp((0.-g)/1.7,0.,1.);
   vec3 c=mix(shallow,deep,smoothstep(.05,.95,d));
   float wob=n(w.xz*.55+t*.5)+.6*n(w.xz*1.3-t*.7)+.3*n(w.xz*vec2(2.4,3.1)+t);
   c+=vec3(.022)*wob*(.4+d);
   float streak=smoothstep(.62,.8,n(w.xz*vec2(.35,2.1)+vec2(t*.2,0.))); c=mix(c,foam,streak*.1*d);
   float band=smoothstep(.2,.0,d-.06*wob); float ring=smoothstep(.45,.55,sin(d*26.-t*1.5+wob*2.)); c=mix(c,foam,band*.85+ (1.-smoothstep(.0,.3,d))*ring*.45);
   gl_FragColor=vec4(c,1.); }`
})
{ const g = new THREE.PlaneGeometry(SX * 2, SZ * 2); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, waterMat); m.position.y = 0; scene.add(m) }

// --- thửa ruộng: khung bờ đất + mặt nước/lúa ---
const ANG = 0.28, COSA = Math.cos(ANG), SINA = Math.sin(ANG)
const PAD: { x: number; z: number; y: number; w: number; d: number; kind: string }[] = []
{
  const cw = 13, cd = 9
  for (let i = -11; i < 2; i++) for (let j = 0; j < 14; j++) {
    const a = i * cw, b = j * cd + 26, x = a * COSA + b * SINA, z = -a * SINA + b * COSA
    const ok = [[0, 0], [5, 3], [-5, 3], [5, -3], [-5, -3]].every(([u, v]) => { const px = x + u, pz = z + v; return !!paddy(px, pz) && heightAt(px, pz) > 0.6 && nearestRoad(px, pz).d > 7 })
    if (!ok) continue
    const hh = hash(i, j), kind = hh < 0.3 ? 'water' : hh < 0.62 ? 'green' : 'gold'
    const y = heightAt(x, z) + 0.2
    PAD.push({ x, z, y, w: cw - 1.1, d: cd - 1.1, kind })
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ANG
    g.add(at(mesh(new THREE.BoxGeometry(cw - 0.1, 0.5, cd - 0.1), 0xa98a5a), 0, -0.3, 0))
    const top = mesh(new THREE.BoxGeometry(cw - 1.1, 0.03, cd - 1.1), kind === 'water' ? (warm ? 0xe9b08f : 0xa9dcd6) : kind === 'green' ? 0x76c04f : 0xd9b84a); g.add(at(top, 0, -0.04, 0))
    for (const [w, d, u, v] of [[cw, 0.55, 0, -cd / 2 + 0.25], [cw, 0.55, 0, cd / 2 - 0.25], [0.55, cd, -cw / 2 + 0.25, 0], [0.55, cd, cw / 2 - 0.25, 0]]) g.add(at(mesh(new THREE.BoxGeometry(w, 0.16, d), 0x9fce6a), u, 0.03, v))
    add(g)
  }
}

// --- ribbon đường ---
function ribbon(s: { p: THREE.Vector3; t: THREE.Vector3 }[], a: number, b: number, dy: number, c: number, skip = 1) {
  const pos: number[] = [], idx: number[] = []
  for (let i = 0; i < s.length; i += skip) {
    const { p, t } = s[i]; const nx = -t.z, nz = t.x
    pos.push(p.x + nx * a, p.y + dy, p.z + nz * a, p.x + nx * b, p.y + dy, p.z + nz * b)
    if (i + skip < s.length) { const k = (pos.length / 3) - 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3) }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals()
  const m = new THREE.Mesh(g, mat(c, { side: THREE.DoubleSide })); m.receiveShadow = true; scene.add(m); return m
}
const dash: THREE.Matrix4[] = [], D = new THREE.Object3D()
for (const r of roads) {
  const w = r.w
  if (r.kind === 'main') {
    ribbon(r.s, -w - 0.5, w + 0.5, 0.1, P.curb); ribbon(r.s, -w, w, 0.14, P.asphalt)
    ribbon(r.s, -w + 0.22, -w + 0.4, 0.17, P.line); ribbon(r.s, w - 0.4, w - 0.22, 0.17, P.line)
    for (let i = 0; i < r.s.length; i += 4) { const { p, t } = r.s[i]; D.position.set(p.x, p.y + 0.175, p.z); D.rotation.y = Math.atan2(t.x, t.z); D.scale.set(0.2, 0.02, 1.9); D.updateMatrix(); dash.push(D.matrix.clone()) }
  } else { ribbon(r.s, -w - 0.3, w + 0.3, 0.1, 0xa58c70); ribbon(r.s, -w, w, 0.14, P.stone) }
}
{ const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(P.line), dash.length); dash.forEach((m, i) => im.setMatrixAt(i, m)); scene.add(im) }
// đá lát phố
{
  const s = roads[1].s, list: THREE.Matrix4[] = []
  for (let i = 0; i < 90; i++) for (let k = -5; k <= 5; k++) { if (rnd() < 0.55) continue; const { p, t } = s[i]; const o = k * 0.46 + (rnd() - 0.5) * 0.16; D.position.set(p.x - t.z * o + (rnd() - 0.5) * 0.3, p.y + 0.15, p.z + t.x * o); D.rotation.y = rnd() * 0.4; D.scale.set(0.34, 0.03, 0.34 + rnd() * 0.3); D.updateMatrix(); list.push(D.matrix.clone()) }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xb9a386), list.length); list.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, new THREE.Color().setHSL(0.09, 0.2, 0.62 + rnd() * 0.12)) }); im.receiveShadow = true; scene.add(im)
}
// cầu lớn qua sông: thành cầu + trụ
{
  const s = roads[0].s.filter((a) => a.p.z > 2 && a.p.z < 33)
  for (let side = -1; side <= 1; side += 2) {
    ribbon(s, side * 2.75, side * 3.05, 0.8, 0xe8e0d0); ribbon(s, side * 3.0, side * 3.05, 0.14, 0xe8e0d0)
    for (let i = 0; i < s.length; i += 2) { const { p, t } = s[i]; add(at(mesh(new THREE.BoxGeometry(0.22, 0.75, 0.22), 0xd0c4b0), p.x - t.z * side * 2.9, p.y + 0.45, p.z + t.x * side * 2.9)) }
  }
  ribbon(s, -3.05, 3.05, -0.25, 0xcabfae)
  for (let i = 4; i < s.length; i += 7) { const { p, t } = s[i]; const pil = mesh(new THREE.BoxGeometry(5.6, p.y + 2.2, 1), 0xbfb4a3); add(at(pil, p.x, (p.y - 2.2) / 2 - 0.3, p.z)); pil.rotation.y = Math.atan2(t.x, t.z) }
}

// --- nhà phố cổ ---
const ribs: { m: THREE.Matrix4; c: number }[] = []
function roof(g: THREE.Group, w: number, d: number, y: number, rise: number, tile = P.tile) {
  // hai mái dốc cong nhẹ, gờ ngói âm dương chạy theo dốc
  const hw = w / 2 + 0.28, hd = d / 2 + 0.34
  for (const sgn of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(w + 0.56, 1, 10, 6), p = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i) + 0.5; const zz = sgn * hd * (1 - v), yy = rise * v - 0.08 * Math.sin(v * Math.PI) + 0.1 * (Math.abs(u) / hw) ** 3; p.setXYZ(i, u, yy, zz) }
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, mat(tile, { side: THREE.DoubleSide })); m.position.y = y; g.add(m)
    const n = Math.floor((w + 0.5) / 0.3)
    for (let k = 0; k <= n; k++) {
      const u = -hw + 0.08 + (k / n) * (hw * 2 - 0.16), L = Math.hypot(hd, rise)
      D.position.set(u, y + rise / 2 + 0.04, (sgn * hd) / 2); D.rotation.set(sgn * Math.atan2(rise, hd) * -1 * -sgn * sgn, 0, 0); D.rotation.x = -sgn * Math.atan2(rise, hd) * -1 * -1 * (sgn > 0 ? 1 : 1)
      D.rotation.x = sgn > 0 ? Math.atan2(rise, hd) : -Math.atan2(rise, hd)
      D.scale.set(0.11, 0.11, L); D.updateMatrix()
      ribs.push({ m: new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().compose(g.position, g.quaternion, g.scale), D.matrix.clone()), c: rnd() })
    }
    const eave = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, w + 0.56, 6), mat(0xe9dcc0)); eave.rotation.z = Math.PI / 2; eave.position.set(0, y + 0.03, sgn * hd); g.add(eave)
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.13, 0.2), mat(0xeadfc6)); ridge.position.y = y + rise + 0.03; g.add(ridge)
  for (const s of [-1, 1]) { const tip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.22), mat(0xeadfc6)); tip.position.set(s * (w / 2 + 0.44), y + rise + 0.1, 0); tip.rotation.z = -s * 0.5; g.add(tip) }
}
const glow: THREE.Vector3[] = []
function lantern(x: number, y: number, z: number, c: number, parent?: THREE.Object3D, s = 1) {
  const em = warm ? { emissive: c, emissiveIntensity: night ? 1.7 : 1.1 } : {}
  const l = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 12, 10), mat(c, em)); b.scale.y = 1.15; l.add(b)
  for (const yy of [0.25, -0.25]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.1 * s, 0.05, 8), mat(0xd9a93a)); cap.position.y = yy * s; l.add(cap) }
  const tas = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.05 * s, 0.24 * s, 5), mat(0xd9a93a)); tas.position.y = -0.4 * s; l.add(tas)
  l.position.set(x, y, z); (parent ?? scene).add(l); return l
}
const LC = [0xe84a35, 0xf2a03d, 0xf5d24a, 0xe25a8c, 0x3fa7d6, 0x5cb85c]
function house(x: number, z: number, rotY: number, w: number, d: number, floors: number, variant: number) {
  const g = new THREE.Group(); g.position.set(x, heightAt(x, z) + 0.05, z); g.rotation.y = rotY; g.updateMatrixWorld()
  const wall = variant % 3 === 0 ? P.wall : variant % 3 === 1 ? P.wall2 : 0xf6d478
  const H1 = 1.9, H2 = floors > 1 ? 1.5 : 0, HH = H1 + H2
  g.add(at(mesh(new THREE.BoxGeometry(w, HH, d), wall), 0, HH / 2, 0))
  g.add(at(mesh(new THREE.BoxGeometry(w + 0.04, 0.3, d + 0.04), P.wallLow), 0, 0.15, 0))
  for (let i = 0; i < 5; i++) { const st = mesh(new THREE.BoxGeometry(0.5 + rnd() * 0.8, 0.28 + rnd() * 0.6, 0.02), 0xdcae47); g.add(at(st, (rnd() - 0.5) * w * 0.8, 0.5 + rnd() * (HH - 1), d / 2 + 0.012)) }
  // cửa gỗ, cửa chớp
  g.add(at(mesh(new THREE.BoxGeometry(1, 1.45, 0.07), P.woodD), -w * 0.18, 0.75, d / 2 + 0.02))
  for (let i = 0; i < 4; i++) g.add(at(mesh(new THREE.BoxGeometry(0.23, 1.36, 0.1), P.wood), -w * 0.18 - 0.36 + i * 0.24, 0.75, d / 2 + 0.03))
  g.add(at(mesh(new THREE.BoxGeometry(0.8, 0.8, 0.07), warm ? 0xffd27a : 0x4a3a35, warm ? { emissive: 0xffb04a, emissiveIntensity: night ? 1.2 : 0.5 } : {}), w * 0.23, 1.1, d / 2 + 0.02))
  for (const s of [-1, 1]) g.add(at(mesh(new THREE.BoxGeometry(0.42, 0.86, 0.07), P.shutter), w * 0.23 + s * 0.62, 1.1, d / 2 + 0.05))
  // mái hiên tầng trệt
  const awn = new THREE.Group(); awn.position.set(0, H1 - 0.02, d / 2 + 0.3); g.add(awn)
  const a2 = mesh(new THREE.BoxGeometry(w + 0.1, 0.08, 1), P.tile); a2.rotation.x = 0.32; awn.add(a2)
  for (let i = 0; i < w / 0.26; i++) { const r = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.04, 5), P.tileD); r.rotation.x = Math.PI / 2 + 0.32; awn.add(at(r, -w / 2 + i * 0.26, 0.07, 0)) }
  for (const s of [-1, 1]) g.add(at(mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.8, 8), P.wood), s * (w / 2 - 0.1), 0.9, d / 2 + 0.62))
  if (floors > 1) {
    for (const s of [-1, 1]) { g.add(at(mesh(new THREE.BoxGeometry(0.62, 0.92, 0.07), 0x3a2a26), s * w * 0.23, H1 + 0.8, d / 2 + 0.02)); g.add(at(mesh(new THREE.BoxGeometry(0.28, 0.96, 0.07), P.shutter), s * w * 0.23 - 0.46, H1 + 0.8, d / 2 + 0.05)); g.add(at(mesh(new THREE.BoxGeometry(0.28, 0.96, 0.07), P.shutter), s * w * 0.23 + 0.46, H1 + 0.8, d / 2 + 0.05)) }
    // ban công giấy: hoa giấy leo
    const pink = [0xe8418f, 0xf268a6, 0xd92f78]
    for (let i = 0; i < 26; i++) { const b = mesh(new THREE.IcosahedronGeometry(0.12 + rnd() * 0.16, 1), pink[i % 3]); g.add(at(b, w / 2 - rnd() * 1.5 * (variant % 2 ? 1 : -1) * 1 - (variant % 2 ? 0 : w), H1 + 0.1 + rnd() * 1.2 - (i % 4) * 0.2, d / 2 + 0.1 + rnd() * 0.25)) }
  }
  roof(g, w, d, HH, 1.05 + 0.08 * w, variant % 4 === 3 ? 0xa45a3c : P.tile)
  const c1 = LC[variant % 6], c2 = LC[(variant + 2) % 6]
  lantern(-w * 0.35, H1 - 0.52, d / 2 + 0.72, c1, g); lantern(w * 0.05, H1 - 0.52, d / 2 + 0.72, c2, g); lantern(w * 0.4, H1 - 0.52, d / 2 + 0.72, c1, g)
  add(g); (scene.userData.houses ??= []).push(g)
  return g
}
// hai dãy nhà dọc phố
{
  const s = roads[1].s; let v = 0
  for (let side = -1; side <= 1; side += 2) {
    let u = 6
    while (u < 96) {
      const w = 3.4 + rnd() * 1.3
      const a = s[Math.min(s.length - 1, Math.floor(u))], { p, t } = a
      const crossesCanal = Math.abs(p.x - canalX(p.z)) < 6.5
      if (!crossesCanal) {
        const d = 4.2, off = 2.6 + 0.4 + d / 2 + 0.7
        const hx = p.x - t.z * side * off, hz = p.z + t.x * side * off
        const ry = Math.atan2(t.x, t.z) + (side > 0 ? Math.PI / 2 * -1 : Math.PI / 2) * -1 * (side > 0 ? -1 : -1) * -1
        const face = Math.atan2(p.x - hx, p.z - hz)
        if (heightAt(hx, hz) > 0.5) house(hx, hz, face, w, d, rnd() < 0.72 ? 2 : 1, v++)
        void ry
      }
      u += w + 0.28
    }
  }
}
// dây đèn lồng ngang phố
{
  const s = roads[1].s
  for (let i = 8; i < 92; i += 7) {
    const { p, t } = s[i]; if (Math.abs(p.x - canalX(p.z)) < 7) continue
    const span = 3.4, n = 6
    for (let k = 0; k <= n; k++) { const f = k / n, o = -span + f * span * 2, sag = 0.8 * (1 - (2 * f - 1) ** 2); lantern(p.x - t.z * o, p.y + 3.5 - sag, p.z + t.x * o, LC[(k + i) % 6], undefined, 0.8) }
    const pts = Array.from({ length: 11 }, (_, k) => { const f = k / 10, o = -span + f * span * 2, sag = 0.8 * (1 - (2 * f - 1) ** 2); return new THREE.Vector3(p.x - t.z * o, p.y + 3.8 - sag, p.z + t.x * o) })
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.022, 4), mat(0x3a2a26)))
  }
}
// đèn đường + cột điện dọc đường lớn
{
  const k = new Kit(THREE as any); const s = roads[0].s
  for (let i = 10; i < s.length - 6; i += 16) { const { p, t } = s[i]; const sd = i % 32 ? 1 : -1, x = p.x - t.z * sd * 3.5, z = p.z + t.x * sd * 3.5
    const pole = mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.4, 8), 0x55606a); add(at(pole, x, p.y + 1.7, z))
    const arm = mesh(new THREE.BoxGeometry(1.2, 0.06, 0.08), 0x55606a); arm.rotation.y = Math.atan2(t.z, -t.x) * 1 + Math.PI / 2 * 0; add(at(arm, x + t.z * sd * 0.5, p.y + 3.4, z - t.x * sd * 0.5))
    add(at(mesh(new THREE.SphereGeometry(0.16, 10, 8), 0xfff2c4, warm ? { emissive: 0xffdc8a, emissiveIntensity: 2 } : {}), x + t.z * sd * 1, p.y + 3.33, z - t.x * sd * 1)) }
  add(k.group); void k
}

// --- CHÙA CẦU (dựng tay, đúng tinh thần: cầu vòm gỗ, mái ngói cong, miếu nhỏ, tượng chó & khỉ) ---
function chuaCau() {
  const g = new THREE.Group()
  const L = 13, Hb = 1.1, W2 = 2.5
  // vòm đá + sàn gỗ cong
  const deck = (u: number) => Hb * (1 - (u / (L / 2)) ** 2)
  const arc = new THREE.Shape(); arc.moveTo(-L / 2 - 1, -0.9)
  for (let i = 0; i <= 24; i++) { const u = -L / 2 + (i / 24) * L; arc.lineTo(u, deck(u)) }
  arc.lineTo(L / 2 + 1, -0.9); arc.lineTo(L / 2 + 1, -2.2)
  arc.lineTo(3.2, -2.2); for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; arc.lineTo(3.2 - 3.2 * (1 - Math.cos(a)) , -2.2 + 1.9 * Math.sin(a)) }
  arc.lineTo(-L / 2 - 1, -2.2); arc.closePath()
  const ex = new THREE.ExtrudeGeometry(arc, { depth: W2, bevelEnabled: false, curveSegments: 4 }); ex.translate(0, 0, -W2 / 2)
  g.add(mesh(ex, 0xb9a890))
  for (let i = 0; i < 44; i++) { const u = -L / 2 + 0.1 + (i / 44) * L; const pl = mesh(new THREE.BoxGeometry(0.27, 0.09, W2), i % 2 ? 0x8a5a3c : 0x7a4c33); g.add(at(pl, u, deck(u) + 0.05, 0)) }
  const span = 5.6, top = 3.1
  // cột sơn son + lan can + vách gỗ
  for (let i = 0; i <= 10; i++) {
    const u = -span + (i / 10) * span * 2
    for (const s of [-1, 1]) {
      const c = mesh(new THREE.CylinderGeometry(0.11, 0.13, top - deck(u) + 0.2, 10), P.red); g.add(at(c, u, (top + deck(u)) / 2, s * (W2 / 2 - 0.05)))
      g.add(at(mesh(new THREE.BoxGeometry(0.18, 0.1, 0.2), 0xd9a93a), u, deck(u) + 0.1, s * (W2 / 2 - 0.05)))
      if (i < 10) {
        const u2 = u + (span * 2) / 10, rail = mesh(new THREE.BoxGeometry((span * 2) / 10, 0.08, 0.08), P.red); rail.rotation.z = Math.atan2(deck(u2) - deck(u), u2 - u); g.add(at(rail, (u + u2) / 2, (deck(u) + deck(u2)) / 2 + 0.85, s * (W2 / 2 - 0.05)))
        for (let k = 1; k < 5; k++) { const uu = u + (k / 5) * (u2 - u); g.add(at(mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), 0xa8382b), uu, deck(uu) + 0.48, s * (W2 / 2 - 0.05))) }
        g.add(at(mesh(new THREE.BoxGeometry(u2 - u, 0.38, 0.05), 0x7a3b2a), (u + u2) / 2, top - 0.15, s * (W2 / 2 - 0.05)))
      }
    }
  }
  // mái cong: lưới cong võng dọc nóc, đầu đao vểnh
  const RW = span + 1.4, RD = W2 / 2 + 0.95, RH = 1.45
  for (const sgn of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(RW * 2, 1, 40, 10), p = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i), v = p.getY(i) + 0.5
      const curl = (Math.abs(u) / RW) ** 4
      const zz = sgn * RD * (1 - v), yy = RH * v ** 1.35 + 0.34 * curl * (1 - v) + 0.14 * (u / RW) ** 2
      p.setXYZ(i, u, yy, zz)
    }
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, mat(0x8a4b34, { side: THREE.DoubleSide })); m.position.y = top - 0.02; g.add(m)
    const n = 74
    for (let k = 0; k <= n; k++) {
      const u = -RW + 0.1 + (k / n) * (RW * 2 - 0.2), curl = (Math.abs(u) / RW) ** 4
      const y0 = 0.34 * curl + 0.14 * (u / RW) ** 2, y1 = RH + 0.14 * (u / RW) ** 2
      const pts = Array.from({ length: 7 }, (_, j) => { const v = j / 6; return new THREE.Vector3(u, top - 0.02 + RH * v ** 1.35 + 0.34 * curl * (1 - v) + 0.14 * (u / RW) ** 2 + 0.05, sgn * RD * (1 - v)) })
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 7, 0.075, 5), mat(k % 2 ? 0xa55a3e : 0x96503a)); g.add(tube); void y0; void y1
      if (k % 2 === 0) add(at(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), 0xdbc99e), 0, 0, 0)), g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 8).rotateX(Math.PI / 2), mat(0xe2d3a8)), u, top - 0.02 + 0.34 * curl + 0.14 * (u / RW) ** 2 + 0.05, sgn * (RD + 0.02)))
    }
  }
  const ridgeC = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => { const u = -RW + (i / 12) * RW * 2; return new THREE.Vector3(u, top + RH + 0.05 + 0.14 * (u / RW) ** 2 + 0.3 * (Math.abs(u) / RW) ** 5, 0) }))
  g.add(new THREE.Mesh(new THREE.TubeGeometry(ridgeC, 40, 0.17, 8), mat(0xe9dcbe)))
  for (const s of [-1, 1]) { const f = mesh(new THREE.ConeGeometry(0.14, 0.7, 8), 0xe9dcbe); f.rotation.z = -s * 0.7; g.add(at(f, s * (RW + 0.22), top + RH + 0.62, 0)) }
  // miếu nhỏ giữa cầu nhô về phía bắc + biển gỗ
  const sh = new THREE.Group(); sh.position.set(0, 0, -W2 / 2 - 1.3); g.add(sh)
  sh.add(at(mesh(new THREE.BoxGeometry(3, 2.3, 2), 0x9b4a35), 0, 2.45, 0)); sh.add(at(mesh(new THREE.BoxGeometry(1.1, 1.5, 0.08), 0x4b2f26), 0, 2.6, 1.02 - 2.05))
  const sr = mesh(new THREE.ConeGeometry(2.5, 1.2, 4), 0x8a4b34); sr.rotation.y = Math.PI / 4; sr.scale.set(1.15, 1, 0.9); sh.add(at(sr, 0, 4.15, 0))
  for (let i = -1; i <= 1; i += 2) sh.add(at(mesh(new THREE.CylinderGeometry(0.1, 0.12, 4.2, 8), P.red), i * 1.35, 0.7, 0.9))
  sh.position.y = -0.2
  const sign = mesh(new THREE.BoxGeometry(2.2, 0.62, 0.08), 0x4b2f26); g.add(at(sign, 0, top + 0.42, W2 / 2 + 0.72)); g.add(at(mesh(new THREE.BoxGeometry(1.9, 0.42, 0.09), 0xd9a93a), 0, top + 0.42, W2 / 2 + 0.74))
  // tượng chó + khỉ hai đầu cầu
  const dog = (x: number) => { const a = new THREE.Group(); a.add(at(mesh(new THREE.SphereGeometry(0.22, 10, 8), 0xcbbba0), 0, 0.2, 0)); a.add(at(mesh(new THREE.SphereGeometry(0.15, 10, 8), 0xcbbba0), 0, 0.46, 0.08)); for (const s of [-1, 1]) a.add(at(mesh(new THREE.ConeGeometry(0.05, 0.12, 6), 0xbcae93), s * 0.08, 0.6, 0.06)); g.add(at(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), 0xbcae93), x, deck(x) + 0.12, W2 / 2 - 0.4)); g.add(at(a, x, deck(x) + 0.26, W2 / 2 - 0.4)) }
  dog(-span - 0.9); dog(span + 0.9)
  for (let i = 0; i < 7; i++) { const u = -4.5 + i * 1.5; lantern(u, top - 0.52, W2 / 2 - 0.05, LC[i % 6], g, 1.1); lantern(u, top - 0.52, -W2 / 2 + 0.05, LC[(i + 3) % 6], g, 1.1) }
  return g
}
const bridgeC = chuaCau()
bridgeC.rotation.y = 0; bridgeC.position.set(canalX(-8), 1.4, -8); add(bridgeC)

// --- tài nguyên CC0 (Kenney Nature Kit): nạp từ ArrayBuffer, tô lại theo bảng màu, instancing ---
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer
const loader = new GLTFLoader()
const tint: Record<string, number> = { leaf: 0x57b05a, leafPalm: 0x4fb26a, trunk: 0x9a6a48 }
async function kit(name: string, list: { x: number; y?: number; z: number; s: number; r?: number }[], recolor?: (c: THREE.Color) => void) {
  const gltf = await new Promise<any>((res, rej) => loader.parse(b64(GLB[name]), '', res, rej))
  const meshes: { g: THREE.BufferGeometry; m: THREE.Material; w: THREE.Matrix4 }[] = []
  gltf.scene.updateMatrixWorld(true)
  gltf.scene.traverse((o: any) => { if (o.isMesh) { const c = (o.material.color as THREE.Color).clone(); recolor?.(c); meshes.push({ g: o.geometry, m: new THREE.MeshLambertMaterial({ color: c }), w: o.matrixWorld.clone() }) } })
  for (const e of meshes) {
    const im = new THREE.InstancedMesh(e.g, e.m, list.length)
    list.forEach((l, i) => {
      D.position.set(l.x, l.y ?? heightAt(l.x, l.z) - 0.05, l.z); D.rotation.set(0, l.r ?? rnd() * 6.28, 0); D.scale.setScalar(l.s); D.updateMatrix()
      im.setMatrixAt(i, new THREE.Matrix4().multiplyMatrices(D.matrix, e.w))
      im.setColorAt(i, new THREE.Color().setHSL(0, 0, 0.42 + rnd() * 0.2))
    })
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im)
  }
}
const canPlace = (x: number, z: number, m = 6) => { const h = heightAt(x, z); if (h < 0.7) return false; if (nearestRoad(x, z).d < m) return false; if (Math.abs(x + 6) < 46 && z > -24 && z < 14) return false; if (x > 0 && x < 60 && z > 10 && z < 42) return rnd() < 0.3; return true }
const places = (n: number, f: (x: number, z: number) => boolean, x0: number, x1: number, z0: number, z1: number, s: [number, number]) => { const o: any[] = []; let t = 0; while (o.length < n && t++ < n * 60) { const x = mix(x0, x1, rnd()), z = mix(z0, z1, rnd()); if (f(x, z)) o.push({ x, z, s: mix(s[0], s[1], rnd()) }) } return o }
const greener = (c: THREE.Color) => { const h = { h: 0, s: 0, l: 0 }; c.getHSL(h); if (h.h > 0.2 && h.h < 0.5) c.setHSL(0.27 + (h.h - 0.3) * 0.5 + rnd() * 0.02, 0.5, Math.min(0.42, h.l * 0.62 + 0.04)) }

async function vegetation() {
  const notPaddy = (x: number, z: number) => !paddy(x, z)
  await kit('tree_palmDetailedTall', places(60, (x, z) => coastX(z) - x > 3 && coastX(z) - x < 16 && canPlace(x, z, 5), 38, 80, -100, 100, [4.2, 6]), greener)
  await kit('tree_palmBend', places(26, (x, z) => Math.abs(z - riverZ(x)) < 15 && canPlace(x, z, 5), -100, 60, -6, 36, [3.6, 5]), greener)
  await kit('tree_palmShort', places(40, (x, z) => canPlace(x, z, 5) && notPaddy(x, z), -60, 60, -60, 60, [3.5, 4.6]), greener)
  await kit('tree_default', places(140, (x, z) => canPlace(x, z, 6) && notPaddy(x, z), -130, 60, -90, 40, [4, 6]), greener)
  await kit('tree_fat', places(120, (x, z) => canPlace(x, z, 6) && notPaddy(x, z), -130, 60, -90, 40, [3.6, 5.5]), greener)
  await kit('tree_oak', places(70, (x, z) => canPlace(x, z, 6) && notPaddy(x, z), -140, 60, -110, -24, [5, 7]), greener)
  { const cl: any[] = []; for (const [cx, cz] of [[-60, -18], [36, -44], [-30, 28], [14, 36], [-84, 26], [34, 48]]) for (let i = 0; i < 14; i++) { const x = cx + (rnd() - 0.5) * 7, z = cz + (rnd() - 0.5) * 6; if (heightAt(x, z) > 0.5) cl.push({ x, z, s: 3 + rnd() * 1.6 }) } await kit('crops_bambooStageB', cl, greener) }
  await kit('plant_bushDetailed', places(220, (x, z) => canPlace(x, z, 4.5) && notPaddy(x, z), -120, 60, -80, 60, [1.6, 3]), greener)
  await kit('grass_large', places(600, (x, z) => canPlace(x, z, 4.2) && notPaddy(x, z), -120, 64, -80, 80, [1.4, 2.4]), greener)
  await kit('flower_redA', places(120, (x, z) => canPlace(x, z, 4.2) && notPaddy(x, z), -60, 60, -40, 60, [1.5, 2.4]))
  await kit('flower_yellowA', places(140, (x, z) => canPlace(x, z, 4.2) && notPaddy(x, z), -60, 60, -40, 60, [1.5, 2.4]))
  await kit('rock_smallFlatA', places(70, (x, z) => { const h = heightAt(x, z); return h > 0.1 && h < 0.9 }, -110, 80, -40, 60, [1.6, 3.4]))
  await kit('lily_large', places(30, (x, z) => { const h = heightAt(x, z); return h < -0.15 && h > -0.9 && x < 50 }, -100, 40, 2, 30, [1.4, 2.2]).map((o: any) => ({ ...o, y: 0.02 })), greener)
  // lúa theo hàng trong từng thửa
  const rice: any[] = []
  for (const p of PAD) { if (p.kind === 'water') continue; for (let a = -p.w / 2 + 0.5; a < p.w / 2 - 0.3; a += 0.62) for (let b = -p.d / 2 + 0.5; b < p.d / 2 - 0.3; b += 0.62) { const x = p.x + a * COSA + b * SINA, z = p.z - a * SINA + b * COSA; rice.push({ x, y: p.y + 0.02, z, s: 0.75 + rnd() * 0.25 + (p.kind === 'gold' ? 0.2 : 0), k: p.kind }) } }
  await kit('grass', rice.filter((r) => r.k === 'green'), (c) => c.set(0xc8f07a))
  await kit('grass', rice.filter((r) => r.k === 'gold'), (c) => c.set(0xffe27a))
}

// --- thuyền Hội An: thân hẹp cong, mắt vẽ ở mũi ---
function sampan(x: number, z: number, r: number, c: number) {
  const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-2, 0.55); sh.quadraticCurveTo(-1.4, -0.1, 0, -0.14); sh.quadraticCurveTo(1.4, -0.1, 2.15, 0.7); sh.lineTo(1.5, 0.42); sh.lineTo(-1.4, 0.4); sh.closePath()
  const e = new THREE.ExtrudeGeometry(sh, { depth: 0.82, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }); e.translate(0, 0, -0.41); g.add(mesh(e, c))
  g.add(at(mesh(new THREE.BoxGeometry(2.6, 0.04, 0.72), 0x8a5a3c), 0, 0.36, 0))
  for (const s of [-1, 1]) { g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), mat(0xffffff)), 1.5, 0.38, s * 0.462).rotateY(s > 0 ? 0 : Math.PI)); g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.075, 14), mat(0x20202a)), 1.52, 0.38, s * 0.468).rotateY(s > 0 ? 0 : Math.PI)) }
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1, 12, 1, true, 0, Math.PI), mat(0xd7b37a, { side: THREE.DoubleSide })); hood.rotation.z = Math.PI / 2; hood.rotation.y = 0; g.add(at(hood, -0.4, 0.38, 0))
  lantern(-1.4, 1.1, 0, 0xe84a35, g, 0.8)
  g.position.set(x, 0.1, z); g.rotation.y = r; add(g); (scene.userData.boats ??= []).push(g)
}
for (const [x, z, r, c] of [[-22, 13, 0.2, 0x2f6fa3], [-11, 17, 2.9, 0x3a8f6d], [3, 12.5, -0.3, 0xb5433a], [16, 18, 3.3, 0x2f6fa3], [-34, 19, 0.1, 0xc58a2e], [42, 16, 2.7, 0x3a8f6d], [-5, 2, 1.6, 0x2f6fa3]] as number[][]) sampan(x, z, r, c)
// thuyền thúng ven biển + dù
for (const [x, z] of [[70, 2], [72, 8], [68, -6], [71, 18]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, 6.3, Math.PI / 2, Math.PI / 2), mat(0x6e7f5e, { side: THREE.DoubleSide })); b.scale.y = 0.55; add(at(b, x, 0.55, z)); const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 22), mat(0x8a6a44)); rim.rotation.x = Math.PI / 2; add(at(rim, x, 0.55, z)) }
for (const [x, z, c] of [[63, -24, 0xe84a35], [61, -18, 0xf2a03d], [64, -12, 0x3fa7d6], [60, 28, 0xe25a8c], [62, 34, 0xf5d24a]] as number[][]) { const y = heightAt(x, z); add(at(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), 0xe9dcbe), x, y + 1.1, z)); add(at(mesh(new THREE.ConeGeometry(1.4, 0.6, 12), c), x, y + 2.3, z)) }

// --- xe ---
{
  const k = new Kit(THREE as any); const s = roads[0].s
  const put = (i: number, sd: number, kind: string, c: number) => { const { p, t } = s[i]; const dir = sd > 0 ? Math.atan2(t.x, t.z) : Math.atan2(-t.x, -t.z); const x = p.x - t.z * sd * 1.2, z = p.z + t.x * sd * 1.2
    const g = kind === 'car' ? k.car(0, 0, c, 0, undefined, 0.95) : k.motorbike(0, 0, c, 0); g.position.set(x, p.y + 0.16, z); g.rotation.y = dir - Math.PI / 2; g.scale.setScalar(kind === 'car' ? 2.3 : 1.7); add(g); (scene.userData.cars ??= []).push({ g, t, sd }) }
  ;[[60, 1, 'car', 0xe84a35], [84, -1, 'bike', 0x3f6fe0], [96, 1, 'bike', 0xf2a03d], [118, -1, 'car', 0x4bb7c9], [132, 1, 'car', 0xf5d24a]].forEach(([i, sd, kd, c]) => put(i as number, sd as number, kd as string, c as number))
}
// mây
for (let i = 0; i < 9; i++) { const c = new THREE.Group(); for (let j = 0; j < 6; j++) { const s = mesh(new THREE.SphereGeometry(2.4 + rnd() * 2.6, 14, 10), 0xffffff); s.scale.y = 0.6; c.add(at(s, (j - 3) * 2.6, rnd() * 0.9, rnd() * 3)) } const side = i % 2 ? 1 : -1; c.position.set(side * (70 + rnd() * 50), 34 + rnd() * 6, -110 + rnd() * 60); c.scale.setScalar(0.7); scene.add(c); c.traverse((o: any) => { if (o.isMesh) o.castShadow = true }) }

// --- ánh sáng + bầu trời ---
const look = { overview: [[-5, 70, 96], [2, 0, 2]], town: [[10, 11, 26], [-4, 2.2, -9]], bridge: [[1, 5.5, 13.5], [-6, 3, -8]], road: [[48, 14, 30], [27, 1.5, 12]], rice: [[-22, 22, 72], [-52, 0, 40]], beach: [[48, 18, 26], [70, 0, 2]], flat: [[50, 150, 150], [-8, 0, 8]], ride: [[0, 0, 0], [0, 0, 0]] } as Record<string, number[][]>
const view = q.get('view') ?? 'overview'
const [eye, tgt] = look[view]
const skyCol = night ? 0x10183a : dusk ? 0xf0a884 : 0xbfe7fa
scene.background = new THREE.Color(skyCol)
scene.fog = new THREE.Fog(skyCol, 160, 420)
const hemi = new THREE.HemisphereLight(night ? 0x5570c0 : dusk ? 0xffcfb0 : 0xe6f4ff, night ? 0x1a2240 : dusk ? 0x8a6a70 : 0xb8a878, night ? 1.1 : dusk ? 1.5 : 2.0); scene.add(hemi)
const sun = new THREE.DirectionalLight(night ? 0x9fb4ff : dusk ? 0xffa766 : 0xfff0d4, night ? 0.9 : dusk ? 2.6 : 3.3)
const tv = new THREE.Vector3(...tgt)
const sp = dusk ? [-70, 26, 40] : [-55, 80, 45]
sun.position.set(tv.x + sp[0], sp[1], tv.z + sp[2]); sun.target.position.copy(tv); sun.castShadow = true
const span = view === 'overview' ? 130 : view === 'rice' || view === 'beach' ? 70 : 42
Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 320 }); sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.12
scene.add(sun, sun.target)

// --- gờ ngói gom thành instancing ---
function flushRibs() {
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6).rotateX(Math.PI / 2), mat(0xffffff), ribs.length)
  const a = new THREE.Color(0xc06c47), b = new THREE.Color(0xa85a3e), mo = new THREE.Color(0x87865a), c = new THREE.Color()
  ribs.forEach((r, i) => { im.setMatrixAt(i, r.m); c.copy(a).lerp(b, r.c); if (r.c > 0.86) c.lerp(mo, 0.6); im.setColorAt(i, c) })
  im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im)
}

// --- dựng hình ---
async function main() {
  await vegetation(); flushRibs()
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true })
  renderer.setSize(W, H); renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.NoToneMapping
  const ortho = q.get('ortho') === '1'
  if (ortho) scene.fog = null
  const oz = +(q.get('oz') ?? 95)
  const cam: any = ortho ? new THREE.OrthographicCamera(-oz * W / H, oz * W / H, oz, -oz, 1, 900) : new THREE.PerspectiveCamera(+(q.get('fov') ?? 30), W / H, 1, 900)
  cam.position.set(...(eye as [number, number, number])); cam.lookAt(tv)
  const car0 = scene.userData.cars[0]
  if (view === 'ride') { const p = car0.g.position, t = car0.t.clone().multiplyScalar(-car0.sd); cam.position.set(p.x - t.x * 7 - t.z * 3.5, p.y + 3.4, p.z - t.z * 7 + t.x * 3.5); cam.lookAt(p.x + t.x * 3, p.y + 0.6, p.z + t.z * 3); for (let i = 1; i < 9; i++) { const pf = mesh(new THREE.SphereGeometry(0.12 + i * 0.05, 8, 6), 0xf1e6d0, { transparent: true, opacity: 0.6 - i * 0.055 }); add(at(pf, p.x - t.x * (1.2 + i * 0.5), p.y + 0.3 + i * 0.06, p.z - t.z * (1.2 + i * 0.5)), false) } }
  const iso = q.get('iso')
  if (iso) {
    const target = iso === 'bridge' ? bridgeC : iso === 'house' ? scene.userData.houses[5] : scene.userData.boats[2]
    scene.children.forEach((c) => { c.visible = c === target || (c as any).isLight })
    scene.background = null; scene.fog = null
    renderer.setClearColor(0, 0); renderer.setClearAlpha(0)
    const wp = target.getWorldPosition(new THREE.Vector3()); const d = iso === 'bridge' ? 11 : iso === 'house' ? 5.6 : 3
    const c2 = new THREE.OrthographicCamera(-d * W / H, d * W / H, d, -d, 1, 500); const o = new THREE.Vector3(30, 42, 42); if (iso === 'house') o.applyAxisAngle(new THREE.Vector3(0, 1, 0), target.rotation.y); c2.position.copy(wp).add(o); c2.lookAt(wp.x, wp.y + (iso === 'bridge' ? 2 : iso === 'house' ? 2 : 0.2), wp.z)
    sun.position.copy(wp).add(new THREE.Vector3(-30, 60, 30)); sun.target.position.copy(wp)
    renderer.render(scene, c2)
    const im = document.createElement('img'); im.src = renderer.domElement.toDataURL('image/png'); document.getElementById('host')!.replaceChildren(im); document.body.style.background = '#00f0f0'; document.title = 'ready'; return
  }
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }))
  composer.addPass(new RenderPass(scene, cam))
  const ao = new GTAOPass(scene, cam, W, H); ao.updateGtaoMaterial({ radius: view === 'overview' ? 6 : 1.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 16, distanceFallOff: 1, screenSpaceRadius: false }); ao.blendIntensity = 0.85
  if (q.get('ao') !== '0') composer.addPass(ao)
  // viền mực mềm: lấy độ sâu từ lượt riêng
  const depthRT = new THREE.WebGLRenderTarget(W, H, { depthTexture: new THREE.DepthTexture(W, H) })
  const ink = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tDepth: { value: depthRT.depthTexture }, texel: { value: new THREE.Vector2(1 / W, 1 / H) }, near: { value: cam.near }, far: { value: cam.far }, tintA: { value: night ? new THREE.Color(0x2a3a7a) : new THREE.Color(0x4a3040) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    defines: { ORTHO: ortho ? 'true' : 'false' },
    fragmentShader: `#include <packing>
    varying vec2 vUv; uniform sampler2D tDiffuse,tDepth; uniform vec2 texel; uniform float near,far; uniform vec3 tintA;
    float lin(vec2 u){ float d=texture2D(tDepth,u).x; return ORTHO ? 400.+d*far*.4 : -perspectiveDepthToViewZ(d,near,far); }
    void main(){ vec4 c=texture2D(tDiffuse,vUv); float z=lin(vUv); vec2 o=texel*1.0; float j=0.;
      for(int i=0;i<4;i++){ vec2 d=i==0?vec2(o.x,0.):i==1?vec2(-o.x,0.):i==2?vec2(0.,o.y):vec2(0.,-o.y); j=max(j,abs(lin(vUv+d)-z)); }
      float e=smoothstep(.006,.02,j/z); gl_FragColor=vec4(mix(c.rgb,tintA*c.rgb*.9,e*.72),1.); }`
  })
  composer.addPass(ink)
  if (warm) composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), night ? 0.55 : 0.3, 0.5, 0.82))
  composer.addPass(new OutputPass())
  renderer.setRenderTarget(depthRT); renderer.render(scene, cam); renderer.setRenderTarget(null)
  composer.render(); composer.render()
  const out = document.createElement('img'); out.src = renderer.domElement.toDataURL('image/png'); out.style.display = 'block'
  const host = document.getElementById('host')!; host.style.cssText = 'position:relative;width:' + W + 'px;height:' + H + 'px'; host.replaceChildren(out)
  if (q.get('pet') === '1') { const p = car0.g.position.clone(); p.y += 1.05; cam.updateMatrixWorld(); const n = p.clone().project(cam), a = new THREE.Vector3(p.x, p.y + 1, p.z).project(cam); const k = Math.abs(a.y - n.y) * 0.5 * H; const sz = k * 1.55; const sx = (n.x * 0.5 + 0.5) * W, sy = (-n.y * 0.5 + 0.5) * H
    host.insertAdjacentHTML('beforeend', '<svg viewBox="-20 -20 200 180" style="position:absolute;left:' + (sx - sz / 2) + 'px;top:' + (sy - sz * 0.82) + 'px;width:' + sz + 'px;height:' + sz * 0.9 + 'px"><g transform="translate(80 143) scale(.9) translate(-80 -143)"><use href="#tails3"/><use href="#fbody"/><use href="#ehappy"/><use href="#kbib"/></g></svg>') }
  const r = renderer.info.render; document.title = `ready tris=${r.triangles} calls=${r.calls}`
  const d = document.createElement('div'); d.id = 'info'; d.textContent = document.title; d.style.cssText = 'position:fixed;left:0;top:0;font:12px monospace;background:#fff;display:' + (q.get('info') ? 'block' : 'none'); document.body.append(d)
}
main().catch((e) => { document.body.innerHTML = '<pre style="color:#fff;background:#700;padding:12px;font-size:16px;white-space:pre-wrap">' + e + '\n' + e.stack + '</pre>' })
