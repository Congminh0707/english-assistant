// Tiếng động của màn game bé, tự tạo bằng WebAudio (dao động + bao âm) — không có file âm thanh, không cần nguồn ngoài.
// Tắt được bằng cài đặt `kids.gameSound`; giọng đọc từ (TTS) không bị ảnh hưởng. docs/19-kids-world.md §5.4 mục 5
export type Sfx =
  'tap' | 'step' | 'open' | 'chest' | 'right' | 'whoosh' | 'car' | 'boat' | 'plane' | 'splash'

let ctx: AudioContext | null = null
let enabled = true

export function setSfxEnabled(on: boolean): void {
  enabled = on
}

function tone(
  ac: AudioContext,
  at: number,
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.16,
  slideTo?: number
): void {
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur)
  amp.gain.setValueAtTime(0.0001, at)
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(amp).connect(ac.destination)
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

export function playSfx(name: Sfx): void {
  if (!enabled) return
  try {
    ctx ??= new AudioContext()
    const ac = ctx
    if (ac.state === 'suspended') void ac.resume()
    const t = ac.currentTime
    switch (name) {
      case 'tap':
        tone(ac, t, 660, 0.09, 'triangle', 0.14, 990)
        break
      case 'step':
        tone(ac, t, 300, 0.06, 'triangle', 0.08, 220)
        break
      case 'whoosh':
        tone(ac, t, 220, 0.35, 'sine', 0.08, 660)
        break
      case 'car':
        tone(ac, t, 523, 0.11, 'square', 0.06)
        tone(ac, t + 0.15, 523, 0.16, 'square', 0.06)
        break
      case 'boat':
        tone(ac, t, 196, 0.6, 'triangle', 0.12, 185)
        break
      case 'plane':
        tone(ac, t, 140, 1.1, 'sawtooth', 0.03, 520)
        tone(ac, t, 280, 1.1, 'sine', 0.05, 900)
        break
      case 'splash':
        tone(ac, t, 900, 0.18, 'sine', 0.06, 200)
        break
      case 'right':
        tone(ac, t, 784, 0.12, 'triangle', 0.14)
        tone(ac, t + 0.1, 1175, 0.18, 'triangle', 0.14)
        break
      case 'open':
        ;[523, 659, 784, 1047].forEach((f, i) => tone(ac, t + i * 0.08, f, 0.22, 'triangle', 0.13))
        break
      case 'chest':
        ;[392, 523, 659, 784, 1047, 1319].forEach((f, i) =>
          tone(ac, t + i * 0.07, f, 0.3, i % 2 ? 'square' : 'triangle', 0.08)
        )
        break
    }
  } catch {
    // Không có thiết bị âm thanh: bỏ qua, game vẫn chạy
  }
}
