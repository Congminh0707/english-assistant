// Công trình 3D miền Bắc: Tháp Rùa, hòn Trống Mái + thuyền buồm, ruộng bậc thang Sa Pa, hang núi Tràng An.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

type Three = typeof ThreeNS

/** Thuyền buồm truyền thống (hai buồm nâu đỏ có nan, thân cong) — dùng lại ở nhiều nơi */
export function junk(k: Kit, x: number, z: number, s = 1, rot = 0): void {
  const { THREE } = k
  const g = new THREE.Group()
  const hull = new THREE.Shape()
  hull.moveTo(-1.5, 0.5)
  hull.quadraticCurveTo(-1.2, -0.15, -0.5, -0.2)
  hull.lineTo(0.9, -0.2)
  hull.quadraticCurveTo(1.6, 0, 1.9, 0.7)
  hull.lineTo(-1.5, 0.5)
  const geo = new THREE.ExtrudeGeometry(hull, {
    depth: 0.8,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    bevelSegments: 2
  })
  geo.translate(0, 0, -0.4)
  k.put(k.mesh(geo, 0x8a4a2a), 0, 0.15, 0, g)
  k.box(2.9, 0.08, 0.86, 0xc8322b, 0.15, 0.62, 0, g)
  k.box(0.9, 0.35, 0.6, 0x5e3b22, -0.9, 0.7, 0, g)
  k.hip(1.1, 0.8, 0.3, 0x7a3a28, -0.9, 1.05, 0, g)
  for (const [mx, h, c] of [
    [0.4, 2.3, 0xa0643a],
    [-0.3, 1.8, 0xb8402e]
  ] as const) {
    k.cyl(0.04, 0.05, h, 0x5e3b22, mx, 0.6, 0, 8, g)
    for (let i = 0; i < 5; i++) {
      const w = 1.05 - i * 0.04
      const panel = k.box(0.04, h / 6, w, c, mx + 0.05 + i * 0.01, 0.8 + (i * h) / 6.6, w * 0.45, g)
      panel.rotation.x = 0
      k.box(0.06, 0.03, w + 0.05, 0x3a2418, mx + 0.06 + i * 0.01, 0.8 + (i * h) / 6.6, w * 0.45, g) // nan buồm
    }
  }
  k.box(0.35, 0.18, 0.03, 0xc8322b, 0.4, 2.95, 0, g)
  g.scale.setScalar(s)
  g.rotation.y = rot
  k.put(g, x, 0.02, z)
}

export function hanoiTurtleTower(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(9.4, 9.4, 0, 0, true, 0x56bde8)
  k.cyl(4.7, 4.9, 0.12, 0xd9c98f, 0, 0, 0, 40) // bờ hồ
  k.water(8.8, 8.8, 0, 0, true, 0x4db3e6, 0.12)
  // gò đảo + tháp
  k.cyl(1.35, 1.6, 0.3, 0x7cc45a, -0.3, 0.1, -1.2, 24)
  k.cyl(0.95, 1.05, 0.2, 0xb9b09a, -0.3, 0.38, -1.2, 24)
  const tw = [1.05, 0.9, 0.76]
  tw.forEach((w, i) => {
    const y = 0.55 + i * 0.95
    k.box(w, 0.8, w, 0xcfc6ae, -0.3, y, -1.2)
    k.arch(w * 0.9, 0.7, 0.04, 0.28, 0.6, 0x4a4036, -0.3, y + 0.02, -1.2 + w / 2)
    k.arch(w * 0.9, 0.7, 0.04, 0.28, 0.6, 0x4a4036, -0.3, y + 0.02, -1.2 - w / 2)
    k.box(w + 0.35, 0.09, w + 0.35, 0x8a7a64, -0.3, y + 0.8, -1.2)
    k.hip(w + 0.4, w + 0.4, 0.22, 0x9a8a72, -0.3, y + 0.88, -1.2)
  })
  k.hip(0.7, 0.7, 0.5, 0x8a7a64, -0.3, 3.45, -1.2)
  k.cyl(0.025, 0.04, 0.5, 0xe8b830, -0.3, 3.9, -1.2, 8)
  k.ball(0.07, 0xe8b830, -0.3, 4.42, -1.2)
  // cầu Thê Húc đỏ + cổng đền Ngọc Sơn
  const bridge = new THREE.Shape()
  bridge.moveTo(0, 0)
  bridge.quadraticCurveTo(1.8, 1.0, 3.6, 0)
  bridge.lineTo(3.6, 0.18)
  bridge.quadraticCurveTo(1.8, 1.2, 0, 0.18)
  const bgeo = new THREE.ExtrudeGeometry(bridge, { depth: 0.7, bevelEnabled: false })
  bgeo.translate(-1.8, 0, -0.35)
  bgeo.rotateY(-0.55)
  k.put(k.mesh(bgeo, 0xc8322b), 1.2, 0.2, 1.7)
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    const px = 1.2 + Math.cos(-0.55) * (-1.8 + 3.6 * t)
    const pz = 1.7 - Math.sin(-0.55) * (-1.8 + 3.6 * t) * -1
    k.box(0.07, 0.4, 0.07, 0xe8b830, px, 0.2 + Math.sin(t * Math.PI) * 1.05 + 0.15, pz)
  }
  k.box(1.5, 0.9, 1.0, 0xb53a2a, 3.1, 0.1, 3.1)
  k.eaveRoof(1.9, 1.4, 2, 0x5a3c33, 0xe8b830, 3.1, 1.0, 3.1)
  for (const [x, z] of [
    [3.1, 3.62],
    [2.45, 3.62]
  ])
    k.arch(0.5, 0.8, 0.04, 0.34, 0.7, 0x2b1a14, x, 0.1, z)
  // liễu + đèn
  for (const [x, z, s] of [
    [-3.4, 2.6, 1.3],
    [3.8, -1.6, 1.2],
    [-1.4, 3.7, 1.1],
    [4.2, 1.0, 1.0],
    [-4.0, -1.0, 1.1]
  ] as const) {
    k.tree(x, z, s, 0.05, undefined, 0x9fd36a, 0x6fb24a)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      const dr = k.cyl(
        0.015,
        0.015,
        0.7 * s,
        0x6fb24a,
        x + Math.cos(a) * 0.4 * s,
        0.35 * s,
        z + Math.sin(a) * 0.4 * s,
        4
      )
      dr.rotation.z = Math.cos(a) * 0.1
    }
  }
  return k.group
}

export function halongTrongMai(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.4, 10.4, 0, 0, true, 0x35b5d8)
  k.water(8.6, 8.6, 0, 0, true, 0x56c8e4, 0.1)
  // đảo đá chung
  k.rock(0, 0.1, -0.6, 3.1, 0.7, 2.3, 0x8c877c, 3)
  // hòn Trống (cao) và hòn Mái (thấp) nghiêng vào nhau
  const pillar = (x: number, z: number, h: number, r: number, lean: number, seed: number): void => {
    for (let i = 0; i < 7; i++) {
      const t = i / 6
      const rr = r * (1 - t * 0.55) * (1 + Math.sin(i * 1.7 + seed) * 0.08)
      k.rock(
        x + lean * t * t * h,
        0.3 + t * h,
        z,
        rr,
        h / 5,
        rr * 0.9,
        i % 2 ? 0xa9a698 : 0x9a9a8e,
        seed + i
      )
    }
    k.ball(r * 0.55, 0x5fae48, x + lean * h, 0.55 + h, z, 0.55) // mũ cây
    k.ball(r * 0.35, 0x79c25a, x + lean * h + 0.1, 0.8 + h, z + 0.05, 0.6)
  }
  pillar(-1.25, -0.6, 3.9, 0.95, 0.15, 1)
  pillar(1.35, -0.4, 3.0, 0.8, -0.14, 5)
  // đầu gà: mào đỏ + mỏ vàng
  k.cone(0.12, 0.3, 0xc8322b, -0.85, 4.45, -0.6, 6)
  k.cone(0.1, 0.35, 0xe8b830, -0.62, 4.0, -0.6, 6).rotation.z = -1.4
  k.cone(0.1, 0.25, 0xc8322b, 0.95, 3.4, -0.4, 6)
  k.cone(0.09, 0.3, 0xe8b830, 0.7, 3.05, -0.4, 6).rotation.z = 1.4
  // đá nhỏ phía sau + thuyền buồm phía trước
  k.rock(-3.3, 0.2, -2.6, 0.8, 1.7, 0.7, 0x9a9a8e, 8)
  k.rock(3.4, 0.2, -2.0, 0.7, 1.3, 0.6, 0xa9a698, 9)
  k.ball(0.45, 0x5fae48, -3.3, 1.9, -2.6, 0.5)
  k.ball(0.4, 0x5fae48, 3.4, 1.4, -2.0, 0.5)
  junk(k, 0.4, 3.1, 1.15, -0.25)
  junk(k, -3.2, 2.4, 0.8, 0.5)
  return k.group
}

export function sapaTerraces(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  // núi Fansipan phía sau + mây
  k.cone(3.2, 5.2, 0x8a8f86, 0.6, 0, -2.2, 7)
  k.cone(1.35, 1.9, 0xf4f8fb, 0.6, 3.3, -2.2, 7)
  k.cone(2.1, 3.4, 0x7d8a7a, -2.4, 0, -2.4, 7)
  for (const [x, y, z, r] of [
    [-1.4, 3.3, -0.7, 0.7],
    [-0.6, 3.5, -0.4, 0.55],
    [2.8, 2.5, -0.4, 0.5]
  ] as const)
    k.ball(r, 0xffffff, x, y, z, 0.65, 1.4, 1)
  // ruộng bậc thang: các vòng đồng tâm thấp dần, xen lúa chín và ruộng nước
  const cols = [0x9bd160, 0xd9c94f, 0x7cc45a, 0xe3d45a, 0x8fcb58, 0xd4c04a, 0x7cc45a]
  for (let i = 0; i < 7; i++) {
    const r = 4.8 - i * 0.58
    const y = i * 0.42
    k.cyl(r, r + 0.12, 0.42, 0x9b6a43, 0.2, y, 0.9, 40)
    k.cyl(r - 0.05, r - 0.05, 0.05, cols[i], 0.2, y + 0.4, 0.9, 40)
    if (i % 3 === 1) k.cyl(r - 0.28, r - 0.28, 0.06, 0x6fc4ea, 0.2, y + 0.42, 0.9, 40) // ruộng đổ nước
  }
  // nhà sàn mái tranh + thang + cột
  const hx = 0.4
  const hz = 1.0
  const hy = 7 * 0.42 + 0.1
  for (const [dx, dz] of [
    [-0.45, -0.35],
    [0.45, -0.35],
    [-0.45, 0.35],
    [0.45, 0.35]
  ])
    k.cyl(0.05, 0.06, 0.55, 0x6b4a32, hx + dx, hy, hz + dz, 6)
  k.box(1.2, 0.08, 0.9, 0x9b7a4a, hx, hy + 0.55, hz)
  k.box(1.0, 0.55, 0.7, 0xb9854a, hx, hy + 0.63, hz)
  k.arch(0.35, 0.5, 0.04, 0.24, 0.45, 0x4a3020, hx, hy + 0.63, hz + 0.36)
  k.gable(1.4, 1.1, 0.55, 0xc9a35a, hx, hy + 1.18, hz)
  const ladder = k.box(0.18, 0.7, 0.05, 0x6b4a32, hx + 0.1, hy, hz + 0.65)
  ladder.rotation.x = -0.5
  for (const [x, z] of [
    [-2.3, 2.3],
    [2.8, 2.0],
    [-3.3, 0.2]
  ] as const)
    k.pine(x, z, 1.1, 0.1)
  k.person(1.6, 7 * 0.42 - 0.9, 2.0, 0xc8322b, true)
  return k.group
}

export function ninhbinhTrangAn(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  // sông xuyên qua hang
  k.water(3.8, 9.6, 0, 0, false, 0x4fb8c8)
  k.water(8.6, 3.6, 0, 3.4, true, 0x4fb8c8)
  // hai khối núi đá vôi + vòm hang
  for (const [x, flip] of [
    [-3.2, 1],
    [3.2, -1]
  ] as const) {
    k.rock(x, 1.4, -0.8, 2.4, 2.6, 3.2, 0xb4b09c, 3 + x)
    k.rock(x + flip * 0.4, 3.3, -0.6, 1.5, 1.7, 2.1, 0xa6a290, 7 + x)
    k.ball(1.2, 0x5fae48, x + flip * 0.2, 4.4, -0.6, 0.55, 1, 1.2)
    k.ball(0.8, 0x79c25a, x - flip * 0.5, 4.5, 0.3, 0.55)
  }
  // vòm đá trên đỉnh nối hai khối + cửa hang
  const bridgeRock = k.arch(7.6, 4.4, 3.6, 3.4, 2.8, 0xa9a698, 0, 0.1, -0.6)
  bridgeRock.scale.set(1, 1, 1)
  k.ball(1.9, 0x5fae48, 0, 4.5, -0.6, 0.45, 1.5, 0.9)
  for (const [x, z, s] of [
    [-3.4, 2.6, 1],
    [3.6, 2.4, 1.2],
    [-1.5, -3.2, 1.1]
  ] as const)
    k.tree(x, z, s)
  // chiếc đò chèo + người chèo nón lá
  const boat = new THREE.Group()
  const hull = new THREE.Shape()
  hull.moveTo(-1.0, 0.3)
  hull.quadraticCurveTo(-0.8, -0.1, 0, -0.12)
  hull.quadraticCurveTo(0.8, -0.1, 1.0, 0.3)
  hull.closePath()
  const bg = new THREE.ExtrudeGeometry(hull, {
    depth: 0.55,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2
  })
  bg.translate(0, 0, -0.27)
  k.put(k.mesh(bg, 0x2f8a6a), 0, 0.12, 0, boat)
  k.person(0.1, 0.25, 0, 0xf2c94c, true, boat)
  const oar = k.box(1.3, 0.03, 0.03, 0x6b4a32, 0.5, 0.55, 0.35, boat)
  oar.rotation.y = 0.5
  k.put(boat, 0.4, 0.03, 3.0)
  return k.group
}
