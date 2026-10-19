<script setup lang="ts">
import { computed } from 'vue'
import { parseMd } from '../lessonText'

// Hiển thị văn bản bài học (đoạn, danh sách, đậm, cụm tiếng Anh) mà không dùng v-html.
const props = defineProps<{ md: string }>()
const blocks = computed(() => parseMd(props.md))
</script>

<template>
  <div class="md">
    <template v-for="(b, i) in blocks" :key="i">
      <p v-if="b.kind === 'p'">
        <template v-for="(s, j) in b.inline" :key="j">
          <strong v-if="s.kind === 'bold'">{{ s.text }}</strong>
          <code v-else-if="s.kind === 'code'">{{ s.text }}</code>
          <template v-else>{{ s.text }}</template>
        </template>
      </p>
      <ul v-else>
        <li v-for="(item, k) in b.items" :key="k">
          <template v-for="(s, j) in item" :key="j">
            <strong v-if="s.kind === 'bold'">{{ s.text }}</strong>
            <code v-else-if="s.kind === 'code'">{{ s.text }}</code>
            <template v-else>{{ s.text }}</template>
          </template>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.md p {
  margin: 0 0 8px;
  line-height: 1.55;
}
.md p:last-child,
.md ul:last-child {
  margin-bottom: 0;
}
.md ul {
  margin: 0 0 8px;
  padding-left: 20px;
  line-height: 1.55;
}
code {
  padding: 0 4px;
  font-family: inherit;
  font-weight: 700;
  color: var(--c-xp);
  background: #f1ecff;
}
</style>
