// Công trình 3D chi tiết đợt 3 (docs/18-ui-rules.md §10): Tháp Bà Ponagar, ga Đà Lạt, chợ nổi Cái Răng, làng chài Phú Quốc.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

type Three = typeof ThreeNS

const BRICK = 0xb35a3a
const BRICK_DARK = 0x8a3f28
const BRICK_LIGHT = 0xc87050

/** Thuyền gỗ miền biển: thân cong, mũi vẽ mắt, ca-bin nhỏ */
function eyeBoat(k: Kit, hull: number, cabin: number, s = 1): ThreeNS.Group {
  const { THREE } = k
  const g = new THREE.Group()
  const prof = new THREE.Shape()
  prof.moveTo(-1.0, 0.36)
  prof.quadraticCurveTo(-0.85, -0.05, -0.3, -0.08)
  prof.lineTo(0.55, -0.08)
  prof.quadraticCurveTo(1.05, 0.05, 1.25, 0.42)
  prof.closePath()
  const geo = new THREE.ExtrudeGeometry(prof, {
    depth: 0.6,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2
  })
  geo.translate(0, 0, -0.3)
  k.put(k.mesh(geo, hull), 0, 0.06, 0, g)
  k.box(2.1, 0.05, 0.66, 0xc8322b, 0.1, 0.4, 0, g) // viền mạn
  for (const sz of [-1, 1]) {
    k.ball(0.07, 0xffffff, 1.0, 0.3, sz * 0.31, 1, 1, 0.3, g) // mắt thuyền
    k.ball(0.035, 0x111111, 1.03, 0.3, sz * 0.33, 1, 1, 0.3, g)
  }
  k.box(0.6, 0.32, 0.5, cabin, -0.45, 0.42, 0, g)
  k.gable(0.7, 0.62, 0.18, 0xc8322b, -0.45, 0.74, 0, g)
  k.cyl(0.025, 0.03, 0.9, 0x5e3b22, 0.35, 0.42, 0, 6, g)
  k.box(0.28, 0.16, 0.02, 0xd92b2b, 0.5, 1.15, 0, g)
  g.scale.setScalar(s)
  return g
}

/**
 * Tháp Bà Ponagar (Nha Trang). Đặc điểm thật: cụm tháp Chăm gạch nung đỏ trên đồi Cù Lao bên cửa sông Cái — tháp chính
 * cao nhiều tầng thu nhỏ, đỉnh nhọn, cửa chính có mái vòm nhọn nhìn ra sông; hai hàng cột gạch bát giác ở tiền đình phía
 * dưới; bậc thang dốc; thuyền đánh cá vẽ mắt trên sông, dừa và bãi cát.
 */
export function ponagar(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.6, 4.4, 0, 3.6, false, 0x4aa8c8)
  k.cyl(5.0, 5.2, 0.12, 0xe9d49a, 0, 0, -1.2, 40) // bờ cát
  // đồi hai bậc
  k.cyl(3.8, 4.3, 0.7, 0x8fa860, 0, 0.1, -1.6, 32)
  k.cyl(2.8, 3.1, 0.6, 0xa8b870, 0.2, 0.8, -2.0, 28)
  // tiền đình: hai hàng cột gạch bát giác trên nền thấp
  k.box(3.2, 0.12, 1.4, BRICK_DARK, -0.2, 0.8, 0.6)
  for (let i = 0; i < 5; i++)
    for (const dz of [0.2, 1.0]) {
      k.cyl(0.13, 0.15, 0.95, BRICK_LIGHT, -1.4 + i * 0.6, 0.92, dz, 8)
      k.cyl(0.17, 0.17, 0.06, BRICK_DARK, -1.4 + i * 0.6, 1.86, dz, 8)
    }
  // bậc thang dốc lên tháp
  for (let i = 0; i < 7; i++)
    k.box(0.9, 0.1, 0.24, 0xc9a07a, 0.2, 0.82 + i * 0.09, -0.15 - i * 0.18)
  // tháp Chăm: tầng thân + các tầng mái thu nhỏ, mỗi tầng có tháp nhỏ ở góc và hốc vòm nhọn
  const tower = (x: number, z: number, s: number, tiers: number): void => {
    const g = new THREE.Group()
    k.box(1.6, 0.25, 1.6, BRICK_DARK, 0, 0, 0, g)
    k.box(1.3, 1.3, 1.3, BRICK, 0, 0.25, 0, g)
    for (const dx of [-0.5, 0, 0.5]) k.box(0.12, 1.3, 0.04, BRICK_LIGHT, dx, 0.25, 0.66, g) // trụ ốp
    // cửa chính có mái vòm nhọn
    k.box(0.55, 0.9, 0.3, BRICK, 0, 0.25, 0.75, g)
    k.arch(0.42, 0.75, 0.05, 0.28, 0.66, 0x2a1810, 0, 0.25, 0.92, g)
    k.cone(0.32, 0.45, BRICK_LIGHT, 0, 1.15, 0.78, 4, g).rotation.y = Math.PI / 4
    let y = 1.55
    let w = 1.15
    for (let i = 0; i < tiers; i++) {
      k.box(w + 0.1, 0.08, w + 0.1, BRICK_DARK, 0, y, 0, g)
      k.box(w, 0.42, w, BRICK, 0, y + 0.08, 0, g)
      k.arch(w * 0.4, 0.34, 0.03, 0.18, 0.3, 0x2a1810, 0, y + 0.1, w / 2 + 0.01, g)
      for (const [cx, cz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ])
        k.cone(0.07, 0.24, BRICK_LIGHT, (cx * w) / 2, y + 0.5, (cz * w) / 2, 6, g)
      y += 0.5
      w *= 0.78
    }
    k.cone(w * 0.55, 0.7, BRICK, 0, y, 0, 8, g)
    k.ball(0.06, 0xe8b830, 0, y + 0.75, 0, 1, 1, 1, g)
    g.scale.setScalar(s)
    k.put(g, x, 1.4, z)
  }
  tower(0.2, -2.0, 1.0, 4)
  tower(-1.8, -2.4, 0.62, 3)
  tower(2.2, -2.6, 0.55, 2)
  tower(1.6, -0.9, 0.42, 2)
  for (const [x, z, s] of [
    [-4.0, 1.4, 1],
    [4.2, 1.2, 1.1],
    [-3.2, -3.6, 0.9],
    [3.9, -3.2, 1.0]
  ] as const)
    k.palm(x, z, s, 0.12)
  for (const [x, z, c] of [
    [-0.6, 1.5, 0xe24a3b],
    [0.9, 1.6, 0x4aa8d8],
    [0.4, 0.4, 0xf2c94c]
  ] as const)
    k.person(x, 0.85, z, c, false, undefined, 0.5)
  // thuyền vẽ mắt trên sông + thúng
  const b1 = eyeBoat(k, 0x2b6fb0, 0xf3e7c4, 0.7)
  k.put(b1, -2.4, 0.05, 3.6)
  const b2 = eyeBoat(k, 0x2f8a6a, 0xf6d9a8, 0.6)
  k.put(b2, 2.4, 0.05, 4.4)
  const tub = new THREE.Group()
  k.cyl(0.32, 0.24, 0.18, 0x6b8a4a, 0, 0, 0, 16, tub)
  k.person(0, 0.08, 0, 0x4aa8d8, true, tub, 0.45)
  k.put(tub, 0.6, 0.05, 3.0)
  k.group.userData.tick = (t: number): void => {
    b1.position.x = -2.4 + Math.sin(t * 0.12) * 1.6
    b1.rotation.y = Math.cos(t * 0.12) > 0 ? 0 : Math.PI
    b1.rotation.z = Math.sin(t * 1.6) * 0.05
    b2.position.y = 0.05 + Math.sin(t * 1.9) * 0.03
    b2.rotation.z = Math.sin(t * 1.4 + 1) * 0.05
    tub.rotation.y = t * 0.5
    tub.position.y = 0.05 + Math.sin(t * 2.2) * 0.03
  }
  return k.group
}

/**
 * Ga Đà Lạt. Đặc điểm thật: nhà ga kiến trúc Pháp màu vàng kem, ba mái nhọn hình tam giác cao (gợi ba đỉnh Langbiang),
 * cửa sổ kính màu, đồng hồ ở gian giữa; sân ga có đầu máy hơi nước đen bánh đỏ kéo toa gỗ; đồi thông, luống hoa cẩm tú
 * cầu xanh/hồng; hồ Xuân Hương với thuyền thiên nga.
 */
export function dalatStation2(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  const wall = 0xf2dfa0
  const trim = 0xf8f4e6
  const roof = 0xa3402e
  k.cyl(5.1, 5.2, 0.08, 0x8fb86a, 0, 0, 0, 40)
  // nhà ga: thân dài + ba gian mái nhọn
  k.box(7.6, 1.3, 2.2, wall, 0, 0.08, -1.0)
  k.box(7.7, 0.1, 2.3, trim, 0, 1.38, -1.0)
  k.gable(7.6, 2.4, 0.5, roof, 0, 1.48, -1.0)
  const peak = (x: number, w: number, h: number): void => {
    k.box(w, h, 2.3, wall, x, 0.08, -0.95)
    for (const dx of [-w / 2 + 0.06, w / 2 - 0.06]) k.box(0.1, h, 0.06, trim, x + dx, 0.08, 0.22)
    const r = k.gable(2.6, w + 0.4, h * 0.95, roof, x, 0.08 + h, -0.95)
    r.rotation.y = Math.PI / 2
    // cửa sổ kính màu hình vòm
    const colors = [0x4aa8d8, 0xf2b630, 0xc8322b, 0x7cc45a, 0xf08ac0]
    for (let i = 0; i < 5; i++) k.box(0.14, 0.7, 0.03, colors[i], x - 0.32 + i * 0.16, 0.5, 0.22)
    k.arch(0.9, 1.0, 0.04, 0.82, 0.95, trim, x, 0.42, 0.23)
    k.box(0.6, 0.55, 0.03, 0x6b4a32, x, 0.08, 0.22) // cửa ra vào
  }
  peak(-2.5, 1.8, 2.0)
  peak(0, 2.2, 2.6)
  peak(2.5, 1.8, 2.0)
  const clock = k.cyl(0.3, 0.3, 0.04, 0xffffff, 0, 2.15, 0.25, 20)
  clock.rotation.x = Math.PI / 2
  clock.position.set(0, 2.15, 0.25)
  const hand = k.box(0.03, 0.22, 0.02, 0x111111, 0, 2.15, 0.28)
  k.sign('ĐÀ LẠT', 1.0, 0.2, '#a3402e', '#fff4d0', 0, 1.6, 0.23)
  // sân ga + đường ray
  k.box(9.6, 0.14, 1.0, 0xcfc9bd, 0, 0.08, 0.7)
  for (const z of [1.6, 2.1]) k.box(10, 0.05, 0.06, 0x6b6b75, 0, 0.14, z)
  for (let i = -16; i <= 16; i++) k.box(0.1, 0.04, 0.8, 0x6b4a32, i * 0.3, 0.1, 1.85)
  // đầu máy hơi nước + toa gỗ
  const train = new THREE.Group()
  const loco = new THREE.Group()
  k.box(1.5, 0.12, 0.62, 0x2b2b36, 0, 0.18, 0, loco)
  const boiler = k.cyl(0.26, 0.26, 0.95, 0x2b2b36, 0.25, 0.55, 0, 16, loco)
  boiler.rotation.z = Math.PI / 2
  boiler.position.set(0.3, 0.55, 0)
  k.cyl(0.07, 0.1, 0.35, 0x2b2b36, 0.65, 0.78, 0, 10, loco) // ống khói
  k.box(0.6, 0.6, 0.66, 0x7a2a22, -0.5, 0.3, 0, loco) // buồng lái
  k.box(0.7, 0.06, 0.72, 0x2b2b36, -0.5, 0.9, 0, loco)
  for (const x of [-0.5, 0, 0.45]) {
    for (const z of [0.33, -0.33]) {
      const w = k.cyl(0.18, 0.18, 0.06, 0xc8322b, x, 0, z, 14, loco)
      w.rotation.x = Math.PI / 2
      w.position.set(x, 0.2, z)
    }
  }
  k.ball(0.06, 0xffe27a, 0.78, 0.55, 0, 1, 1, 1, loco, { emissive: 0x6a5410 })
  k.put(loco, 1.7, 0.14, 1.85, train)
  for (let i = 0; i < 2; i++) {
    const car = new THREE.Group()
    k.box(1.6, 0.6, 0.62, 0x9b6a3a, 0, 0.22, 0, car)
    for (let w = 0; w < 4; w++) k.box(0.24, 0.2, 0.03, 0xfff1c9, -0.55 + w * 0.37, 0.5, 0.32, car)
    k.box(1.66, 0.06, 0.68, 0x5e3b22, 0, 0.82, 0, car)
    for (const x of [-0.5, 0.5]) {
      const w2 = k.cyl(0.13, 0.13, 0.66, 0x2b2b36, x, 0, 0, 10, car)
      w2.rotation.x = Math.PI / 2
      w2.position.set(x, 0.16, 0)
    }
    k.put(car, -0.1 - i * 1.75, 0.14, 1.85, train)
  }
  k.put(train, 0, 0, 0)
  // đồi thông, luống cẩm tú cầu, hồ nhỏ có thuyền thiên nga
  for (const [x, z, s] of [
    [-4.4, -2.6, 1.3],
    [-3.4, -3.4, 1.1],
    [4.4, -2.8, 1.4],
    [3.4, -3.6, 1.0],
    [-4.6, 0.4, 1.0],
    [4.6, 0.4, 1.1],
    [-1.4, -3.6, 1.0],
    [1.6, -3.7, 1.2]
  ] as const)
    k.pine(x, z, s)
  for (let i = 0; i < 14; i++) {
    const x = -3.6 + i * 0.55
    k.ball(0.18, i % 2 ? 0x8fb0f0 : 0xf4a6c8, x, 0.25, 3.4 + (i % 3) * 0.12, 0.8, 1, 1)
    k.ball(0.14, 0x4f9a3b, x + 0.1, 0.12, 3.5, 0.7, 1, 1)
  }
  k.water(2.6, 1.6, 3.4, 3.9, true, 0x6fb4d8)
  const swanBoat = k.swan(3.3, 0.06, 3.9, 0.5)
  for (const [x, z, c] of [
    [-1.2, 0.6, 0xe24a3b],
    [-0.5, 0.75, 0x4aa8d8],
    [1.0, 0.65, 0x7cc45a]
  ] as const)
    k.person(x, 0.22, z, c, false, undefined, 0.5)
  const steam: ThreeNS.Mesh[] = []
  for (let i = 0; i < 6; i++) steam.push(k.ball(0.14, 0xffffff, 0, 0, 0, 1, 1, 1, train))
  k.group.userData.tick = (t: number): void => {
    const u = (t * 0.045) % 2
    const ease = (v: number): number => v * v * (3 - 2 * v)
    train.position.x = u < 1 ? -3.5 + ease(u) * 3.5 : 0 - ease(u - 1) * 3.5
    steam.forEach((p, i) => {
      const life = (t * 0.8 + i / 6) % 1
      p.position.set(2.35 - life * 0.5, 1.1 + life * 1.1, 1.85)
      p.scale.setScalar(0.5 + life * 1.5)
    })
    hand.rotation.z = -t * 0.2
    swanBoat.position.set(3.4 + Math.cos(t * 0.3) * 0.7, 0.06, 3.9 + Math.sin(t * 0.3) * 0.4)
    swanBoat.rotation.y = -t * 0.3 - Math.PI / 2
  }
  return k.group
}

/** Ghe hàng chợ nổi: thân dài, mũi đỏ vẽ mắt, mui cong, cây bẹo treo hàng, người bán nón lá */
function marketBoat(k: Kit, hull: number, goods: number[], hang: number[]): ThreeNS.Group {
  const { THREE } = k
  const g = new THREE.Group()
  const prof = new THREE.Shape()
  prof.moveTo(-1.3, 0.34)
  prof.quadraticCurveTo(-1.05, -0.08, -0.3, -0.1)
  prof.lineTo(0.7, -0.1)
  prof.quadraticCurveTo(1.25, 0.0, 1.5, 0.42)
  prof.closePath()
  const geo = new THREE.ExtrudeGeometry(prof, {
    depth: 0.75,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2
  })
  geo.translate(0, 0, -0.375)
  k.put(k.mesh(geo, hull), 0, 0.05, 0, g)
  k.box(1.0, 0.18, 0.82, 0xc8322b, 1.05, 0.25, 0, g) // mũi đỏ
  for (const sz of [-1, 1]) {
    k.ball(0.07, 0xffffff, 1.3, 0.32, sz * 0.4, 1, 1, 0.3, g)
    k.ball(0.035, 0x111111, 1.33, 0.32, sz * 0.42, 1, 1, 0.3, g)
  }
  // mui cong che nắng (nửa ống)
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.9, 16, 1, true, 0, Math.PI),
    k.mat(0x3a7a5a, { double: true })
  )
  canopy.rotation.z = Math.PI / 2 // trục dọc thân ghe, vòm cong lên trên
  k.put(canopy, -0.65, 0.42, 0, g)
  // hàng hoá chất trên ghe
  goods.forEach((c, i) => {
    const px = -0.05 + (i % 3) * 0.32
    const pz = i < 3 ? -0.17 : 0.17
    if (c === 0x7cc45a)
      k.ball(0.17, c, px, 0.5, pz, 0.85, 1.25, 1, g) // dưa hấu
    else if (c === 0xf2b630) {
      k.ball(0.12, c, px, 0.5, pz, 1.3, 1, 1, g) // dứa
      k.cone(0.08, 0.18, 0x4f9a3b, px, 0.62, pz, 6, g)
    } else k.ball(0.11, c, px, 0.46, pz, 1, 1, 1, g)
  })
  // cây bẹo: sào cao treo mẫu hàng đang bán
  k.cyl(0.025, 0.035, 2.0, 0x8a6a42, 0.65, 0.3, 0, 6, g)
  hang.forEach((c, i) =>
    k.ball(0.11, c, 0.65 + (i % 2 ? 0.14 : -0.14), 1.4 + i * 0.22, 0, 1.1, 1, 1, g)
  )
  k.person(-0.95, 0.15, 0, 0x2f6a4a, true, g, 0.55)
  return g
}

/**
 * Chợ nổi Cái Răng (Cần Thơ). Đặc điểm thật: chợ họp trên sông Hậu nước phù sa; ghe xuồng chen nhau, mũi ghe sơn đỏ vẽ
 * mắt, mui cong; mỗi ghe dựng "cây bẹo" treo mẫu hàng (dứa, dưa hấu, bí, khoai); xuồng nhỏ bán cà phê, hủ tiếu; nhà
 * sàn ven sông, dừa nước; cầu Cần Thơ dây văng phía xa.
 */
export function caiRang(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.6, 10.6, 0, 0, true, 0x6aa7a0)
  const boats = [
    marketBoat(
      k,
      0x2f6a8a,
      [0x7cc45a, 0x7cc45a, 0xf2b630, 0xf2b630, 0xe8a03a, 0x7cc45a],
      [0xf2b630, 0x7cc45a, 0xe8a03a]
    ),
    marketBoat(
      k,
      0x5a7a4a,
      [0xe8a03a, 0xe8a03a, 0xf2b630, 0x9b6a3a, 0x9b6a3a, 0xe8a03a],
      [0xe8a03a, 0x9b6a3a]
    ),
    marketBoat(
      k,
      0x8a5a3a,
      [0xf2b630, 0xf2b630, 0xf2b630, 0x7cc45a, 0xe8432e, 0xe8432e],
      [0xf2b630, 0xe8432e, 0x7cc45a]
    ),
    marketBoat(
      k,
      0x2f6a8a,
      [0xe8432e, 0xf08ac0, 0xf2b630, 0x7cc45a, 0xf2b630, 0xe8432e],
      [0xf08ac0, 0xe8432e]
    )
  ]
  const spots: Array<[number, number, number]> = [
    [-1.8, -1.6, 0.25],
    [1.9, -2.0, -0.35],
    [-2.0, 1.4, -0.15],
    [1.8, 1.6, 0.3]
  ]
  boats.forEach((b, i) => {
    b.rotation.y = spots[i][2]
    k.put(b, spots[i][0], 0.03, spots[i][1])
  })
  // xuồng nhỏ bán cà phê
  const canoe = new THREE.Group()
  k.cyl(0.12, 0.12, 1.1, 0x6b4a32, 0, 0, 0, 10, canoe).rotation.z = Math.PI / 2
  canoe.children[canoe.children.length - 1].position.set(0, 0.12, 0)
  k.person(-0.25, 0.1, 0, 0xc8322b, true, canoe, 0.45)
  k.cyl(0.08, 0.08, 0.16, 0xd9d9e0, 0.25, 0.14, 0, 10, canoe) // ấm cà phê
  k.put(canoe, 0, 0.05, 0)
  // nhà sàn ven sông + dừa nước
  for (const [x, z, r] of [
    [-4.3, -0.6, 0.4],
    [4.3, 0.4, -0.3]
  ] as const) {
    const h = new THREE.Group()
    for (const [dx, dz] of [
      [-0.45, -0.35],
      [0.45, -0.35],
      [-0.45, 0.35],
      [0.45, 0.35]
    ])
      k.cyl(0.04, 0.05, 0.6, 0x6b4a32, dx, 0, dz, 6, h)
    k.box(1.2, 0.07, 0.95, 0x9b7a4a, 0, 0.6, 0, h)
    k.box(1.0, 0.55, 0.8, 0xd9b98a, 0, 0.67, 0, h)
    k.gable(1.35, 1.1, 0.45, 0x7a6a5a, 0, 1.22, 0, h)
    h.rotation.y = r
    k.put(h, x, 0, z)
    k.palm(x + (x < 0 ? 0.6 : -0.6), z - 1.3, 0.85, 0)
    k.palm(x + (x < 0 ? -0.2 : 0.2), z + 1.4, 0.75, 0)
  }
  // cầu Cần Thơ dây văng phía xa
  const bx = 0
  const bz = -4.4
  k.box(9.0, 0.12, 0.5, 0xb9b4a8, bx, 1.0, bz)
  for (const px of [-2.0, 2.0]) {
    k.box(0.18, 2.6, 0.18, 0xdfe6ea, bx + px, 0, bz - 0.18)
    k.box(0.18, 2.6, 0.18, 0xdfe6ea, bx + px, 0, bz + 0.18)
    k.box(0.2, 0.16, 0.56, 0xdfe6ea, bx + px, 2.4, bz)
    for (let i = 1; i <= 4; i++)
      for (const sx of [-1, 1]) {
        const len = Math.hypot(i * 0.45, 1.5 - i * 0.05)
        const cable = k.box(
          0.015,
          len,
          0.015,
          0xffffff,
          bx + px + (sx * i * 0.45) / 2,
          1.05 + (1.5 - i * 0.05) / 2 - len / 2,
          bz
        )
        cable.rotation.z = -sx * Math.atan2(i * 0.45, 1.5 - i * 0.05)
      }
  }
  const home = boats.map((b) => ({ x: b.position.x, z: b.position.z, r: b.rotation.y }))
  k.group.userData.tick = (t: number): void => {
    boats.forEach((b, i) => {
      b.position.x = home[i].x + Math.sin(t * 0.25 + i * 1.7) * 0.35
      b.position.z = home[i].z + Math.cos(t * 0.2 + i) * 0.22
      b.position.y = 0.03 + Math.sin(t * 2 + i) * 0.035
      b.rotation.y = home[i].r + Math.sin(t * 0.35 + i) * 0.1
      b.rotation.x = Math.sin(t * 1.6 + i) * 0.035
    })
    const a = t * 0.18
    canoe.position.set(Math.cos(a) * 0.9, 0.05 + Math.sin(t * 2.4) * 0.02, Math.sin(a) * 0.6)
    canoe.rotation.y = -a - Math.PI / 2
  }
  return k.group
}

/**
 * Làng chài Hàm Ninh (Phú Quốc). Đặc điểm thật: cầu cảng gỗ dài vươn ra biển, nhà sàn trên mặt nước mái tôn, thuyền
 * đánh cá xanh cắm cờ, thúng chai, lồng bẫy ghẹ, giàn phơi mực/cá, nhà thùng ủ nước mắm, bãi cát trắng và hàng dừa.
 */
export function hamNinh(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.6, 10.6, 0, 1.6, true, 0x2fc0cc)
  k.cyl(4.2, 4.6, 0.12, 0xf4e6b8, 0, 0, -2.4, 40) // bãi cát trắng
  // cầu cảng dài vươn ra biển
  for (let i = 0; i < 14; i++) k.box(0.7, 0.06, 0.34, 0x9b7a4a, 0.4, 0.42, -0.6 + i * 0.36)
  for (let i = 0; i < 8; i++)
    for (const dx of [0.1, 0.7]) k.cyl(0.035, 0.04, 0.45, 0x6b4a32, dx, 0, -0.4 + i * 0.65, 6)
  k.railing(0.08, -0.6, 0.08, 4.2, 0.48, 0.2, 0x6b4a32, 10)
  // nhà sàn trên nước mái tôn
  const stilt = (x: number, z: number, wall: number, roof: number): void => {
    const h = new THREE.Group()
    for (const [dx, dz] of [
      [-0.5, -0.4],
      [0.5, -0.4],
      [-0.5, 0.4],
      [0.5, 0.4]
    ])
      k.cyl(0.04, 0.05, 0.5, 0x6b4a32, dx, 0, dz, 6, h)
    k.box(1.3, 0.07, 1.05, 0x9b7a4a, 0, 0.5, 0, h)
    k.box(1.1, 0.6, 0.85, wall, 0, 0.57, 0, h)
    k.box(0.3, 0.42, 0.03, 0x4a3020, 0.2, 0.57, 0.44, h)
    k.box(0.26, 0.2, 0.03, 0x9fd3ef, -0.28, 0.8, 0.44, h)
    const r = k.gable(1.35, 1.2, 0.36, roof, 0, 1.17, 0, h)
    void r
    k.put(h, x, 0, z)
  }
  stilt(-1.5, 1.2, 0xf3e7c4, 0x8aa0b8)
  stilt(2.0, 0.6, 0xd9e8f2, 0x6f9ab8)
  stilt(-2.6, 2.8, 0xf6d9a8, 0x8aa0b8)
  // nhà thùng nước mắm trên bờ
  k.box(1.8, 1.0, 1.2, 0xe8d6a8, -2.6, 0.12, -3.0)
  k.gable(2.0, 1.4, 0.5, 0x8a5a36, -2.6, 1.12, -3.0)
  for (let i = 0; i < 3; i++)
    k.cyl(0.24, 0.26, 0.55, 0x8a5a36, -3.8 + i * 0.0, 0.12, -1.9 + i * 0.55, 14)
  // giàn phơi mực + lồng bẫy ghẹ
  for (let i = 0; i < 4; i++) k.cyl(0.025, 0.025, 0.9, 0x6b4a32, 1.6 + i * 0.5, 0.12, -3.0, 6)
  k.box(1.6, 0.02, 0.02, 0x2b2b36, 2.35, 0.95, -3.0)
  for (let i = 0; i < 8; i++) k.box(0.08, 0.28, 0.02, 0xf1e2c8, 1.7 + i * 0.18, 0.66, -3.0)
  for (let i = 0; i < 4; i++)
    k.box(0.32, 0.22, 0.32, 0x3a6aa0, 3.2 + (i % 2) * 0.4, 0.12 + Math.floor(i / 2) * 0.22, -2.0)
  // thuyền đánh cá + thúng chai
  const boat = new THREE.Group()
  const prof = new THREE.Shape()
  prof.moveTo(-1.2, 0.4)
  prof.quadraticCurveTo(-1.0, -0.06, -0.3, -0.1)
  prof.lineTo(0.7, -0.1)
  prof.quadraticCurveTo(1.25, 0.05, 1.45, 0.5)
  prof.closePath()
  const bg = new THREE.ExtrudeGeometry(prof, {
    depth: 0.7,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2
  })
  bg.translate(0, 0, -0.35)
  k.put(k.mesh(bg, 0x2b6fb0), 0, 0.06, 0, boat)
  k.box(2.4, 0.05, 0.76, 0xe8432e, 0.1, 0.46, 0, boat)
  k.box(0.7, 0.45, 0.55, 0xf3e7c4, -0.55, 0.48, 0, boat)
  k.gable(0.82, 0.68, 0.22, 0x2b6fb0, -0.55, 0.93, 0, boat)
  k.cyl(0.03, 0.03, 1.4, 0x5e3b22, 0.5, 0.48, 0, 6, boat)
  const flag = k.box(0.36, 0.22, 0.02, 0xd92b2b, 0.69, 1.7, 0, boat)
  for (let i = 0; i < 4; i++)
    k.ball(0.06, 0xffd166, -0.2 + i * 0.25, 0.9, 0.3, 1, 1, 1, boat, { emissive: 0x6a4a10 }) // đèn câu mực
  k.put(boat, 2.4, 0.05, 3.4)
  boat.rotation.y = 0.4
  const tubs: ThreeNS.Group[] = []
  for (const [x, z, c] of [
    [-0.8, 3.6, 0x2b6f4a],
    [1.4, 2.2, 0x6b4a32],
    [-3.6, 1.0, 0x2b6f4a]
  ] as const) {
    const tub = new THREE.Group()
    k.cyl(0.34, 0.26, 0.2, c, 0, 0, 0, 18, tub)
    k.cyl(0.29, 0.22, 0.04, 0x9b6a43, 0, 0.2, 0, 18, tub)
    k.person(0, 0.08, 0, 0xc8322b, true, tub, 0.45)
    k.put(tub, x, 0.05, z)
    tubs.push(tub)
  }
  for (const [x, z, s] of [
    [-4.2, -2.6, 1.2],
    [4.2, -1.8, 1.1],
    [-3.4, -4.0, 1.0],
    [1.0, -4.4, 1.2],
    [3.4, -3.8, 0.9]
  ] as const)
    k.palm(x, z, s, 0.12)
  k.person(0.4, 0.48, 1.6, 0x4aa8d8, true, undefined, 0.5)
  k.group.userData.tick = (t: number): void => {
    boat.position.y = 0.05 + Math.sin(t * 1.8) * 0.04
    boat.rotation.z = Math.sin(t * 1.4) * 0.05
    flag.rotation.y = Math.sin(t * 4) * 0.3
    tubs.forEach((tub, i) => {
      tub.rotation.y = t * (i % 2 ? -0.5 : 0.45)
      tub.position.y = 0.05 + Math.sin(t * 2.2 + i) * 0.03
    })
  }
  return k.group
}
