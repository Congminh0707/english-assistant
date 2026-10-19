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
  private readonly columns: number
  /** Các lớp phụ kiện (cùng bố cục frame với sheet chính), vẽ chồng theo thứ tự */
  private overlays: HTMLImageElement[] = []

  constructor(
    private readonly image: HTMLImageElement,
    private readonly meta: SpriteSheetMeta,
    private readonly ctx: CanvasRenderingContext2D,
    private scale: number
  ) {
    this.columns = Math.floor(image.width / meta.frameSize.w)
    this.resizeCanvas()
  }

  /** Đặt các lớp phụ kiện đang đeo (vẽ lại ngay) */
  setOverlays(images: HTMLImageElement[]): void {
    this.overlays = images
    this.drawnFrame = -1
  }

  /** Đổi hệ số phóng to (cài đặt kích thước mascot) */
  setScale(scale: number): void {
    this.scale = scale
    this.resizeCanvas()
  }

  private resizeCanvas(): void {
    this.ctx.canvas.width = this.meta.frameSize.w * this.scale
    this.ctx.canvas.height = this.meta.frameSize.h * this.scale
    this.drawnFrame = -1 // canvas bị xoá khi đổi kích thước → buộc vẽ lại
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
    const { ctx, scale } = this
    const sx = (frame % this.columns) * w
    const sy = Math.floor(frame / this.columns) * h
    ctx.save()
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.imageSmoothingEnabled = false
    if (flip) {
      // Nhân vật luôn vẽ quay phải; đi sang trái thì lật ngang
      ctx.translate(ctx.canvas.width, 0)
      ctx.scale(-1, 1)
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
