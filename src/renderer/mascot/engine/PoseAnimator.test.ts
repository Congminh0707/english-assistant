import { describe, expect, it } from 'vitest'
import { PoseAnimator, poseOf } from './PoseAnimator'

describe('PoseAnimator', () => {
  it('trạng thái của não đổi thành dáng vector, trạng thái lạ rơi về idle', () => {
    expect(poseOf('walk')).toBe('walk')
    expect(poseOf('sleep')).toBe('sleep')
    expect(poseOf('eat')).toBe('eat')
    expect(poseOf('levelup')).toBe('levelup')
    expect(poseOf('quirk_web')).toBe('idle')
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
})
