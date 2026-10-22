/** Khung sprite gốc dùng để tính kích thước hiển thị (docs/05-mascot-system.md) */
const BASE_FRAME = 48

export interface AnimationDef {
  frames: number[]
  fps: number
  loop: boolean
  /** Animation chuyển sang khi chạy xong (chỉ với loop: false) */
  next?: string
}

/** Định dạng sheet.json — docs/05-mascot-system.md#2-sprite-sheet--định-dạng-chuẩn */
export interface SpriteSheetMeta {
  frameSize: { w: number; h: number }
  anchor: { x: number; y: number }
  animations: Record<string, AnimationDef>
}

/** Vẽ đúng frame đúng thời điểm. Chỉ vẽ lại khi frame hoặc hướng thay đổi để tiết kiệm CPU. */
export class SpriteAnimator {
  /** Gọi khi một animation không lặp chạy xong */
  onFinish: ((name: string) => void) | null = null

  private current = 'idle'
  private frameIdx = 0
  private acc = 0
  private drawnFrame = -1
  private drawnFlip = false
  private columns: number
  /** Các lớp phụ kiện (cùng bố cục frame với sheet chính), vẽ chồng theo thứ tự */
  private overlays: HTMLImageElement[] = []
  /** Phụ kiện nằm sau lưng nhân vật (áo choàng, cánh), vẽ trước thân */
  private backOverlays: HTMLImageElement[] = []

  constructor(
    private image: HTMLImageElement,
    private meta: SpriteSheetMeta,
    private readonly ctx: CanvasRenderingContext2D,
    private scale: number
  ) {
    this.columns = Math.floor(image.width / meta.frameSize.w)
    this.resizeCanvas()
  }

  /** Đổi sang sheet khác cùng bố cục frame (tiến hoá sang giai đoạn mới); vẽ lại ngay */
  setSheet(image: HTMLImageElement, meta?: SpriteSheetMeta): void {
    this.image = image
    // Mỗi nhân vật có bộ hoạt ảnh riêng (quirk_*) nên khi đổi nhân vật phải đổi cả metadata
    if (meta) this.meta = meta
    this.columns = Math.floor(image.width / this.meta.frameSize.w)
    this.drawnFrame = -1
  }

  /** Đặt các lớp phụ kiện đang đeo: `front` vẽ đè lên thân, `back` vẽ phía sau (vẽ lại ngay) */
  setOverlays(front: HTMLImageElement[], back: HTMLImageElement[] = []): void {
    this.overlays = front
    this.backOverlays = back
    this.drawnFrame = -1
  }

  /** Đổi hệ số phóng to (cài đặt kích thước mascot) */
  setScale(scale: number): void {
    this.scale = scale
    this.resizeCanvas()
  }

  /**
   * Hệ số phóng thực tế. `scale` tính theo khung gốc 48px (kích thước hiển thị = 48 × scale) nên sheet
   * chi tiết hơn (khung 96px) được thu lại tương ứng: scale 2 → vừa khít 1:1.
   */
  private get displayScale(): number {
    return (this.scale * BASE_FRAME) / this.meta.frameSize.w
  }

  private resizeCanvas(): void {
    this.ctx.canvas.width = Math.round(this.meta.frameSize.w * this.displayScale)
    this.ctx.canvas.height = Math.round(this.meta.frameSize.h * this.displayScale)
    this.drawnFrame = -1 // canvas bị xoá khi đổi kích thước → buộc vẽ lại
  }

  /** Tên mọi hoạt ảnh có trong sheet hiện tại */
  names(): string[] {
    return Object.keys(this.meta.animations)
  }

  get animation(): string {
    return this.current
  }

  play(name: string, restart = false): void {
    if (!this.meta.animations[name]) throw new Error(`Missing animation: ${name}`)
    if (name === this.current && !restart) return
    this.current = name
    this.frameIdx = 0
    this.acc = 0
  }

  update(dt: number, flip: boolean): void {
    const anim = this.meta.animations[this.current]
    this.acc += dt
    const frameTime = 1 / anim.fps
    while (this.acc >= frameTime) {
      this.acc -= frameTime
      this.frameIdx++
      if (this.frameIdx >= anim.frames.length) {
        if (anim.loop) {
          this.frameIdx = 0
        } else {
          const finished = this.current
          this.play(anim.next ?? 'idle')
          this.onFinish?.(finished)
          break
        }
      }
    }
    const frame = this.meta.animations[this.current].frames[this.frameIdx]
    if (frame !== this.drawnFrame || flip !== this.drawnFlip) this.draw(frame, flip)
  }

  private draw(frame: number, flip: boolean): void {
    const { w, h } = this.meta.frameSize
    const { ctx } = this
    const scale = this.displayScale
    const sx = (frame % this.columns) * w
    const sy = Math.floor(frame / this.columns) * h
    ctx.save()
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // Tỉ lệ nguyên thì giữ pixel sắc nét; lẻ (vd 96px → 72px) thì làm mịn để không bị răng cưa
    const integer = Number.isInteger(scale)
    ctx.imageSmoothingEnabled = !integer
    ctx.imageSmoothingQuality = 'high'
    if (flip) {
      // Nhân vật luôn vẽ quay phải; đi sang trái thì lật ngang
      ctx.translate(ctx.canvas.width, 0)
      ctx.scale(-1, 1)
    }
    for (const overlay of this.backOverlays) {
      ctx.drawImage(overlay, sx, sy, w, h, 0, 0, w * scale, h * scale)
    }
    ctx.drawImage(this.image, sx, sy, w, h, 0, 0, w * scale, h * scale)
    for (const overlay of this.overlays) {
      ctx.drawImage(overlay, sx, sy, w, h, 0, 0, w * scale, h * scale)
    }
    ctx.restore()
    this.drawnFrame = frame
    this.drawnFlip = flip
  }
}
