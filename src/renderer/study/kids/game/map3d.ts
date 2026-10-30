// Bản đồ 3D tầng Việt Nam (three.js, nạp lười): địa hình voxel dựng từ vnMap (src/shared/voxels/vnTerrain.ts),
// công trình voxel đặt ở vị trí bệ của bố cục, nhãn tên trên từng nơi. Kéo = trượt bản đồ, kéo chuột phải / Shift = xoay,
// lăn chuột = zoom, chạm công trình = chọn nơi (camera bay tới). Vẽ theo yêu cầu (khi có chuyển động), dừng khi ẩn.
// docs/19-kids-world.md §5.2
import type * as ThreeNS from 'three'
import { landmarkGrid } from '@shared/voxels/landmarks'
import { meshVoxels, type VoxelMesh } from '@shared/voxels/mesh'
import { SEA_TOP, TERRAIN_CELL, buildVnTerrain, terrainHeightAt } from '@shared/voxels/vnTerrain'

type Three = typeof ThreeNS

export interface Map3DPlace {
  id: string
  title: string
  vi: string
  landmark: string
  /** Vị trí bệ (đơn vị sân khấu) */
  x: number
  y: number
  done: boolean
}

export interface Map3DOptions {
  places: Map3DPlace[]
  width: number
  height: number
  pixelRatio: number
  reduceMotion: boolean
  onSelect: (id: string | null) => void
}

export interface Map3DHandle {
  /** Bay camera tới một nơi (hoặc về toàn cảnh khi null) */
  focus: (id: string | null) => void
  dispose: () => void
}

/** Kích thước chân công trình trên bản đồ, tính bằng ô địa hình */
const LANDMARK_SPAN = 6.5

function geometryOf(THREE: Three, mesh: VoxelMesh): ThreeNS.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3))
  g.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(
      mesh.colors.map((c) => Math.pow(c, 2.2)), // sRGB → tuyến tính cho vertex color
      3
    )
  )
  g.setIndex(mesh.indices)
  return g
}

function labelTexture(THREE: Three, p: Map3DPlace): { tex: ThreeNS.CanvasTexture; ratio: number } {
  const w = 360
  const h = 112
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const c = cv.getContext('2d')
  if (c) {
    c.beginPath()
    c.roundRect(4, 4, w - 8, h - 8, 28)
    c.fillStyle = p.done ? '#e6f7d8' : '#fff8e2'
    c.fill()
    c.lineWidth = 6
    c.strokeStyle = '#3b2a3a'
    c.stroke()
    c.fillStyle = '#3b2a3a'
    c.textAlign = 'center'
    c.font = '800 44px system-ui, sans-serif'
    c.fillText(p.title, w / 2, 58)
    c.font = '600 26px system-ui, sans-serif'
    c.fillStyle = '#6b5566'
    c.fillText(p.vi, w / 2, 94)
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return { tex, ratio: h / w }
}

export async function mountVnMap3D(host: HTMLElement, opts: Map3DOptions): Promise<Map3DHandle> {
  const THREE = await import('three')
  const terrain = buildVnTerrain()
  const { cols, rows } = terrain

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(opts.pixelRatio)
  renderer.setSize(opts.width, opts.height)
  renderer.domElement.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;touch-action:none'
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 1.55))
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.3)
  sun.position.set(-40, 90, 60)
  scene.add(sun)

  const disposables: Array<{ dispose: () => void }> = []
  const own = <T extends { dispose: () => void }>(x: T): T => {
    disposables.push(x)
    return x
  }

  // địa hình + mặt biển rộng xung quanh
  const terrainGeo = own(geometryOf(THREE, meshVoxels(terrain.grid)))
  const material = own(new THREE.MeshLambertMaterial({ vertexColors: true }))
  scene.add(new THREE.Mesh(terrainGeo, material))
  const sea = new THREE.Mesh(
    own(new THREE.PlaneGeometry(1400, 1400)),
    own(new THREE.MeshLambertMaterial({ color: 0x4aa8d8 }))
  )
  sea.rotation.x = -Math.PI / 2
  sea.position.set(cols / 2, SEA_TOP - 0.03, rows / 2)
  scene.add(sea)

  // công trình + nhãn
  const pickables: ThreeNS.Object3D[] = []
  const anchors = new Map<string, ThreeNS.Vector3>()
  for (const p of opts.places) {
    const grid = landmarkGrid(p.landmark)
    if (!grid) continue
    const k = LANDMARK_SPAN / Math.max(grid.sx, grid.sz)
    const mesh = new THREE.Mesh(own(geometryOf(THREE, meshVoxels(grid))), material)
    const gx = p.x / TERRAIN_CELL
    const gz = p.y / TERRAIN_CELL
    const gy = terrainHeightAt(terrain, { x: p.x, y: p.y })
    mesh.scale.setScalar(k)
    mesh.position.set(gx - (grid.sx * k) / 2, gy, gz - (grid.sz * k) / 2)
    mesh.userData.placeId = p.id
    scene.add(mesh)
    pickables.push(mesh)
    anchors.set(p.id, new THREE.Vector3(gx, gy + 1, gz))
    const { tex, ratio } = labelTexture(THREE, p)
    own(tex)
    const sprite = new THREE.Sprite(
      own(new THREE.SpriteMaterial({ map: tex, depthTest: false, sizeAttenuation: false }))
    )
    sprite.scale.set(0.095, 0.095 * ratio, 1) // cỡ không đổi theo zoom (đơn vị = chiều cao khung hình)
    sprite.position.set(gx, gy + 0.2, gz + LANDMARK_SPAN / 2 + 1.2)
    sprite.renderOrder = 10
    scene.add(sprite)
  }

  // camera: quay quanh `look`, đứng cách `dist`
  const camera = new THREE.PerspectiveCamera(36, opts.width / opts.height, 1, 600)
  const home = { x: cols / 2, z: rows / 2, dist: 85, pitch: 0.85, yaw: 0 }
  const cam = { ...home }
  const goal = { ...home }
  let dirty = true

  const clampGoal = (): void => {
    goal.pitch = Math.min(1.35, Math.max(0.45, goal.pitch))
    goal.dist = Math.min(150, Math.max(22, goal.dist))
    goal.x = Math.min(cols, Math.max(0, goal.x))
    goal.z = Math.min(rows, Math.max(0, goal.z))
  }
  const place = (): void => {
    const look = new THREE.Vector3(cam.x, 2, cam.z)
    camera.position.set(
      look.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist,
      look.y + Math.sin(cam.pitch) * cam.dist,
      look.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist
    )
    camera.lookAt(look)
  }

  const focus = (id: string | null): void => {
    const a = id ? anchors.get(id) : null
    if (a) Object.assign(goal, { x: a.x, z: a.z, dist: 34, pitch: 0.9 })
    else Object.assign(goal, home)
    clampGoal()
    if (opts.reduceMotion) Object.assign(cam, goal)
    dirty = true
  }

  // thao tác
  const el = renderer.domElement
  let down: { x: number; y: number; moved: boolean; rotate: boolean } | null = null
  const raycaster = new THREE.Raycaster()
  const onDown = (e: PointerEvent): void => {
    down = { x: e.clientX, y: e.clientY, moved: false, rotate: e.button === 2 || e.shiftKey }
    el.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent): void => {
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    if (!down.moved && Math.hypot(dx, dy) < 6) return
    down.moved = true
    const rect = el.getBoundingClientRect()
    const unit = (opts.width / rect.width) * 0.03 * (cam.dist / 60)
    if (down.rotate) {
      goal.yaw -= dx * 0.008 * (opts.width / rect.width)
      goal.pitch += dy * 0.006 * (opts.width / rect.width)
    } else {
      // trượt theo hướng nhìn hiện tại
      const sx = Math.cos(cam.yaw)
      const sz = -Math.sin(cam.yaw)
      const fx = Math.sin(cam.yaw)
      const fz = Math.cos(cam.yaw)
      goal.x -= (dx * sx + dy * fx) * unit
      goal.z -= (dx * sz + dy * fz) * unit
    }
    down.x = e.clientX
    down.y = e.clientY
    clampGoal()
    if (opts.reduceMotion) Object.assign(cam, goal)
    dirty = true
  }
  const onUp = (e: PointerEvent): void => {
    const d = down
    down = null
    if (!d || d.moved) return
    const rect = el.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    )
    raycaster.setFromCamera(ndc, camera)
    const hit = raycaster.intersectObjects(pickables, false)[0]
    const id = (hit?.object.userData.placeId as string | undefined) ?? null
    opts.onSelect(id)
    if (id) focus(id)
  }
  const onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    goal.dist *= e.deltaY > 0 ? 1.12 : 0.89
    clampGoal()
    if (opts.reduceMotion) Object.assign(cam, goal)
    dirty = true
  }
  const noMenu = (e: Event): void => e.preventDefault()
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', () => (down = null))
  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('contextmenu', noMenu)

  // vòng vẽ theo yêu cầu: chỉ vẽ khi camera đang đổi
  let raf = 0
  let prev = performance.now()
  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - prev) / 1000)
    prev = now
    const k = 1 - Math.exp(-dt * 5)
    let moving = false
    for (const key of ['x', 'z', 'dist', 'pitch', 'yaw'] as const) {
      const diff = goal[key] - cam[key]
      if (Math.abs(diff) > 0.001) {
        cam[key] += diff * k
        moving = true
      }
    }
    if (moving || dirty) {
      place()
      renderer.render(scene, camera)
      dirty = moving
    }
    raf = requestAnimationFrame(frame)
  }
  const visibility = (): void => {
    cancelAnimationFrame(raf)
    if (!document.hidden) {
      prev = performance.now()
      dirty = true
      raf = requestAnimationFrame(frame)
    }
  }
  document.addEventListener('visibilitychange', visibility)
  raf = requestAnimationFrame(frame)

  return {
    focus,
    dispose: () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', visibility)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('contextmenu', noMenu)
      for (const d of disposables) d.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      el.remove()
    }
  }
}
