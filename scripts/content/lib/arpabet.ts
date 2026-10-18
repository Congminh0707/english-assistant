// ARPAbet (CMUdict) → IPA kiểu General American, có dấu nhấn ˈ/ˌ đặt đầu âm tiết.

const VOWELS: Record<string, string> = {
  AA: 'ɑ',
  AE: 'æ',
  AH: 'ʌ',
  AO: 'ɔ',
  AW: 'aʊ',
  AY: 'aɪ',
  EH: 'ɛ',
  ER: 'ɝ',
  EY: 'eɪ',
  IH: 'ɪ',
  IY: 'i',
  OW: 'oʊ',
  OY: 'ɔɪ',
  UH: 'ʊ',
  UW: 'u'
}

const CONSONANTS: Record<string, string> = {
  B: 'b',
  CH: 'tʃ',
  D: 'd',
  DH: 'ð',
  F: 'f',
  G: 'ɡ',
  HH: 'h',
  JH: 'dʒ',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  NG: 'ŋ',
  P: 'p',
  R: 'ɹ',
  S: 's',
  SH: 'ʃ',
  T: 't',
  TH: 'θ',
  V: 'v',
  W: 'w',
  Y: 'j',
  Z: 'z',
  ZH: 'ʒ'
}

// Phụ âm đầu hợp lệ trong tiếng Anh — để đặt dấu nhấn đúng chỗ (nguyên tắc maximal onset)
const ONSETS = new Set(
  [
    'P L',
    'B L',
    'K L',
    'G L',
    'F L',
    'S L',
    'P R',
    'B R',
    'T R',
    'D R',
    'K R',
    'G R',
    'F R',
    'TH R',
    'SH R',
    'T W',
    'D W',
    'K W',
    'G W',
    'S W',
    'TH W',
    'S P',
    'S T',
    'S K',
    'S M',
    'S N',
    'S F',
    'S P L',
    'S P R',
    'S T R',
    'S K R',
    'S K W',
    'S K L',
    'P Y',
    'B Y',
    'K Y',
    'G Y',
    'M Y',
    'F Y',
    'V Y',
    'HH Y',
    'S K Y',
    'S P Y'
  ].concat(Object.keys(CONSONANTS).filter((c) => c !== 'NG'))
)

interface Phone {
  base: string
  stress: number | null
}

export function arpabetToIpa(arpabet: string): string {
  const phones: Phone[] = arpabet
    .trim()
    .split(/\s+/)
    .map((p) => {
      const m = /^([A-Z]+)([012])?$/.exec(p)
      if (!m) throw new Error(`Bad ARPAbet phone "${p}"`)
      return { base: m[1], stress: m[2] === undefined ? null : Number(m[2]) }
    })

  // Vị trí bắt đầu âm tiết của từng nguyên âm có nhấn
  const marks = new Map<number, string>()
  let prevVowel = -1
  phones.forEach((ph, i) => {
    if (ph.stress === null) return
    if (ph.stress > 0) {
      let start = i
      for (let j = prevVowel + 1; j < i; j++) {
        const cluster = phones
          .slice(j, i)
          .map((p) => p.base)
          .join(' ')
        if (ONSETS.has(cluster)) {
          start = j
          break
        }
      }
      // Từ một âm tiết: không cần dấu nhấn
      marks.set(start, ph.stress === 1 ? 'ˈ' : 'ˌ')
    }
    prevVowel = i
  })
  const vowelCount = phones.filter((p) => p.stress !== null).length

  let out = ''
  phones.forEach((ph, i) => {
    if (vowelCount > 1 && marks.has(i)) out += marks.get(i)
    if (ph.stress !== null) {
      if (ph.base === 'AH' && ph.stress === 0) out += 'ə'
      else if (ph.base === 'ER' && ph.stress === 0) out += 'ɚ'
      else out += VOWELS[ph.base] ?? ''
    } else {
      out += CONSONANTS[ph.base] ?? ''
    }
  })
  return `/${out}/`
}
