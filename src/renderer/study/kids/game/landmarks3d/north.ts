// Công trình 3D miền Bắc: Tháp Rùa, hòn Trống Mái + thuyền buồm, ruộng bậc thang Sa Pa, hang núi Tràng An.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

/** Thuyền buồm truyền thống (hai buồm nâu đỏ có nan, thân cong) — dùng lại ở nhiều nơi */
export function junk(k: Kit, x: number, z: number, s = 1, rot = 0): ThreeNS.Group {
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
  return k.put(g, x, 0.02, z)
}
