<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { KidsWorldView } from '@shared/schemas/kidsWorld'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Tiến độ một nơi (docs/19 §5.5): số sao, thanh từ đã học, từng từ đã học / đang học / chưa học.
// Dùng ở màn giới thiệu trước khi vào và ở góc cảnh bên trong.
const props = defineProps<{ place: KidsWorldView['tiers'][number]['places'][number] }>()
const { t } = useI18n()

type Status = 'done' | 'learning' | 'todo'
const words = computed(() =>
  props.place.words.map((w) => ({
    ...w,
    status: (w.done ? 'done' : w.stage === 'hidden' ? 'todo' : 'learning') as Status
  }))
)
const done = computed(() => words.value.filter((w) => w.status === 'done').length)
const total = computed(() => words.value.length)
const left = computed(() => total.value - done.value)
</script>

<template>
  <div class="prog">
    <div class="head">
      <strong>{{ t('kids.game.progress.learned', { done, total }) }}</strong>
      <span class="stars" :title="t('kids.game.progress.stars', { n: place.stars })">
        <UiIcon v-for="n in 3" :key="n" name="star" :size="26" :class="{ lit: n <= place.stars }" />
      </span>
    </div>
    <div
      class="bar"
      role="progressbar"
      :aria-valuenow="done"
      aria-valuemin="0"
      :aria-valuemax="total"
    >
      <i :style="{ width: `${(done / Math.max(1, total)) * 100}%` }" />
    </div>
    <p class="note">
      {{
        left === 0
          ? t('kids.game.progress.all')
          : place.stars === 0
            ? `${t('kids.game.progress.next', { n: left })} · ${t('kids.game.progress.noStars')}`
            : t('kids.game.progress.next', { n: left })
      }}
    </p>
    <ul class="chips">
      <li v-for="w in words" :key="w.pictureId" :class="w.status">
        <UiIcon
          :name="w.status === 'done' ? 'check' : w.status === 'learning' ? 'flower' : 'dot'"
          :size="18"
        />
        {{ w.word }}
      </li>
    </ul>
    <p class="legend">
      <span class="done"><UiIcon name="check" :size="16" />{{ t('kids.game.progress.done') }}</span>
      <span class="learning"
        ><UiIcon name="flower" :size="16" />{{ t('kids.game.progress.learning') }}</span
      >
      <span class="todo"><UiIcon name="dot" :size="16" />{{ t('kids.game.progress.todo') }}</span>
    </p>
  </div>
</template>

<style scoped>
.prog {
  display: grid;
  gap: 8px;
  font-family: var(--font-kids);
  color: #3a2413;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 22px;
}
.stars {
  display: inline-flex;
  gap: 2px;
  color: #d9c9a6;
}
.stars .lit {
  color: #f7b91a;
  fill: currentcolor;
}
.bar {
  height: 16px;
  overflow: hidden;
  border: 3px solid #e7c98e;
  border-radius: 999px;
  background: #fff;
}
.bar i {
  display: block;
  height: 100%;
  background: #0b7a52;
  transition: width 400ms ease;
}
.note {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #6b3e1e;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.chips li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px 3px 8px;
  border: 3px solid #e7c98e;
  border-radius: 999px;
  background: #fff;
  font-size: 18px;
  font-weight: 700;
}
.chips li.done {
  border-color: #0b7a52;
  background: #e2f6ea;
  color: #0b7a52;
}
.chips li.learning {
  border-color: #f7b91a;
  background: #fff3cf;
  color: #8a5a00;
}
.chips li.todo {
  color: #8c7a63;
  border-style: dashed;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.legend .done {
  color: #0b7a52;
}
.legend .learning {
  color: #8a5a00;
}
.legend .todo {
  color: #8c7a63;
}
</style>
