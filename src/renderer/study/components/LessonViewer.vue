<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Lesson } from '@shared/schemas/lesson'
import { useTts } from '@renderer/shared/composables/useTts'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import SpeakPractice from '@renderer/shared/components/SpeakPractice.vue'
import MdText from './MdText.vue'
import PicText from '@renderer/shared/components/PicText.vue'
import ListeningPlayer from './ListeningPlayer.vue'
import ReadingPassage from './ReadingPassage.vue'

// Đọc một bài: giải thích, bảng, ví dụ có nút nghe, lưới âm bấm nghe, mẹo.
const props = defineProps<{ lesson: Lesson }>()
defineEmits<{ start: []; back: [] }>()

const { t } = useI18n()
const { speak, prefetch } = useTts()

/** Ô âm đang luyện phát âm (bấm 🎤): chữ hiển thị và chuỗi để chấm */
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
    <button type="button" class="link" @click="$emit('back')">
      ← {{ t('study.lessons.back') }}
    </button>
    <h1>{{ lesson.title }}</h1>
    <p class="summary">{{ lesson.summary }}</p>

    <template v-for="(block, i) in lesson.blocks" :key="i">
      <PxPanel v-if="block.type === 'text'" class="block">
        <MdText :md="block.md" />
      </PxPanel>

      <div v-else-if="block.type === 'tip'" class="tip">
        <span class="tip-icon">💡</span>
        <MdText :md="block.md" />
      </div>

      <PxPanel v-else-if="block.type === 'examples'" class="block">
        <h2 v-if="block.title">{{ block.title }}</h2>
        <ul class="examples">
          <li v-for="(ex, j) in block.items" :key="j">
            <button
              type="button"
              class="say"
              :title="t('study.lessons.listen')"
              @click="speak(ex.en, undefined, 0.9)"
            >
              🔊
            </button>
            <div>
              <div class="en">{{ ex.en }}</div>
              <div class="vi">{{ ex.vi }}</div>
              <div v-if="ex.note" class="note">{{ ex.note }}</div>
            </div>
          </li>
        </ul>
      </PxPanel>

      <PxPanel v-else-if="block.type === 'table'" class="block">
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
      </PxPanel>

      <PxPanel v-else-if="block.type === 'sounds'" class="block">
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
              class="sound-mic"
              :title="t('speech.practiceSound')"
              :aria-label="t('speech.practiceSound')"
              @click="practicing = { block: i, label: item.text, text: item.say ?? item.text }"
            >
              🎤
            </button>
          </div>
        </div>
        <p class="hint">
          🔊 {{ t('study.lessons.tapToHear') }} · 🎤 {{ t('speech.practiceSound') }}
        </p>
        <div v-if="practicing && practicing.block === i" class="practice">
          <div class="practice-head">
            <strong>{{ practicing.label }}</strong>
            <button type="button" class="link" @click="practicing = null">
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
      </PxPanel>

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

    <div class="actions">
      <button type="button" class="primary" @click="$emit('start')">
        ✏️ {{ t('study.lessons.startExercises', { n: lesson.exercises.length }) }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.viewer {
  display: grid;
  gap: 12px;
  max-width: 720px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: 22px;
}
h2 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--c-xp);
}
.summary {
  margin: 0;
  color: var(--c-ink-soft);
}
.link {
  justify-self: start;
  border: none;
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  cursor: pointer;
}
.block {
  padding: 14px 16px;
}
.tip {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fff8dc;
  border-left: 4px solid var(--c-warning);
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
.say {
  align-self: flex-start;
  padding: 2px 8px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  cursor: pointer;
}
.say:hover {
  background: #eef3ff;
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
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  padding: 5px 8px;
  text-align: left;
  border: 1px solid #cfc8b0;
}
th {
  background: #f1ecd8;
}
.sounds {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
}
.sound-cell {
  position: relative;
  display: grid;
}
.sound-mic {
  position: absolute;
  top: 2px;
  right: 2px;
  padding: 0 4px;
  border: 2px solid var(--c-border);
  background: var(--c-surface);
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
}
.sound-mic:hover {
  background: #e3f4e8;
}
.practice {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-bg);
}
.practice-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 18px;
}
.sound {
  display: grid;
  gap: 2px;
  justify-items: center;
  padding: 8px 4px;
  border: var(--px) solid var(--c-border);
  background: var(--c-bg);
  font: inherit;
  cursor: pointer;
}
.sound:hover {
  background: #eef3ff;
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
  justify-content: center;
  padding: 8px 0 16px;
}
.primary {
  padding: 12px 24px;
  border: var(--px) solid var(--c-border);
  background: var(--c-success);
  color: #fff;
  font: inherit;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
</style>
