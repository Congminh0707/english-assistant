// Công trình 3D miền Trung: Ngọ Môn (Huế), Cầu Rồng (Đà Nẵng), Chùa Cầu (Hội An), tháp Bà Ponagar (Nha Trang), ga Đà Lạt.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

type Three = typeof ThreeNS

export function hueNgoMon(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(11, 3, 0, 4.2, false, 0x4db3e6) // hào nước
  k.box(10.2, 0.14, 2.8, 0xd9c98f, 0, 0.02, 4.2) // bờ hào
  for (const [x, z] of [
    [-3.6, 4.3],
    [-2.2, 4.0],
    [3.0, 4.4],
    [4.0, 4.0]
  ] as const) {
    k.cyl(0.38, 0.38, 0.03, 0x3f9a6a, x, 0.1, z, 14)
    k.ball(0.14, 0xf08ac0, x, 0.2, z, 0.7)
  }
  // đài nền đá có năm cổng vòm
  k.box(9.4, 1.7, 2.6, 0xb9b4a8, 0, 0.1, 0)
  k.box(9.7, 0.15, 2.9, 0x9a958a, 0, 1.75, 0)
  for (const x of [-3.4, -1.7, 0, 1.7, 3.4])
    k.arch(1.1, 1.45, 0.06, x === 0 ? 0.95 : 0.7, x === 0 ? 1.3 : 1.05, 0x3a2a22, x, 0.1, 1.31)
  k.steps(2.2, 1.8, 4, 0.1, 0xcfc9bd, 0, 0.0, 2.4)
  // lầu Ngũ Phụng: gian giữa hai tầng mái vàng + hai gác bên
  const hall = (x: number, w: number, tiers: number, h: number): void => {
    k.box(w, h, 1.5, 0xc8322b, x, 1.9, 0)
    for (let i = 0; i < 5; i++)
      k.column(0.07, h, 0xe8b830, x - w / 2 + 0.12 + (i * (w - 0.24)) / 4, 1.9, 0.78)
    k.box(w * 0.85, h * 0.6, 0.04, 0xe8b830, x, 1.95, 0.78)
    k.eaveRoof(w + 0.9, 2.3, tiers, 0xf2b630, 0xc8322b, x, 1.9 + h, 0)
  }
  hall(0, 4.4, 3, 1.25)
  hall(-3.3, 1.8, 2, 0.95)
  hall(3.3, 1.8, 2, 0.95)
  // cột cờ vàng + cây
  k.cyl(0.04, 0.05, 4.4, 0x6b4a32, -4.6, 0, 3.4, 8)
  k.box(0.9, 0.5, 0.03, 0xf2c200, -4.15, 3.7, 3.4)
  for (const [x, z] of [
    [4.7, 3.6],
    [-4.9, -1.5],
    [4.9, -1.3]
  ] as const)
    k.tree(x, z, 0.9, 0.05)
  return k.group
}

export function danangDragonBridge(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.8, 4.2, 0, 0, false, 0x4db3e6)
  // mặt cầu dọc theo x + trụ + dây cáp
  k.box(10.6, 0.22, 1.5, 0x4a4f5c, 0, 0.7, 0)
  for (let i = -5; i <= 5; i += 1) k.box(0.4, 0.015, 0.05, 0xffffff, i * 0.9, 0.93, 0)
  for (const x of [-4, -1.5, 1.5, 4]) k.box(0.5, 0.7, 1.5, 0xb9b4a8, x, 0, 0)
  k.box(10.6, 0.15, 0.1, 0xfff1c9, 0, 0.93, 0.7)
  k.box(10.6, 0.15, 0.1, 0xfff1c9, 0, 0.93, -0.7)
  // thân rồng: ống vàng uốn lượn trên mặt cầu
  const pts: ThreeNS.Vector3[] = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    pts.push(
      new THREE.Vector3(
        -4.6 + t * 8.6,
        1.5 + Math.sin(t * Math.PI * 4) * 0.4 + Math.sin(t * Math.PI) * 0.6,
        Math.sin(t * Math.PI * 4 + 1) * 0.12
      )
    )
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const body = new THREE.TubeGeometry(curve, 120, 0.2, 12, false)
  k.put(k.mesh(body, 0xf2b630), 0, 0, 0)
  // vây lưng + vảy
  for (let i = 3; i < 38; i += 2) {
    const p = curve.getPointAt(i / 40)
    const fin = k.cone(0.12, 0.34, i % 4 ? 0xc8322b : 0xe8432e, p.x, p.y + 0.15, p.z, 6)
    fin.rotation.z = 0.2
  }
  // đầu rồng ở đầu cầu bên phải: hàm, sừng, mắt, râu
  const head = curve.getPointAt(1)
  k.ball(0.38, 0xf2b630, head.x + 0.2, head.y + 0.05, head.z, 0.85, 1.4, 1)
  k.ball(0.2, 0xf2b630, head.x + 0.7, head.y - 0.05, head.z, 0.6, 1.4, 0.9) // mõm
  k.ball(0.07, 0xffffff, head.x + 0.35, head.y + 0.25, head.z + 0.25)
  k.ball(0.07, 0xffffff, head.x + 0.35, head.y + 0.25, head.z - 0.25)
  k.ball(0.035, 0x111111, head.x + 0.4, head.y + 0.25, head.z + 0.28)
  k.ball(0.035, 0x111111, head.x + 0.4, head.y + 0.25, head.z - 0.28)
  for (const s of [-1, 1]) {
    k.cone(0.06, 0.55, 0xc8322b, head.x + 0.05, head.y + 0.55, head.z + s * 0.18, 6).rotation.z =
      0.5
    const whisker = k.cyl(
      0.015,
      0.01,
      0.9,
      0xfff1c9,
      head.x + 0.9,
      head.y - 0.2,
      head.z + s * 0.25,
      5
    )
    whisker.rotation.z = 1.2
    whisker.rotation.x = s * 0.5
  }
  // đuôi cuộn
  const tail = curve.getPointAt(0)
  k.ball(0.22, 0xe8432e, tail.x - 0.2, tail.y + 0.1, tail.z, 1.2, 0.8, 0.8)
  // toà nhà hai bờ + cây
  const towers: Array<[number, number, number, number, number]> = [
    [-4.2, -2.9, 0.9, 3.2, 0xdfe6ea],
    [-2.6, -3.1, 0.8, 2.3, 0xf3e7c4],
    [3.6, -3.0, 1.0, 3.8, 0xd5e4ee],
    [4.8, 3.1, 0.9, 2.2, 0xf6d9a8]
  ]
  for (const [x, z, w, h, c] of towers) {
    k.box(w, h, w, c, x, 0, z)
    for (let r = 0; r < h * 2.4; r++)
      k.box(w * 0.7, 0.07, 0.02, 0x6fb4d8, x, 0.4 + r * 0.38, z + w / 2 + 0.01)
    k.box(w + 0.05, 0.1, w + 0.05, 0xa05a3a, x, h, z)
  }
  for (const [x, z] of [
    [-4.9, 3.0],
    [-2.0, 3.4],
    [2.0, 3.2]
  ] as const)
    k.palm(x, z, 0.8, 0.05)
  return k.group
}

export function hoianBridgePagoda(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.6, 4.6, 0, 0, false, 0x4db3e6)
  k.box(2.0, 1.0, 5.0, 0xcfc9bd, -4.6, 0, 0)
  k.box(2.0, 1.0, 5.0, 0xcfc9bd, 4.6, 0, 0)
  k.box(2.1, 0.12, 5.1, 0x7cc45a, -4.6, 1.0, 0)
  k.box(2.1, 0.12, 5.1, 0x7cc45a, 4.6, 1.0, 0)
  // thân cầu cong: các đốt xếp theo cung, mái ngói trên từng đốt
  const n = 11
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const x = -3.3 + t * 6.6
    const y = 1.02 + Math.sin(t * Math.PI) * 0.45
    const ang = Math.cos(t * Math.PI) * -0.2
    const seg = new THREE.Group()
    k.box(0.75, 0.22, 1.5, 0x8a5a36, 0, 0, 0, seg)
    for (const z of [-0.65, 0.65]) k.box(0.1, 1.05, 0.1, 0xc8322b, 0, 0.22, z, seg)
    k.box(0.75, 0.06, 1.4, 0x4a2e22, 0, 1.2, 0, seg)
    k.gable(0.75, 1.9, 0.75, i % 2 ? 0x8b5a46 : 0x6b4234, 0, 1.27, 0, seg)
    k.lantern(0, 1.2, 0.95, i % 2 ? 0xe8432e : 0xf2b630, seg)
    seg.rotation.z = ang
    k.put(seg, x, y, 0)
  }
  // gian chùa giữa cầu: tường vàng, cửa, mái hai tầng đầu đao
  k.box(2.1, 1.2, 1.5, 0xf2c94c, 0, 1.45, 0)
  k.arch(0.8, 1.0, 0.06, 0.6, 0.95, 0x6b3a22, 0, 1.45, 0.76)
  k.box(0.9, 0.22, 0.06, 0xc8322b, 0, 2.45, 0.78)
  k.box(0.6, 0.06, 0.07, 0xe8b830, 0, 2.52, 0.8)
  k.eaveRoof(2.9, 2.2, 2, 0x8b5a46, 0xe8b830, 0, 2.65, 0)
  // đèn lồng treo dọc hai bờ + nhà ven sông
  for (let i = 0; i < 6; i++) {
    k.lantern(
      -4.6 + i * 1.84,
      1.8 + (i % 2) * 0.2,
      2.2,
      [0xe8432e, 0xf2b630, 0x4aa8d8, 0xf08ac0][i % 4]
    )
    k.cyl(0.02, 0.02, 1.0, 0x6b4a32, -4.6 + i * 1.84, 1.0, 2.2, 5)
  }
  for (const x of [-4.8, 4.6]) {
    k.box(1.4, 0.9, 1.1, 0xf3e7c4, x, 1.12, -1.6)
    k.gable(1.6, 1.4, 0.5, 0x8b5a46, x, 2.02, -1.6)
  }
  k.tree(-3.9, 2.0, 1.1, 1.1, undefined, 0x9fd36a, 0x6fb24a)
  // thuyền nan nhỏ có đèn
  const b = new THREE.Group()
  k.box(1.5, 0.22, 0.55, 0xa5522e, 0, 0, 0, b)
  k.ball(0.14, 0xf2b630, 0.3, 0.45, 0, 1.2, 1, 1, b, { emissive: 0x4a3006 })
  k.put(b, -1.2, 0.05, 1.7)
  return k.group
}

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
  k.put(loco, -2.0, 0.1, 1.65)
  for (let i = 0; i < 2; i++) {
    const car = new THREE.Group()
    k.box(1.6, 0.6, 0.62, i ? 0x4aa8d8 : 0xf2b630, 0, 0.25, 0, car)
    for (const x of [-0.5, 0, 0.5]) k.box(0.28, 0.22, 0.03, 0x9fd3ef, x, 0.6, 0.32, car)
    k.put(car, -0.1 + i * 1.8, 0.1, 1.65)
  }
  return k.group
}
