// Tiện ích dùng chung cho định nghĩa hoạt ảnh (anim.mjs: hoạt ảnh chung; anim-chars.mjs: riêng từng nhân vật).
export const TAU = Math.PI * 2
export const S = Math.sin
export const C = Math.cos
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const ease = (t) => t * t * (3 - 2 * t)
/** Đường cong 0→1→0 mượt theo t ∈ [0,1] */
export const hump = (t) => S(clamp(t) * Math.PI)
/** Tạo n tư thế: fn(t, i, n) trả về các trường pose */
export const seq = (n, fn) =>
  Array.from({ length: n }, (_, i) => ({ t: i / n, ...fn(i / n, i, n) }))

/** Gộp thêm trường vào một tư thế; hiệu ứng (fx) được cộng dồn thay vì ghi đè */
export function mergePose(pose, extra) {
  if (!extra) return pose
  return { ...pose, ...extra, fx: [...(pose.fx ?? []), ...(extra.fx ?? [])] }
}
