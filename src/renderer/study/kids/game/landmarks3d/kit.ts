// Bộ dựng công trình 3D cho bản đồ game (cùng phong cách mịn với địa hình: Lambert, màu tươi, bo tròn, bóng đổ) — thay cho
// mô hình voxel (voxel chỉ còn dùng ở bản đồ 2D). Mọi toạ độ là đơn vị cục bộ: chân công trình rộng ~10, y = 0 là mặt đất,
// mặt trước hướng +z. Bản đồ co lại bằng `scale`. docs/19-kids-world.md §5.2
import type * as ThreeNS from 'three'
import { toon } from '../toon'

type Three = typeof ThreeNS
type Color = number | string

export class Kit {
  readonly group: ThreeNS.Group
  private readonly mats = new Map<string, ThreeNS.Material>()
  constructor(readonly THREE: Three) {
    this.group = new THREE.Group()
  }

  mat(
    color: Color,
    opts: { emissive?: number; opacity?: number; double?: boolean } = {}
  ): ThreeNS.Material {
    const key = `${color}|${opts.emissive ?? ''}|${opts.opacity ?? ''}|${opts.double ? 1 : 0}`
    let m = this.mats.get(key)
    if (!m) {
      m = toon(this.THREE, {
        color: new this.THREE.Color(color as number),
        emissive: opts.emissive !== undefined ? new this.THREE.Color(opts.emissive) : undefined,
        transparent: opts.opacity !== undefined,
        opacity: opts.opacity ?? 1,
        side: opts.double ? this.THREE.DoubleSide : this.THREE.FrontSide
      })
      this.mats.set(key, m)
    }
    return m
  }

  /** Thêm mesh vào nhóm (hoặc `into`), bật bóng đổ */
  put<M extends ThreeNS.Object3D>(
    m: M,
    x: number,
    y: number,
    z: number,
    into?: ThreeNS.Object3D
  ): M {
    m.position.set(x, y, z)
    m.traverse((o) => {
      const mesh = o as ThreeNS.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    ;(into ?? this.group).add(m)
    return m
  }

  mesh(geo: ThreeNS.BufferGeometry, color: Color, opts?: Parameters<Kit['mat']>[1]): ThreeNS.Mesh {
    return new this.THREE.Mesh(geo, this.mat(color, opts))
  }

  /** y = đáy */
  box(
    w: number,
    h: number,
    d: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const m = this.mesh(new this.THREE.BoxGeometry(w, h, d), color)
    return this.put(m, x, y + h / 2, z, into)
  }

  cyl(
    rt: number,
    rb: number,
    h: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    seg = 20,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const m = this.mesh(new this.THREE.CylinderGeometry(rt, rb, h, seg), color)
    return this.put(m, x, y + h / 2, z, into)
  }

  cone(
    r: number,
    h: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    seg = 16,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const m = this.mesh(new this.THREE.ConeGeometry(r, h, seg), color)
    return this.put(m, x, y + h / 2, z, into)
  }

  /** Cầu / elip (sy kéo giãn theo y) — y = tâm */
  ball(
    r: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    sy = 1,
    sx = 1,
    sz = 1,
    into?: ThreeNS.Object3D,
    opts?: Parameters<Kit['mat']>[1]
  ): ThreeNS.Mesh {
    const m = this.mesh(new this.THREE.SphereGeometry(r, 18, 12), color, opts)
    m.scale.set(sx, sy, sz)
    return this.put(m, x, y, z, into)
  }

  /** Mái chóp bốn mặt (w × d), y = đáy */
  hip(
    w: number,
    d: number,
    h: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const m = this.mesh(new this.THREE.CylinderGeometry(0, w / Math.SQRT2, h, 4), color)
    m.rotation.y = Math.PI / 4
    const holder = new this.THREE.Group()
    holder.add(m)
    holder.scale.z = d / w
    return this.put(holder as unknown as ThreeNS.Mesh, x, y + h / 2, z, into)
  }

  /** Mái hai dốc chạy dọc trục x (w dài, d rộng), y = đáy */
  gable(
    w: number,
    d: number,
    h: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const s = new this.THREE.Shape()
    s.moveTo(-d / 2, 0)
    s.lineTo(d / 2, 0)
    s.lineTo(0, h)
    s.closePath()
    const geo = new this.THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false })
    geo.translate(0, 0, -w / 2)
    geo.rotateY(Math.PI / 2)
    return this.put(this.mesh(geo, color, { double: true }), x, y, z, into)
  }

  /** Mái đình kiểu Việt: ba tầng thu nhỏ có đầu đao cong vút ở bốn góc, y = đáy tầng thấp nhất */
  eaveRoof(
    w: number,
    d: number,
    tiers: number,
    color: Color,
    trim: Color,
    x = 0,
    y = 0,
    z = 0,
    into?: ThreeNS.Object3D
  ): ThreeNS.Group {
    const g = new this.THREE.Group()
    let cw = w
    let cd = d
    let cy = 0
    for (let i = 0; i < tiers; i++) {
      const h = Math.min(cw, cd) * 0.32
      this.hip(cw, cd, h, color, 0, cy, 0, g)
      this.box(cw * 1.02, 0.07, cd * 1.02, trim, 0, cy - 0.02, 0, g) // diềm mái
      // đầu đao
      for (const [sx, sz] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ]) {
        const horn = this.cone(0.07, 0.3, trim, (sx * cw) / 2, cy + 0.03, (sz * cd) / 2, 6, g)
        horn.rotation.z = -sx * 0.7
        horn.rotation.x = sz * 0.7
      }
      cy += h * 0.55
      cw *= 0.62
      cd *= 0.62
    }
    this.cyl(0.04, 0.07, 0.5, 0xe8b830, 0, cy, 0, 8, g)
    return this.put(g, x, y, z, into)
  }

  /** Cổng/vòm: tấm (w × h × depth) khoét ô vòm (aw × ah) — y = đáy */
  arch(
    w: number,
    h: number,
    depth: number,
    aw: number,
    ah: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const s = new this.THREE.Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(w / 2, h)
    s.lineTo(-w / 2, h)
    s.closePath()
    const hole = new this.THREE.Path()
    hole.moveTo(-aw / 2, 0)
    hole.lineTo(-aw / 2, ah - aw / 2)
    hole.absarc(0, ah - aw / 2, aw / 2, Math.PI, 0, true)
    hole.lineTo(aw / 2, 0)
    hole.closePath()
    s.holes.push(hole)
    const geo = new this.THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
    geo.translate(0, 0, -depth / 2)
    return this.put(this.mesh(geo, color), x, y, z, into)
  }

  steps(
    w: number,
    d: number,
    n: number,
    rise: number,
    color: Color,
    x = 0,
    y = 0,
    z = 0,
    into?: ThreeNS.Object3D
  ): void {
    for (let i = 0; i < n; i++)
      this.box(
        w,
        rise,
        d * (1 - i / (n + 1)),
        color,
        x,
        y + i * rise,
        z - (i * d) / (2 * (n + 1)),
        into
      )
  }

  column(r: number, h: number, color: Color, x = 0, y = 0, z = 0, into?: ThreeNS.Object3D): void {
    this.cyl(r, r * 1.05, h, color, x, y, z, 10, into)
    this.cyl(r * 1.5, r * 1.5, 0.06, 0x6b4a32, x, y, z, 10, into)
    this.cyl(r * 1.35, r * 1.35, 0.05, 0xe8b830, x, y + h - 0.02, z, 10, into)
  }

  lantern(x: number, y: number, z: number, color: Color = 0xe8432e, into?: ThreeNS.Object3D): void {
    this.ball(0.17, color, x, y, z, 1.25, 1, 1, into, { emissive: 0x5a1208 })
    this.cyl(0.08, 0.08, 0.05, 0xe8b830, x, y + 0.2, z, 8, into)
    this.cyl(0.04, 0.04, 0.12, 0xe8b830, x, y - 0.3, z, 6, into)
  }

  tree(
    x: number,
    z: number,
    s = 1,
    y = 0,
    into?: ThreeNS.Object3D,
    light = 0x79c25a,
    dark = 0x4f9a3b
  ): void {
    this.cyl(0.07 * s, 0.1 * s, 0.55 * s, 0x6b4a32, x, y, z, 8, into)
    this.ball(0.4 * s, dark, x, y + 0.85 * s, z, 0.95, 1, 1, into)
    this.ball(0.3 * s, light, x + 0.12 * s, y + 1.15 * s, z + 0.08 * s, 0.9, 1, 1, into)
  }

  pine(x: number, z: number, s = 1, y = 0, into?: ThreeNS.Object3D): void {
    this.cyl(0.06 * s, 0.08 * s, 0.35 * s, 0x6b4a32, x, y, z, 8, into)
    for (let i = 0; i < 3; i++)
      this.cone(
        (0.42 - i * 0.1) * s,
        0.55 * s,
        i % 2 ? 0x2f7a34 : 0x3f8f3a,
        x,
        y + (0.25 + i * 0.32) * s,
        z,
        8,
        into
      )
  }

  palm(x: number, z: number, s = 1, y = 0, into?: ThreeNS.Object3D): void {
    const g = new this.THREE.Group()
    for (let i = 0; i < 5; i++) {
      const seg = this.cyl(
        0.07 * s,
        0.09 * s,
        0.4 * s,
        0x9b7a4a,
        0.03 * i * s,
        i * 0.38 * s,
        0,
        8,
        g
      )
      seg.rotation.z = -0.07 * i
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2
      const frond = this.cone(
        0.14 * s,
        1.0 * s,
        0x4f9a3b,
        Math.cos(a) * 0.4 * s + 0.15 * s,
        1.95 * s,
        Math.sin(a) * 0.4 * s,
        5,
        g
      )
      frond.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2)
      frond.scale.set(1, 1, 0.35)
    }
    this.ball(0.09 * s, 0x6b4a32, 0.1 * s, 1.85 * s, 0.05 * s, 1, 1, 1, g)
    this.put(g, x, y, z, into)
  }

  /** Tảng đá vôi/đá núi: hình cầu méo nhấp nhô (nhiễu cố định theo hạt giống) */
  rock(
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
    color: Color,
    seed = 1,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const geo = new this.THREE.IcosahedronGeometry(1, 2)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i)
      const vy = p.getY(i)
      const vz = p.getZ(i)
      const n =
        Math.sin(vx * 3.1 + seed) * Math.cos(vz * 2.7 + seed * 1.7) * 0.18 +
        Math.sin(vy * 4.3 + seed * 2.3) * 0.1
      p.setXYZ(i, vx * (1 + n), vy * (1 + n * 0.6), vz * (1 + n))
    }
    geo.computeVertexNormals()
    const m = this.mesh(geo, color)
    m.scale.set(rx, ry, rz)
    return this.put(m, x, y, z, into)
  }

  /** Mặt nước dẹt (hình tròn hoặc chữ nhật) hơi nhô lên khỏi nền */
  water(
    w: number,
    d: number,
    x = 0,
    z = 0,
    round = false,
    color: Color = 0x4db3e6,
    y = 0.04
  ): ThreeNS.Mesh {
    const geo = round
      ? new this.THREE.CylinderGeometry(w / 2, w / 2, 0.08, 32)
      : new this.THREE.BoxGeometry(w, 0.08, d)
    const m = this.mesh(geo, color, { opacity: 0.92 })
    m.castShadow = false
    m.receiveShadow = true
    m.position.set(x, y, z)
    this.group.add(m)
    return m
  }

  /** Người nhỏ: thân ngắn + đầu + nón (tuỳ chọn nón lá) */
  person(
    x: number,
    y: number,
    z: number,
    shirt: Color,
    hat = false,
    into?: ThreeNS.Object3D,
    s = 1
  ): void {
    const g = new this.THREE.Group()
    g.scale.setScalar(s)
    this.cyl(0.13, 0.16, 0.42, shirt, 0, 0.08, 0, 10, g)
    this.ball(0.13, 0xf1c9a0, 0, 0.64, 0, 1, 1, 1, g)
    if (hat) this.cone(0.3, 0.2, 0xe8d28a, 0, 0.66, 0, 14, g)
    else this.ball(0.14, 0x2b2b36, 0, 0.7, -0.02, 0.7, 1, 1, g)
    this.put(g, x, y, z, into)
  }

  /** Biển chữ (bảng tên, hoành phi) vẽ bằng canvas — `w` × `h`, mặt quay về +z (hoặc xoay `rotY`) */
  sign(
    text: string,
    w: number,
    h: number,
    bg: string,
    fg: string,
    x: number,
    y: number,
    z: number,
    rotY = 0,
    into?: ThreeNS.Object3D
  ): ThreeNS.Mesh {
    const px = 64
    const cv = document.createElement('canvas')
    cv.width = Math.max(64, Math.round(w * px * 2))
    cv.height = Math.max(32, Math.round(h * px * 2))
    const c = cv.getContext('2d')
    if (c) {
      c.fillStyle = bg
      c.fillRect(0, 0, cv.width, cv.height)
      c.fillStyle = fg
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.font = `800 ${Math.round(cv.height * 0.62)}px system-ui, sans-serif`
      c.fillText(text, cv.width / 2, cv.height / 2, cv.width * 0.92)
    }
    const tex = new this.THREE.CanvasTexture(cv)
    tex.colorSpace = this.THREE.SRGBColorSpace
    const m = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(w, h),
      new this.THREE.MeshBasicMaterial({ map: tex })
    )
    m.rotation.y = rotY
    m.position.set(x, y, z)
    ;(into ?? this.group).add(m)
    return m
  }

  /** Lan can: cột + tay vịn chạy từ (x0, z0) tới (x1, z1) ở độ cao y */
  railing(
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    y: number,
    h: number,
    color: Color,
    posts = 8,
    into?: ThreeNS.Object3D
  ): void {
    const len = Math.hypot(x1 - x0, z1 - z0)
    const ang = Math.atan2(z1 - z0, x1 - x0)
    for (let i = 0; i <= posts; i++) {
      const t = i / posts
      this.box(0.05, h, 0.05, color, x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t, into)
    }
    const rail = this.box(len, 0.04, 0.05, color, (x0 + x1) / 2, y + h - 0.04, (z0 + z1) / 2, into)
    rail.rotation.y = -ang
    const mid = this.box(len, 0.03, 0.03, color, (x0 + x1) / 2, y + h * 0.45, (z0 + z1) / 2, into)
    mid.rotation.y = -ang
  }

  /** Cột đèn đường kiểu cổ */
  lamp(x: number, z: number, y = 0, into?: ThreeNS.Object3D, s = 0.55): void {
    this.cyl(0.03 * s, 0.045 * s, 1.1 * s, 0x2b2b36, x, y, z, 8, into)
    this.ball(0.09 * s, 0xfff1b8, x, y + 1.18 * s, z, 1.1, 1, 1, into, { emissive: 0x6a5a20 })
    this.cone(0.11 * s, 0.08 * s, 0x2b2b36, x, y + 1.27 * s, z, 8, into)
  }

  /** Xe máy nhỏ có người lái */
  motorbike(x: number, z: number, color: Color, rot = 0, into?: ThreeNS.Object3D): ThreeNS.Group {
    const g = new this.THREE.Group()
    this.box(0.5, 0.14, 0.1, color, 0, 0.14, 0, g)
    for (const dx of [-0.2, 0.2])
      this.cyl(0.08, 0.08, 0.05, 0x2b2b36, dx, 0.0, 0, 10, g).rotation.x = Math.PI / 2
    this.person(-0.02, 0.2, 0, color === 0xe24a3b ? 0x4aa8d8 : 0xe24a3b, false, g)
    g.rotation.y = rot
    g.scale.setScalar(0.7)
    return this.put(g, x, 0.08, z, into)
  }

  /** Băng ghế công viên */
  bench(x: number, z: number, rot = 0, into?: ThreeNS.Object3D): void {
    const g = new this.THREE.Group()
    this.box(0.6, 0.05, 0.2, 0x8a5a36, 0, 0.18, 0, g)
    this.box(0.6, 0.18, 0.04, 0x8a5a36, 0, 0.22, -0.09, g)
    for (const dx of [-0.25, 0.25]) this.box(0.04, 0.18, 0.18, 0x2b2b36, dx, 0, 0, g)
    g.rotation.y = rot
    this.put(g, x, 0, z, into)
  }
}
