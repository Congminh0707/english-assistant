// Công trình 3D miền Trung: Ngọ Môn (Huế), Cầu Rồng (Đà Nẵng), Chùa Cầu (Hội An), tháp Bà Ponagar (Nha Trang), ga Đà Lạt.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

type Three = typeof ThreeNS

export function nhatrangTramHuong(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.cyl(5.0, 5.2, 0.12, 0xf4e0a4, 0, 0, 0, 40) // bãi cát
  k.water(8.4, 8.4, 0, 3.8, true, 0x4db3e6)
  k.cyl(4.2, 4.6, 0.8, 0xd9c98f, 0, 0.1, -0.6, 8) // gò đồi
  k.steps(2.6, 3.0, 6, 0.14, 0xcfc9bd, 0, 0.9, 1.6)
  // tháp Cham: các tầng gạch đỏ thu nhỏ, hốc vòm, đỉnh nhọn
  const tower = (x: number, z: number, s: number, tiers: number): void => {
    const g = new THREE.Group()
    k.box(1.7, 0.8, 1.7, 0xb5573a, 0, 0, 0, g)
    k.arch(1.0, 0.75, 0.06, 0.5, 0.65, 0x3a1f16, 0, 0.02, 0.86, g)
    for (let i = 0; i < tiers; i++) {
      const w = 1.4 - i * 0.28
      const y = 0.8 + i * 0.62
      k.box(w, 0.5, w, 0xc0603f, 0, y, 0, g)
      k.box(w + 0.18, 0.08, w + 0.18, 0x8a3f28, 0, y + 0.5, 0, g)
      k.arch(w * 0.5, 0.42, 0.04, 0.24, 0.38, 0x3a1f16, 0, y + 0.03, w / 2 + 0.01, g)
      for (const sx of [-1, 1])
        k.cone(0.09, 0.28, 0xb5573a, sx * (w / 2 + 0.05), y + 0.55, w / 2, 6, g)
    }
    k.cone(0.34, 0.9, 0xb5573a, 0, 0.8 + tiers * 0.62 + 0.1, 0, 8, g)
    k.ball(0.09, 0xe8b830, 0, 0.8 + tiers * 0.62 + 1.05, 0, 1, 1, 1, g)
    g.scale.setScalar(s)
    k.put(g, x, 1.5, z)
  }
  tower(0, -1.2, 1.15, 4)
  tower(-2.8, -0.5, 0.72, 2)
  tower(2.9, -0.4, 0.78, 3)
  for (const [x, z, s] of [
    [-4.0, 2.2, 1],
    [4.0, 2.6, 1.1],
    [-3.2, 3.5, 0.9]
  ] as const)
    k.palm(x, z, s, 0.1)
  k.person(1.4, 0.15, 3.4, 0x4aa8d8, true)
  // sóng vỗ bờ + ca nô chạy ngoài khơi
  const foam = k.mesh(new THREE.CylinderGeometry(4.25, 4.25, 0.03, 40, 1, true), 0xffffff, {
    opacity: 0.6,
    double: true
  })
  k.put(foam, 0, 0.06, 3.8)
  const speed = new THREE.Group()
  k.box(0.9, 0.18, 0.36, 0xffffff, 0, 0, 0, speed)
  k.box(0.35, 0.18, 0.3, 0x4aa8d8, -0.1, 0.18, 0, speed)
  k.put(speed, 0, 0.05, 5.4)
  k.group.userData.tick = (t: number): void => {
    const w = (t * 0.4) % 1
    foam.scale.set(0.9 + w * 0.12, 1, 0.9 + w * 0.12)
    speed.position.x = Math.sin(t * 0.25) * 4.2
    speed.rotation.y = Math.cos(t * 0.25) > 0 ? 0 : Math.PI
    speed.position.y = 0.05 + Math.abs(Math.sin(t * 6)) * 0.04
  }
  return k.group
}

export function dalatStation(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  // hồ + thông
  k.water(4.4, 3.4, 3.6, 2.8, true, 0x4db3e6)
  for (const [x, z, s] of [
    [-4.4, -2.4, 1.2],
    [-3.2, -3.4, 1.0],
    [4.5, -2.8, 1.3],
    [-4.6, 1.6, 1.0],
    [3.0, -3.8, 1.1]
  ] as const)
    k.pine(x, z, s)
  // nhà ga: thân kem, ba mái chóp tam giác đặc trưng
  k.box(8.0, 1.5, 2.4, 0xf3e7c4, 0, 0.1, -0.8)
  k.box(8.2, 0.1, 2.6, 0xc8a46a, 0, 1.6, -0.8)
  const gabled = (x: number, w: number, h: number, hh: number): void => {
    k.box(w, h, 2.5, 0xf3e7c4, x, 0.1, -0.8)
    const roof = k.gable(2.9, w + 0.5, hh, 0xa3402e, x, 0.1 + h, -0.8)
    roof.rotation.y = Math.PI / 2
    k.box(w * 0.5, 0.35, 0.04, 0x7a4a2a, x, 0.1 + h + 0.3, 0.46) // bảng tên
    // hoa văn kính màu
    for (const [dx, c] of [
      [-0.3, 0x4aa8d8],
      [0, 0xf2b630],
      [0.3, 0xc8322b]
    ] as const)
      k.box(0.18, 0.55, 0.03, c, x + dx, 0.5, 0.46)
  }
  gabled(-2.6, 2.0, 2.0, 1.6)
  gabled(0, 2.4, 2.6, 2.0)
  gabled(2.6, 2.0, 2.0, 1.6)
  // đồng hồ
  k.cyl(0.32, 0.32, 0.05, 0xffffff, 0, 2.6, 0.5, 20).rotation.x = Math.PI / 2
  k.box(0.04, 0.22, 0.03, 0x111111, 0, 2.65, 0.55)
  // đường ray + đoàn tàu nhỏ
  for (const z of [1.4, 1.9]) k.box(9.4, 0.05, 0.07, 0x6b6b75, 0, 0.1, z)
  for (let i = -9; i <= 9; i++) k.box(0.1, 0.04, 0.8, 0x6b4a32, i * 0.5, 0.06, 1.65)
  const loco = new THREE.Group()
  k.box(1.6, 0.7, 0.62, 0xc8322b, 0, 0.25, 0, loco)
  k.cyl(0.26, 0.26, 0.9, 0x2b2b36, 0.35, 0.65, 0, 14, loco).rotation.z = Math.PI / 2
  k.cyl(0.08, 0.1, 0.35, 0x2b2b36, 0.7, 0.95, 0, 8, loco)
  k.box(0.7, 0.55, 0.7, 0xf3e7c4, -0.5, 0.95, 0, loco)
  for (const x of [-0.6, -0.1, 0.5])
    k.cyl(0.19, 0.19, 0.1, 0x2b2b36, x, 0.02, 0.33, 14, loco).rotation.x = Math.PI / 2
  const train = new THREE.Group()
  k.put(train, 0, 0, 0)
  k.put(loco, -2.0, 0.1, 1.65, train)
  for (let i = 0; i < 2; i++) {
    const car = new THREE.Group()
    k.box(1.6, 0.6, 0.62, i ? 0x4aa8d8 : 0xf2b630, 0, 0.25, 0, car)
    for (const x of [-0.5, 0, 0.5]) k.box(0.28, 0.22, 0.03, 0x9fd3ef, x, 0.6, 0.32, car)
    k.put(car, -0.1 + i * 1.8, 0.1, 1.65, train)
  }
  // đoàn tàu chạy ra chạy vào ga + khói hơi nước
  const steam: ThreeNS.Mesh[] = []
  for (let i = 0; i < 6; i++) steam.push(k.ball(0.16, 0xffffff, 0, 0, 0, 1, 1, 1, train))
  k.group.userData.tick = (t: number): void => {
    const u = (t * 0.05) % 2
    const ease = (v: number): number => v * v * (3 - 2 * v)
    train.position.x = u < 1 ? -1.6 + ease(u) * 3.4 : 1.8 - ease(u - 1) * 3.4
    steam.forEach((p, i) => {
      const life = (t * 0.8 + i / 6) % 1
      p.position.set(-1.3 - life * 0.6, 1.25 + life * 1.2, 1.65)
      p.scale.setScalar(0.6 + life * 1.4)
    })
  }
  return k.group
}
