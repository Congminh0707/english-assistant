// Phương tiện 3D của bản đồ game (xe jeep mui trần, thuyền buồm, máy bay cánh quạt) và đường đi — dựng bằng hình khối mịn
// (đùn profile có vát cạnh, tiện tròn) cùng phong cách địa hình; có hoạt ảnh thật: bánh xe lăn theo quãng đường + treo
// nhún + khói, thuyền chòng chành + buồm phồng + cờ phất + sóng đuôi, máy bay quay cánh quạt + nghiêng khi vòng + vệt mây.
// Kích thước mô hình tính theo đơn vị riêng (xe dài ~2,4) rồi nhân `scale` của bản đồ. docs/19-kids-world.md §5.4
import type * as ThreeNS from 'three'
import { toon } from './toon'

type Three = typeof ThreeNS

export type VehicleKind = 'car' | 'boat' | 'plane'

/** Độ cao chỗ ngồi của thú cưng so với điểm đặt phương tiện (đơn vị mô hình, chưa nhân scale) */
export const SEAT: Record<VehicleKind, number> = { car: 0.62, boat: 0.5, plane: 0.55 }

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

class Mats {
  private readonly cache = new Map<string, ThreeNS.MeshToonMaterial>()
  constructor(private readonly THREE: Three) {}
  get(
    color: number,
    extra: Partial<ThreeNS.MeshToonMaterialParameters> = {}
  ): ThreeNS.MeshToonMaterial {
    const key = `${color}|${JSON.stringify(extra)}`
    let m = this.cache.get(key)
    if (!m) {
      m = toon(this.THREE, { color, ...extra })
      this.cache.set(key, m)
    }
    return m
  }
}

function shadowed<T extends ThreeNS.Object3D>(o: T): T {
  o.traverse((c) => {
    const m = c as ThreeNS.Mesh
    if (m.isMesh) m.castShadow = true
  })
  return o
}

/** Đùn một profile (x dọc thân, y cao) theo bề ngang `width`, có vát cạnh */
function extrude(
  THREE: Three,
  shape: ThreeNS.Shape,
  width: number,
  bevel: number
): ThreeNS.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: width - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10
  })
  g.translate(0, 0, -(width - bevel * 2) / 2)
  return g
}

function buildCar(
  THREE: Three,
  mats: Mats
): { group: ThreeNS.Group; wheels: ThreeNS.Group[]; body: ThreeNS.Group } {
  const group = new THREE.Group()
  const body = new THREE.Group()
  // thân xe: profile bên hông (mũi bên phải +x)
  const s = new THREE.Shape()
  s.moveTo(-1.2, 0.18)
  s.lineTo(1.2, 0.18)
  s.quadraticCurveTo(1.32, 0.2, 1.3, 0.38)
  s.quadraticCurveTo(1.28, 0.5, 1.05, 0.55)
  s.lineTo(0.35, 0.58)
  s.lineTo(-0.9, 0.58)
  s.quadraticCurveTo(-1.28, 0.55, -1.3, 0.38)
  s.quadraticCurveTo(-1.32, 0.2, -1.2, 0.18)
  body.add(new THREE.Mesh(extrude(THREE, s, 1.12, 0.07), mats.get(0xe2483a)))
  // dải trắng + gầm
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.07, 1.18), mats.get(0xfff6dc))
  stripe.position.set(0, 0.36, 0)
  body.add(stripe)
  const under = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 1.0), mats.get(0x2b2b36))
  under.position.set(0, 0.14, 0)
  body.add(under)
  // kính chắn gió + khung
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.34, 1.0),
    mats.get(0x9fd3ef, { transparent: true, opacity: 0.7 })
  )
  glass.position.set(0.42, 0.78, 0)
  glass.rotation.z = -0.5
  body.add(glass)
  for (const z of [-0.5, 0.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), mats.get(0xfff6dc))
    post.position.set(0.42, 0.78, z)
    post.rotation.z = -0.5
    body.add(post)
  }
  // ghế + vô lăng
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.95), mats.get(0xf2c94c))
  seat.position.set(-0.4, 0.58, 0)
  body.add(seat)
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.95), mats.get(0xf2c94c))
  back.position.set(-0.78, 0.76, 0)
  body.add(back)
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 14), mats.get(0x2b2b36))
  wheel.position.set(0.18, 0.88, 0)
  wheel.rotation.y = Math.PI / 2
  wheel.rotation.x = 0.4
  body.add(wheel)
  // đèn pha tròn + lưới tản nhiệt + cản + đèn hậu + ống xả
  for (const z of [-0.36, 0.36]) {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 8),
      mats.get(0xffe27a, { emissive: new THREE.Color(0x6a5410) })
    )
    lamp.position.set(1.28, 0.42, z)
    body.add(lamp)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.18), mats.get(0xc0392b))
    tail.position.set(-1.3, 0.42, z * 0.9)
    body.add(tail)
  }
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.5), mats.get(0x2b2b36))
  grille.position.set(1.32, 0.34, 0)
  body.add(grille)
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 1.2), mats.get(0xd9d9d9))
  bumper.position.set(1.34, 0.2, 0)
  body.add(bumper)
  group.add(body)
  // bánh xe: lốp + vành + nan hoa (quay quanh trục z)
  const wheels: ThreeNS.Group[] = []
  for (const [x, z] of [
    [0.8, 0.62],
    [0.8, -0.62],
    [-0.8, 0.62],
    [-0.8, -0.62]
  ]) {
    const w = new THREE.Group()
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.1, 8, 18), mats.get(0x23232d))
    w.add(tire)
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14), mats.get(0xe8e8ee))
    rim.rotation.x = Math.PI / 2
    w.add(rim)
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.045, 0.14), mats.get(0x9a9aa6))
      spoke.rotation.z = (i * Math.PI) / 3
      w.add(spoke)
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mats.get(0xe2483a))
    hub.position.z = z > 0 ? 0.05 : -0.05
    w.add(hub)
    w.position.set(x, 0.3, z)
    group.add(w)
    wheels.push(w)
  }
  return { group: shadowed(group), wheels, body }
}

function buildBoat(
  THREE: Three,
  mats: Mats
): {
  group: ThreeNS.Group
  hull: ThreeNS.Group
  sail: ThreeNS.Mesh
  flag: ThreeNS.Mesh
  sailBase: Float32Array
} {
  const group = new THREE.Group()
  const hull = new THREE.Group()
  // thân thuyền: mũi nhọn cong lên, đáy tròn
  const s = new THREE.Shape()
  s.moveTo(-1.45, 0.62)
  s.quadraticCurveTo(-1.3, 0.05, -0.55, -0.02)
  s.lineTo(0.7, -0.02)
  s.quadraticCurveTo(1.5, 0.1, 1.95, 0.72)
  s.quadraticCurveTo(1.0, 0.5, -0.1, 0.46)
  s.lineTo(-1.45, 0.62)
  hull.add(new THREE.Mesh(extrude(THREE, s, 0.95, 0.09), mats.get(0xa5522e)))
  const rim = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.06, 1.0), mats.get(0xe2483a))
  rim.position.set(0.15, 0.55, 0)
  hull.add(rim)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.05, 0.8), mats.get(0xe6b877))
  deck.position.set(0, 0.42, 0)
  hull.add(deck)
  // mui + cửa sổ tròn
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.7), mats.get(0xf6ecd2))
  cabin.position.set(-0.85, 0.68, 0)
  hull.add(cabin)
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.0, 0.62, 0.3, 4), mats.get(0xc8322b))
  roof.rotation.y = Math.PI / 4
  roof.position.set(-0.85, 1.02, 0)
  roof.scale.set(1, 1, 0.8)
  hull.add(roof)
  for (const z of [-0.36, 0.36]) {
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 12), mats.get(0x9fd3ef))
    win.rotation.x = Math.PI / 2
    win.position.set(-0.85, 0.72, z)
    hull.add(win)
  }
  // cột buồm + buồm cong (phồng theo gió) + cờ
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 2.5, 8), mats.get(0x5e3b22))
  mast.position.set(0.35, 1.7, 0)
  hull.add(mast)
  const sailGeo = new THREE.PlaneGeometry(1.35, 1.9, 8, 10)
  const base = new Float32Array(sailGeo.attributes.position.array)
  const sail = new THREE.Mesh(
    sailGeo,
    mats.get(0xffffff, { side: THREE.DoubleSide, emissive: new THREE.Color(0x555555) })
  )
  sail.position.set(0.88, 1.65, 0)
  sail.rotation.y = Math.PI / 2
  hull.add(sail)
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.26, 4, 1),
    mats.get(0xe2483a, { side: THREE.DoubleSide })
  )
  flag.position.set(0.35, 2.82, 0.26)
  flag.rotation.y = Math.PI / 2
  hull.add(flag)
  const lantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 8),
    mats.get(0xffd166, { emissive: new THREE.Color(0x6a4a10) })
  )
  lantern.position.set(1.55, 0.78, 0)
  hull.add(lantern)
  group.add(hull)
  return { group: shadowed(group), hull, sail, flag, sailBase: base }
}

function buildPlane(
  THREE: Three,
  mats: Mats
): { group: ThreeNS.Group; prop: ThreeNS.Group; disc: ThreeNS.Mesh } {
  const group = new THREE.Group()
  // thân: tiện tròn
  const prof: ThreeNS.Vector2[] = [
    [0, 1.55],
    [0.17, 1.5],
    [0.32, 1.25],
    [0.4, 0.7],
    [0.4, -0.2],
    [0.3, -0.9],
    [0.16, -1.45],
    [0.06, -1.7],
    [0, -1.75]
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), mats.get(0xf8f8f8))
  fus.rotation.z = -Math.PI / 2
  group.add(fus)
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), mats.get(0xe2483a))
  nose.scale.set(1.1, 1, 1)
  nose.position.set(1.42, 0, 0)
  group.add(nose)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.3, 20), mats.get(0xe2483a))
  band.rotation.z = Math.PI / 2
  band.position.set(0.1, 0, 0)
  group.add(band)
  // cánh thon dần (đùn hình thang)
  const w = new THREE.Shape()
  w.moveTo(0.4, 0)
  w.lineTo(-0.35, 0)
  w.lineTo(-0.15, 2.0)
  w.lineTo(0.2, 2.0)
  w.closePath()
  const wing = new THREE.Mesh(extrude(THREE, w, 0.09, 0.025), mats.get(0x3f78c8))
  wing.rotation.x = Math.PI / 2
  wing.position.set(0.2, -0.05, -0.04)
  const wing2 = wing.clone()
  wing2.rotation.x = -Math.PI / 2
  wing2.position.set(0.2, -0.05, 0.04)
  group.add(wing, wing2)
  // đuôi
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 1.5), mats.get(0x3f78c8))
  tailH.position.set(-1.45, 0.05, 0)
  group.add(tailH)
  const fin = new THREE.Shape()
  fin.moveTo(0, 0)
  fin.lineTo(0.5, 0)
  fin.lineTo(0.12, 0.7)
  fin.lineTo(-0.05, 0.7)
  fin.closePath()
  const tailV = new THREE.Mesh(extrude(THREE, fin, 0.07, 0.02), mats.get(0xe2483a))
  tailV.position.set(-1.65, 0.1, 0)
  group.add(tailV)
  // buồng lái hở: kính chắn gió + yên
  const wind = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.28, 0.5),
    mats.get(0x9fd3ef, { transparent: true, opacity: 0.7 })
  )
  wind.position.set(0.55, 0.52, 0)
  wind.rotation.z = -0.5
  group.add(wind)
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), mats.get(0xf2c94c))
  seat.position.set(0.05, 0.38, 0)
  group.add(seat)
  // càng đáp + bánh
  for (const z of [-0.4, 0.4]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), mats.get(0x6b6b75))
    leg.position.set(0.55, -0.45, z)
    leg.rotation.z = 0.2
    group.add(leg)
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12),
      mats.get(0x23232d)
    )
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(0.6, -0.7, z)
    group.add(wheel)
  }
  // cánh quạt + đĩa mờ khi quay
  const prop = new THREE.Group()
  prop.position.set(1.72, 0, 0)
  for (const rot of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, 0.14), mats.get(0x3a2a22))
    blade.rotation.x = rot
    prop.add(blade)
  }
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.75, 24),
    mats.get(0xffffff, {
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
  disc.rotation.y = Math.PI / 2
  disc.position.set(1.74, 0, 0)
  group.add(prop, disc)
  return { group: shadowed(group), prop, disc }
}

export interface VehicleRig {
  update: (s: VehicleState, dt: number, t: number) => void
  dispose: () => void
}

export function createVehicleRig(THREE: Three, scene: ThreeNS.Scene, scale = 1): VehicleRig {
  const mats = new Mats(THREE)
  const root = new THREE.Group()
  root.visible = false
  root.scale.setScalar(scale)
  scene.add(root)
  const car = buildCar(THREE, mats)
  const boat = buildBoat(THREE, mats)
  const plane = buildPlane(THREE, mats)
  const parts: Record<VehicleKind, ThreeNS.Group> = {
    car: car.group,
    boat: boat.group,
    plane: plane.group
  }
  for (const p of Object.values(parts)) {
    p.visible = false
    root.add(p)
  }

  // khói / bọt sóng / vệt mây: vài quả cầu nhỏ tái sử dụng
  const puffs: Puff[] = []
  const puffGeo = new THREE.SphereGeometry(0.16 * scale, 8, 6)
  for (let i = 0; i < 18; i++) {
    const mesh = new THREE.Mesh(
      puffGeo,
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
  let bank = 0

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
        p.mesh.position.y += dt * 0.5 * scale
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
      const moved = hasLast ? Math.hypot(s.x - lastX, s.z - lastZ) / scale : 0
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
      const run = Math.min(1, speed / 7)
      const back = (d: number): [number, number] => [
        s.x - Math.cos(s.heading) * d * scale,
        s.z + Math.sin(s.heading) * d * scale
      ]
      if (s.kind === 'car') {
        for (const w of car.wheels) w.rotation.z -= moved / 0.3
        // treo nhún: thân xe nhún theo mặt đường, chúi khi vòng
        car.body.position.y = Math.abs(Math.sin(t * 20)) * 0.035 * run
        car.body.rotation.z = Math.sin(t * 8) * 0.015 * run
        car.body.rotation.x = Math.max(-0.08, Math.min(0.08, turn * 0.04))
        sinceSpawn += dt
        if (sinceSpawn > 0.1 && run > 0.15) {
          sinceSpawn = 0
          const [px, pz] = back(1.5)
          spawn(px, s.y + 0.3 * scale, pz, 0xd9d9d9, 0.7, 2.4)
        }
      } else if (s.kind === 'boat') {
        boat.hull.rotation.z = Math.sin(t * 2.3) * 0.06
        boat.hull.rotation.x = Math.sin(t * 1.7) * 0.045
        boat.hull.position.y = Math.sin(t * 2.8) * 0.05
        // buồm phồng gió + cờ phất
        const pos = boat.sail.geometry.attributes.position as ThreeNS.BufferAttribute
        for (let i = 0; i < pos.count; i++) {
          const bx = boat.sailBase[i * 3]
          const by = boat.sailBase[i * 3 + 1]
          const u = (bx + 0.675) / 1.35
          const v = (by + 0.95) / 1.9
          pos.setZ(
            i,
            Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.28 + Math.sin(t * 3 + by * 2) * 0.02
          )
          pos.setY(i, by * (1 - 0.35 * u))
        }
        pos.needsUpdate = true
        const fp = boat.flag.geometry.attributes.position as ThreeNS.BufferAttribute
        for (let i = 0; i < fp.count; i++)
          fp.setZ(i, Math.sin(t * 9 + fp.getX(i) * 8) * 0.05 * (fp.getX(i) + 0.25))
        fp.needsUpdate = true
        sinceSpawn += dt
        if (sinceSpawn > 0.09 && run > 0.1) {
          sinceSpawn = 0
          const [px, pz] = back(1.4)
          spawn(px, s.y + 0.05 * scale, pz, 0xffffff, 1.1, 3.4)
        }
      } else {
        plane.prop.rotation.x += dt * 55
        bank += (Math.max(-0.5, Math.min(0.5, -turn * 0.25)) - bank) * Math.min(1, dt * 6)
        plane.group.rotation.x = bank
        plane.group.rotation.z = Math.sin(t * 2) * 0.03
        plane.group.position.y = Math.sin(t * 3) * 0.07
        sinceSpawn += dt
        if (sinceSpawn > 0.12) {
          sinceSpawn = 0
          const [px, pz] = back(1.8)
          spawn(px, s.y, pz, 0xffffff, 1.0, 2.2)
        }
      }
    },
    dispose() {
      scene.remove(root)
      for (const p of puffs) {
        scene.remove(p.mesh)
        ;(p.mesh.material as ThreeNS.Material).dispose()
      }
      puffGeo.dispose()
      root.traverse((o) => {
        const m = o as ThreeNS.Mesh
        if (m.geometry) m.geometry.dispose()
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
  heightAt: (x: number, z: number) => number,
  scale = 1
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
  const lift = (x: number, z: number, up: number): number =>
    Math.max(0.03, heightAt(x, z)) + up * scale

  for (const route of routes) {
    const step = 0.3 * scale
    const pts: Array<{ x: number; z: number; sea: boolean }> = []
    for (let i = 0; i + 1 < route.length; i++) {
      const a = route[i]
      const b = route[i + 1]
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const n = Math.max(1, Math.ceil(len / step))
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
      const nx = -dz / len
      const nz = dx / len
      travelled += len
      if (p.sea || q.sea) {
        if (
          Math.floor(travelled / (0.9 * scale)) !== Math.floor((travelled - len) / (0.9 * scale))
        ) {
          const r = 0.12 * scale
          quad(
            [p.x - r, 0.06, p.z - r],
            [p.x - r, 0.06, p.z + r],
            [p.x + r, 0.06, p.z + r],
            [p.x + r, 0.06, p.z - r],
            dots
          )
        }
        continue
      }
      const ribbon = (w: number, up: number, rgb: number[]): void => {
        const ww = w * scale
        quad(
          [p.x + nx * ww, lift(p.x + nx * ww, p.z + nz * ww, up), p.z + nz * ww],
          [q.x + nx * ww, lift(q.x + nx * ww, q.z + nz * ww, up), q.z + nz * ww],
          [q.x - nx * ww, lift(q.x - nx * ww, q.z - nz * ww, up), q.z - nz * ww],
          [p.x - nx * ww, lift(p.x - nx * ww, p.z - nz * ww, up), p.z - nz * ww],
          rgb
        )
      }
      ribbon(0.42, 0.05, edge)
      ribbon(0.3, 0.075, dirt)
      if (Math.floor(travelled / (0.7 * scale)) % 2 === 0) ribbon(0.035, 0.1, paint)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const mat = toon(THREE, {
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
