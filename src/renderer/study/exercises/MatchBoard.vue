<script setup lang="ts">
import { ref } from 'vue'
import PicText from '@renderer/shared/components/PicText.vue'

// Ghép cặp: chọn một mục bên trái rồi một mục bên phải để nối; một mục bên phải chỉ nối với một mục bên trái.
// `modelValue[i]` là vị trí (trong `right` đang hiển thị) mà mục trái thứ i được nối, hoặc null. Mục có thể là emoji/id hình.
const props = defineProps<{
  left: string[]
  right: string[]
  modelValue: Array<number | null>
  locked?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Array<number | null>] }>()

const selectedLeft = ref<number | null>(null)

function selectLeft(i: number): void {
  if (props.locked) return
  selectedLeft.value = selectedLeft.value === i ? null : i
}

function selectRight(pos: number): void {
  const i = selectedLeft.value
  if (props.locked || i === null) return
  // Một mục bên phải chỉ nối với một mục bên trái: gỡ nối cũ của nó
  const next = props.modelValue.map((m) => (m === pos ? null : m))
  next[i] = pos
  emit('update:modelValue', next)
  selectedLeft.value = null
}

const owner = (pos: number): number | null => {
  const i = props.modelValue.indexOf(pos)
  return i >= 0 ? i : null
}
</script>

<template>
  <div class="pairs">
    <div class="col">
      <button
        v-for="(l, i) in left"
        :key="i"
        type="button"
        class="pair"
        :class="{ active: selectedLeft === i, linked: modelValue[i] !== null }"
        :disabled="locked"
        @click="selectLeft(i)"
      >
        <PicText :text="l" :size="40" />
        <span v-if="modelValue[i] !== null" class="badge">{{ (modelValue[i] ?? 0) + 1 }}</span>
      </button>
    </div>
    <div class="col">
      <button
        v-for="(r, pos) in right"
        :key="pos"
        type="button"
        class="pair"
        :class="{ linked: owner(pos) !== null }"
        :disabled="locked"
        @click="selectRight(pos)"
      >
        <span class="num">{{ pos + 1 }}</span>
        <PicText :text="r" :size="40" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pairs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.col {
  display: grid;
  gap: 8px;
  align-content: start;
}
.pair {
  position: relative;
  padding: 8px 10px;
  border: var(--px) solid var(--c-border);
  background: var(--c-bg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.pair.active {
  background: var(--c-warning);
}
.pair.linked {
  background: #dff3e4;
}
.num {
  display: inline-block;
  width: 18px;
  font-weight: 700;
  opacity: 0.6;
}
.badge {
  position: absolute;
  top: 4px;
  right: 6px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--c-xp);
}
</style>
