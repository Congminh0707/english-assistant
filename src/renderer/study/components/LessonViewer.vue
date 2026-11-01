<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Lesson } from '@shared/schemas/lesson'
import { useTts } from '@renderer/shared/composables/useTts'
import { ChevronLeft } from 'lucide-vue-next'
import { cefrLabel } from '@shared/placement'
import SpeakPractice from '@renderer/shared/components/SpeakPractice.vue'
import MdText from './MdText.vue'
import PicText from '@renderer/shared/components/PicText.vue'
import ListeningPlayer from './ListeningPlayer.vue'
import ReadingPassage from './ReadingPassage.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Đọc một bài: giải thích, bảng, ví dụ có nút nghe, lưới âm bấm nghe, mẹo.
const props = defineProps<{ lesson: Lesson }>()
defineEmits<{ start: []; back: [] }>()

const { t } = useI18n()
const { speak, prefetch } = useTts()

/** Khối ví dụ nằm cột phải (kèm nút làm bài); các khối còn lại ở cột chính, giữ chỉ số gốc */
const mainBlocks = computed(() =>
  props.lesson.blocks.map((block, i) => ({ block, i })).filter((x) => x.block.type !== 'examples')
)
const sideBlocks = computed(() =>
  props.lesson.blocks.map((block, i) => ({ block, i })).filter((x) => x.block.type === 'examples')
)

/** Ô âm đang luyện phát âm (bấm nút micro): chữ hiển thị và chuỗi để chấm */
const practicing = ref<{ block: number; label: string; text: string } | null>(null)

// Giọng tự nhiên: tạo trước âm thanh của ví dụ và lưới âm ở nền để bấm nghe là có ngay
onMounted(() => {
  const texts: string[] = []
  for (const block of props.lesson.blocks) {
    if (block.type === 'examples') texts.push(...block.items.map((i) => i.en))
    if (block.type === 'sounds') texts.push(...block.items.map((i) => i.say ?? i.text))
  }
  prefetch(texts.slice(0, 40), undefined, 0.9)
})
</script>

<template>
  <section class="viewer">
    <button type="button" class="back" @click="$emit('back')">
      <ChevronLeft :size="16" :stroke-width="2.4" /> {{ t('study.lessons.back') }}
    </button>
    <div class="title-row">
      <h1 class="page-title">{{ lesson.title }}</h1>
      <span class="chip chip--primary">{{ cefrLabel(lesson.level) }}</span>
      <span class="chip">{{ t('study.lessons.minutes', { n: lesson.minutes }) }}</span>
    </div>
    <p class="summary">{{ lesson.summary }}</p>

    <div class="cols" :class="{ single: !sideBlocks.length }">
      <div class="main">
        <template v-for="{ block, i } in mainBlocks" :key="i">
          <div v-if="block.type === 'text'" class="card block">
            <MdText :md="block.md" />
          </div>

          <div v-else-if="block.type === 'tip'" class="tip">
            <span class="tip-icon"><UiIcon name="hint" /></span>
            <MdText :md="block.md" />
          </div>

          <div v-else-if="block.type === 'table'" class="card block">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th v-for="(h, j) in block.head" :key="j">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, r) in block.rows" :key="r">
                    <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="block.type === 'sounds'" class="card block">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <div class="sounds">
              <div v-for="(item, j) in block.items" :key="j" class="sound-cell">
                <button
                  type="button"
                  class="sound"
                  @click="speak(item.say ?? item.text, undefined, 0.8)"
                >
                  <PicText class="sound-text" :text="item.text" :size="64" :with-label="true" />
                  <span v-if="item.ipa" class="sound-ipa">{{ item.ipa }}</span>
                  <span v-if="item.note" class="sound-note">{{ item.note }}</span>
                </button>
                <button
                  type="button"
                  class="btn btn--xs btn--icon btn--ghost sound-mic"
                  :title="t('speech.practiceSound')"
                  :aria-label="t('speech.practiceSound')"
                  @click="practicing = { block: i, label: item.text, text: item.say ?? item.text }"
                >
                  <UiIcon name="mic" />
                </button>
              </div>
            </div>
            <p class="hint">
              <UiIcon name="volume" /> {{ t('study.lessons.tapToHear') }} · <UiIcon name="mic" />
              {{ t('speech.practiceSound') }}
            </p>
            <div v-if="practicing && practicing.block === i" class="practice">
              <div class="practice-head">
                <strong>{{ practicing.label }}</strong>
                <button type="button" class="btn btn--ghost btn--sm" @click="practicing = null">
                  {{ t('speech.closePractice') }}
                </button>
              </div>
              <SpeakPractice
                :key="practicing.text"
                :expected="practicing.text"
                can-listen
                phonemes
                phoneme-only
              />
            </div>
          </div>

          <ListeningPlayer
            v-else-if="block.type === 'audio'"
            :title="block.title"
            :lines="block.lines"
            :hide-text="block.hideText"
          />

          <ReadingPassage
            v-else-if="block.type === 'passage'"
            :title="block.title"
            :paragraphs="block.paragraphs"
          />
        </template>
      </div>
      <aside class="side">
        <template v-for="{ block, i } in sideBlocks" :key="i">
          <div v-if="block.type === 'examples'" class="card block">
            <h2 v-if="block.title">{{ block.title }}</h2>
            <ul class="examples">
              <li v-for="(ex, j) in block.items" :key="j">
                <button
                  type="button"
                  class="btn btn--sm btn--icon"
                  :title="t('study.lessons.listen')"
                  @click="speak(ex.en, undefined, 0.9)"
                >
                  <UiIcon name="volume" />
                </button>
                <div>
                  <div class="en">{{ ex.en }}</div>
                  <div class="vi">{{ ex.vi }}</div>
                  <div v-if="ex.note" class="note">{{ ex.note }}</div>
                </div>
              </li>
            </ul>
          </div>
        </template>
        <div class="actions">
          <button type="button" class="btn btn--primary btn--block" @click="$emit('start')">
            <UiIcon name="pencil" />
            {{ t('study.lessons.startExercises', { n: lesson.exercises.length }) }}
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.viewer {
  display: grid;
  gap: var(--sp-2);
}
.back {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
}
.back:hover {
  color: var(--c-ink);
}
.title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-3);
}
.page-title {
  margin: 0;
}
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 340px);
  gap: var(--sp-4);
  align-items: start;
  margin-top: var(--sp-2);
}
.cols.single {
  grid-template-columns: minmax(0, 1fr);
}
.main,
.side {
  display: grid;
  gap: var(--sp-3);
  min-width: 0;
}
@media (max-width: 900px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }
}
h2 {
  margin: 0 0 8px;
  font-size: var(--fs-lg);
  color: var(--c-xp);
}
.summary {
  margin: 0;
  color: var(--c-ink-soft);
}
.block {
  padding: var(--sp-4);
}
.tip {
  display: flex;
  gap: 8px;
  padding: var(--sp-3) var(--sp-4);
  background: var(--c-warning-soft);
  color: var(--c-ink);
  border: 2px solid var(--c-coin);
  border-radius: var(--r-md);
}
.tip-icon {
  display: inline-flex;
  color: var(--c-warning);
}
.examples {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.examples li {
  display: flex;
  gap: 8px;
}
.en {
  font-weight: 700;
}
.vi {
  color: var(--c-ink-soft);
  font-size: 13px;
}
.note {
  font-size: 12px;
  color: var(--c-xp);
}
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--fs-md);
}
th,
td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--c-line);
  border-right: 1px solid var(--c-line);
}
th:last-child,
td:last-child {
  border-right: 0;
}
tbody tr:last-child td {
  border-bottom: 0;
}
th {
  background: var(--c-surface-2);
  font-weight: 700;
}
/* Mọi ô cùng một hàng cao bằng nhau; nút micro nằm trong thẻ, góc trên bên phải */
.sounds {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  grid-auto-rows: 1fr;
  gap: var(--sp-2);
}
.sound-cell {
  position: relative;
  display: flex;
}
.sound-mic {
  position: absolute;
  top: 6px;
  right: 6px;
  color: var(--c-ink-soft);
}
.practice {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--c-line);
  background: var(--c-bg);
  border-radius: var(--r-md);
}
.practice-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
}
.sound {
  display: grid;
  flex: 1;
  align-content: center;
  gap: 2px;
  justify-items: center;
  padding: 14px 6px 10px;
  border: 2px solid var(--c-line);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  cursor: pointer;
  border-radius: var(--r-md);
}
.sound:hover {
  background: var(--c-primary-soft);
}
.sound-text {
  font-size: 20px;
  font-weight: 700;
}
.sound-ipa {
  font-size: 13px;
  color: var(--c-xp);
}
.sound-note {
  font-size: 11px;
  color: var(--c-ink-soft);
}
.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--c-ink-soft);
}
.actions {
  display: flex;
  justify-content: stretch;
}
.cols.single .actions {
  justify-content: flex-end;
}
</style>
