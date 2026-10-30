// Phương tiện 3D của bản đồ game (xe jeep mui trần, thuyền buồm, máy bay cánh quạt) và đường đi — dựng bằng hình khối mịn
// (đùn profile có vát cạnh, tiện tròn) cùng phong cách địa hình; có hoạt ảnh thật: bánh xe lăn theo quãng đường + treo
// nhún + khói, thuyền chòng chành + buồm phồng + cờ phất + sóng đuôi, máy bay quay cánh quạt + nghiêng khi vòng + vệt mây.
// Kích thước mô hình tính theo đơn vị riêng (xe dài ~2,4) rồi nhân `scale` của bản đồ. docs/19-kids-world.md §5.4
import type * as ThreeNS from 'three'
import { toon } from './toon'

type Three = typeof ThreeNS

export type VehicleKind = 'car' | 'boat' | 'plane'

/** Độ cao chỗ ngồi của thú cưng so với điểm đặt phương tiện (đơn vị mô hình, chưa nhân scale) */
export const SEAT: Record<VehicleKind, number> = { car: 0.62, boat: 0.66, plane: 0.42 }

export interface VehicleState {
  kind: VehicleKind | null
  /** Vị trí thế giới: x, z trên mặt phẳng, y = độ cao mặt đất/nước tại đó + độ nhấc */
  x: number
  y: number
  z: number
  /** Hướng đi (rad, quanh trục y; 0 = hướng +x) */
  heading: number
  /** Chúc/ngóc đầu (rad, dương = ngóc lên) */
  pitch?: number
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

/** Xe mui trần thể thao: thân thấp bo tròn, nắp ca-pô dài, kính chắn gió nghiêng, hai ghế da, đèn tròn, mâm crôm */
function buildCar(
  THREE: Three,
  mats: Mats
): { group: ThreeNS.Group; wheels: ThreeNS.Group[]; body: ThreeNS.Group } {
  const group = new THREE.Group()
  const body = new THREE.Group()
  const red = 0xe23a3a
  const s = new THREE.Shape()
  s.moveTo(-1.25, 0.2)
  s.lineTo(1.2, 0.2)
  s.quadraticCurveTo(1.38, 0.22, 1.36, 0.36)
  s.quadraticCurveTo(1.3, 0.46, 0.95, 0.5)
  s.lineTo(0.35, 0.52)
  s.lineTo(-0.85, 0.52)
  s.quadraticCurveTo(-1.2, 0.54, -1.3, 0.42)
  s.quadraticCurveTo(-1.34, 0.24, -1.25, 0.2)
  body.add(new THREE.Mesh(extrude(THREE, s, 1.1, 0.1), mats.get(red)))
  // khoang ngồi khoét (mảng tối) + ghế da kem + tựa đầu
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.86), mats.get(0x3a2a2a))
  cockpit.position.set(-0.32, 0.535, 0)
  body.add(cockpit)
  for (const z of [-0.22, 0.22]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.34), mats.get(0xf3e3c3))
    seat.position.set(-0.45, 0.58, z)
    body.add(seat)
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.34), mats.get(0xf3e3c3))
    back.position.set(-0.66, 0.72, z)
    back.rotation.z = 0.15
    body.add(back)
  }
  // kính chắn gió viền crôm
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.26, 0.98),
    mats.get(0xbfe6ff, { transparent: true, opacity: 0.55 })
  )
  glass.position.set(0.2, 0.66, 0)
  glass.rotation.z = -0.55
  body.add(glass)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 1.02), mats.get(0xe8e8ee))
  frame.position.set(0.13, 0.78, 0)
  body.add(frame)
  // vô lăng, gương, nắp ca-pô có gân
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 14), mats.get(0x2b2b36))
  wheel.position.set(0.0, 0.66, 0.2)
  wheel.rotation.y = Math.PI / 2
  wheel.rotation.x = 0.5
  body.add(wheel)
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.025, 0.06), mats.get(0xc22f2f))
  ridge.position.set(0.75, 0.51, 0)
  body.add(ridge)
  // dải trắng thể thao + viền crôm hông
  for (const z of [-0.555, 0.555]) {
    const chrome = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.03, 0.02), mats.get(0xe8e8ee))
    chrome.position.set(0, 0.36, z)
    body.add(chrome)
  }
  for (const z of [-0.1, 0.1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.012, 0.08), mats.get(0xfff6dc))
    stripe.position.set(0.05, 0.52, z)
    body.add(stripe)
  }
  // đèn pha tròn, đèn hậu, lưới tản nhiệt, cản crôm, ống xả
  for (const z of [-0.34, 0.34]) {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 8),
      mats.get(0xfff1b8, { emissive: new THREE.Color(0x6a5a20) })
    )
    lamp.position.set(1.3, 0.38, z)
    body.add(lamp)
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 6), mats.get(0xff4a3a))
    tail.position.set(-1.31, 0.4, z * 0.9)
    body.add(tail)
  }
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.42), mats.get(0x2b2b36))
  grille.position.set(1.36, 0.3, 0)
  body.add(grille)
  for (const x of [1.38, -1.33]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.12), mats.get(0xe8e8ee))
    bumper.position.set(x, 0.22, 0)
    body.add(bumper)
  }
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8), mats.get(0xb0b0b8))
  pipe.rotation.z = Math.PI / 2
  pipe.position.set(-1.36, 0.2, 0.3)
  body.add(pipe)
  group.add(body)
  const wheels: ThreeNS.Group[] = []
  for (const [x, z] of [
    [0.82, 0.58],
    [0.82, -0.58],
    [-0.82, 0.58],
    [-0.82, -0.58]
  ]) {
    const w = new THREE.Group()
    w.add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.09, 10, 20), mats.get(0x23232d)))
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.09, 16), mats.get(0xe8e8ee))
    rim.rotation.x = Math.PI / 2
    w.add(rim)
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.3, 0.11),
        mats.get(i === 0 ? 0xe23a3a : 0x9a9aa6)
      )
      spoke.rotation.z = (i * Math.PI * 2) / 5
      w.add(spoke)
    }
    w.position.set(x, 0.28, z)
    group.add(w)
    wheels.push(w)
  }
  return { group: shadowed(group), wheels, body }
}

/** Ca nô: thân trắng mũi nhọn ngóc lên, sọc xanh, kính chắn gió cong, ghế, máy gắn đuôi có chân vịt */
function buildBoat(
  THREE: Three,
  mats: Mats
): { group: ThreeNS.Group; hull: ThreeNS.Group; prop: ThreeNS.Object3D } {
  const group = new THREE.Group()
  const hull = new THREE.Group()
  // mặt cắt dọc: đáy vát, mũi nhọn cao
  const s = new THREE.Shape()
  s.moveTo(-1.25, 0.5)
  s.lineTo(-1.3, 0.12)
  s.quadraticCurveTo(-1.1, -0.02, -0.4, -0.04)
  s.lineTo(0.6, -0.02)
  s.quadraticCurveTo(1.35, 0.1, 1.7, 0.55)
  s.lineTo(-1.25, 0.5)
  const geo = extrude(THREE, s, 0.95, 0.12)
  // thu hẹp mũi: co bề ngang theo x
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const k = x > 0.3 ? 1 - ((x - 0.3) / 1.45) * 0.85 : 1
    p.setZ(i, p.getZ(i) * Math.max(0.12, k))
  }
  geo.computeVertexNormals()
  hull.add(new THREE.Mesh(geo, mats.get(0xfbfbf6)))
  // sọc xanh dọc mạn + vạch đỏ đáy
  const stripeG = extrude(THREE, s, 0.97, 0.12)
  const sp = stripeG.attributes.position
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i)
    const k = x > 0.3 ? 1 - ((x - 0.3) / 1.45) * 0.85 : 1
    sp.setZ(i, sp.getZ(i) * Math.max(0.12, k))
  }
  const stripe = new THREE.Mesh(stripeG, mats.get(0x2f7fc8))
  stripe.scale.y = 0.35
  stripe.position.y = 0.16
  hull.add(stripe)
  // sàn + ghế + kính chắn gió cong
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.78), mats.get(0xd9b98a))
  deck.position.set(-0.35, 0.48, 0)
  hull.add(deck)
  for (const z of [-0.2, 0.2]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.3), mats.get(0x2f7fc8))
    seat.position.set(-0.35, 0.57, z)
    hull.add(seat)
  }
  const wind = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.24, 18, 1, true, -Math.PI / 2.4, Math.PI / 1.2),
    mats.get(0xbfe6ff, { transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  )
  wind.position.set(0.0, 0.66, 0)
  wind.rotation.z = -0.25
  hull.add(wind)
  // máy đuôi + chân vịt
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.22), mats.get(0x2b2b36))
  motor.position.set(-1.36, 0.42, 0)
  hull.add(motor)
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.24), mats.get(0xe23a3a))
  cap.position.set(-1.36, 0.62, 0)
  hull.add(cap)
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.06), mats.get(0x6b6b75))
  shaft.position.set(-1.4, 0.1, 0)
  hull.add(shaft)
  const prop = new THREE.Group()
  for (const r of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.05), mats.get(0xb0b0b8))
    blade.rotation.x = r
    prop.add(blade)
  }
  prop.position.set(-1.46, -0.05, 0)
  hull.add(prop)
  // cờ nhỏ + đèn hành trình
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), mats.get(0xe8e8ee))
  pole.position.set(-1.15, 0.7, 0.3)
  hull.add(pole)
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.12),
    mats.get(0xe23a3a, { side: THREE.DoubleSide })
  )
  flag.position.set(-1.25, 0.84, 0.3)
  hull.add(flag)
  group.add(hull)
  return { group: shadowed(group), hull, prop }
}

/** Máy bay phản lực nhỏ: thân tiện thon, mũi tròn, cửa sổ, cánh xuôi có đầu cánh vểnh, hai động cơ có cánh quạt quay */
function buildPlane(
  THREE: Three,
  mats: Mats
): { group: ThreeNS.Group; prop: ThreeNS.Group; disc: ThreeNS.Mesh } {
  const group = new THREE.Group()
  const prof: ThreeNS.Vector2[] = [
    [0, 1.7],
    [0.2, 1.62],
    [0.34, 1.4],
    [0.42, 1.0],
    [0.44, 0.2],
    [0.4, -0.6],
    [0.28, -1.3],
    [0.14, -1.7],
    [0.05, -1.85],
    [0, -1.88]
  ].map(([r, y]) => new THREE.Vector2(r, y))
  const fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), mats.get(0xf8f8f8))
  fus.rotation.z = -Math.PI / 2
  group.add(fus)
  // sọc thân + bụng xanh
  const belly = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 24, Math.PI * 0.62, Math.PI * 0.76),
    mats.get(0x2f6fc0)
  )
  belly.rotation.z = -Math.PI / 2
  belly.scale.setScalar(1.005)
  group.add(belly)
  // kính buồng lái + cửa sổ tròn
  const cock = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.2),
    mats.get(0x5aa8e0)
  )
  cock.scale.set(1.5, 0.7, 1)
  cock.position.set(1.15, 0.2, 0)
  group.add(cock)
  for (let i = 0; i < 6; i++)
    for (const z of [-0.42, 0.42]) {
      const win = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10),
        mats.get(0x5aa8e0)
      )
      win.rotation.x = Math.PI / 2
      win.position.set(0.6 - i * 0.28, 0.12, z)
      group.add(win)
    }
  // cánh xuôi + đầu cánh vểnh
  const w = new THREE.Shape()
  w.moveTo(0.45, 0)
  w.lineTo(-0.35, 0)
  w.lineTo(-0.75, 2.1)
  w.lineTo(-0.4, 2.1)
  w.closePath()
  for (const sd of [-1, 1]) {
    const wing = new THREE.Mesh(extrude(THREE, w, 0.08, 0.025), mats.get(0xf0f0f4))
    wing.rotation.x = (sd * Math.PI) / 2
    wing.position.set(0.15, -0.12, sd * 0.04)
    group.add(wing)
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.05), mats.get(0x2f6fc0))
    tip.position.set(-0.55, 0.04, sd * 2.12)
    tip.rotation.z = 0.25
    group.add(tip)
  }
  // đuôi ngang + đuôi đứng
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 1.3), mats.get(0xf0f0f4))
  tailH.position.set(-1.55, 0.12, 0)
  group.add(tailH)
  const fin = new THREE.Shape()
  fin.moveTo(0, 0)
  fin.lineTo(0.55, 0)
  fin.lineTo(0.05, 0.8)
  fin.lineTo(-0.15, 0.8)
  fin.closePath()
  const tailV = new THREE.Mesh(extrude(THREE, fin, 0.07, 0.02), mats.get(0x2f6fc0))
  tailV.position.set(-1.8, 0.25, 0)
  group.add(tailV)
  // hai động cơ dưới cánh có quạt
  const prop = new THREE.Group()
  let disc: ThreeNS.Mesh | null = null
  for (const sd of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.62, 16), mats.get(0xd9d9e0))
    pod.rotation.z = Math.PI / 2
    pod.position.set(0.25, -0.32, sd * 0.95)
    group.add(pod)
    const intake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16),
      mats.get(0x2b2b36)
    )
    intake.rotation.z = Math.PI / 2
    intake.position.set(0.57, -0.32, sd * 0.95)
    group.add(intake)
    const fan = new THREE.Group()
    for (let i = 0; i < 6; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.035), mats.get(0xb0b0b8))
      blade.rotation.x = (i * Math.PI) / 3
      blade.position.set(0, Math.cos((i * Math.PI) / 3) * 0.06, Math.sin((i * Math.PI) / 3) * 0.06)
      fan.add(blade)
    }
    fan.position.set(0.59, -0.32, sd * 0.95)
    prop.add(fan)
    const d = new THREE.Mesh(
      new THREE.CircleGeometry(0.13, 18),
      mats.get(0xffffff, {
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    )
    d.rotation.y = Math.PI / 2
    d.position.set(0.6, -0.32, sd * 0.95)
    group.add(d)
    disc = d
  }
  group.add(prop)
  // càng đáp
  for (const [x, z] of [
    [1.0, 0],
    [-0.1, -0.35],
    [-0.1, 0.35]
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 6), mats.get(0x6b6b75))
    leg.position.set(x, -0.5, z)
    group.add(leg)
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.07, 12),
      mats.get(0x23232d)
    )
    tire.rotation.x = Math.PI / 2
    tire.position.set(x, -0.66, z)
    group.add(tire)
  }
  return { group: shadowed(group), prop, disc: disc as ThreeNS.Mesh }
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
  let pitchNow = 0

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
      root.rotation.order = 'YZX'
      pitchNow += ((s.pitch ?? 0) - pitchNow) * Math.min(1, dt * 6)
      root.rotation.set(0, -s.heading, pitchNow)
      const run = Math.min(1, speed / 7)
      const back = (d: number): [number, number] => [
        s.x - Math.cos(s.heading) * d * scale,
        s.z + Math.sin(s.heading) * d * scale
      ]
      if (s.kind === 'car') {
        // bánh lăn đúng theo quãng đường (giới hạn mỗi khung để không bị "đứng hình" do quay quá nhanh)
        for (const w of car.wheels) w.rotation.z -= Math.min(0.5, moved / 0.3)
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
        boat.hull.rotation.z = Math.sin(t * 2.3) * 0.04
        boat.hull.rotation.x = Math.sin(t * 1.7) * 0.04
        boat.hull.position.y = Math.sin(t * 2.8) * 0.05
        // ca nô ngóc mũi khi chạy nhanh, chân vịt quay
        boat.hull.rotation.z += run * 0.12
        boat.prop.rotation.x += dt * 40
        sinceSpawn += dt
        if (sinceSpawn > 0.09 && run > 0.1) {
          sinceSpawn = 0
          const [px, pz] = back(1.4)
          spawn(px, s.y + 0.05 * scale, pz, 0xffffff, 1.1, 3.4)
        }
      } else {
        for (const fan of plane.prop.children) fan.rotation.x += dt * 55
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

/** Một điểm mẫu của đường (đơn vị thế giới) với cao độ mặt đường đã làm mượt */
export interface RoadSample {
  x: number
  z: number
  /** Cao độ mặt đường (đã làm mượt; trên cầu là mặt cầu) */
  y: number
  /** Đoạn đi phà trên biển/sông lớn */
  sea: boolean
  /** Đoạn cầu bắc qua sông/kênh */
  bridge: boolean
}

/**
 * Đường bộ liền mạch theo cao độ đã làm mượt: lề đất + mặt đường + vạch trắng; đoạn qua nước thành **cầu** nối liền
 * (mặt cầu bê tông, thành cầu, trụ cầu) chứ không đứt; chỗ chuyển sang đi phà có **bến gỗ** nhô ra nước; đường phà là chấm
 * trắng trên mặt nước. Mỗi tuyến là dãy điểm mẫu dày (~0,12 đơn vị).
 */
export function buildRoads(
  THREE: Three,
  scene: ThreeNS.Scene,
  paths: ReadonlyArray<ReadonlyArray<RoadSample>>,
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
  // đường mòn: lưới riêng có độ trong (mép mềm, hai đầu mờ dần)
  const tpos: number[] = []
  const tcol: number[] = []
  const tidx: number[] = []
  /** Dải giữa hai điểm mẫu: lệch ngang [l, r] ở mỗi đầu, độ đục theo từng đỉnh (pL, pR, qR, qL) */
  const band = (
    p: RoadSample,
    q: RoadSample,
    pl: number,
    pr: number,
    ql: number,
    qr: number,
    up: number,
    rgb: number[],
    alpha: [number, number, number, number]
  ): void => {
    const dx = q.x - p.x
    const dz = q.z - p.z
    const len = Math.hypot(dx, dz) || 1
    const nx = -dz / len
    const nz = dx / len
    const base = tpos.length / 3
    const v: Array<[number, number, number]> = [
      [p.x + nx * pl, p.y + up, p.z + nz * pl],
      [p.x + nx * pr, p.y + up, p.z + nz * pr],
      [q.x + nx * qr, q.y + up, q.z + nz * qr],
      [q.x + nx * ql, q.y + up, q.z + nz * ql]
    ]
    v.forEach((pt, k) => {
      tpos.push(pt[0], pt[1], pt[2])
      tcol.push(rgb[0], rgb[1], rgb[2], alpha[k])
    })
    tidx.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  const lin = (hex: number): number[] =>
    [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => Math.pow(v / 255, 2.2))
  const C = {
    dirt: lin(0xd9bf86),
    edge: lin(0xbfa06a),
    worn: lin(0xe8d5a6),
    paint: lin(0xfff6dc),
    dots: lin(0xffffff),
    deck: lin(0xb98a55),
    deckSide: lin(0x9a9384),
    rail: lin(0x8a5e3a),
    pillar: lin(0xb3ac9c),
    wood: lin(0xa07a4a),
    woodDark: lin(0x6b4a32)
  }
  const W = 0.32 * scale // nửa bề rộng mặt đường
  const E = 0.44 * scale // nửa bề rộng cả lề

  /** Dải nằm ngang giữa hai điểm mẫu, lệch ngang [w0, w1] (âm = bên trái), cao thêm `up` */
  const strip = (
    p: RoadSample,
    q: RoadSample,
    w0: number,
    w1: number,
    up: number,
    rgb: number[]
  ): void => {
    const dx = q.x - p.x
    const dz = q.z - p.z
    const len = Math.hypot(dx, dz) || 1
    const nx = -dz / len
    const nz = dx / len
    quad(
      [p.x + nx * w1, p.y + up, p.z + nz * w1],
      [q.x + nx * w1, q.y + up, q.z + nz * w1],
      [q.x + nx * w0, q.y + up, q.z + nz * w0],
      [p.x + nx * w0, p.y + up, p.z + nz * w0],
      rgb
    )
  }
  /** Mặt đứng dọc theo cạnh (lệch ngang w) từ cao y0 tới y1 (tương đối mặt đường) */
  const wall = (
    p: RoadSample,
    q: RoadSample,
    w: number,
    y0: number,
    y1: number,
    rgb: number[]
  ): void => {
    const dx = q.x - p.x
    const dz = q.z - p.z
    const len = Math.hypot(dx, dz) || 1
    const nx = -dz / len
    const nz = dx / len
    quad(
      [p.x + nx * w, p.y + y0, p.z + nz * w],
      [q.x + nx * w, q.y + y0, q.z + nz * w],
      [q.x + nx * w, q.y + y1, q.z + nz * w],
      [p.x + nx * w, p.y + y1, p.z + nz * w],
      rgb
    )
  }
  /** Cột đứng (hình hộp nhỏ) tại một điểm, từ y0 tới y1 */
  const post = (x: number, z: number, y0: number, y1: number, r: number, rgb: number[]): void => {
    quad([x - r, y0, z - r], [x + r, y0, z - r], [x + r, y1, z - r], [x - r, y1, z - r], rgb)
    quad([x + r, y0, z + r], [x - r, y0, z + r], [x - r, y1, z + r], [x + r, y1, z + r], rgb)
    quad([x - r, y0, z + r], [x - r, y0, z - r], [x - r, y1, z - r], [x - r, y1, z + r], rgb)
    quad([x + r, y0, z - r], [x + r, y0, z + r], [x + r, y1, z + r], [x + r, y1, z - r], rgb)
  }

  const sm = (t: number): number => {
    const c = Math.min(1, Math.max(0, t))
    return c * c * (3 - 2 * c)
  }
  for (const path of paths) {
    // độ dài tích luỹ để làm mờ hai đầu tuyến
    const cum = [0]
    for (let i = 1; i < path.length; i++)
      cum.push(cum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z))
    const total = cum[cum.length - 1] || 1
    const fadeLen = 1.1
    const fade = (i: number): number => sm(cum[i] / fadeLen) * sm((total - cum[i]) / fadeLen)
    let travelled = 0
    let lastDot = -1
    for (let i = 0; i + 1 < path.length; i++) {
      const p = path[i]
      const q = path[i + 1]
      const len = Math.hypot(q.x - p.x, q.z - p.z)
      travelled += len
      if (q.sea && p.sea) {
        const k = Math.floor(travelled / (0.9 * scale))
        if (k !== lastDot) {
          lastDot = k
          const r = 0.1 * scale
          quad(
            [q.x - r, 0.06, q.z - r],
            [q.x - r, 0.06, q.z + r],
            [q.x + r, 0.06, q.z + r],
            [q.x + r, 0.06, q.z - r],
            C.dots
          )
        }
        continue
      }
      if (p.sea !== q.sea) {
        // bến gỗ: sàn nhô ra nước theo hướng đi + cọc
        const land = p.sea ? q : p
        const sea = p.sea ? p : q
        const dx = sea.x - land.x
        const dz = sea.z - land.z
        const l = Math.hypot(dx, dz) || 1
        const end: RoadSample = {
          x: land.x + (dx / l) * 0.55,
          z: land.z + (dz / l) * 0.55,
          y: 0.12,
          sea: false,
          bridge: false
        }
        const start: RoadSample = { ...land, y: Math.max(0.12, land.y) }
        strip(start, end, -W, W, 0.02, C.wood)
        wall(start, end, -W, -0.12, 0.02, C.woodDark)
        wall(start, end, W, -0.12, 0.02, C.woodDark)
        for (const t of [0.35, 1]) {
          const px = start.x + (end.x - start.x) * t
          const pz = start.z + (end.z - start.z) * t
          const nx = -(end.z - start.z) / 0.55
          const nz = (end.x - start.x) / 0.55
          for (const sd of [-1, 1])
            post(px + nx * W * sd, pz + nz * W * sd, -0.1, 0.22, 0.025 * scale, C.woodDark)
        }
        continue
      }
      if (p.bridge || q.bridge) {
        // cầu: mặt cầu + thành cầu + trụ, nối liền hai đầu đường
        strip(p, q, -E, E, 0.04, C.deck)
        wall(p, q, -E, -0.08, 0.04, C.deckSide)
        wall(p, q, E, -0.08, 0.04, C.deckSide)
        wall(p, q, -E + 0.02, 0.04, 0.16, C.rail)
        wall(p, q, E - 0.02, 0.04, 0.16, C.rail)
        for (let pl = 0; pl < 3; pl++)
          strip(
            p,
            q,
            -E + 0.05 + pl * 0.09 * scale,
            -E + 0.07 + pl * 0.09 * scale,
            0.045,
            C.woodDark
          )
        if (i % 7 === 0) {
          const dx = q.x - p.x
          const dz = q.z - p.z
          const l = Math.hypot(dx, dz) || 1
          for (const sd of [-1, 1])
            post(
              p.x - (dz / l) * W * 0.7 * sd,
              p.z + (dx / l) * W * 0.7 * sd,
              -0.3,
              p.y - 0.06,
              0.05 * scale,
              C.pillar
            )
        }
        continue
      }
      // đường mòn đất: bề rộng hơi uốn lượn, mép mềm tan vào cỏ, vệt mòn sáng ở giữa, hai đầu tuyến mờ dần
      const fa = fade(i)
      const fb = fade(i + 1)
      const wa = W * (1 + Math.sin(cum[i] * 2.3) * 0.12)
      const wb = W * (1 + Math.sin(cum[i + 1] * 2.3) * 0.12)
      const ea = wa + (E - W) * 1.3
      const eb = wb + (E - W) * 1.3
      band(p, q, -ea, -wa, -eb, -wb, 0.05, C.edge, [0, fa * 0.9, fb * 0.9, 0])
      band(p, q, wa, ea, wb, eb, 0.05, C.edge, [fa * 0.9, 0, 0, fb * 0.9])
      band(p, q, -wa, wa, -wb, wb, 0.055, C.dirt, [fa, fa, fb, fb])
      band(p, q, -wa * 0.35, wa * 0.35, -wb * 0.35, wb * 0.35, 0.06, C.worn, [
        fa * 0.6,
        fa * 0.6,
        fb * 0.6,
        fb * 0.6
      ])
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
  mesh.castShadow = true
  scene.add(mesh)
  const tgeo = new THREE.BufferGeometry()
  tgeo.setAttribute('position', new THREE.Float32BufferAttribute(tpos, 3))
  tgeo.setAttribute('color', new THREE.Float32BufferAttribute(tcol, 4))
  tgeo.setIndex(tidx)
  tgeo.computeVertexNormals()
  const tmat = toon(THREE, {
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
    side: THREE.DoubleSide
  })
  const trail = new THREE.Mesh(tgeo, tmat)
  trail.receiveShadow = true
  trail.renderOrder = 1
  scene.add(trail)
  return {
    dispose: () => {
      scene.remove(mesh)
      scene.remove(trail)
      geo.dispose()
      mat.dispose()
      tgeo.dispose()
      tmat.dispose()
    }
  }
}
