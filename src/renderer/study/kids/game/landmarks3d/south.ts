// Công trình 3D miền Nam: chợ Bến Thành, chợ nổi Cái Răng, làng chài Phú Quốc.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

type Three = typeof ThreeNS

function sampan(
  k: Kit,
  x: number,
  z: number,
  hull: number,
  cargo: number[],
  rot: number,
  hat = true
): ThreeNS.Group {
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
  return k.put(g, x, 0.03, z)
}

export function canthoFloatingMarket(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  const boats: ThreeNS.Group[] = []
  k.water(10.8, 10.8, 0, 0, true, 0x6aa7a8) // nước sông (xanh đục)
  boats.push(
    sampan(
      k,
      -2.4,
      -1.8,
      0x2f8a6a,
      [0xf2b630, 0xf2b630, 0xe8432e, 0x7cc45a, 0xf08ac0, 0x7cc45a],
      0.2
    )
  )
  sampan(
    k,
    2.5,
    -2.2,
    0xe24a3b,
    [0x7cc45a, 0x4f9a3b, 0xf2b630, 0xf2b630, 0xe8432e, 0xe8432e],
    -0.25
  )
  boats.push(
    sampan(
      k,
      -2.2,
      2.0,
      0x4aa8d8,
      [0xe8432e, 0xf08ac0, 0xf2b630, 0x7cc45a, 0xf2b630, 0xe8432e],
      -0.1
    )
  )
  boats.push(
    sampan(k, 2.4, 2.2, 0xf2b630, [0x7cc45a, 0x7cc45a, 0xf2b630, 0xe8432e, 0xf08ac0, 0x4f9a3b], 0.3)
  )
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
  // ghe xuồng dập dềnh, trôi chậm, xoay nhẹ theo con nước
  const home = boats.map((b) => ({ x: b.position.x, z: b.position.z, r: b.rotation.y }))
  k.group.userData.tick = (t: number): void => {
    boats.forEach((b, i) => {
      b.position.x = home[i].x + Math.sin(t * 0.3 + i * 1.7) * 0.5
      b.position.z = home[i].z + Math.cos(t * 0.25 + i) * 0.3
      b.position.y = 0.03 + Math.sin(t * 2 + i) * 0.04
      b.rotation.y = home[i].r + Math.sin(t * 0.4 + i) * 0.12
      b.rotation.z = Math.sin(t * 1.6 + i) * 0.04
    })
  }
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
  // thuyền chài dập dềnh, thuyền thúng xoay tròn
  const tubs: ThreeNS.Group[] = []
  for (const [x, z, c] of [
    [-1.6, 3.6, 0x7cc45a],
    [1.4, 2.6, 0xf08ac0]
  ] as const) {
    const tub = new THREE.Group()
    k.cyl(0.5, 0.36, 0.26, c, 0, 0, 0, 20, tub)
    k.cyl(0.42, 0.3, 0.05, 0x9b6a43, 0, 0.27, 0, 20, tub)
    k.person(0, 0.15, 0, 0x4aa8d8, true, tub)
    k.put(tub, x, 0.04, z)
    tubs.push(tub)
  }
  k.group.userData.tick = (t: number): void => {
    boat.position.y = 0.03 + Math.sin(t * 1.8) * 0.05
    boat.rotation.z = Math.sin(t * 1.4) * 0.05
    tubs.forEach((tub, i) => {
      tub.rotation.y = t * (i ? -0.6 : 0.5)
      tub.position.y = 0.04 + Math.sin(t * 2.2 + i) * 0.04
    })
  }
  return k.group
}
