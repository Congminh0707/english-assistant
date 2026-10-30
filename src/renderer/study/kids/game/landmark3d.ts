// Dựng công trình voxel thành cảnh three.js xoay được (docs/19-kids-world.md §5.2): greedy mesh từ lưới voxel, kéo để
// xoay, tự xoay chậm khi không chạm. three.js nạp lười (chunk riêng). Trả hàm giải phóng GPU/sự kiện.
import { meshVoxels } from '@shared/voxels/mesh'
import { landmarkGrid } from '@shared/voxels/landmarks'

export async function mountLandmark3D(
  host: HTMLElement,
  id: string,
  width: number,
  height: number,
  spinning: boolean
): Promise<() => void> {
  const grid = landmarkGrid(id)
  if (!grid) throw new Error('no model')
  const THREE = await import('three')
  const mesh = meshVoxels(grid)
  const colors = mesh.colors.map((c) => Math.pow(c, 2.2)) // sRGB → tuyến tính cho vertex color

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(mesh.indices)
  geometry.translate(-grid.sx / 2, 0, -grid.sz / 2)
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })
  const model = new THREE.Mesh(geometry, material)

  const scene = new THREE.Scene()
  const pivot = new THREE.Group()
  pivot.add(model)
  scene.add(pivot)
  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.4)
  sun.position.set(-30, 60, 40)
  scene.add(sun)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height)
  host.appendChild(renderer.domElement)

  const radius = Math.hypot(grid.sx, grid.sz) / 2
  const camera = new THREE.PerspectiveCamera(34, width / height, 1, 400)
  const dist = Math.max(radius * 3.1, grid.sy * 2.9)
  let yaw = Math.PI / 4
  let pitch = 0.5
  const target = new THREE.Vector3(0, grid.sy * 0.32, 0)
  const place = (): void => {
    camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * dist,
      target.y + Math.sin(pitch) * dist,
      Math.cos(yaw) * Math.cos(pitch) * dist
    )
    camera.lookAt(target)
  }

  let dragging = false
  let lastX = 0
  let lastY = 0
  let idle = 0
  const el = renderer.domElement
  el.style.touchAction = 'none'
  const down = (e: PointerEvent): void => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    el.setPointerCapture(e.pointerId)
  }
  const move = (e: PointerEvent): void => {
    if (!dragging) return
    yaw -= (e.clientX - lastX) * 0.012
    pitch = Math.min(1.1, Math.max(0.15, pitch + (e.clientY - lastY) * 0.008))
    lastX = e.clientX
    lastY = e.clientY
    idle = 0
  }
  const up = (): void => {
    dragging = false
  }
  el.addEventListener('pointerdown', down)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)

  let raf = 0
  let last = performance.now()
  const spin = spinning
  const frame = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    idle += dt
    if (spin && !dragging && idle > 1.2) yaw += dt * 0.35
    place()
    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }
  const visibility = (): void => {
    cancelAnimationFrame(raf)
    if (!document.hidden) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }
  document.addEventListener('visibilitychange', visibility)
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    document.removeEventListener('visibilitychange', visibility)
    el.removeEventListener('pointerdown', down)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerup', up)
    el.removeEventListener('pointercancel', up)
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    el.remove()
  }
}
