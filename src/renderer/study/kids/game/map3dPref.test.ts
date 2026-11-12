import { describe, expect, it } from 'vitest'
import { defaultSettings } from '@shared/schemas/settings'
import { can3dMap, show3dMap } from './map3dPref'

describe('bản đồ 3D của bé (thử nghiệm, cài đặt kids.map3d)', () => {
  it('mặc định (mọi người dùng cũ/mới) tắt → không có nút, luôn 2D dù đã từng chọn 3D', () => {
    const setting = defaultSettings()['kids.map3d']
    expect(setting).toBe(false)
    const can = can3dMap({ setting, scene: 'vn', webglFailed: false })
    expect(can).toBe(false)
    expect(show3dMap(can, true)).toBe(false)
  })

  it('bật → có nút trên bản đồ Việt Nam; 3D chỉ khi bé chọn', () => {
    const can = can3dMap({ setting: true, scene: 'vn', webglFailed: false })
    expect(can).toBe(true)
    expect(show3dMap(can, true)).toBe(true)
    expect(show3dMap(can, false)).toBe(false)
  })

  it('bật nhưng WebGL lỗi hoặc tầng không có bản đồ địa lý → về 2D, không có nút', () => {
    expect(can3dMap({ setting: true, scene: 'vn', webglFailed: true })).toBe(false)
    expect(can3dMap({ setting: true, scene: 'asia', webglFailed: false })).toBe(false)
    expect(can3dMap({ setting: true, scene: undefined, webglFailed: false })).toBe(false)
  })
})
