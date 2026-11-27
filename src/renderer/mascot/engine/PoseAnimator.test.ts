import { describe, expect, it } from 'vitest'
import { PoseAnimator, motionOf, poseOf } from './PoseAnimator'

describe('PoseAnimator', () => {
  it('trạng thái của não đổi thành dáng vector, trạng thái lạ rơi về idle', () => {
    expect(poseOf('walk')).toBe('walk')
    expect(poseOf('sleep')).toBe('sleep')
    expect(poseOf('eat')).toBe('eat')
    expect(poseOf('levelup')).toBe('levelup')
    expect(poseOf('quirk_web')).toBe('idle')
  })

  it('trạng thái tương tác dùng lại dáng sẵn có, thêm chuyển động cả thân', () => {
    expect([poseOf('trick'), motionOf('trick')]).toEqual(['hello', 'bounce'])
    expect([poseOf('groove'), motionOf('groove')]).toEqual(['listen', 'shimmy'])
    expect([poseOf('dizzy'), motionOf('dizzy')]).toEqual(['surprised', 'dizzy'])
    expect([poseOf('purr'), motionOf('purr')]).toEqual(['happy', 'sway'])
    expect(motionOf('walk')).toBe('')
    const seen: string[] = []
    const a = new PoseAnimator((p, m) => seen.push(`${p}/${m}`))
    a.play('notice', true)
    a.update(1.3)
    expect(seen).toEqual(['idle/perk', 'idle/'])
  })

  it('hoạt ảnh một lần giữ dáng rồi báo xong, hoạt ảnh lặp thì không', () => {
    const poses: string[] = []
    const done: string[] = []
    const a = new PoseAnimator((p) => poses.push(p))
    a.onFinish = (n) => done.push(n)
    a.play('happy', true)
    a.update(1)
    expect(done).toEqual([])
    a.update(1.5)
    expect(done).toEqual(['happy'])
    expect(poses).toEqual(['happy', 'idle'])
    a.play('walk', true)
    a.update(60)
    expect(done).toEqual(['happy'])
    expect(a.names()).toEqual([])
  })

  it('hoạt ảnh tự do của nhân vật: có tên cho não chọn, giữ đúng độ dài rồi báo xong', () => {
    const poses: string[] = []
    const done: string[] = []
    const quirks = {
      quirk_door: { seconds: 8, variants: 1 },
      quirk_blast: { seconds: 6, variants: 3 }
    }
    let roll = 0
    const a = new PoseAnimator(
      (p, m) => poses.push(`${p}/${m}`),
      () => quirks,
      () => roll
    )
    a.onFinish = (n) => done.push(n)
    expect(a.names()).toEqual(['quirk_door', 'quirk_blast'])
    a.play('quirk_door', true)
    a.update(7.9)
    expect(done).toEqual([])
    a.update(0.2)
    expect(done).toEqual(['quirk_door'])
    expect(poses).toEqual(['quirk_door/', 'idle/'])
    // Nhiều biến thể: mỗi lần diễn chọn một dáng `_1.._N`
    roll = 0.99
    a.play('quirk_blast', true)
    roll = 0.4
    a.play('quirk_blast', true)
    expect(poses.slice(2)).toEqual(['quirk_blast_3/', 'quirk_blast_2/'])
  })

  it('quirk không có ở nhân vật hiện tại thì đứng idle và báo xong ngay, não không kẹt', () => {
    const poses: string[] = []
    const done: string[] = []
    const a = new PoseAnimator((p) => poses.push(p))
    a.onFinish = (n) => done.push(n)
    a.play('quirk_web', true)
    expect(poses).toEqual(['idle'])
    a.update(0.05)
    expect(done).toEqual(['quirk_web'])
  })
})
