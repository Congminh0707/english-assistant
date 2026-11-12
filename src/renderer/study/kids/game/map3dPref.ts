// Bản đồ 3D của bé (docs/19-kids-world.md §5.2) — THỬ NGHIỆM, ngừng đầu tư (docs/decisions.md #65): chỉ có khi phụ
// huynh bật cài đặt `kids.map3d`. Tắt (mặc định) thì không có nút 3D/2D trên HUD và bản đồ luôn 2D, lựa chọn cũ trong
// localStorage bị bỏ qua (không đọc, không ghi, không xoá) để bật lại thì vẫn còn.

const KEY = 'kids.map3d'

/** Có cho dùng bản đồ 3D không (hiện nút trên HUD): cài đặt bật + tầng có bản đồ địa lý + WebGL chạy được */
export function can3dMap(opts: {
  setting: boolean
  scene: string | undefined
  webglFailed: boolean
}): boolean {
  return opts.setting && opts.scene === 'vn' && !opts.webglFailed
}

/** Có đang vẽ bản đồ 3D không: được phép và bé đã chọn 3D */
export function show3dMap(can3d: boolean, wanted: boolean): boolean {
  return can3d && wanted
}

/** Lựa chọn 3D đã nhớ trên máy này; chỉ gọi khi cài đặt `kids.map3d` đang bật */
export function readMap3dChoice(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Nhớ lựa chọn 3D/2D; chỉ gọi khi cài đặt `kids.map3d` đang bật (nút HUD chỉ có lúc đó) */
export function saveMap3dChoice(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* không lưu được thì thôi */
  }
}
