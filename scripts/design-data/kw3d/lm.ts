import * as THREE from 'three'
import { buildLandmark3D } from 'D:/Gonbi/Projects/App/english-assistant/src/renderer/study/kids/game/landmarks3d'
const id = new URLSearchParams(location.search).get('id')!
const W = 640, H = 520
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
r.setSize(W, H); r.setClearColor(0, 0); r.shadowMap.enabled = true
document.getElementById('host')!.appendChild(r.domElement)
const s = new THREE.Scene()
const g = buildLandmark3D(THREE as any, id) as any
s.add(g)
// bỏ đế và phần phụ của mô hình bản đồ, chỉ giữ công trình; bệ tròn dựng trong 3D để liền khối
g.updateMatrixWorld(true)
const KEEP: Record<string, [number, number]> = { 'hoian-bridge-pagoda': [6.5, 4.4], 'hue-ngo-mon': [7, 3.2], 'danang-dragon-bridge': [8.5, 5.2], 'nhatrang-tram-huong': [2.9, 3], 'dalat-station': [6, 3.2] }
const bb0 = new THREE.Box3().setFromObject(g), c0 = bb0.getCenter(new THREE.Vector3())
const [kx, kz] = KEEP[id] ?? [7.5, 4.6]
const parts: any[] = []; g.traverse((o: any) => { if (o.isMesh) parts.push(o) })
for (const o of parts) {
  const bx = new THREE.Box3().setFromObject(o), q = bx.getCenter(new THREE.Vector3()), z = bx.getSize(new THREE.Vector3())
  if ((z.y < .55 && Math.max(z.x, z.z) > 3.2 && q.y < bb0.min.y + (id === 'danang-dragon-bridge' ? .6 : .3)) || Math.abs(q.x - c0.x) > kx || Math.abs(q.z - c0.z) > kz) o.visible = false
}
const b = new THREE.Box3(); for (const o of parts) if (o.visible) b.expandByObject(o)
const c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3())
const R = Math.max(sz.x, sz.z) * (id === 'hoian-bridge-pagoda' ? .66 : id === 'danang-dragon-bridge' ? .62 : .58), Ytop = id === 'sapa-terraces' ? 0 : b.min.y
const WET = ['halong-trong-mai', 'cantho-floating-market', 'phuquoc-fishing-village', 'ninhbinh-trang-an'].includes(id)
const toon = (col: number) => new THREE.MeshToonMaterial({ color: col })
const disc = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .22, 64), toon(0x7edb62)); disc.position.set(c.x, Ytop - .11, c.z)
const side = new THREE.Mesh(new THREE.CylinderGeometry(R * .98, R * .86, .9, 64), toon(0xb98a4a)); side.position.set(c.x, Ytop - .67, c.z)
disc.receiveShadow = true; s.add(disc, side)
if (WET) { const w = new THREE.Mesh(new THREE.CylinderGeometry(R * .9, R * .9, .06, 64), toon(0x27d3d6)); w.position.set(c.x, Ytop + .02, c.z); s.add(w) }
if (id === 'hoian-bridge-pagoda' || id === 'danang-dragon-bridge') { const w = new THREE.Mesh(new THREE.CylinderGeometry(R * .96, R * .96, .06, 64), toon(0x27d3d6)); w.scale.set(.46, 1, 1); w.position.set(c.x, Ytop + .02, c.z); s.add(w) }
for (let i = 0; i < 16; i++) { const a = i * 2.399, r = R * .9, m = new THREE.Mesh(new THREE.SphereGeometry(.16 + (i % 3) * .07, 10, 8), toon([0x3ccb6b, 0x1fa860, 0x9be564][i % 3])); m.position.set(c.x + Math.cos(a) * r, Ytop + .1, c.z + Math.sin(a) * r); s.add(m) }
// viền mực: lớp vỏ lật mặt, đẩy theo pháp tuyến
const ink = new THREE.MeshBasicMaterial({ color: 0x3a2413, side: THREE.BackSide })
ink.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.045;') }
const hulls: THREE.Mesh[] = []
const ms: any[] = [...s.children.filter((o: any) => o.isMesh)]; for (const o of parts) if (o.visible && o.material && !o.material.transparent) ms.push(o)
for (const o of ms) { const h = new THREE.Mesh(o.geometry, ink); h.frustumCulled = false; o.add(h); hulls.push(h); o.castShadow = o.receiveShadow = true }
s.add(new THREE.HemisphereLight(0xfff4e0, 0xc8a070, 2.1))
const sun = new THREE.DirectionalLight(0xfff0d4, 2.8); sun.position.set(c.x - 10, 22, c.z + 14); sun.target.position.copy(c); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 }); s.add(sun, sun.target)
const d = R * 5.4
const cam = new THREE.PerspectiveCamera(24, W / H, .1, 200); cam.position.set(c.x + d * .34, Ytop + d * .46, c.z + d * .82); cam.lookAt(c.x, Ytop + sz.y * .3, c.z)
r.toneMapping = THREE.NoToneMapping
r.render(s, cam)
