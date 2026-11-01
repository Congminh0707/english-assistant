<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LEVEL_CODES, levelIndex } from '@shared/schemas/content/level'
import type { DictEntry } from '@shared/schemas/dictionary'
import { splitSentences } from '@shared/sentences'
import { invoke } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { useTts } from '@renderer/shared/composables/useTts'
import { Languages } from 'lucide-vue-next'
import UiIcon from '@renderer/shared/components/UiIcon.vue'
import { tokenizeWords } from '@shared/properNouns'

// Trình đọc tương tác (docs/07-learning-modules.md#5): bấm từ để tra, từ trên level được gạch chân,
// nghe từng câu hoặc cả đoạn, bật/tắt bản dịch tiếng Việt từng đoạn, lưu từ kèm câu ngữ cảnh.
const props = defineProps<{
  title?: string
  paragraphs: Array<{ en: string; vi?: string }>
}>()

const { t } = useI18n()
const settings = useSettingsStore()
const { speak } = useTts()

/** Mảnh văn bản: từ (bấm được) hoặc dấu câu/khoảng trắng */
interface Piece {
  text: string
  word: boolean
}
interface Sentence {
  text: string
  pieces: Piece[]
}

/** Tên riêng/từ viết tắt (xem shared/properNouns.ts) hiện như chữ thường, không bấm tra/lưu được */
function pieces(sentence: string): Piece[] {
  const out: Piece[] = []
  let last = 0
  for (const w of tokenizeWords(sentence)) {
    if (w.index > last) out.push({ text: sentence.slice(last, w.index), word: false })
    out.push({ text: w.text, word: !w.proper })
    last = w.index + w.text.length
  }
  if (last < sentence.length) out.push({ text: sentence.slice(last), word: false })
  return out
}

const parsed = computed(() =>
  props.paragraphs.map((p) => ({
    sentences: splitSentences(p.en).map<Sentence>((text) => ({ text, pieces: pieces(text) })),
    vi: p.vi
  }))
)

const levels = ref<Record<string, string>>({})
const showVi = ref<boolean[]>(props.paragraphs.map(() => false))
const entry = ref<DictEntry | null>(null)
const context = ref('')
const looked = ref('')
const notFound = ref(false)
const toast = ref('')
let toastTimer = 0

const userLevel = computed(() => levelIndex(settings.settings['learning.level']))
const key = (w: string): string => w.toLowerCase().replace(/’/g, "'")

/** Từ khó hơn level hiện tại của người học → gạch chân chấm */
function isHard(word: string): boolean {
  const level = levels.value[key(word)]
  return !!level && LEVEL_CODES.indexOf(level as (typeof LEVEL_CODES)[number]) > userLevel.value
}

async function lookup(word: string, sentence: string): Promise<void> {
  looked.value = word
  context.value = sentence
  notFound.value = false
  try {
    const res = await invoke('dictionary:lookup', { text: word })
    entry.value = res.entries[0] ?? null
    notFound.value = !entry.value
    speak(entry.value?.lemma ?? word, undefined, 0.9)
  } catch (err) {
    console.warn('[reader] lookup failed', err)
    entry.value = null
    notFound.value = true
  }
}

async function save(): Promise<void> {
  const e = entry.value
  if (!e || e.saved) return
  try {
    await invoke('vocab:save', { contentId: e.id, text: e.lemma, context: context.value })
    e.saved = true
    toast.value = t('study.reading.saved')
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => (toast.value = ''), 1800)
  } catch (err) {
    console.warn('[reader] save failed', err)
  }
}

/** Các từ khó hơn level hiện tại (không trùng), kèm câu đầu tiên chứa từ đó làm ngữ cảnh */
const hardWords = computed(() => {
  const seen = new Map<string, string>()
  for (const p of parsed.value) {
    for (const s of p.sentences) {
      for (const piece of s.pieces) {
        if (piece.word && isHard(piece.text) && !seen.has(key(piece.text))) {
          seen.set(key(piece.text), s.text)
        }
      }
    }
  }
  return [...seen.entries()].map(([text, context]) => ({ text, context }))
})

/** Lưu các từ khó của bài vào sổ từ (tạo thẻ ôn) */
async function saveHard(): Promise<void> {
  if (!hardWords.value.length) return
  try {
    const res = await invoke('vocab:save-many', { items: hardWords.value.slice(0, 60) })
    toast.value = t('study.reading.savedMany', res)
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => (toast.value = ''), 3500)
  } catch (err) {
    console.warn('[reader] save many failed', err)
  }
}

function toggleVi(i: number): void {
  showVi.value[i] = !showVi.value[i]
}

const anyVi = computed(() => props.paragraphs.some((p) => p.vi))
function toggleAllVi(): void {
  const next = !showVi.value.every(Boolean)
  showVi.value = props.paragraphs.map(() => next)
}

onMounted(async () => {
  const words = [
    ...new Set(
      parsed.value
        .flatMap((p) => p.sentences.flatMap((s) => s.pieces))
        .filter((x) => x.word)
        .map((x) => key(x.text))
    )
  ]
  try {
    levels.value = await invoke('dictionary:levels', { words })
  } catch (err) {
    console.warn('[reader] levels failed', err)
  }
})
</script>

<template>
  <div class="reader">
    <div class="card passage">
      <header class="head">
        <h2 v-if="title">{{ title }}</h2>
        <div class="tools">
          <button
            type="button"
            class="btn btn--sm"
            @click="speak(paragraphs.map((p) => p.en).join(' '), undefined, 0.85)"
          >
            <UiIcon name="volume" /> {{ t('study.reading.listenAll') }}
          </button>
          <button v-if="anyVi" type="button" class="btn btn--sm" @click="toggleAllVi">
            <Languages :size="16" :stroke-width="2.2" /> {{ t('study.reading.toggleVi') }}
          </button>
        </div>
      </header>
      <p class="hint">{{ t('study.reading.hint') }}</p>

      <div v-for="(p, i) in parsed" :key="i" class="para">
        <p class="en">
          <span v-for="(s, si) in p.sentences" :key="si" class="sentence">
            <button
              type="button"
              class="btn btn--sm btn--icon"
              :title="t('study.reading.listenSentence')"
              @click="speak(s.text, undefined, 0.85)"
            >
              <UiIcon name="volume" />
            </button>
            <template v-for="(piece, pi) in s.pieces" :key="pi">
              <button
                v-if="piece.word"
                type="button"
                class="word"
                :class="{ hard: isHard(piece.text), active: looked === piece.text && !!entry }"
                @click="lookup(piece.text, s.text)"
              >
                {{ piece.text }}
              </button>
              <template v-else>{{ piece.text }}</template>
            </template>
          </span>
        </p>
        <template v-if="p.vi">
          <button type="button" class="btn btn--xs vi-toggle" @click="toggleVi(i)">
            {{ showVi[i] ? t('study.reading.hideVi') : t('study.reading.showVi') }}
          </button>
          <p v-if="showVi[i]" class="vi">{{ p.vi }}</p>
        </template>
      </div>

      <p class="legend"><span class="word hard">abc</span> {{ t('study.reading.hardLegend') }}</p>
    </div>
    <aside class="side">
      <div v-if="entry || notFound" class="lookup">
        <template v-if="entry">
          <div class="line">
            <strong class="lemma">{{ entry.lemma }}</strong>
            <span class="chip chip--xp">{{ entry.level.replace('_', '.') }}</span>
            <span class="pos">{{ entry.pos.join(', ') }}</span>
            <span v-if="entry.ipaUs" class="ipa">{{ entry.ipaUs }}</span>
            <button
              type="button"
              class="btn btn--sm btn--icon"
              @click="speak(entry.lemma, undefined, 0.9)"
            >
              <UiIcon name="volume" />
            </button>
          </div>
          <p class="meaning">
            {{ entry.vi.join('; ') || t('study.reading.noMeaning') }}
            <span v-if="entry.viGenerated" class="ai">AI</span>
          </p>
          <button
            type="button"
            class="btn btn--primary btn--sm"
            :disabled="entry.saved"
            @click="save"
          >
            <UiIcon :name="entry.saved ? 'saved' : 'save'" />
            {{ entry.saved ? t('study.reading.savedShort') : t('study.reading.save') }}
          </button>
        </template>
        <p v-else class="meaning">{{ t('study.reading.notFound', { word: looked }) }}</p>
        <span v-if="toast" class="toast">{{ toast }}</span>
      </div>
      <button
        v-if="hardWords.length"
        type="button"
        class="btn btn--block"
        :title="t('study.reading.saveHardHint')"
        @click="saveHard"
      >
        <UiIcon name="save" /> {{ t('study.reading.saveHard', { n: hardWords.length }) }}
      </button>
    </aside>
  </div>
</template>

<style scoped>
.passage {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: var(--fs-lg);
}
.tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.hint,
.legend {
  margin: 0;
  font-size: 12px;
  color: var(--c-ink-soft);
}
.para {
  display: grid;
  gap: 4px;
}
.en {
  margin: 0;
  font-size: 18px;
  line-height: 1.9;
}
.sentence {
  margin-right: 4px;
}
.sentence .btn--icon {
  width: 24px;
  min-height: 24px;
  height: 24px;
  margin-right: var(--sp-1);
  padding: 0;
  vertical-align: middle;
}
.word {
  padding: 0;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  border-radius: var(--r-sm);
}
.word:hover {
  background: var(--c-primary-soft);
}
.word.hard {
  border-bottom: 2px dotted var(--c-warning);
}
.word.active {
  background: var(--c-warning-soft);
}
.vi-toggle {
  justify-self: start;
}
.vi {
  margin: 0;
  padding: 6px 10px;
  color: var(--c-ink-soft);
  background: var(--c-warning-soft);
  border-left: 3px solid var(--c-coin);
  border-radius: var(--r-sm);
}
.reader {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
  gap: var(--sp-4);
  align-items: start;
}
@media (max-width: 900px) {
  .reader {
    grid-template-columns: minmax(0, 1fr);
  }
}
.side {
  position: sticky;
  top: 0;
  display: grid;
  gap: var(--sp-3);
}
.lookup {
  display: grid;
  gap: 4px;
  padding: var(--sp-4);
  background: var(--c-surface);
  border: 2px solid var(--c-line);
  border-radius: var(--r-md);
}
.line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.lemma {
  font-size: 18px;
}
.pos,
.ipa {
  color: var(--c-ink-soft);
  font-size: 13px;
}
.meaning {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.ai {
  margin-left: 6px;
  padding: 0 6px;
  font-size: var(--fs-xs);
  color: var(--c-warning);
  background: var(--c-warning-soft);
  border-radius: var(--r-pill);
}
.toast {
  font-size: 12px;
  color: var(--c-ink-soft);
}
</style>
