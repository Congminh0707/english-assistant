// Công trình 3D vẽ chi tiết, bám ảnh thật (docs/18-ui-rules.md §10). Mỗi hàm ghi rõ các đặc điểm nhận diện đã vẽ.
import type * as ThreeNS from 'three'
import { Kit } from './kit'

type Three = typeof ThreeNS

const ROOF_DARK = 0x5a4038 // ngói âm dương cũ
const ROOF_DARK2 = 0x46322c
const LACQUER = 0xb8322a
const GOLD = 0xe8b830

/** Dải ngói: các gờ ngói song song trên một mặt phẳng nghiêng (nhìn gần thấy rõ lớp ngói) */
function tileRidges(
  k: Kit,
  w: number,
  d: number,
  h: number,
  x: number,
  y: number,
  z: number,
  color: number,
  into?: ThreeNS.Object3D
): void {
  const rows = Math.max(4, Math.round(w / 0.22))
  for (const side of [-1, 1]) {
    for (let i = 0; i <= rows; i++) {
      const rx = x - w / 2 + (i * w) / rows
      const ridge = k.box(0.05, 0.04, Math.hypot(d / 2, h), color, rx, 0, 0, into)
      ridge.position.set(rx, y + h / 2, z + (side * d) / 4)
      ridge.rotation.x = side * Math.atan2(h, d / 2)
    }
  }
}

/**
 * Hồ Gươm (Hà Nội). Đặc điểm thật: Tháp Rùa ba tầng trên gò Rùa giữa hồ (tường vôi xám rêu, mỗi tầng có cửa vòm,
 * tầng trên cùng nhỏ có mái và chóp); cầu Thê Húc sơn đỏ cong vồng dẫn ra đền Ngọc Sơn trên đảo Ngọc; Tháp Bút năm
 * tầng trên gò đá ở lối vào; hàng cây, ghế đá, đèn quanh bờ hồ.
 */
export function hanoiHoGuom(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  // bờ hồ thuôn dài theo trục bắc–nam (ở đây trục z), kè đá + lối đi lát gạch
  const shore = k.cyl(5.0, 5.0, 0.12, 0xcfc4a6, 0, 0, 0, 56)
  shore.scale.set(0.95, 1, 1.05)
  const lake = k.water(9.2, 9.2, 0, 0, true, 0x4fae9a, 0.13) // nước hồ xanh rêu
  lake.scale.set(0.92, 1, 1.02)
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2
    k.lamp(Math.cos(a) * 4.82, Math.sin(a) * 5.0, 0.12)
    if (i % 3 === 0) k.bench(Math.cos(a + 0.1) * 4.75, Math.sin(a + 0.1) * 4.95, -a + Math.PI / 2)
  }
  // gò Rùa + Tháp Rùa
  const tx = 0.9
  const tz = 0.9
  k.cyl(1.0, 1.25, 0.28, 0x6f9a52, tx, 0.08, tz, 24)
  k.tree(tx - 0.7, tz - 0.4, 0.8, 0.3, undefined, 0x8fc65c, 0x5f9a3e)
  k.tree(tx + 0.75, tz + 0.2, 0.7, 0.3, undefined, 0x8fc65c, 0x5f9a3e)
  const wall = 0xc9c1aa
  const moss = 0x8f8c76
  const storeys: Array<[number, number, number]> = [
    [1.0, 0.75, 0.72], // rộng (x), sâu (z), cao
    [0.8, 0.6, 0.62],
    [0.62, 0.48, 0.55]
  ]
  let y = 0.36
  storeys.forEach(([w, d, h], i) => {
    k.box(w, h, d, wall, tx, y, tz)
    k.box(w + 0.02, 0.12, d + 0.02, moss, tx, y, tz) // chân tường rêu
    const doors = i === 0 ? 3 : 1
    for (let n = 0; n < doors; n++) {
      const dx = doors === 1 ? 0 : (n - 1) * w * 0.32
      k.arch(0.22, h * 0.8, 0.03, 0.14, h * 0.7, 0x3a332c, tx + dx, y, tz + d / 2 + 0.005)
      k.arch(0.22, h * 0.8, 0.03, 0.14, h * 0.7, 0x3a332c, tx + dx, y, tz - d / 2 - 0.005)
    }
    k.arch(0.2, h * 0.8, 0.03, 0.13, h * 0.68, 0x3a332c, tx + w / 2 + 0.005, y, tz).rotation.y =
      Math.PI / 2
    k.arch(0.2, h * 0.8, 0.03, 0.13, h * 0.68, 0x3a332c, tx - w / 2 - 0.005, y, tz).rotation.y =
      Math.PI / 2
    k.box(w + 0.16, 0.06, d + 0.16, 0x9a9282, tx, y + h, tz) // gờ mái tầng
    y += h + 0.06
  })
  // tầng đỉnh: lầu nhỏ mái cong + chóp
  k.box(0.36, 0.3, 0.3, wall, tx, y, tz)
  k.arch(0.16, 0.26, 0.03, 0.1, 0.22, 0x3a332c, tx, y, tz + 0.155)
  k.eaveRoof(0.6, 0.52, 1, 0x7a6e5e, 0x9a9282, tx, y + 0.3, tz)
  k.cyl(0.02, 0.03, 0.35, GOLD, tx, y + 0.5, tz, 8)
  k.ball(0.05, GOLD, tx, y + 0.88, tz)

  // đảo Ngọc + đền Ngọc Sơn (mái ngói sẫm, cột đỏ, tường vàng)
  const ix = -2.3
  const iz = -2.6
  k.cyl(1.3, 1.45, 0.3, 0x7cb35a, ix, 0.06, iz, 28)
  const temple = (x: number, z: number, w: number, d: number): void => {
    k.box(w, 0.08, d, 0xb9b4a8, x, 0.36, z)
    k.box(w * 0.86, 0.5, d * 0.8, 0xe8c25a, x, 0.44, z)
    for (let i = 0; i < 5; i++)
      k.column(0.035, 0.5, LACQUER, x - w * 0.4 + (i * w * 0.8) / 4, 0.44, z + d * 0.45)
    k.eaveRoof(w + 0.3, d + 0.3, 2, ROOF_DARK, 0x8a6a4a, x, 0.94, z)
  }
  temple(ix, iz - 0.3, 1.5, 0.9)
  temple(ix + 0.1, iz + 0.6, 1.1, 0.6)
  k.tree(ix - 0.9, iz + 0.3, 0.8, 0.3, undefined, 0x8fc65c, 0x5f9a3e)
  k.tree(ix + 1.0, iz - 0.4, 0.9, 0.3, undefined, 0x8fc65c, 0x5f9a3e)

  // cầu Thê Húc: vòm cong nhiều nhịp, sàn đỏ, lan can đỏ
  const bx0 = -4.6
  const bz0 = -0.6
  const bx1 = ix + 0.9
  const bz1 = iz + 0.9
  const len = Math.hypot(bx1 - bx0, bz1 - bz0)
  const ang = Math.atan2(bz1 - bz0, bx1 - bx0)
  const bridge = new THREE.Group()
  const segs = 14
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs
    const t1 = (i + 1) / segs
    const yA = 0.25 + Math.sin(t0 * Math.PI) * 0.55
    const yB = 0.25 + Math.sin(t1 * Math.PI) * 0.55
    const seg = k.box(
      len / segs + 0.02,
      0.07,
      0.42,
      0xc8322b,
      (len * (t0 + t1)) / 2 - len / 2,
      (yA + yB) / 2,
      0,
      bridge
    )
    seg.rotation.z = Math.atan2(yB - yA, len / segs)
    for (const sz of [-0.2, 0.2]) {
      const post = k.box(0.04, 0.22, 0.04, 0xc8322b, len * t0 - len / 2, yA + 0.05, sz, bridge)
      post.userData.rail = true
      const rail = k.box(
        len / segs + 0.02,
        0.035,
        0.035,
        0xd8452f,
        (len * (t0 + t1)) / 2 - len / 2,
        (yA + yB) / 2 + 0.25,
        sz,
        bridge
      )
      rail.rotation.z = seg.rotation.z
    }
    if (i % 3 === 1) k.box(0.05, 0.25, 0.42, 0x5e3b22, len * t0 - len / 2, 0.0, 0, bridge) // trụ gỗ dưới cầu
  }
  bridge.rotation.y = -ang
  k.put(bridge, (bx0 + bx1) / 2, 0.02, (bz0 + bz1) / 2)

  // Tháp Bút năm tầng trên gò đá + cổng Đài Nghiên ở lối vào bờ hồ
  k.rock(-4.5, 0.15, -1.9, 0.55, 0.32, 0.55, 0x8c877c, 4)
  for (let i = 0; i < 5; i++) {
    const w = 0.34 - i * 0.045
    k.box(w, 0.22, w, 0xbdb4a0, -4.5, 0.4 + i * 0.25, -1.9)
    k.box(w + 0.08, 0.04, w + 0.08, 0x8f8676, -4.5, 0.62 + i * 0.25, -1.9)
  }
  k.cone(0.07, 0.38, 0xbdb4a0, -4.5, 1.66, -1.9, 8) // ngọn bút
  k.box(0.8, 0.55, 0.2, 0xd8cfb4, -4.2, 0.12, -0.9)
  k.arch(0.8, 0.55, 0.22, 0.34, 0.48, 0xd8cfb4, -4.2, 0.12, -0.9)
  k.ball(0.14, 0x8a7a64, -4.2, 0.8, -0.9, 0.7, 1.3, 1) // nghiên mực hình quả đào
  k.sign('NGỌC SƠN', 0.6, 0.12, '#b8322a', '#f6d77a', -4.2, 0.55, -0.79)
  // người đi dạo quanh hồ
  for (const [x, z, c] of [
    [3.9, 2.6, 0xe24a3b],
    [-3.4, 3.4, 0x4aa8d8],
    [4.4, -1.2, 0xf2c94c],
    [-1.0, 4.8, 0x7cc45a]
  ] as const)
    k.person(x, 0.12, z, c, false, undefined, 0.55)

  // rùa nổi + thuyền thiên nga
  const turtle = new THREE.Group()
  k.ball(0.26, 0x5e7a3a, 0, 0.04, 0, 0.42, 1.25, 1, turtle)
  k.ball(0.1, 0x8aa05a, 0.34, 0.07, 0, 0.8, 1, 1, turtle)
  k.put(turtle, 2.6, 0.13, 0)
  const swan = k.swan(-2.8, 0.13, 1.5, 0.7)
  const swan2 = k.swan(-2.4, 0.13, 1.8, 0.45)

  k.group.userData.tick = (t: number): void => {
    const a = t * 0.2
    turtle.position.set(
      Math.cos(a) * 2.9 + 0.3,
      0.11 + Math.max(0, Math.sin(t * 0.8)) * 0.07,
      Math.sin(a) * 3.2 + 0.3
    )
    turtle.rotation.y = -a - Math.PI / 2
    const b = -t * 0.15 + 2
    swan.position.set(
      Math.cos(b) * 2.6 - 0.6,
      0.15 + Math.sin(t * 2) * 0.025,
      Math.sin(b) * 2.0 + 2.2
    )
    swan.rotation.y = -b + Math.PI / 2
    swan2.position.set(
      swan.position.x - Math.cos(b) * 0.5,
      swan.position.y,
      swan.position.z - Math.sin(b) * 0.5
    )
    swan2.rotation.y = swan.rotation.y
  }
  return k.group
}

/**
 * Ngọ Môn (Huế). Đặc điểm thật: đài đá hình chữ U (hai cánh vươn ra trước), năm cửa — ba cửa ở mặt chính (cửa giữa
 * lớn nhất) và hai cửa ở hai cánh; lầu Ngũ Phụng hai tầng phía trên với chín mái — mái giữa lợp ngói lưu ly vàng, các mái
 * hai bên ngói xanh; hàng cột đỏ; lỗ châu mai trên đài; hồ sen + cầu Trung Đạo trước cửa.
 */
export function hueNgoMon2(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  const stone = 0xb3a891
  const stoneDark = 0x8f8572
  // hồ sen + cầu Trung Đạo
  k.water(10.6, 2.4, 0, 4.0, false, 0x5a9e8a)
  for (let i = 0; i < 26; i++) {
    const x = -4.8 + (i % 13) * 0.8 + (i > 12 ? 0.4 : 0)
    const z = 3.4 + (i > 12 ? 0.9 : 0.2)
    if (Math.abs(x) < 0.8) continue
    k.cyl(0.18, 0.18, 0.02, 0x4f9a5a, x, 0.14, z, 10)
    if (i % 3 === 0) k.ball(0.07, 0xf4a6c0, x, 0.22, z, 0.8)
  }
  k.box(1.3, 0.12, 2.6, 0xd0c4a8, 0, 0.1, 4.0)
  k.railing(-0.62, 2.8, -0.62, 5.2, 0.22, 0.22, 0xd0c4a8, 8)
  k.railing(0.62, 2.8, 0.62, 5.2, 0.22, 0.22, 0xd0c4a8, 8)

  // đài chữ U: khối chính + hai cánh vươn ra trước
  const H = 1.7
  k.box(9.0, H, 2.2, stone, 0, 0.05, -0.6)
  for (const sx of [-1, 1]) k.box(1.7, H, 2.4, stone, sx * 3.65, 0.05, 1.6)
  // mạch đá + chân đế
  for (let r = 1; r < 5; r++) {
    k.box(9.04, 0.025, 2.24, stoneDark, 0, 0.05 + r * (H / 5), -0.6)
    for (const sx of [-1, 1])
      k.box(1.74, 0.025, 2.44, stoneDark, sx * 3.65, 0.05 + r * (H / 5), 1.6)
  }
  k.box(9.3, 0.12, 2.5, stoneDark, 0, 0.0, -0.6)
  // năm cửa
  k.arch(1.2, 1.35, 0.06, 0.9, 1.25, 0x2e241e, 0, 0.05, 0.52)
  for (const sx of [-1, 1]) {
    k.arch(0.9, 1.2, 0.06, 0.62, 1.05, 0x2e241e, sx * 1.5, 0.05, 0.52)
    const side = k.arch(0.9, 1.1, 0.06, 0.55, 0.95, 0x2e241e, sx * 2.79, 0.05, 1.7)
    side.rotation.y = Math.PI / 2
  }
  // lỗ châu mai trên mép đài
  for (let i = 0; i < 22; i++) k.box(0.22, 0.16, 0.12, stone, -4.4 + i * 0.42, H + 0.05, 0.45)
  for (const sx of [-1, 1])
    for (let i = 0; i < 6; i++) k.box(0.12, 0.16, 0.22, stone, sx * 4.45, H + 0.05, 0.6 + i * 0.42)
  // lầu Ngũ Phụng: gian giữa hai tầng (mái vàng) + các gian bên (mái xanh) + hành lang trên hai cánh
  const hall = (
    x: number,
    w: number,
    d: number,
    h: number,
    roof: number,
    tiers: number,
    z = -0.6
  ): void => {
    k.box(w, 0.08, d, 0x8a3a2a, x, H + 0.05, z) // sàn gỗ
    k.box(w * 0.9, h, d * 0.7, 0xc04a32, x, H + 0.13, z) // vách gỗ son
    const cols = Math.max(3, Math.round(w / 0.42))
    for (let i = 0; i <= cols; i++)
      k.column(
        0.045,
        h,
        LACQUER,
        x - w / 2 + 0.08 + (i * (w - 0.16)) / cols,
        H + 0.13,
        z + d / 2 - 0.08
      )
    for (let i = 0; i < cols; i++)
      k.box(
        0.22,
        h * 0.5,
        0.03,
        0xe8b830,
        x - w / 2 + 0.3 + (i * (w - 0.16)) / cols,
        H + 0.3,
        z + d * 0.35 + 0.01
      )
    k.eaveRoof(
      w + 0.6,
      d + 0.6,
      tiers,
      roof,
      roof === 0xf2b630 ? 0xc8322b : 0xe8b830,
      x,
      H + 0.13 + h,
      z
    )
  }
  hall(0, 3.0, 1.8, 0.9, 0xf2b630, 2)
  for (const sx of [-1, 1]) {
    hall(sx * 2.4, 1.6, 1.5, 0.75, 0x3f8f6a, 2)
    hall(sx * 3.65, 1.3, 1.8, 0.6, 0x3f8f6a, 1, 1.4)
  }
  k.sign('NGỌ MÔN', 1.0, 0.24, '#1e3a6a', '#f2c94c', 0, 1.5, 0.54)
  // cờ + cây hai bên
  const flagPole = k.cyl(0.04, 0.05, 3.0, 0x6b4a32, -4.9, 0, 3.0, 8)
  void flagPole
  const flag = k.box(0.7, 0.42, 0.03, 0xf2c200, -4.52, 2.55, 3.0)
  for (const [x, z] of [
    [4.8, 3.0],
    [-4.8, -2.2],
    [4.8, -2.2],
    [3.0, -2.4],
    [-3.0, -2.4]
  ] as const)
    k.tree(x, z, 0.9)
  const dboat = new THREE.Group()
  k.box(1.6, 0.16, 0.34, 0xc8322b, 0, 0, 0, dboat)
  k.ball(0.15, 0xf2b630, 0.85, 0.24, 0, 1.2, 1, 0.8, dboat)
  k.box(0.5, 0.26, 0.3, 0xf2b630, -0.25, 0.14, 0, dboat)
  k.put(dboat, -3, 0.12, 4.4)
  k.group.userData.tick = (t: number): void => {
    flag.rotation.y = Math.sin(t * 3.5) * 0.25
    dboat.position.x = -1.6 - Math.cos(t * 0.15) * 2.8
    dboat.rotation.y = Math.sin(t * 0.15) > 0 ? 0 : Math.PI
    dboat.position.y = 0.12 + Math.sin(t * 2.4) * 0.025
  }
  return k.group
}

/**
 * Chùa Cầu (Hội An). Đặc điểm thật: cầu gỗ có mái che dài bắc qua lạch nước, mái ngói âm dương sẫm màu, thân cầu
 * cong nhẹ, chùa nhỏ nhô ra giữa phía bắc (sau cầu) có mái riêng, cửa giữa có biển "LAI VIỄN KIỀU", tượng khỉ ở một đầu
 * và chó ở đầu kia; phố cổ hai bên tường vàng mái ngói, đèn lồng nhiều màu, thuyền trên sông Hoài.
 */
export function hoianChuaCau(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  k.water(10.6, 4.0, 0, 0.4, false, 0x4aa59a)
  for (const sx of [-1, 1]) {
    k.box(2.6, 0.75, 9.6, 0xbcb39e, sx * 4.0, 0, 0)
    k.box(2.6, 0.08, 9.6, 0xd7c89e, sx * 4.0, 0.75, 0)
  }
  // thân cầu: trụ đá + vòm gỗ, sàn cong
  const L = 5.4
  const n = 16
  const deck = (t: number): number => 0.8 + Math.sin(t * Math.PI) * 0.22
  for (const x of [-1.6, 0, 1.6]) k.box(0.4, 0.8, 1.5, 0x9a927e, x, 0, 0)
  for (let i = 0; i < n; i++) {
    const t0 = i / n
    const t1 = (i + 1) / n
    const x = -L / 2 + (L * (t0 + t1)) / 2
    const y = (deck(t0) + deck(t1)) / 2
    const seg = new THREE.Group()
    k.box(L / n + 0.01, 0.1, 1.5, 0x7a4a2e, 0, 0, 0, seg)
    // hai vách gỗ thấp + chấn song + cột
    for (const sz of [-0.68, 0.68]) {
      k.box(L / n + 0.01, 0.32, 0.06, 0x8a3a24, 0, 0.1, sz, seg)
      if (i % 2 === 0) k.column(0.04, 0.95, 0x6b2a1e, 0, 0.1, sz, seg)
      k.box(L / n + 0.01, 0.05, 0.08, 0x5a3020, 0, 1.0, sz, seg)
    }
    // mái hai mái ngói âm dương
    k.gable(L / n + 0.04, 1.95, 0.62, i % 2 ? ROOF_DARK : ROOF_DARK2, 0, 1.05, 0, seg)
    seg.rotation.z = Math.atan2(deck(t1) - deck(t0), L / n)
    k.put(seg, x, y, 0)
  }
  tileRidges(k, L, 1.95, 0.62, 0, deck(0.5) + 1.05, 0, 0x3a2620)
  // hai đầu cầu: cổng mái cong + tượng khỉ / chó
  for (const sx of [-1, 1]) {
    const gx = sx * (L / 2 + 0.25)
    k.box(0.5, 1.05, 1.7, 0x8a3a24, gx, 0.8, 0)
    k.arch(0.5, 0.95, 1.72, 0.0001, 0.0001, 0x8a3a24, gx, 0.8, 0).visible = false
    k.box(0.52, 0.8, 0.9, 0x2a1a14, gx, 0.8, 0) // lối vào tối
    k.eaveRoof(0.95, 2.1, 1, ROOF_DARK, 0xd8d2c0, gx, 1.85, 0)
    for (const sz of [-0.7, 0.7]) {
      const statue = new THREE.Group()
      k.box(0.2, 0.18, 0.2, 0xd8d2c0, 0, 0, 0, statue)
      k.ball(0.11, sx < 0 ? 0xa48a64 : 0xc9b48a, 0, 0.3, 0, 1.2, 1, 1, statue)
      k.ball(0.07, sx < 0 ? 0xa48a64 : 0xc9b48a, 0.06 * -sx, 0.46, 0, 1, 1, 1, statue)
      k.put(statue, gx + sx * 0.45, 0.8, sz)
    }
  }
  // chùa nhỏ nhô ra phía bắc (sau cầu) giữa cầu
  const cy = deck(0.5)
  k.box(1.2, 0.9, 1.0, 0xe9c25a, 0, cy, -1.25)
  k.box(1.24, 0.1, 1.04, 0x8a3a24, 0, cy, -1.25)
  for (const sx of [-0.5, 0.5]) k.column(0.05, 0.9, LACQUER, sx, cy, -0.76)
  k.eaveRoof(1.7, 1.5, 2, ROOF_DARK, 0xd8d2c0, 0, cy + 0.9, -1.25)
  // cửa giữa + biển Lai Viễn Kiều
  k.sign('LAI VIỄN KIỀU', 0.9, 0.2, '#3a2418', '#f2c94c', 0, cy + 0.98, 0.79)
  for (let i = 0; i < 9; i++) {
    const x = -L / 2 + 0.3 + (i * (L - 0.6)) / 8
    k.lantern(x, deck(0.5 + x / L) + 0.82, 0.78, [0xe8432e, 0xf2b630, 0x4aa8d8, 0xf08ac0][i % 4])
  }
  // phố cổ hai bờ: nhà tường vàng mái ngói, ban công gỗ, đèn lồng giăng ngang
  const shop = (x: number, z: number, wall: number): void => {
    k.box(1.3, 0.95, 1.1, wall, x, 0.83, z)
    k.box(1.32, 0.06, 0.25, 0x6b3a22, x, 1.3, z + 0.62) // ban công
    for (const dx of [-0.35, 0.35]) k.box(0.28, 0.4, 0.03, 0x5e3b22, x + dx, 0.88, z + 0.56)
    k.gable(1.5, 1.4, 0.5, ROOF_DARK, x, 1.78, z)
  }
  shop(-4.1, -3.2, 0xf2c94c)
  shop(-4.1, -1.8, 0xe9b44a)
  shop(4.0, -3.0, 0xf2c94c)
  shop(4.0, 2.9, 0xe9b44a)
  shop(-4.1, 3.0, 0xf2d06a)
  for (let i = 0; i < 6; i++)
    k.lantern(-4.6 + i * 0.25, 2.1, 1.8 + (i % 2) * 0.1, [0xe8432e, 0xf2b630, 0x4aa8d8][i % 3])
  k.tree(4.4, 0.9, 1.0, 0.83, undefined, 0x8fc65c, 0x5f9a3e)
  // hoa đăng + thuyền
  const floats: ThreeNS.Mesh[] = []
  for (let i = 0; i < 10; i++)
    floats.push(
      k.ball(0.08, [0xffd166, 0xf08ac0, 0xff8a5a][i % 3], 0, 0.12, 0, 0.7, 1, 1, undefined, {
        emissive: 0x6a4a10
      })
    )
  const boat = new THREE.Group()
  k.box(1.2, 0.18, 0.42, 0x3f6f8a, 0, 0, 0, boat)
  k.box(0.5, 0.25, 0.4, 0xc9a35a, -0.2, 0.18, 0, boat)
  k.lantern(0.45, 0.45, 0, 0xe8432e, boat)
  k.person(0.35, 0.1, 0, 0x7cc45a, true, boat)
  k.put(boat, 0, 0.1, 1.6)
  k.group.userData.tick = (t: number): void => {
    floats.forEach((f, i) => {
      f.position.set(
        ((t * 0.16 + i * 1.07) % 5.6) - 2.8,
        0.12 + Math.sin(t * 2 + i) * 0.02,
        -1.0 + (i % 5) * 0.55
      )
    })
    boat.position.x = Math.sin(t * 0.12) * 2.0
    boat.rotation.y = Math.cos(t * 0.12) > 0 ? 0 : Math.PI
    boat.position.y = 0.1 + Math.sin(t * 2.2) * 0.02
  }
  return k.group
}

/**
 * Chợ Bến Thành (TP.HCM). Đặc điểm thật: mặt tiền tường vàng kem với các trụ trắng, tháp đồng hồ vuông ở cửa chính
 * (cửa Nam) có đồng hồ ba mặt, vòm cửa lớn, chữ "BẾN THÀNH" phía trên; nhà lồng chợ mái ngói xám dài phía sau; vòng
 * xoay Quách Thị Trang trước cửa có tượng Trần Nguyên Hãn cưỡi ngựa; đường phố đầy xe máy.
 */
export function hcmcBenThanh2(THREE: Three): ThreeNS.Group {
  const k = new Kit(THREE)
  const cream = 0xf2dfa0
  const trim = 0xf8f4e6
  k.cyl(5.3, 5.3, 0.08, 0x5d6068, 0, 0, 0, 48) // mặt đường
  k.cyl(1.0, 1.0, 0.12, 0x7cc45a, 0, 0.08, 3.6, 28) // vòng xoay
  // tượng Trần Nguyên Hãn cưỡi ngựa trên bệ
  k.box(0.5, 0.4, 0.35, 0xb9b4a8, 0, 0.2, 3.6)
  const horse = new THREE.Group()
  k.box(0.42, 0.18, 0.14, 0x3a3a3a, 0, 0.18, 0, horse)
  for (const [dx, dz] of [
    [0.15, 0.05],
    [-0.15, 0.05],
    [0.15, -0.05],
    [-0.15, -0.05]
  ])
    k.box(0.04, 0.18, 0.04, 0x3a3a3a, dx, 0, dz, horse)
  k.box(0.08, 0.2, 0.1, 0x3a3a3a, 0.22, 0.28, 0, horse)
  k.cyl(0.05, 0.06, 0.22, 0x3a3a3a, -0.02, 0.32, 0, 6, horse)
  k.ball(0.05, 0x3a3a3a, -0.02, 0.6, 0)
  k.put(horse, 0, 0.6, 3.6)
  // nhà lồng chợ phía sau: mái ngói xám dài
  k.box(7.0, 1.0, 3.8, cream, 0, 0.08, -1.6)
  k.gable(7.2, 4.2, 1.0, 0x6f6e72, 0, 1.08, -1.6)
  k.box(7.2, 0.3, 4.0, cream, 0, 1.08, -1.6).scale.set(1, 1, 0.02)
  // mặt tiền: hai cánh + trụ trắng + cửa sổ vòm
  for (const sx of [-1, 1]) {
    k.box(2.6, 1.5, 0.6, cream, sx * 2.0, 0.08, 0.6)
    for (let i = 0; i < 4; i++) {
      const x = sx * (0.9 + i * 0.62)
      k.box(0.1, 1.5, 0.06, trim, x - sx * 0.3, 0.08, 0.92)
      k.arch(0.42, 0.75, 0.04, 0.3, 0.65, 0x6b4a32, x, 0.35, 0.92)
    }
    k.box(2.62, 0.12, 0.64, trim, sx * 2.0, 1.58, 0.6) // gờ mái
    k.gable(2.7, 0.9, 0.35, 0x6f6e72, sx * 2.0, 1.7, 0.6)
  }
  // sảnh chính + tháp đồng hồ
  k.box(1.6, 2.0, 1.0, cream, 0, 0.08, 0.6)
  for (const sx of [-1, 1]) k.box(0.14, 2.0, 0.1, trim, sx * 0.75, 0.08, 1.12)
  k.arch(1.3, 1.6, 0.06, 0.95, 1.4, 0x4a3020, 0, 0.08, 1.12)
  k.sign('BẾN THÀNH', 1.3, 0.24, '#f2dfa0', '#b8322a', 0, 1.8, 1.14)
  k.box(1.0, 1.1, 0.9, cream, 0, 2.08, 0.6)
  k.box(1.06, 0.08, 0.96, trim, 0, 3.18, 0.6)
  for (const [x, z, ry] of [
    [0, 1.06, 0],
    [0.51, 0.6, Math.PI / 2],
    [-0.51, 0.6, -Math.PI / 2]
  ] as const) {
    const face = k.cyl(0.32, 0.32, 0.04, 0xffffff, x, 2.6, z, 24)
    face.rotation.set(Math.PI / 2, 0, ry)
    face.position.set(x, 2.62, z)
    const hand = k.box(0.03, 0.22, 0.02, 0x111111, x, 2.6, z)
    hand.rotation.y = ry
    hand.position.set(x + Math.sin(ry) * 0.03, 2.62, z + Math.cos(ry) * 0.03)
  }
  k.hip(1.15, 1.05, 0.7, 0x6f6e72, 0, 3.26, 0.6)
  k.cyl(0.025, 0.03, 0.5, 0xb9b4a8, 0, 3.9, 0.6, 6)
  const flag = k.box(0.42, 0.26, 0.02, 0xd92b2b, 0.22, 4.18, 0.6)
  k.ball(0.07, 0xf2c200, 0.22, 4.18, 0.62, 1, 1, 0.3)
  // cây me + xe máy + người
  for (const [x, z] of [
    [-4.3, 2.4],
    [4.3, 2.4],
    [-4.6, -2.0],
    [4.6, -2.0]
  ] as const)
    k.tree(x, z, 1.1, 0.08, undefined, 0x7cc45a, 0x4f9a3b)
  const bikes: ThreeNS.Group[] = []
  const colors = [0xe24a3b, 0x4aa8d8, 0xf2b630, 0x7cc45a, 0xf08ac0, 0xffffff]
  for (let i = 0; i < 6; i++) bikes.push(k.motorbike(0, 0, colors[i]))
  for (const [x, z, c] of [
    [-1.4, 1.6, 0xe24a3b],
    [1.5, 1.7, 0x4aa8d8],
    [-2.6, 1.5, 0xf2c94c],
    [2.7, 1.6, 0x7cc45a]
  ] as const)
    k.person(x, 0.08, z, c, false, undefined, 0.55)
  k.group.userData.tick = (t: number): void => {
    bikes.forEach((b, i) => {
      const a = t * 0.3 + (i * Math.PI * 2) / bikes.length
      const r = 1.55 + (i % 2) * 0.35
      b.position.set(Math.cos(a) * r, 0.08, 3.6 + Math.sin(a) * r)
      b.rotation.y = -a - Math.PI / 2
    })
    flag.rotation.y = Math.sin(t * 4) * 0.3
  }
  return k.group
}
