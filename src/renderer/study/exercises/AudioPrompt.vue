<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTts } from '@renderer/shared/composables/useTts'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Hai nút nghe: bình thường và chậm. Dùng cho mọi bài tập có âm thanh (nghe chọn, nghe chép, nghe chọn hình).
defineProps<{ text: string }>()

const { t } = useI18n()
const { speak } = useTts()
</script>

<template>
  <div class="play">
    <button type="button" class="btn" @click="speak(text, undefined, 0.9)">
      <UiIcon name="volume" /> {{ t('study.lessons.play') }}
    </button>
    <button type="button" class="btn" @click="speak(text, undefined, 0.6)">
      <UiIcon name="slow" /> {{ t('study.lessons.slow') }}
    </button>
  </div>
</template>

<style scoped>
.play {
  display: flex;
  gap: 8px;
}
</style>
