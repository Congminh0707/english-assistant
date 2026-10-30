// Công trình 3D miền Nam: chợ Bến Thành, chợ nổi Cái Răng, làng chài Phú Quốc.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

type Three = typeof ThreeNS

function smallCar(k: Kit, x: number, z: number, color: number, rot = 0): void {
  const g = new k.THREE.Group()
  k.box(0.9, 0.22, 0.45, color, 0, 0.12, 0, g)
  k.box(0.5, 0.2, 0.4, 0xf3e7c4, -0.05, 0.32, 0, g)
  for (const [dx, dz] of [
    [0.3, 0.22],
    [-0.3, 0.22],
    [0.3, -0.22],
    [-0.3, -0.22]
  ])
    k.cyl(0.1, 0.1, 0.08, 0x2b2b36, dx, 0.02, dz, 10, g).rotation.x = Math.PI / 2
  g.rotation.y = rot
  k.put(g, x, 0.05, z)
}

export function hcmcBenThanh(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.cyl(5.3, 5.3, 0.1, 0x5d6068, 0, 0, 0, 48) // vòng xoay + đường
  k.box(7.4, 0.14, 5.2, 0xd9d3c0, 0, 0.1, -1.0)
  for (let i = -4; i <= 4; i++) {
    k.box(0.5, 0.012, 0.1, 0xffffff, i * 1.1, 0.105, 4.2)
    k.box(0.1, 0.012, 0.5, 0xffffff, -4.8, 0.105, i * 0.9)
  }
  // thân chợ: hai cánh vàng kem, dải trang trí, mái thấp
  const wing = (x: number): void => {
    k.box(2.8, 1.5, 3.8, 0xf3e0a0, x, 0.24, -1.2)
    k.box(2.9, 0.12, 3.9, 0xb9854a, x, 1.74, -1.2)
    for (let i = 0; i < 4; i++)
      k.arch(0.55, 1.0, 0.05, 0.42, 0.85, 0x7a4a2a, x - 1.0 + i * 0.68, 0.26, 0.72)
    k.gable(3.0, 4.0, 0.7, 0x7a4a36, x, 1.86, -1.2).rotation.y = 0
  }
  wing(-2.5)
  wing(2.5)
  // sảnh giữa + tháp đồng hồ
  k.box(2.6, 2.3, 3.4, 0xf3e0a0, 0, 0.24, -1.0)
  k.arch(2.2, 2.0, 0.06, 1.3, 1.7, 0x7a4a2a, 0, 0.26, 0.74)
  k.box(2.8, 0.14, 3.6, 0xb9854a, 0, 2.54, -1.0)
  k.box(1.5, 1.5, 1.5, 0xf3e0a0, 0, 2.68, -1.0)
  k.cyl(0.5, 0.5, 0.06, 0xffffff, 0, 3.35, -0.23, 22).rotation.x = Math.PI / 2
  k.box(0.04, 0.34, 0.03, 0x111111, 0, 3.4, -0.2)
  k.box(0.26, 0.04, 0.03, 0x111111, 0.1, 3.35, -0.2)
  k.hip(1.9, 1.9, 0.9, 0x7a4a36, 0, 4.2, -1.0)
  k.cyl(0.03, 0.04, 0.9, 0xb9b4a8, 0, 5.1, -1.0, 6)
  k.box(0.6, 0.35, 0.03, 0xd92b2b, 0.32, 5.55, -1.0)
  k.ball(0.15, 0xf2c200, 0.34, 5.55, -0.97, 1, 1, 0.3)
  // cây xanh, xe máy + ô tô nhỏ, người đi bộ
  for (const [x, z] of [
    [-4.4, 3.0],
    [-4.6, -3.6],
    [4.6, -3.6],
    [4.5, 3.0]
  ] as const)
    k.tree(x, z, 1.0, 0.1)
  smallCar(k, -1.5, 4.1, 0xe24a3b)
  smallCar(k, 2.2, 3.7, 0x4aa8d8, Math.PI)
  smallCar(k, -4.4, 1.2, 0xf2b630, Math.PI / 2)
  for (const [x, z, c] of [
    [-0.8, 2.5, 0xe24a3b],
    [0.4, 2.8, 0x4aa8d8],
    [1.3, 2.4, 0xf2c94c]
  ] as const)
    k.person(x, 0.1, z, c, false)
  return k.group
}

function sampan(
  k: Kit,
  x: number,
  z: number,
  hull: number,
  cargo: number[],
  rot: number,
  hat = true
): void {
  const { THREE } = k
  const g = new THREE.Group()
  const prof = new THREE.Shape()
  prof.moveTo(-1.4, 0.35)
  prof.quadraticCurveTo(-1.1, -0.12, -0.3, -0.15)
  prof.lineTo(0.7, -0.15)
  prof.quadraticCurveTo(1.4, 0, 1.7, 0.4)
  prof.closePath()
  const geo = new THREE.ExtrudeGeometry(prof, {
    depth: 0.9,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 2
  })
  geo.translate(0, 0, -0.45)
  k.put(k.mesh(geo, hull), 0, 0.1, 0, g)
  k.box(2.9, 0.07, 0.95, 0x2b6fb0, 0.15, 0.48, 0, g)
  // hàng hoá: dưa hấu, dứa, cam, chuối
  cargo.forEach((c, i) => {
    const px = -0.9 + (i % 4) * 0.55
    const pz = i < 4 ? -0.18 : 0.2
    k.ball(0.22, c, px, 0.72, pz, 0.9, 1, 1, g)
    if (c === 0xf2b630) k.cone(0.12, 0.28, 0x4f9a3b, px, 0.9, pz, 6, g)
  })
  k.person(-1.1, 0.5, 0, 0x3f8f3a, hat, g)
  // cây bẹo: cột cao treo hàng
  k.cyl(0.04, 0.05, 2.6, 0x6b4a32, 1.0, 0.5, 0, 6, g)
  for (let i = 0; i < 4; i++)
    k.ball(
      0.14,
      [0xf2b630, 0xe8432e, 0x7cc45a, 0xf08ac0][i],
      1.0 + (i % 2 ? 0.18 : -0.18),
      1.2 + i * 0.5,
      0,
      1,
      1,
      1,
      g
    )
  k.box(0.5, 0.18, 0.03, 0xe24a3b, 1.28, 3.0, 0, g)
  g.rotation.y = rot
  k.put(g, x, 0.03, z)
}

export function canthoFloatingMarket(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.8, 10.8, 0, 0, true, 0x8c6e45) // nước phù sa
  k.water(10.2, 10.2, 0, 0, true, 0xa08455, 0.07)
  sampan(k, -2.4, -1.8, 0x2f8a6a, [0xf2b630, 0xf2b630, 0xe8432e, 0x7cc45a, 0xf08ac0, 0x7cc45a], 0.2)
  sampan(
    k,
    2.5,
    -2.2,
    0xe24a3b,
    [0x7cc45a, 0x4f9a3b, 0xf2b630, 0xf2b630, 0xe8432e, 0xe8432e],
    -0.25
  )
  sampan(k, -2.2, 2.0, 0x4aa8d8, [0xe8432e, 0xf08ac0, 0xf2b630, 0x7cc45a, 0xf2b630, 0xe8432e], -0.1)
  sampan(k, 2.4, 2.2, 0xf2b630, [0x7cc45a, 0x7cc45a, 0xf2b630, 0xe8432e, 0xf08ac0, 0x4f9a3b], 0.3)
  // nhà sàn ven sông + cọ + cầu khỉ
  for (const [x, z] of [
    [-4.6, 0],
    [4.7, 0.2]
  ] as const) {
    k.box(1.2, 0.55, 1.4, 0xb9854a, x, 0.5, z)
    k.gable(1.6, 1.5, 0.55, 0xc9a35a, x, 1.05, z)
    for (const dz of [-0.5, 0.5]) k.cyl(0.05, 0.05, 0.5, 0x6b4a32, x, 0, z + dz, 6)
    k.palm(x + (x < 0 ? 0.9 : -0.9), z - 1.4, 0.9, 0)
  }
  k.palm(0, -4.5, 1.1, 0)
  return k.group
}

export function phuquocFishingVillage(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.cyl(5.0, 5.2, 0.1, 0xf4e0a4, 0, 0, -1.4, 40) // bãi cát
  k.water(9.2, 9.2, 0, 2.6, true, 0x38c8d4)
  // cầu tàu gỗ + nhà chài mái tranh trên cọc
  for (let i = 0; i < 8; i++) k.box(0.8, 0.07, 0.6, 0x9b7a4a, -0.2, 0.55, 0.4 + i * 0.5)
  for (let i = 0; i < 5; i++)
    for (const x of [-0.55, 0.15]) k.cyl(0.04, 0.05, 0.6, 0x6b4a32, x, 0, 0.5 + i * 0.9, 6)
  const hut = (x: number, z: number, c: number): void => {
    for (const [dx, dz] of [
      [-0.5, -0.4],
      [0.5, -0.4],
      [-0.5, 0.4],
      [0.5, 0.4]
    ])
      k.cyl(0.05, 0.06, 0.6, 0x6b4a32, x + dx, 0, z + dz, 6)
    k.box(1.3, 0.08, 1.1, 0x9b7a4a, x, 0.6, z)
    k.box(1.1, 0.6, 0.9, c, x, 0.68, z)
    k.arch(0.36, 0.5, 0.04, 0.26, 0.45, 0x4a3020, x, 0.68, z + 0.46)
    k.gable(1.5, 1.35, 0.7, 0xd4b36a, x, 1.28, z)
  }
  hut(-2.2, -2.2, 0xf3e7c4)
  hut(1.9, -2.6, 0xd9e8f2)
  hut(-3.4, 0.4, 0xf6d9a8)
  // thuyền thúng tròn + thuyền chài
  for (const [x, z, c] of [
    [2.6, 2.0, 0x4aa8d8],
    [3.6, 3.0, 0xe24a3b],
    [-2.8, 2.6, 0xf2b630]
  ] as const) {
    k.cyl(0.55, 0.4, 0.28, c, x, 0.04, z, 20)
    k.cyl(0.46, 0.34, 0.06, 0x9b6a43, x, 0.3, z, 20)
    k.person(x, 0.2, z, 0xc8322b, true)
  }
  const boat = new THREE.Group()
  const prof = new THREE.Shape()
  prof.moveTo(-1.5, 0.45)
  prof.quadraticCurveTo(-1.2, -0.1, -0.4, -0.15)
  prof.lineTo(0.8, -0.15)
  prof.quadraticCurveTo(1.5, 0.05, 1.8, 0.55)
  prof.closePath()
  const geo = new THREE.ExtrudeGeometry(prof, {
    depth: 0.9,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.05,
    bevelSegments: 2
  })
  geo.translate(0, 0, -0.45)
  k.put(k.mesh(geo, 0x2b6fb0), 0, 0.1, 0, boat)
  k.box(0.9, 0.5, 0.7, 0xf3e7c4, -0.6, 0.58, 0, boat)
  k.hip(1.1, 0.9, 0.35, 0xc8322b, -0.6, 1.08, 0, boat)
  k.cyl(0.04, 0.04, 1.8, 0x5e3b22, 0.7, 0.6, 0, 6, boat)
  k.put(boat, 0.2, 0.03, 4.0)
  boat.rotation.y = 0.3
  // phơi lưới/cá khô + dừa
  for (let i = 0; i < 4; i++) k.cyl(0.03, 0.03, 0.9, 0x6b4a32, 3.0 + i * 0.5, 0.1, -3.6, 6)
  k.box(1.8, 0.04, 0.04, 0x6b4a32, 3.75, 0.95, -3.6)
  for (let i = 0; i < 5; i++) k.box(0.1, 0.35, 0.02, 0xc9b49a, 3.0 + i * 0.35, 0.58, -3.6)
  for (const [x, z, s] of [
    [-4.2, -2.6, 1.2],
    [4.4, -1.0, 1.1],
    [-4.6, -0.6, 1.0],
    [0.6, -4.2, 1.2]
  ] as const)
    k.palm(x, z, s, 0.1)
  return k.group
}
