<script setup lang="ts">
// Viết theo đề: ô viết + đếm từ so với yêu cầu min/max. Chỉ hiển thị; nộp/chấm do LessonExercises (qua store) lo.
// Khi đang chấm hoặc đã chấm thì khoá ô nhưng giữ nguyên chữ người học.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { WRITE_MAX_CHARS, writeLength } from '@shared/writing'

const props = withDefaults(
  defineProps<{
    modelValue: string
    minWords: number
    maxWords?: number
    locked?: boolean
    /** Giới hạn ký tự (mặc định WRITE_MAX_CHARS của bài học; viết tự do dùng FREE_WRITING_MAX_CHARS) */
    maxChars?: number
    /** Nhãn cho trình đọc màn hình (mặc định nhãn bài viết trong bài học) */
    label?: string
  }>(),
  { maxWords: undefined, maxChars: WRITE_MAX_CHARS, label: undefined }
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const { t } = useI18n()

const length = computed(() => writeLength(props.modelValue, props.minWords, props.maxWords))
</script>

<template>
  <div class="write">
    <textarea
      :value="modelValue"
      rows="6"
      :maxlength="maxChars"
      spellcheck="false"
      :disabled="locked"
      :placeholder="t('study.lessons.writing.placeholder')"
      :aria-label="label ?? t('study.lessons.writeHelp')"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p class="count" :class="{ warn: length.status === 'long' }" aria-live="polite">
      {{ t('study.lessons.writing.words', { n: length.words }, length.words) }}
      <template v-if="length.status === 'long' && maxWords !== undefined">
        · {{ t('study.lessons.writing.tooLong', { n: maxWords }) }}
      </template>
      <template v-else>
        · {{ t('study.lessons.writing.minWords', { n: minWords }) }}
        <template v-if="maxWords !== undefined">
          · {{ t('study.lessons.writing.maxWords', { n: maxWords }) }}
        </template>
      </template>
    </p>
  </div>
</template>

<style scoped>
.write {
  display: grid;
  gap: var(--sp-2);
}
textarea {
  width: 100%;
  min-height: 140px;
  resize: vertical;
  line-height: 1.5;
}
.count {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
}
.count.warn {
  color: var(--c-danger);
  font-weight: 700;
}
</style>
