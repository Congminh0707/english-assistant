// Công trình 3D chi tiết đợt 2 (docs/18-ui-rules.md §10): Vịnh Hạ Long, Sa Pa, Tràng An, Cầu Rồng.
import type * as ThreeNS from 'three'
import { Kit } from './kit'
import { junk } from './north'

type Three = typeof ThreeNS

/** Nhiễu cố định */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Núi đá vôi dạng tháp (karst): thân dựng đứng hơi phình giữa, eo khoét ở chân sát mặt nước, sọc đá dọc, đỉnh tròn phủ
 * cây; tiện tròn rồi làm méo theo nhiễu để mỗi hòn một dáng.
 */
function karst(
  k: Kit,
  x: number,
  z: number,
  h: number,
  r: number,
  seed: number,
  lean = 0,
  into?: ThreeNS.Object3D
): ThreeNS.Group {
  const { THREE } = k
  const prof: ThreeNS.Vector2[] = []
  const steps = 14
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    let rr = r * (0.82 + Math.sin(t * Math.PI) * 0.28)
    if (t < 0.08) rr *= 0.8 // eo khoét do sóng
    if (t > 0.86) rr *= 1 - (t - 0.86) * 4.2 // đỉnh bo tròn
    prof.push(new THREE.Vector2(Math.max(0.02, rr), t * h))
  }
  const geo = new THREE.LatheGeometry(prof, 20)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i)
    const py = pos.getY(i)
    const pz = pos.getZ(i)
    const a = Math.atan2(pz, px)
    const n =
      1 +
      Math.sin(a * 5 + seed) * 0.12 +
      Math.sin(a * 11 + seed * 2.3) * 0.05 +
      Math.sin(py * 3 + a * 2 + seed) * 0.05
    pos.setXYZ(i, px * n + lean * (py / h) ** 2, py, pz * n * 0.85)
  }
  geo.computeVertexNormals()
  const g = new THREE.Group()
  k.put(k.mesh(geo, seed % 2 ? 0xb8b4a2 : 0xaaa794), 0, 0, 0, g)
  // sọc đá sẫm
  for (let i = 0; i < 4; i++) {
    const a = seed + i * 1.6
    const streak = k.box(
      0.05,
      h * (0.4 + hash(seed + i) * 0.35),
      0.05,
      0x7e7a6a,
      Math.cos(a) * r * 0.95 + lean * 0.3,
      h * 0.2,
      Math.sin(a) * r * 0.8,
      g
    )
    streak.rotation.z = 0.04
  }
  // mũ cây + vài bụi cây bám vách
  k.ball(r * 0.75, 0x4f9a3b, lean, h * 0.97, 0, 0.55, 1, 0.85, g)
  k.ball(r * 0.45, 0x79c25a, lean + r * 0.2, h * 1.05, r * 0.1, 0.6, 1, 1, g)
  for (let i = 0; i < 3; i++) {
    const a = seed * 2 + i * 2.1
    const y = h * (0.35 + i * 0.18)
    k.ball(
      r * 0.22,
      0x5fae48,
      Math.cos(a) * r * 1.0 + lean * (y / h) ** 2,
      y,
      Math.sin(a) * r * 0.85,
      0.6,
      1,
      1,
      g
    )
  }
  return k.put(g, x, 0, z, into)
}

/**
 * Vịnh Hạ Long. Đặc điểm thật: nước xanh ngọc; hàng chục đảo đá vôi dạng tháp dựng đứng, có eo khoét sát mặt nước,
 * phủ cây trên đỉnh; hòn Trống Mái là hai khối đá đứng đối nhau như đôi gà trên một chân đá chung; thuyền buồm nâu đỏ
 * nhiều nan; làng chài nổi (nhà trên bè) và thuyền kayak.
 */
export function halongBay(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.6, 10.6, 0, 0, true, 0x3fb7b0)
  k.water(9.4, 9.4, 0, 0, true, 0x55c8be, 0.09)
  // Trống Mái: hai hòn trên chân đá chung, đỉnh chạm nhau
  k.rock(0, 0.1, -0.4, 1.6, 0.35, 1.0, 0x9a9684, 2)
  const cock = karst(k, -0.55, -0.4, 3.0, 0.42, 3, 0.35)
  const hen = karst(k, 0.6, -0.4, 2.4, 0.38, 6, -0.3)
  k.cone(0.09, 0.22, 0xc8322b, -0.15, 3.05, -0.4, 6) // mào trống
  k.cone(0.06, 0.22, 0xe8b830, 0.08, 2.75, -0.4, 6).rotation.z = -1.3
  k.cone(0.06, 0.18, 0xe8b830, 0.18, 2.3, -0.4, 6).rotation.z = 1.3
  void cock
  void hen
  // các đảo đá xung quanh, xa thấp dần
  const isles: Array<[number, number, number, number]> = [
    [-3.4, -2.6, 3.6, 0.7],
    [-2.0, -3.6, 2.6, 0.55],
    [2.6, -3.0, 3.2, 0.65],
    [3.9, -1.2, 2.2, 0.5],
    [-4.0, 0.6, 2.0, 0.5],
    [3.6, 1.8, 1.6, 0.45],
    [-1.0, -4.2, 1.8, 0.5]
  ]
  isles.forEach(([x, z, h, r], i) => karst(k, x, z, h, r, i * 3 + 9, (hash(i) - 0.5) * 0.4))
  // làng chài nổi: nhà trên bè gỗ
  const raft = (x: number, z: number, c: number): void => {
    k.box(1.1, 0.08, 0.8, 0x8a6a42, x, 0.06, z)
    for (const dx of [-0.45, 0.45])
      k.cyl(0.07, 0.07, 0.75, 0x3a6aa0, x + dx, 0.03, z, 8).rotation.x = Math.PI / 2
    k.box(0.7, 0.42, 0.55, c, x, 0.14, z)
    k.gable(0.85, 0.75, 0.3, 0x3a7aa0, x, 0.56, z)
  }
  raft(-3.0, 2.6, 0xf3e7c4)
  raft(-1.8, 3.4, 0xf6d9a8)
  raft(-3.6, 3.7, 0xd9e8f2)
  // thuyền buồm + kayak
  const j1 = junk(k, 0.6, 2.8, 0.75, -0.3)
  const j2 = junk(k, 2.8, 3.6, 0.55, 0.8)
  const kayak = new THREE.Group()
  k.cyl(0.08, 0.08, 0.8, 0xf2b630, 0, 0, 0, 8, kayak).rotation.z = Math.PI / 2
  k.person(0, 0.02, 0, 0xe24a3b, false, kayak, 0.35)
  const paddle = k.box(0.03, 0.03, 0.6, 0x6b4a32, 0, 0.18, 0, kayak)
  k.put(kayak, 1.5, 0.1, 1.6)
  // hải âu
  const gulls: ThreeNS.Group[] = []
  for (let i = 0; i < 4; i++) {
    const gull = new THREE.Group()
    for (const sz of [-1, 1]) k.box(0.04, 0.02, 0.32, 0xffffff, 0, 0, sz * 0.16, gull)
    k.ball(0.05, 0xffffff, 0, 0, 0, 0.8, 1.6, 1, gull)
    k.put(gull, 0, 4, 0)
    gulls.push(gull)
  }
  k.group.userData.tick = (t: number): void => {
    const a = t * 0.08
    j1.position.set(Math.cos(a) * 2.6, 0.02 + Math.sin(t * 2) * 0.03, Math.sin(a) * 1.2 + 2.6)
    j1.rotation.y = -a - Math.PI / 2
    j1.rotation.z = Math.sin(t * 1.6) * 0.04
    j2.position.x = 2.8 - Math.sin(t * 0.06) * 2.2
    j2.rotation.y = Math.cos(t * 0.06) > 0 ? Math.PI : 0
    j2.position.y = 0.02 + Math.sin(t * 1.8 + 1) * 0.03
    kayak.position.set(1.5 + Math.sin(t * 0.2) * 1.0, 0.1, 1.6 + Math.cos(t * 0.2) * 0.4)
    kayak.rotation.y = -t * 0.2
    paddle.rotation.x = Math.sin(t * 4) * 0.6
    gulls.forEach((g, i) => {
      const c = t * 0.45 + i * 1.6
      g.position.set(
        Math.cos(c) * (1.8 + i * 0.5),
        3.4 + i * 0.3 + Math.sin(t * 2 + i) * 0.15,
        Math.sin(c) * (1.5 + i * 0.4) - 0.5
      )
      g.rotation.y = -c
      g.children.forEach((w, n) => {
        if (n < 2) w.rotation.x = (n ? 1 : -1) * (0.2 + Math.sin(t * 9 + i) * 0.45)
      })
    })
  }
  return k.group
}

/** Vòng ruộng bậc thang méo tự nhiên (bờ ruộng uốn theo đường đồng mức) */
function terraceRing(
  k: Kit,
  rx: number,
  rz: number,
  h: number,
  top: number,
  x: number,
  y: number,
  z: number,
  seed: number
): void {
  const { THREE } = k
  const geo = new THREE.CylinderGeometry(1, 1.04, h, 40, 1)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i)
    const pz = pos.getZ(i)
    const a = Math.atan2(pz, px)
    const n = 1 + Math.sin(a * 3 + seed) * 0.07 + Math.sin(a * 7 + seed * 1.7) * 0.03
    pos.setX(i, px * rx * n)
    pos.setZ(i, pz * rz * n)
  }
  geo.computeVertexNormals()
  k.put(k.mesh(geo, 0x8a5e3a), x, y + h / 2, z)
  const cap = new THREE.CylinderGeometry(1, 1, 0.04, 40, 1)
  const cp = cap.attributes.position
  for (let i = 0; i < cp.count; i++) {
    const px = cp.getX(i)
    const pz = cp.getZ(i)
    const a = Math.atan2(pz, px)
    const n = (1 + Math.sin(a * 3 + seed) * 0.07 + Math.sin(a * 7 + seed * 1.7) * 0.03) * 0.97
    cp.setX(i, px * rx * n)
    cp.setZ(i, pz * rz * n)
  }
  k.put(k.mesh(cap, top), x, y + h, z)
}

/**
 * Sa Pa. Đặc điểm thật: ruộng bậc thang uốn theo sườn đồi (lúa xanh xen lúa chín vàng, ruộng đổ nước loang loáng), đỉnh
 * Fansipan phía sau có cáp treo, mây vờn núi; bản làng nhà gỗ mái thấp của người H'Mông ở thung lũng, suối và cầu gỗ,
 * trâu cày, người mặc áo chàm.
 */
export function sapaValley(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  // núi Fansipan + dãy núi phía sau
  k.rock(1.2, 0, -3.4, 2.6, 4.6, 1.6, 0x7d8a7a, 11)
  k.cone(0.8, 1.2, 0xf4f8fb, 1.2, 3.7, -3.4, 7)
  k.rock(-2.6, 0, -3.8, 2.4, 3.2, 1.4, 0x6f8a62, 13)
  k.rock(4.0, 0, -2.8, 1.6, 2.4, 1.2, 0x6f8a62, 17)
  // cáp treo lên đỉnh
  k.cyl(0.05, 0.07, 1.4, 0x6b6b75, 3.6, 0.0, 2.6, 6)
  k.cyl(0.04, 0.06, 0.8, 0x6b6b75, 1.3, 4.2, -3.3, 6)
  const cableLen = Math.hypot(1.3 - 3.6, 4.6 - 1.4, -3.3 - 2.6)
  const cable = k.cyl(0.008, 0.008, cableLen, 0x2b2b36, 2.45, 3.0 - cableLen / 2, -0.35, 4)
  cable.lookAt(new THREE.Vector3(1.3, 5.0, -3.3))
  cable.rotateX(Math.PI / 2)
  const cabin = new THREE.Group()
  k.box(0.22, 0.18, 0.18, 0xe24a3b, 0, 0, 0, cabin)
  k.box(0.2, 0.08, 0.19, 0x9fd3ef, 0, 0.07, 0, cabin)
  k.put(cabin, 2.4, 2.8, -0.4)
  // ruộng bậc thang trên sườn: các vòng thu nhỏ dần, lệch về phía sau tạo sườn dốc
  const golds = [0x9bd160, 0xd9c94f, 0x8fcb58, 0xe3d45a, 0x7cc45a, 0xd4c04a, 0x9bd160, 0xe0cc58]
  for (let i = 0; i < 8; i++) {
    const t = i / 7
    const top = i % 3 === 2 ? 0x8fd0e6 : golds[i]
    terraceRing(
      k,
      4.6 - t * 3.4,
      3.4 - t * 2.4,
      0.3,
      top,
      -0.6 - t * 0.6,
      i * 0.3,
      0.4 - t * 1.4,
      i * 1.3
    )
  }
  // nhà sàn gỗ mái thấp trên đỉnh đồi ruộng + bản làng dưới thung
  const hut = (x: number, y: number, z: number, s = 1): void => {
    const g = new THREE.Group()
    k.box(0.9, 0.45, 0.6, 0x9b6a3a, 0, 0, 0, g)
    k.box(0.92, 0.04, 0.62, 0x6b4a2a, 0, 0.2, 0, g)
    k.arch(0.25, 0.36, 0.03, 0.16, 0.32, 0x3a2418, 0, 0, 0.31, g)
    k.gable(1.15, 0.95, 0.42, 0x7a6a5a, 0, 0.45, 0, g)
    g.scale.setScalar(s)
    k.put(g, x, y, z)
  }
  hut(-1.2, 2.4, -0.6, 0.9)
  hut(3.2, 0.0, 3.4, 0.8)
  hut(4.2, 0.0, 2.6, 0.7)
  hut(2.4, 0.0, 4.2, 0.75)
  // suối + cầu gỗ
  k.water(0.6, 6, 4.6, 1.6, false, 0x6fc4e0, 0.03)
  k.box(0.9, 0.06, 0.36, 0x8a5a36, 4.6, 0.12, 3.0)
  k.railing(4.15, 2.84, 5.05, 2.84, 0.18, 0.18, 0x6b4a32, 4)
  // trâu + người áo chàm
  const buffalo = new THREE.Group()
  k.ball(0.22, 0x4a4a52, 0, 0.32, 0, 0.75, 1.5, 0.9, buffalo)
  k.ball(0.11, 0x4a4a52, 0.36, 0.38, 0, 1, 1.1, 0.9, buffalo)
  for (const s2 of [-1, 1]) {
    const horn = k.cone(0.03, 0.18, 0xd9d2c0, 0.38, 0.48, s2 * 0.1, 6, buffalo)
    horn.rotation.x = s2 * 1.2
  }
  for (const [dx, dz] of [
    [0.16, 0.1],
    [-0.16, 0.1],
    [0.16, -0.1],
    [-0.16, -0.1]
  ])
    k.cyl(0.035, 0.035, 0.2, 0x3a3a42, dx, 0, dz, 6, buffalo)
  k.put(buffalo, 1.8, 0.3, 2.8)
  const farmer = k.person(1.2, 0.3, 2.8, 0x2f3f7a, true, undefined, 0.6)
  k.person(-2.4, 0.9, 1.6, 0x2f3f7a, false, undefined, 0.55)
  k.person(2.8, 0, 3.8, 0xc8322b, true, undefined, 0.55)
  for (const [x, z, s] of [
    [-4.2, 2.6, 1.0],
    [4.6, -0.6, 1.1],
    [-3.6, -1.4, 0.9],
    [3.8, 4.4, 0.8]
  ] as const)
    k.pine(x, z, s)
  // mây trôi vờn núi
  const drift: ThreeNS.Group[] = []
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Group()
    for (let b = 0; b < 4; b++)
      k.ball(0.38 + (b % 2) * 0.14, 0xffffff, b * 0.42 - 0.7, (b % 2) * 0.12, 0, 0.55, 1, 1, c)
    k.put(c, -4 + i * 3, 3.0 + i * 0.5, -2.2 + i * 0.4)
    drift.push(c)
  }
  k.group.userData.tick = (t: number): void => {
    drift.forEach((c, i) => {
      c.position.x = ((t * 0.18 + i * 3.4) % 11) - 5.5
    })
    const u = (Math.sin(t * 0.12) + 1) / 2
    cabin.position.set(3.6 + (1.3 - 3.6) * u, 1.45 + (4.15 - 1.45) * u, 2.6 + (-3.3 - 2.6) * u)
    buffalo.position.x = 1.8 + Math.sin(t * 0.15) * 0.8
    buffalo.rotation.y = Math.cos(t * 0.15) > 0 ? 0 : Math.PI
    farmer.position.x = buffalo.position.x - (Math.cos(t * 0.15) > 0 ? 0.6 : -0.6)
  }
  return k.group
}

/**
 * Tràng An (Ninh Bình). Đặc điểm thật: những khối núi đá vôi tròn phủ cây xanh mọc lên giữa đồng nước, hang xuyên núi
 * thấp sát mặt nước, đò nan chở khách do người chèo đội nón lá, đền nhỏ mái ngói bên bờ, ruộng lúa và sen.
 */
export function trangAn(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.6, 10.6, 0, 0, true, 0x4fa89a)
  // các núi đá tròn phủ xanh
  const hills: Array<[number, number, number, number]> = [
    [-3.2, -2.2, 2.6, 1.3],
    [3.0, -2.6, 3.0, 1.4],
    [-3.8, 1.4, 1.8, 0.9],
    [4.0, 1.2, 2.0, 1.0],
    [0.3, -4.0, 2.2, 1.1]
  ]
  hills.forEach(([x, z, h, r], i) => {
    k.rock(x, h * 0.45, z, r, h * 0.55, r * 0.95, 0xa9a290, i + 21)
    k.ball(r * 0.95, 0x4f9a3b, x, h * 0.85, z, 0.55, 1, 0.95)
    k.ball(r * 0.6, 0x79c25a, x + 0.2, h * 0.98, z + 0.1, 0.5, 1, 1)
  })
  // núi lớn giữa có hang xuyên sát mặt nước
  // hai khối đá hai bên + mái đá phía trên chừa cửa hang thấp sát mặt nước
  k.rock(-1.55, 1.2, -0.6, 1.25, 1.5, 1.2, 0xa9a290, 41)
  k.rock(1.55, 1.2, -0.6, 1.25, 1.55, 1.2, 0xa49e8c, 43)
  k.rock(0, 2.35, -0.6, 2.5, 0.95, 1.25, 0xaaa492, 47)
  k.ball(0.75, 0x1e2a22, 0, 0.35, 0.1, 0.75, 1, 0.3) // lòng hang tối
  k.ball(1.9, 0x4f9a3b, 0, 3.1, -0.6, 0.45, 1.2, 0.8)
  k.ball(1.0, 0x79c25a, 0.4, 3.4, -0.5, 0.4, 1, 1)
  for (let i = 0; i < 5; i++)
    k.box(0.04, 0.6 + hash(i) * 0.6, 0.04, 0x6b8a4a, -1.8 + i * 0.9, 1.4, 0.62) // dây leo
  // đền nhỏ bên bờ (mái ngói, cổng tam quan)
  k.cyl(1.0, 1.1, 0.25, 0x7cc45a, 3.2, 0, 3.2, 20)
  k.box(1.0, 0.45, 0.7, 0xe8c25a, 3.2, 0.25, 3.0)
  k.eaveRoof(1.4, 1.0, 2, 0x5a4038, 0xd8d2c0, 3.2, 0.7, 3.0)
  for (const dx of [-0.6, 0.6]) k.box(0.12, 0.6, 0.12, 0xd8d2c0, 3.2 + dx, 0.25, 3.7)
  k.box(1.4, 0.1, 0.16, 0x5a4038, 3.2, 0.85, 3.7)
  // ruộng lúa + sen
  k.cyl(1.2, 1.3, 0.12, 0x9bd160, -3.0, 0, 3.6, 18)
  for (let i = 0; i < 10; i++) {
    const x = -1.2 + hash(i) * 2.4
    const z = 2.4 + hash(i + 9) * 1.6
    k.cyl(0.15, 0.15, 0.02, 0x4f9a5a, x, 0.06, z, 10)
    if (i % 2) k.ball(0.06, 0xf4a6c0, x, 0.13, z, 0.8)
  }
  // đò nan + người chèo nón lá + khách
  const boats: ThreeNS.Group[] = []
  const oars: ThreeNS.Mesh[] = []
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Group()
    const prof = new THREE.Shape()
    prof.moveTo(-0.7, 0.18)
    prof.quadraticCurveTo(-0.55, -0.06, 0, -0.07)
    prof.quadraticCurveTo(0.55, -0.06, 0.7, 0.18)
    prof.closePath()
    const geo = new THREE.ExtrudeGeometry(prof, {
      depth: 0.34,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 2
    })
    geo.translate(0, 0, -0.17)
    k.put(k.mesh(geo, 0x5a7a4a), 0, 0.05, 0, b)
    k.person(-0.45, 0.08, 0, 0xf2c94c, true, b, 0.5)
    k.person(0.1, 0.06, 0, [0xe24a3b, 0x4aa8d8][i], false, b, 0.42)
    k.person(0.35, 0.06, 0, 0x7cc45a, false, b, 0.42)
    const oar = k.box(0.6, 0.02, 0.02, 0x6b4a32, -0.5, 0.2, 0.22, b)
    oars.push(oar)
    k.put(b, 0, 0.06, 2 + i)
    boats.push(b)
  }
  k.group.userData.tick = (t: number): void => {
    boats.forEach((b, i) => {
      const u = (t * 0.05 + i * 0.5) % 2
      const z = u < 1 ? 4.2 - u * 8 : -3.8 + (u - 1) * 8
      b.position.set(-0.2 + i * 0.5, 0.06 + Math.sin(t * 2 + i) * 0.02, z)
      b.rotation.y = u < 1 ? Math.PI / 2 : -Math.PI / 2
      oars[i].rotation.z = Math.sin(t * 2.6 + i) * 0.35
    })
  }
  return k.group
}

/**
 * Cầu Rồng (Đà Nẵng). Đặc điểm thật: thân rồng thép sơn vàng uốn thành nhiều vòm cong vắt qua giữa mặt cầu, đầu rồng ở
 * đầu cầu phía biển (phun lửa và phun nước vào cuối tuần), vảy và vây đỏ, mặt cầu rộng nhiều làn xe, trụ cầu trên sông
 * Hàn, nhà cao tầng hai bờ, đèn dọc cầu.
 */
export function dragonBridge(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.8, 4.6, 0, 0, false, 0x3f9ad0)
  for (const sz of [-1, 1]) {
    k.box(10.8, 0.3, 2.9, 0xb9b4a8, 0, 0, sz * 3.75) // kè hai bờ
    k.box(10.8, 0.06, 2.9, 0x7cc45a, 0, 0.3, sz * 3.75)
  }
  // mặt cầu + làn đường + lan can + trụ
  k.box(10.6, 0.18, 1.8, 0x4a4f5c, 0, 0.75, 0)
  for (let i = -10; i <= 10; i++) {
    k.box(0.3, 0.012, 0.05, 0xffffff, i * 0.5, 0.93, 0.3)
    k.box(0.3, 0.012, 0.05, 0xffffff, i * 0.5, 0.93, -0.3)
  }
  k.box(10.6, 0.012, 0.06, 0xf2c94c, 0, 0.93, 0)
  for (const sz of [-0.88, 0.88]) {
    k.box(10.6, 0.14, 0.06, 0xd9d2c0, 0, 0.93, sz)
    for (let i = -5; i <= 5; i++) k.lamp(i, sz * 1.02, 0.93, undefined, 0.45)
  }
  for (const x of [-4.2, -2.1, 0, 2.1, 4.2]) {
    k.cyl(0.22, 0.26, 0.75, 0xb9b4a8, x, 0, -0.45, 12)
    k.cyl(0.22, 0.26, 0.75, 0xb9b4a8, x, 0, 0.45, 12)
  }
  // thân rồng: các vòm cong đặt giữa mặt cầu, chạm mặt cầu ở chân vòm
  const pts: ThreeNS.Vector3[] = []
  const N = 80
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = -4.8 + t * 9.0
    const y = 0.95 + Math.abs(Math.sin(t * Math.PI * 3)) * (1.1 + Math.sin(t * Math.PI) * 0.4)
    pts.push(new THREE.Vector3(x, y, Math.sin(t * Math.PI * 6) * 0.05))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  k.put(k.mesh(new THREE.TubeGeometry(curve, 240, 0.16, 14, false), 0xf2b630), 0, 0, 0)
  // vảy (vòng đỏ) + vây lưng
  for (let i = 2; i < 78; i += 2) {
    const p = curve.getPointAt(i / 80)
    const tng = curve.getTangentAt(i / 80)
    if (i % 4 === 0) {
      const ring = k.mesh(new THREE.TorusGeometry(0.165, 0.025, 6, 16), 0xe8432e)
      k.put(ring, p.x, p.y, p.z)
      ring.lookAt(p.clone().add(tng))
    }
    const fin = k.cone(0.07, 0.24, 0xc8322b, p.x, p.y + 0.12, p.z, 6)
    fin.rotation.z = -Math.atan2(tng.y, tng.x) * 0.5
  }
  // đầu rồng: hàm, mũi, mắt, sừng, bờm, râu
  const head = curve.getPointAt(1)
  const hg = new THREE.Group()
  k.ball(0.32, 0xf2b630, 0, 0.05, 0, 0.9, 1.3, 1, hg)
  k.ball(0.2, 0xf2b630, 0.42, -0.02, 0, 0.6, 1.5, 0.9, hg) // mõm
  k.ball(0.15, 0xe8432e, 0.4, -0.16, 0, 0.35, 1.4, 0.8, hg) // hàm dưới
  for (const s of [-1, 1]) {
    k.ball(0.07, 0xffffff, 0.18, 0.2, s * 0.2, 1, 1, 1, hg)
    k.ball(0.035, 0x111111, 0.22, 0.21, s * 0.23, 1, 1, 1, hg)
    const horn = k.cone(0.05, 0.45, 0xe8432e, -0.05, 0.4, s * 0.16, 6, hg)
    horn.rotation.z = 0.6
    const whisker = k.cyl(0.012, 0.008, 0.8, 0xfff1c9, 0.65, -0.05, s * 0.18, 5, hg)
    whisker.rotation.z = 1.25
    whisker.rotation.x = s * 0.4
  }
  for (let i = 0; i < 5; i++) {
    const mane = k.cone(
      0.06,
      0.32,
      0xe8432e,
      -0.25 - i * 0.05,
      0.25 - i * 0.04,
      (i - 2) * 0.1,
      6,
      hg
    )
    mane.rotation.z = 1.2
  }
  k.put(hg, head.x + 0.2, head.y, head.z)
  // lửa / nước phun từ miệng
  const fire = new THREE.Group()
  k.cone(0.2, 0.8, 0xff8a2a, 0, 0, 0, 10, fire).rotation.z = -Math.PI / 2
  k.cone(0.12, 0.55, 0xffe27a, 0.06, 0.02, 0, 10, fire).rotation.z = -Math.PI / 2
  k.put(fire, head.x + 1.15, head.y - 0.02, head.z)
  // đuôi xoắn
  const tail = curve.getPointAt(0)
  k.put(
    k.mesh(new THREE.TorusGeometry(0.2, 0.08, 8, 16, Math.PI * 1.5), 0xf2b630),
    tail.x - 0.2,
    tail.y + 0.15,
    tail.z
  )
  // nhà cao tầng hai bờ
  const towers: Array<[number, number, number, number, number]> = [
    [-4.3, -3.4, 0.8, 2.8, 0xdfe6ea],
    [-3.0, -3.8, 0.7, 2.0, 0xf3e7c4],
    [-1.6, -3.6, 0.6, 1.4, 0xd5e4ee],
    [3.0, -3.5, 0.9, 3.4, 0xd5e4ee],
    [4.4, -3.2, 0.7, 2.4, 0xf6d9a8],
    [4.3, 3.6, 0.8, 1.8, 0xf3e7c4]
  ]
  for (const [x, z, w, h, c] of towers) {
    k.box(w, h, w, c, x, 0.36, z)
    for (let r = 0; r < h * 4; r++)
      k.box(w * 0.75, 0.05, 0.02, 0x6fb4d8, x, 0.5 + r * 0.24, z + w / 2 + 0.01)
    k.box(w + 0.06, 0.08, w + 0.06, 0xa05a3a, x, 0.36 + h, z)
  }
  for (const [x, z] of [
    [-4.4, 3.2],
    [-2.6, 3.6],
    [2.4, 3.4],
    [-0.6, 3.8]
  ] as const)
    k.palm(x, z, 0.7, 0.36)
  // xe chạy trên cầu + thuyền trên sông
  const cars = [
    k.car(0, 0, 0xe24a3b),
    k.car(0, 0, 0x4aa8d8),
    k.car(0, 0, 0xf2b630),
    k.car(0, 0, 0xffffff)
  ]
  const boat = new THREE.Group()
  k.box(0.9, 0.18, 0.34, 0xffffff, 0, 0, 0, boat)
  k.box(0.4, 0.2, 0.28, 0x3a7aa0, -0.1, 0.18, 0, boat)
  k.put(boat, 0, 0.08, 1.6)
  k.group.userData.tick = (t: number): void => {
    const phase = t % 8
    fire.visible = phase > 6
    if (fire.visible)
      fire.scale.set(
        0.5 + (phase - 6) * 0.6 + Math.sin(t * 30) * 0.1,
        1 + Math.sin(t * 25) * 0.15,
        1
      )
    cars.forEach((c, i) => {
      const dir = i % 2 ? -1 : 1
      const x = ((((t * 0.7 + i * 2.6) % 10.4) + 10.4) % 10.4) - 5.2
      c.position.set(dir * x, 0.93, dir * 0.42)
      c.rotation.y = dir > 0 ? 0 : Math.PI
      c.scale.setScalar(0.5)
    })
    boat.position.x = Math.sin(t * 0.1) * 4.4
    boat.rotation.y = Math.cos(t * 0.1) > 0 ? 0 : Math.PI
    boat.position.y = 0.08 + Math.sin(t * 2) * 0.02
  }
  return k.group
}
