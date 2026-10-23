<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PetState } from '@shared/schemas/pet'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import PxBar from '@renderer/shared/components/PxBar.vue'
import { Coins } from 'lucide-vue-next'
import type { Bubble } from '../composables/useBubble'
import QuizCard from './QuizCard.vue'

const props = defineProps<{ bubble: Bubble; pet: PetState | null }>()
const emit = defineEmits<{ dismiss: []; quizResult: [correct: boolean] }>()

/** Bấm vào bong bóng thoại/chỉ số để đóng; thẻ hỏi ôn có nút riêng */
function onClick(): void {
  if (props.bubble.kind !== 'quiz') emit('dismiss')
}
const { t } = useI18n()

const root = ref<HTMLElement>()
/** Độ lệch ngang để bong bóng không bị cắt khi mascot đứng sát mép màn hình */
const shift = ref(0)

async function keepOnScreen(): Promise<void> {
  shift.value = 0
  await nextTick()
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const scr = window.screen as Screen & { availLeft?: number }
  const screenLeft = scr.availLeft ?? 0
  const left = window.screenX + rect.left
  const right = left + rect.width
  const margin = 6
  if (left < screenLeft + margin) shift.value = screenLeft + margin - left
  else if (right > screenLeft + scr.availWidth - margin)
    shift.value = screenLeft + scr.availWidth - margin - right
}

watch(() => props.bubble.id, keepOnScreen, { immediate: true })
</script>

<template>
  <div
    ref="root"
    class="bubble modern"
    :style="{ transform: `translateX(${shift}px)` }"
    :class="{ interactive: bubble.kind === 'quiz' }"
    @click="onClick"
  >
    <PxPanel>
      <p v-if="bubble.kind === 'say'" class="text">{{ bubble.text }}</p>
      <QuizCard
        v-else-if="bubble.kind === 'quiz' && bubble.quiz"
        :key="bubble.id"
        :quiz="bubble.quiz"
        @done="emit('dismiss')"
        @result="(ok: boolean) => emit('quizResult', ok)"
      />
      <div v-else-if="pet" class="stats">
        <div class="head">
          <strong>{{ pet.name }}</strong>
          <span class="chip chip--primary">{{ t('stats.level', { level: pet.level }) }}</span>
        </div>
        <PxBar :value="pet.xpInLevel" :max="pet.xpForNext" color="var(--c-xp)" label="XP" />
        <div v-for="stat in ['hunger', 'mood', 'energy'] as const" :key="stat" class="row">
          <span class="label">{{ t(`stats.${stat}`) }}</span>
          <PxBar
            :value="pet[stat]"
            :color="pet[stat] < 30 ? 'var(--c-danger)' : 'var(--c-success)'"
            :label="t(`stats.${stat}`)"
          />
        </div>
        <div class="coins">
          <Coins :size="14" :stroke-width="2.2" />
          {{ t('stats.coins', { coins: pet.coins }) }}
        </div>
      </div>
    </PxPanel>
    <div class="tail" :style="{ transform: `translateX(${-shift}px)` }" />
  </div>
</template>

<style scoped>
.bubble {
  position: relative;
  max-width: 240px;
  margin-bottom: 12px;
  cursor: pointer;
  filter: drop-shadow(0 6px 12px rgb(0 0 0 / 28%));
}
.bubble.interactive {
  cursor: default;
}
/* Khung nổi bật trên mọi nền: bóng đổ do filter, bỏ bóng của PxPanel để khỏi bị cắt ở mép cửa sổ */
.bubble :deep(.px-panel) {
  padding: var(--sp-3) var(--sp-4);
  box-shadow: none;
}
.text {
  margin: 0;
  font-size: var(--fs-md);
  line-height: 1.4;
  white-space: pre-line;
}
.stats {
  display: grid;
  gap: 6px;
  min-width: 180px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-2);
}
.row {
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: center;
  gap: 6px;
}
.label {
  font-size: var(--fs-xs);
  color: var(--c-ink-soft);
}
.coins {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: #8a5a00;
}
.coins :deep(svg) {
  color: var(--c-coin);
}
/* Đuôi bong bóng chỉ xuống nhân vật */
.tail {
  position: absolute;
  left: 50%;
  bottom: -8px;
  width: 0;
  height: 0;
  margin-left: -7px;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 9px solid var(--c-surface);
}
</style>
