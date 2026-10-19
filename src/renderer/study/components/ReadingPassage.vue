<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LEVEL_CODES, levelIndex } from '@shared/schemas/content/level'
import type { DictEntry } from '@shared/schemas/dictionary'
import { splitSentences } from '@shared/sentences'
import { invoke } from '@renderer/shared/ipc'
import { useSettingsStore } from '@renderer/shared/stores/settings'
import { useTts } from '@renderer/shared/composables/useTts'
import PxPanel from '@renderer/shared/components/PxPanel.vue'

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

const WORD = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g

function pieces(sentence: string): Piece[] {
  const out: Piece[] = []
  let last = 0
  for (const m of sentence.matchAll(WORD)) {
    if (m.index > last) out.push({ text: sentence.slice(last, m.index), word: false })
    out.push({ text: m[0], word: true })
    last = m.index + m[0].length
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
  <PxPanel class="passage">
    <header class="head">
      <h2 v-if="title">{{ title }}</h2>
      <div class="tools">
        <button
          type="button"
          class="tool"
          @click="speak(paragraphs.map((p) => p.en).join(' '), undefined, 0.85)"
        >
          🔊 {{ t('study.reading.listenAll') }}
        </button>
        <button v-if="anyVi" type="button" class="tool" @click="toggleAllVi">
          🇻🇳 {{ t('study.reading.toggleVi') }}
        </button>
      </div>
    </header>
    <p class="hint">{{ t('study.reading.hint') }}</p>

    <div v-for="(p, i) in parsed" :key="i" class="para">
      <p class="en">
        <span v-for="(s, si) in p.sentences" :key="si" class="sentence">
          <button
            type="button"
            class="say"
            :title="t('study.reading.listenSentence')"
            @click="speak(s.text, undefined, 0.85)"
          >
            🔊
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
        <button type="button" class="vi-toggle" @click="toggleVi(i)">
          {{ showVi[i] ? t('study.reading.hideVi') : t('study.reading.showVi') }}
        </button>
        <p v-if="showVi[i]" class="vi">{{ p.vi }}</p>
      </template>
    </div>

    <p class="legend"><span class="word hard">abc</span> {{ t('study.reading.hardLegend') }}</p>

    <div v-if="entry || notFound" class="lookup">
      <template v-if="entry">
        <div class="line">
          <strong class="lemma">{{ entry.lemma }}</strong>
          <span class="level">{{ entry.level.replace('_', '.') }}</span>
          <span class="pos">{{ entry.pos.join(', ') }}</span>
          <span v-if="entry.ipaUs" class="ipa">{{ entry.ipaUs }}</span>
          <button type="button" class="say" @click="speak(entry.lemma, undefined, 0.9)">🔊</button>
        </div>
        <p class="meaning">
          {{ entry.vi.join('; ') || t('study.reading.noMeaning') }}
          <span v-if="entry.viGenerated" class="ai">AI</span>
        </p>
        <button type="button" class="save" :disabled="entry.saved" @click="save">
          {{ entry.saved ? `✓ ${t('study.reading.savedShort')}` : `💾 ${t('study.reading.save')}` }}
        </button>
      </template>
      <p v-else class="meaning">{{ t('study.reading.notFound', { word: looked }) }}</p>
      <span v-if="toast" class="toast">{{ toast }}</span>
    </div>
  </PxPanel>
</template>

<style scoped>
.passage {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
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
  font-size: 18px;
}
.tools {
  display: flex;
  gap: 6px;
}
.tool,
.vi-toggle {
  padding: 3px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
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
.say {
  margin-right: 2px;
  padding: 0 2px;
  border: none;
  background: transparent;
  font-size: 11px;
  opacity: 0.45;
  cursor: pointer;
}
.say:hover {
  opacity: 1;
}
.word {
  padding: 0;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.word:hover {
  background: #eef3ff;
}
.word.hard {
  border-bottom: 2px dotted var(--c-warning);
}
.word.active {
  background: #fff3a0;
}
.vi-toggle {
  justify-self: start;
}
.vi {
  margin: 0;
  padding: 6px 10px;
  color: var(--c-ink-soft);
  background: #fff8dc;
  border-left: 3px solid var(--c-primary);
}
.lookup {
  position: sticky;
  bottom: 8px;
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  background: var(--c-surface);
  border: var(--px) solid var(--c-border);
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
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
.level {
  padding: 0 4px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
  border: 1px solid var(--c-border);
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
  padding: 0 4px;
  font-size: 10px;
  background: var(--c-warning);
  border: 1px solid var(--c-border);
}
.save {
  justify-self: start;
  padding: 3px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-success);
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.save:disabled {
  background: var(--c-surface);
  color: var(--c-ink-soft);
  cursor: default;
}
.toast {
  font-size: 12px;
  color: var(--c-ink-soft);
}
</style>
