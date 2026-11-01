// Quả địa cầu tầng 3 (three.js, nạp lười; docs/23-design-v2-spec.md §3, bảng PEarth). Bản đồ vẽ lên canvas phẳng rồi dán lên
// khối cầu nên không phải tam giác hoá đa giác. Đất gộp theo châu lục (earthLand.json), không có biên giới. Kéo để xoay, tự
// quay chậm khi rảnh, dừng khi chọn một nơi. Vũ trụ: sao, Mặt Trăng, vệ tinh, tên lửa, Mặt Trời, hành tinh có vành.
import type * as ThreeNS from 'three'
import type { ContinentId } from '@shared/earthWonders'
import { fpsGuard, type MapQuality } from './mapQuality'

type Three = typeof ThreeNS

export interface GlobeSpot {
  id: string
  lat: number
  lon: number
  /** Ảnh công trình trên bệ */
  image: string
  /** Rộng so với bán kính quả cầu */
  size?: number
}
export interface GlobeLabel {
  id: string
  lat: number
  lon: number
}
export interface GlobeOptions {
  width: number
  height: number
  pixelRatio: number
  reduceMotion: boolean
  quality: MapQuality
  spots: GlobeSpot[]
  /** Điểm chỉ hiện nhãn, không có ảnh (tên châu lục) */
  labels: GlobeLabel[]
  decor?: GlobeSpot[]
  onSelect: (id: string | null) => void
  /** Vị trí màn hình của từng nơi sau mỗi lần vẽ. `near`: 1 ở giữa mặt cầu, 0 ở mép, âm là phía sau */
  onFrame: (items: ReadonlyArray<{ id: string; x: number; y: number; near: number }>) => void
}
export interface GlobeHandle {
  focus: (id: string) => void
  resume: () => void
  dispose: () => void
}

const COLORS: Record<ContinentId, string> = {
  asia: '#F2C04A',
  europe: '#E88AAE',
  africa: '#F2903E',
  northAmerica: '#58BE6A',
  southAmerica: '#2FB898',
  oceania: '#B48AE0',
  antarctica: '#EEF8FC'
}
const COAST = '#F2DDA6'
const RAD = Math.PI / 180
/** Khoảng cách camera để quả cầu cao ~89% khung hình (fov 30°) */
const CAM_Z = 4.25
const SPIN = 0.07
const DRAG = 0.0052
const MAX_TILT = 1.15
const CLICK_PX = 7
/** Công trình chỉ hiện khi đã quay ra đủ xa mép cầu */
const SPOT_MIN_Z = 0.3

type Land = Partial<Record<ContinentId, number[][]>>

function earthTexture(THREE: Three, land: Land, size: number): ThreeNS.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = size
  cv.height = size / 2
  const c = cv.getContext('2d')
  if (!c) throw new Error('no 2d canvas')
  const k = size / 360
  const g = c.createLinearGradient(0, 0, size, 0)
  g.addColorStop(0, '#1E93D6')
  g.addColorStop(0.5, '#12A6CE')
  g.addColorStop(1, '#1E93D6')
  c.fillStyle = g
  c.fillRect(0, 0, size, size / 2)
  const paths = (Object.keys(land) as ContinentId[]).map((id) => {
    const p = new Path2D()
    for (const ring of land[id] ?? []) {
      for (let i = 0; i < ring.length; i += 2) {
        const x = (ring[i] / 10 + 180) * k
        const y = (90 - ring[i + 1] / 10) * k
        if (i) p.lineTo(x, y)
        else p.moveTo(x, y)
      }
      p.closePath()
    }
    return { id, p }
  })
  c.lineJoin = 'round'
  c.lineWidth = size / 512
  c.strokeStyle = COAST
  for (const { p } of paths) c.stroke(p)
  for (const { id, p } of paths) {
    c.fillStyle = COLORS[id]
    c.fill(p, 'evenodd')
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function moonTexture(THREE: Three): ThreeNS.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 256
  cv.height = 128
  const c = cv.getContext('2d')
  if (c) {
    c.fillStyle = '#D9D3C4'
    c.fillRect(0, 0, 256, 128)
    for (let i = 0; i < 26; i++) {
      c.beginPath()
      c.arc((i * 97) % 256, (i * 53) % 128, 4 + (i % 5) * 3, 0, Math.PI * 2)
      c.fillStyle = i % 2 ? '#BDB6A6' : '#C9C2B3'
      c.fill()
    }
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Vầng sáng tròn dùng cho khí quyển và Mặt Trời */
function glowTexture(THREE: Three, stops: Array<[number, string]>): ThreeNS.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 256
  const c = cv.getContext('2d')
  if (c) {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128)
    for (const [o, col] of stops) g.addColorStop(o, col)
    c.fillStyle = g
    c.fillRect(0, 0, 256, 256)
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function ringedPlanet(THREE: Three): ThreeNS.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 256
  cv.height = 160
  const c = cv.getContext('2d')
  if (c) {
    c.translate(128, 80)
    c.rotate(-0.2)
    c.lineWidth = 7
    c.strokeStyle = '#FFF3D6'
    c.beginPath()
    c.ellipse(0, 0, 112, 26, 0, 0, Math.PI * 2)
    c.stroke()
    const g = c.createRadialGradient(-16, -18, 4, 0, 0, 56)
    g.addColorStop(0, '#F7C97A')
    g.addColorStop(1, '#D97F3E')
    c.fillStyle = g
    c.beginPath()
    c.arc(0, 0, 52, 0, Math.PI * 2)
    c.fill()
    c.beginPath()
    c.ellipse(0, 0, 112, 26, 0, 0, Math.PI)
    c.stroke()
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export async function mountGlobe(host: HTMLElement, opts: GlobeOptions): Promise<GlobeHandle> {
  const [THREE, landMod] = await Promise.all([import('three'), import('./earthLand.json')])
  const land = landMod.default as unknown as Land
  const low = { on: opts.quality === 'low' }
  const renderer = new THREE.WebGLRenderer({ antialias: !low.on, alpha: true })
  renderer.setPixelRatio(low.on ? 1 : opts.pixelRatio)
  renderer.setSize(opts.width, opts.height)
  renderer.setClearColor(0x000000, 0)
  const el = renderer.domElement
  el.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
  host.appendChild(el)

  const garbage: Array<{ dispose: () => void }> = []
  const own = <T extends { dispose: () => void }>(x: T): T => {
    garbage.push(x)
    return x
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, opts.width / opts.height, 0.1, 60)
  camera.position.z = CAM_Z
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8d8f0, 2.5))
  const sun = new THREE.DirectionalLight(0xfff4e0, 0.9)
  sun.position.set(0.8, 1, 4)
  scene.add(sun)

  // Sao
  const starCount = low.on ? 350 : 1100
  const pos = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    pos[i * 3] = (((i * 7919) % 1000) / 1000 - 0.5) * 16
    pos[i * 3 + 1] = (((i * 6151) % 1000) / 1000 - 0.5) * 9
    pos[i * 3 + 2] = -3 - ((i * 104729) % 700) / 100
  }
  const starGeo = own(new THREE.BufferGeometry())
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  scene.add(
    new THREE.Points(
      starGeo,
      own(
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.028, transparent: true, opacity: 0.9 })
      )
    )
  )

  const sprite = (tex: ThreeNS.Texture, w: number, h: number): ThreeNS.Sprite => {
    own(tex)
    const s = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: tex, transparent: true })))
    s.scale.set(w, h, 1)
    return s
  }
  const halo = sprite(
    glowTexture(THREE, [
      [0, 'rgba(120,210,255,.9)'],
      [0.74, 'rgba(120,210,255,.8)'],
      [0.82, 'rgba(120,210,255,.32)'],
      [1, 'rgba(120,210,255,0)']
    ]),
    2.6,
    2.6
  )
  halo.position.z = -0.4
  scene.add(halo)
  const sunGlow = sprite(
    glowTexture(THREE, [
      [0, '#FFF6B8'],
      [0.28, '#FFD24A'],
      [0.5, 'rgba(255,170,60,.5)'],
      [1, 'rgba(255,150,40,0)']
    ]),
    1.5,
    1.5
  )
  sunGlow.position.set(1.72, -0.86, -0.2)
  scene.add(sunGlow)
  const planet = sprite(ringedPlanet(THREE), 0.52, 0.325)
  planet.position.set(1.48, 0.76, -0.4)
  scene.add(planet)

  // Quả cầu: `earth` xoay theo kéo tay, kinh độ 0 quay về phía camera khi rotation.y = 0
  const earth = new THREE.Group()
  earth.rotation.order = 'XYZ'
  scene.add(earth)
  const ball = new THREE.Mesh(
    own(new THREE.SphereGeometry(1, 64, 48)),
    own(
      new THREE.MeshPhongMaterial({
        map: own(earthTexture(THREE, land, low.on ? 1024 : 4096)),
        shininess: 14,
        specular: 0x335577
      })
    )
  )
  ball.rotation.y = -Math.PI / 2
  earth.add(ball)

  const dirOf = (lat: number, lon: number): ThreeNS.Vector3 =>
    new THREE.Vector3(
      Math.cos(lat * RAD) * Math.sin(lon * RAD),
      Math.sin(lat * RAD),
      Math.cos(lat * RAD) * Math.cos(lon * RAD)
    )

  const loader = new THREE.TextureLoader()
  const picks: ThreeNS.Sprite[] = []
  const addSpot = (s: GlobeSpot, pick: boolean): void => {
    const tex = own(
      loader.load(s.image, (t) => {
        const img = t.image as HTMLImageElement
        const w = s.size ?? 0.27
        m.scale.set(w, (w * img.height) / img.width, 1)
      })
    )
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = own(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
    const m = new THREE.Sprite(mat)
    m.center.set(0.5, 0.14)
    m.position.copy(dirOf(s.lat, s.lon).multiplyScalar(1.005))
    m.userData.spotId = s.id
    m.userData.dir = dirOf(s.lat, s.lon)
    earth.add(m)
    if (pick) picks.push(m)
  }
  opts.spots.forEach((s) => addSpot(s, true))
  const decor: ThreeNS.Sprite[] = []
  for (const d of opts.decor ?? []) {
    addSpot(d, false)
    decor.push(earth.children[earth.children.length - 1] as ThreeNS.Sprite)
  }

  // Vũ trụ quay quanh quả cầu
  const moon = new THREE.Mesh(
    own(new THREE.SphereGeometry(0.1, 24, 16)),
    own(new THREE.MeshLambertMaterial({ map: own(moonTexture(THREE)) }))
  )
  scene.add(moon)

  const satellite = new THREE.Group()
  const gold = own(new THREE.MeshLambertMaterial({ color: 0xf2b632 }))
  const panel = own(new THREE.MeshLambertMaterial({ color: 0x2f6fd0 }))
  satellite.add(new THREE.Mesh(own(new THREE.BoxGeometry(0.05, 0.05, 0.05)), gold))
  for (const sign of [-1, 1]) {
    const p = new THREE.Mesh(own(new THREE.BoxGeometry(0.1, 0.045, 0.006)), panel)
    p.position.x = sign * 0.08
    satellite.add(p)
  }
  scene.add(satellite)

  const rocket = new THREE.Group()
  const white = own(new THREE.MeshLambertMaterial({ color: 0xffffff }))
  const red = own(new THREE.MeshLambertMaterial({ color: 0xd32f2f }))
  const hull = new THREE.Mesh(own(new THREE.CylinderGeometry(0.03, 0.038, 0.13, 16)), white)
  const nose = new THREE.Mesh(own(new THREE.ConeGeometry(0.03, 0.06, 16)), red)
  nose.position.y = 0.095
  const fin = new THREE.Mesh(own(new THREE.ConeGeometry(0.052, 0.05, 3)), red)
  fin.position.y = -0.07
  const flame = new THREE.Mesh(
    own(new THREE.ConeGeometry(0.022, 0.07, 12)),
    own(new THREE.MeshBasicMaterial({ color: 0xffa62e }))
  )
  flame.rotation.x = Math.PI
  flame.position.y = -0.125
  rocket.add(hull, nose, fin, flame)
  scene.add(rocket)

  const placeSpace = (t: number): void => {
    moon.position.set(Math.cos(t * 0.12 + 1) * 1.46, 0.72, Math.sin(t * 0.12 + 1) * 1.1 - 0.3)
    moon.visible = moon.position.z > -0.2 || Math.abs(moon.position.x) > 1.05
    const a = t * 0.4
    satellite.position.set(Math.cos(a) * 1.28, -Math.sin(a) * 0.5 - 0.5, Math.sin(a) * 1.1)
    satellite.rotation.z = a
    const r = t * 0.28 + 2
    rocket.position.set(Math.cos(r) * 1.32, Math.sin(r) * 0.92, 0.55)
    rocket.rotation.z = r
  }

  // Xoay
  const view = { yaw: -30 * RAD, pitch: 0.18 }
  let vel = 0
  let paused = opts.reduceMotion
  let goal: { yaw: number; pitch: number } | null = null
  let down: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null
  let dirty = true

  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const pickAt = (e: PointerEvent): string | null => {
    const r = el.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const seen = picks.filter((m) => m.visible)
    const ballHit = ray.intersectObject(ball)[0]?.distance ?? Infinity
    const hit = ray.intersectObjects(seen, false)[0]
    if (!hit || hit.distance > ballHit + 0.3) return null
    return String(hit.object.userData.spotId)
  }
  const onDown = (e: PointerEvent): void => {
    el.setPointerCapture(e.pointerId)
    down = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch, moved: false }
    vel = 0
    goal = null
  }
  const onMove = (e: PointerEvent): void => {
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    if (Math.hypot(dx, dy) > CLICK_PX) down.moved = true
    if (!down.moved) return
    const yaw = down.yaw + dx * DRAG
    vel = yaw - view.yaw
    view.yaw = yaw
    view.pitch = Math.max(-MAX_TILT, Math.min(MAX_TILT, down.pitch + dy * DRAG))
    dirty = true
  }
  const onUp = (e: PointerEvent): void => {
    if (down && !down.moved) opts.onSelect(pickAt(e))
    down = null
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)

  const watchFps = fpsGuard(() => {
    low.on = true
    renderer.setPixelRatio(1)
  })

  const tmp = new THREE.Vector3()
  const report = (): void => {
    const out: Array<{ id: string; x: number; y: number; near: number }> = []
    const put = (id: string, dir: ThreeNS.Vector3, lift: number): void => {
      tmp.copy(dir).multiplyScalar(lift).applyEuler(earth.rotation)
      const near = tmp.z / lift
      tmp.project(camera)
      out.push({
        id,
        x: ((tmp.x + 1) / 2) * opts.width,
        y: ((1 - tmp.y) / 2) * opts.height,
        near
      })
    }
    for (const m of picks) {
      m.visible = m.userData.dir.clone().applyEuler(earth.rotation).z > SPOT_MIN_Z
      put(String(m.userData.spotId), m.userData.dir as ThreeNS.Vector3, 1)
    }
    for (const m of decor) {
      m.visible = m.userData.dir.clone().applyEuler(earth.rotation).z > SPOT_MIN_Z
    }
    for (const l of opts.labels) put(l.id, dirOf(l.lat, l.lon), 1)
    opts.onFrame(out)
  }

  let raf = 0
  let prev = performance.now()
  let last = 0
  const frame = (now: number): void => {
    raf = requestAnimationFrame(frame)
    watchFps(now)
    const dt = Math.min(0.1, (now - prev) / 1000)
    prev = now
    let moving = dirty
    if (goal) {
      const d = 1 - Math.exp(-dt * 4)
      const dy = Math.atan2(Math.sin(goal.yaw - view.yaw), Math.cos(goal.yaw - view.yaw))
      view.yaw += dy * d
      view.pitch += (goal.pitch - view.pitch) * d
      moving = true
      if (Math.abs(dy) < 0.002 && Math.abs(goal.pitch - view.pitch) < 0.002) goal = null
    } else if (!down) {
      if (Math.abs(vel) > 0.0002) {
        view.yaw += vel
        vel *= 0.93
        moving = true
      } else if (!paused) {
        view.yaw += SPIN * dt
        moving = true
      }
    }
    const spaceMoves = !opts.reduceMotion
    const budget = down || goal ? 0 : low.on ? 50 : 30
    if ((!moving && !spaceMoves) || now - last < budget) return
    last = now
    dirty = false
    earth.rotation.set(view.pitch, view.yaw, 0)
    placeSpace(spaceMoves ? now / 1000 : 1)
    report()
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(frame)
  const onVisible = (): void => {
    cancelAnimationFrame(raf)
    raf = 0
    if (document.visibilityState === 'visible') {
      prev = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }
  document.addEventListener('visibilitychange', onVisible)

  return {
    focus(id) {
      const s = opts.spots.find((x) => x.id === id)
      if (!s) return
      paused = true
      vel = 0
      // Nhích xuống một chút để công trình và biển tên nằm giữa khung
      const target = { yaw: -s.lon * RAD, pitch: (s.lat - 8) * RAD }
      if (opts.reduceMotion) {
        view.yaw = target.yaw
        view.pitch = target.pitch
        dirty = true
      } else goal = target
    },
    resume() {
      paused = opts.reduceMotion
    },
    dispose() {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisible)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      for (const g of garbage) g.dispose()
      renderer.dispose()
      el.remove()
    }
  }
}
