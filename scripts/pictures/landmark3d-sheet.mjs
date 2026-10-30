import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
// Xuất ảnh các công trình 3D của bản đồ game (docs/18-ui-rules.md §10) để soi:
//   pnpm landmarks3d:sheet --out x.png [--ids hanoi-turtle-tower,hue-ngo-mon]
const require = createRequire(import.meta.url)
const { build } = require(require.resolve('esbuild', { paths: [require.resolve('vite')] }))
const tmp = mkdtempSync(join(tmpdir(), 'l3d-'))
const slash = String.fromCharCode(92)
const idx = resolve('src/renderer/study/kids/game/landmarks3d/index.ts').split(slash).join('/')
const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const out = resolve(arg('out') ?? 'landmark3d-sheet.png')
const ids = (arg('ids') ?? 'hanoi-turtle-tower,halong-trong-mai,sapa-terraces,ninhbinh-trang-an,hue-ngo-mon,danang-dragon-bridge,hoian-bridge-pagoda,nhatrang-tram-huong,dalat-station,hcmc-ben-thanh,cantho-floating-market,phuquoc-fishing-village').split(',')
const entry = `import * as THREE from 'three'
import { buildLandmark3D } from ${JSON.stringify(idx)}
const ids = ${JSON.stringify(ids)}
const one = ids.length === 1
const cols = 3, W = 1800, H = ids.length === 1 ? 1000 : 450 * Math.ceil(ids.length / cols)
const r = new THREE.WebGLRenderer({ antialias: true }); r.setSize(W, H); r.shadowMap.enabled = true; r.setClearColor(0xbfe3fa)
document.body.appendChild(r.domElement)
const scene = new THREE.Scene()
scene.add(new THREE.HemisphereLight(0xe2f3ff, 0x8aa070, 1.35))
const sun = new THREE.DirectionalLight(0xfff0d8, 2.5); sun.position.set(-20, 40, 30); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096)
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 120 }); sun.shadow.bias = -0.0005; scene.add(sun)
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x86c85a })); ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground)
ids.forEach((id, i) => { const g = buildLandmark3D(THREE, id); if (!g) return; if (one) { scene.add(g); return } g.position.set((i % cols - 1) * 15, 0, (Math.floor(i / cols) - 0.5 * (Math.ceil(ids.length / cols) - 1)) * 15); scene.add(g) })
const cam = new THREE.PerspectiveCamera(32, W / H, 0.5, 400); if (one) { cam.position.set(4, 8.5, 12.5); cam.lookAt(0, 1.4, 0) } else { cam.position.set(0, 42, 52); cam.lookAt(0, 0, 0) }
r.render(scene, cam); window.__count = ids.length`
const bundle = await build({ stdin: { contents: entry, resolveDir: resolve('.'), loader: 'ts' }, bundle: true, write: false, format: 'iife', target: 'chrome120', alias: { '@shared': resolve('src/shared') } })
const page = join(tmp, 'p.html')
writeFileSync(page, `<!doctype html><meta charset="utf-8"><body style="margin:0"><script>${bundle.outputFiles[0].text}</script>`)
const r2 = spawnSync(require('electron'), [resolve('scripts/pictures/vector-sheet-capture.cjs'), page, out, tmp], { stdio: 'inherit' })
process.exit(r2.status ?? 1)
