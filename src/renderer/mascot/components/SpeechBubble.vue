<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PetState } from '@shared/schemas/pet'
import PxPanel from '@renderer/shared/components/PxPanel.vue'
import PxBar from '@renderer/shared/components/PxBar.vue'
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
    class="bubble"
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
          <span class="level">{{ t('stats.level', { level: pet.level }) }}</span>
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
        <div class="coins">🪙 {{ t('stats.coins', { coins: pet.coins }) }}</div>
      </div>
    </PxPanel>
    <div class="tail" :style="{ transform: `translateX(${-shift}px)` }" />
  </div>
</template>

<style scoped>
.bubble {
  position: relative;
  max-width: 240px;
  margin-bottom: 10px;
  cursor: pointer;
}
.bubble.interactive {
  cursor: default;
}
.text {
  margin: 0;
  white-space: pre-line;
}
.stats {
  display: grid;
  gap: 4px;
  min-width: 170px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.level {
  color: var(--c-xp);
  font-weight: 700;
}
.row {
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: center;
  gap: 6px;
}
.label {
  font-size: 12px;
  color: var(--c-ink-soft);
}
.coins {
  font-size: 12px;
}
/* Đuôi bong bóng chỉ xuống nhân vật */
.tail {
  position: absolute;
  left: 50%;
  bottom: -8px;
  width: 0;
  height: 0;
  margin-left: -6px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid var(--c-border);
}
</style>
