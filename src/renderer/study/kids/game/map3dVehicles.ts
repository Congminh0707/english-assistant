// Phương tiện 3D của bản đồ game (ô tô, thuyền buồm, máy bay) và đường đi: dựng bằng hình khối three.js, có hoạt ảnh thật —
// bánh xe lăn theo quãng đường, thân xe rung, thuyền chòng chành + sóng đuôi, máy bay quay cánh quạt + nghiêng khi vòng.
// Mọi kích thước tính theo đơn vị thế giới (1 đơn vị = 22,5 đơn vị sân khấu). docs/19-kids-world.md §5.4
import type * as ThreeNS from 'three'

type Three = typeof ThreeNS

export type VehicleKind = 'car' | 'boat' | 'plane'

/** Độ cao chỗ ngồi của thú cưng so với điểm đặt phương tiện (đơn vị thế giới) */
export const SEAT: Record<VehicleKind, number> = { car: 1.15, boat: 0.95, plane: 0.85 }

export interface VehicleState {
  kind: VehicleKind | null
  /** Vị trí thế giới: x, z trên mặt phẳng, y = độ cao mặt đất/nước tại đó + độ nhấc */
  x: number
  y: number
  z: number
  /** Hướng đi (rad, quanh trục y; 0 = hướng +x) */
  heading: number
}

interface Puff {
  mesh: ThreeNS.Mesh
  life: number
  max: number
  grow: number
}

const std = (THREE: Three, color: number): ThreeNS.MeshLambertMaterial =>
  new THREE.MeshLambertMaterial({ color })

function box(
  THREE: Three,
  mat: ThreeNS.Material,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0
): ThreeNS.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  return m
}

function buildCar(THREE: Three): { group: ThreeNS.Group; wheels: ThreeNS.Object3D[] } {
  const g = new THREE.Group()
  const red = std(THREE, 0xe24a3b)
  const dark = std(THREE, 0x2b2b36)
  const light = std(THREE, 0xf6ecd2)
  const glass = std(THREE, 0x9fd3ef)
  g.add(box(THREE, red, 2.3, 0.5, 1.1, 0, 0.62, 0))
  g.add(box(THREE, red, 0.7, 0.2, 1.0, 0.75, 0.97, 0)) // nắp ca-pô
  g.add(box(THREE, light, 1.15, 0.5, 0.96, -0.25, 1.1, 0))
  g.add(box(THREE, glass, 1.17, 0.26, 0.98, -0.25, 1.14, 0))
  g.add(box(THREE, dark, 0.12, 0.2, 1.14, 1.16, 0.5, 0)) // cản trước
  g.add(box(THREE, std(THREE, 0xffe27a), 0.06, 0.14, 0.2, 1.17, 0.7, 0.36))
  g.add(box(THREE, std(THREE, 0xffe27a), 0.06, 0.14, 0.2, 1.17, 0.7, -0.36))
  g.add(box(THREE, std(THREE, 0xc0392b), 0.06, 0.12, 0.9, -1.16, 0.72, 0)) // đèn hậu
  const wheels: ThreeNS.Object3D[] = []
  for (const [x, z] of [
    [0.75, 0.58],
    [0.75, -0.58],
    [-0.75, 0.58],
    [-0.75, -0.58]
  ]) {
    const wheel = new THREE.Group()
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16), dark)
    tire.rotation.x = Math.PI / 2
    tire.castShadow = true
    wheel.add(tire)
    // nan hoa: để thấy bánh đang quay
    wheel.add(box(THREE, light, 0.42, 0.07, 0.24))
    wheel.add(box(THREE, light, 0.07, 0.42, 0.24))
    wheel.position.set(x, 0.3, z)
    g.add(wheel)
    wheels.push(wheel)
  }
  return { group: g, wheels }
}

function buildBoat(THREE: Three): { group: ThreeNS.Group; hull: ThreeNS.Group } {
  const g = new THREE.Group()
  const hull = new THREE.Group()
  const wood = std(THREE, 0xa5522e)
  const deck = std(THREE, 0xd9a766)
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  hull.add(box(THREE, wood, 2.2, 0.42, 1.0, 0, 0.1, 0))
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 4), wood)
  bow.rotation.z = -Math.PI / 2
  bow.rotation.x = Math.PI / 4
  bow.position.set(1.55, 0.1, 0)
  bow.castShadow = true
  hull.add(bow)
  hull.add(box(THREE, std(THREE, 0xe24a3b), 2.25, 0.1, 1.04, 0, 0.3, 0)) // viền đỏ
  hull.add(box(THREE, deck, 2.0, 0.06, 0.82, 0, 0.34, 0))
  hull.add(box(THREE, deck, 0.7, 0.4, 0.6, -0.7, 0.55, 0)) // mui
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), std(THREE, 0x5e3b22))
  mast.position.set(0.2, 1.5, 0)
  hull.add(mast)
  const sail = new THREE.Shape()
  sail.moveTo(0, 0)
  sail.lineTo(0, 1.9)
  sail.lineTo(1.25, 0.1)
  sail.closePath()
  const sailMesh = new THREE.Mesh(new THREE.ShapeGeometry(sail), white)
  sailMesh.position.set(0.28, 0.55, 0)
  sailMesh.rotation.y = Math.PI / 2 - 0.25
  hull.add(sailMesh)
  hull.add(box(THREE, std(THREE, 0xe24a3b), 0.5, 0.2, 0.04, 0.45, 2.6, 0)) // cờ
  g.add(hull)
  return { group: g, hull }
}

function buildPlane(THREE: Three): { group: ThreeNS.Group; prop: ThreeNS.Group } {
  const g = new THREE.Group()
  const white = std(THREE, 0xf8f8f8)
  const red = std(THREE, 0xe24a3b)
  const blue = std(THREE, 0x3f78c8)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.26, 2.6, 14), white)
  body.rotation.z = Math.PI / 2
  body.castShadow = true
  g.add(body)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.55, 14), red)
  nose.rotation.z = -Math.PI / 2
  nose.position.set(1.55, 0, 0)
  nose.castShadow = true
  g.add(nose)
  g.add(box(THREE, blue, 0.75, 0.07, 3.7, 0.1, -0.05, 0)) // cánh
  g.add(box(THREE, blue, 0.5, 0.05, 1.3, -1.15, 0.02, 0)) // cánh đuôi ngang
  g.add(box(THREE, red, 0.55, 0.75, 0.06, -1.15, 0.38, 0)) // cánh đuôi đứng
  g.add(box(THREE, std(THREE, 0x9fd3ef), 0.55, 0.22, 0.5, 0.45, 0.32, 0)) // buồng lái
  const prop = new THREE.Group()
  prop.position.set(1.85, 0, 0)
  prop.add(box(THREE, std(THREE, 0x2b2b36), 0.06, 1.5, 0.16))
  prop.add(box(THREE, std(THREE, 0x2b2b36), 0.06, 0.16, 1.5))
  const spinner = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), red)
  prop.add(spinner)
  g.add(prop)
  return { group: g, prop }
}

export interface VehicleRig {
  update: (s: VehicleState, dt: number, t: number) => void
  dispose: () => void
}

export function createVehicleRig(THREE: Three, scene: ThreeNS.Scene): VehicleRig {
  const root = new THREE.Group()
  root.visible = false
  scene.add(root)
  const car = buildCar(THREE)
  const boat = buildBoat(THREE)
  const plane = buildPlane(THREE)
  const parts: Record<VehicleKind, ThreeNS.Group> = {
    car: car.group,
    boat: boat.group,
    plane: plane.group
  }
  for (const p of Object.values(parts)) {
    p.visible = false
    root.add(p)
  }

  // khói ống xả / bọt sóng đuôi: vài quả cầu nhỏ tái sử dụng
  const puffs: Puff[] = []
  for (let i = 0; i < 14; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    )
    mesh.visible = false
    scene.add(mesh)
    puffs.push({ mesh, life: 0, max: 0.9, grow: 1 })
  }
  let nextPuff = 0
  let lastX = 0
  let lastZ = 0
  let lastHeading = 0
  let hasLast = false
  let sinceSpawn = 0

  const spawn = (
    x: number,
    y: number,
    z: number,
    color: number,
    max: number,
    grow: number
  ): void => {
    const p = puffs[nextPuff++ % puffs.length]
    p.life = max
    p.max = max
    p.grow = grow
    p.mesh.position.set(x, y, z)
    p.mesh.scale.setScalar(1)
    ;(p.mesh.material as ThreeNS.MeshBasicMaterial).color.setHex(color)
    p.mesh.visible = true
  }

  return {
    update(s, dt, t) {
      for (const p of puffs) {
        if (p.life <= 0) continue
        p.life -= dt
        const u = 1 - Math.max(0, p.life) / p.max
        p.mesh.scale.setScalar(1 + u * p.grow)
        p.mesh.position.y += dt * 0.5
        ;(p.mesh.material as ThreeNS.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - u))
        if (p.life <= 0) p.mesh.visible = false
      }
      if (!s.kind) {
        root.visible = false
        hasLast = false
        return
      }
      root.visible = true
      for (const k of Object.keys(parts) as VehicleKind[]) parts[k].visible = k === s.kind
      const moved = hasLast ? Math.hypot(s.x - lastX, s.z - lastZ) : 0
      const speed = dt > 0 ? moved / dt : 0
      const turn =
        hasLast && dt > 0
          ? Math.atan2(Math.sin(s.heading - lastHeading), Math.cos(s.heading - lastHeading)) / dt
          : 0
      lastX = s.x
      lastZ = s.z
      lastHeading = s.heading
      hasLast = true
      root.position.set(s.x, s.y, s.z)
      root.rotation.set(0, -s.heading, 0)
      const run = Math.min(1, speed / 6)
      if (s.kind === 'car') {
        for (const w of car.wheels) w.rotation.z -= moved / 0.3
        car.group.position.y = Math.abs(Math.sin(t * 22)) * 0.03 * run
        car.group.rotation.z = Math.sin(t * 9) * 0.012 * run
        sinceSpawn += dt
        if (sinceSpawn > 0.11 && run > 0.15) {
          sinceSpawn = 0
          spawn(
            s.x - Math.cos(s.heading) * 1.4,
            s.y + 0.4,
            s.z + Math.sin(s.heading) * 1.4,
            0xd9d9d9,
            0.7,
            2.2
          )
        }
      } else if (s.kind === 'boat') {
        boat.hull.rotation.z = Math.sin(t * 2.3) * 0.07
        boat.hull.rotation.x = Math.sin(t * 1.7) * 0.05
        boat.hull.position.y = Math.sin(t * 2.8) * 0.06
        sinceSpawn += dt
        if (sinceSpawn > 0.09 && run > 0.1) {
          sinceSpawn = 0
          spawn(
            s.x - Math.cos(s.heading) * 1.3,
            s.y + 0.12,
            s.z + Math.sin(s.heading) * 1.3,
            0xffffff,
            1.1,
            3.2
          )
        }
      } else {
        plane.prop.rotation.x += dt * 45
        plane.group.rotation.x = Math.max(-0.45, Math.min(0.45, -turn * 0.22))
        plane.group.rotation.z = Math.sin(t * 2) * 0.03
        plane.group.position.y = Math.sin(t * 3) * 0.08
      }
    },
    dispose() {
      scene.remove(root)
      for (const p of puffs) {
        scene.remove(p.mesh)
        p.mesh.geometry.dispose()
        ;(p.mesh.material as ThreeNS.Material).dispose()
      }
      root.traverse((o) => {
        const m = o as ThreeNS.Mesh
        if (m.geometry) m.geometry.dispose()
        if (m.material) (m.material as ThreeNS.Material).dispose()
      })
    }
  }
}

export interface RoutePoint {
  x: number
  y: number
  sea?: boolean
}

/** Đường bộ (dải đất nện + vạch trắng giữa) uốn theo địa hình và đường phà (chấm trắng) — mỗi tuyến là dãy điểm đơn vị thế giới */
export function buildRoads(
  THREE: Three,
  scene: ThreeNS.Scene,
  routes: ReadonlyArray<ReadonlyArray<RoutePoint>>,
  heightAt: (x: number, z: number) => number
): { dispose: () => void } {
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const quad = (a: number[], b: number[], c: number[], d: number[], rgb: number[]): void => {
    const base = pos.length / 3
    for (const p of [a, b, c, d]) {
      pos.push(p[0], p[1], p[2])
      col.push(rgb[0], rgb[1], rgb[2])
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  const lin = (hex: number): number[] =>
    [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => Math.pow(v / 255, 2.2))
  const dirt = lin(0xd8c49a)
  const edge = lin(0x9a825c)
  const paint = lin(0xfff6dc)
  const dots = lin(0xffffff)
  const lift = (x: number, z: number, up: number): number => Math.max(0.06, heightAt(x, z)) + up

  for (const route of routes) {
    // lấy mẫu đều ~0.3 đơn vị
    const pts: Array<{ x: number; z: number; sea: boolean }> = []
    for (let i = 0; i + 1 < route.length; i++) {
      const a = route[i]
      const b = route[i + 1]
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const n = Math.max(1, Math.ceil(len / 0.3))
      for (let k = 0; k < n; k++) {
        const t = k / n
        pts.push({ x: a.x + (b.x - a.x) * t, z: a.y + (b.y - a.y) * t, sea: !!(b.sea ?? a.sea) })
      }
    }
    const last = route[route.length - 1]
    if (last) pts.push({ x: last.x, z: last.y, sea: !!last.sea })
    let travelled = 0
    for (let i = 0; i + 1 < pts.length; i++) {
      const p = pts[i]
      const q = pts[i + 1]
      const dx = q.x - p.x
      const dz = q.z - p.z
      const len = Math.hypot(dx, dz) || 1
      const tx = dx / len
      const tz = dz / len
      const nx = -tz
      const nz = tx
      travelled += len
      if (p.sea || q.sea) {
        // đường phà: chấm trắng cách đều
        if (Math.floor(travelled / 0.9) !== Math.floor((travelled - len) / 0.9)) {
          const r = 0.12
          quad(
            [p.x - r, 0.14, p.z - r],
            [p.x - r, 0.14, p.z + r],
            [p.x + r, 0.14, p.z + r],
            [p.x + r, 0.14, p.z - r],
            dots
          )
        }
        continue
      }
      const ribbon = (w: number, up: number, rgb: number[]): void => {
        quad(
          [p.x + nx * w, lift(p.x + nx * w, p.z + nz * w, up), p.z + nz * w],
          [q.x + nx * w, lift(q.x + nx * w, q.z + nz * w, up), q.z + nz * w],
          [q.x - nx * w, lift(q.x - nx * w, q.z - nz * w, up), q.z - nz * w],
          [p.x - nx * w, lift(p.x - nx * w, p.z - nz * w, up), p.z - nz * w],
          rgb
        )
      }
      ribbon(0.42, 0.05, edge)
      ribbon(0.3, 0.075, dirt)
      if (Math.floor(travelled / 0.7) % 2 === 0) ribbon(0.035, 0.1, paint)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  scene.add(mesh)
  return {
    dispose: () => {
      scene.remove(mesh)
      geo.dispose()
      mat.dispose()
    }
  }
}
