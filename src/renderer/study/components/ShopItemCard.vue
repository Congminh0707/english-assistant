<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ShopItem } from '@shared/schemas/shop'
import { Coins } from 'lucide-vue-next'
import ItemEmoji from '@renderer/shared/components/ItemEmoji.vue'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Thẻ một món đồ ăn/phụ kiện trong cửa hàng: ô hình ở trên, tên, giá, trạng thái, nút ở đáy (nút thẳng hàng giữa các thẻ).
const props = defineProps<{
  item: ShopItem
  name: string
  /** Đang chạy một thao tác cửa hàng: khoá mọi nút */
  busy: boolean
  canBuy: boolean
  /** Lý do chưa mua được (thiếu level / thiếu xu), rỗng nếu mua được */
  missing: string
  /** Đang thử món này trên hình xem trước */
  trying?: boolean
}>()
const emit = defineEmits<{ buy: []; wear: [] }>()
const { t } = useI18n()

const isAccessory = computed(() => props.item.kind === 'accessory')
/** Phụ kiện đã có thì nút là Đeo/Tháo; đồ ăn luôn mua thêm được */
const wearable = computed(() => isAccessory.value && props.item.owned > 0)
</script>

<template>
  <article class="card item" :class="{ locked: item.locked && item.owned === 0, trying }">
    <span class="art"><ItemEmoji :id="item.id" :emoji="item.emoji" :size="56" /></span>
    <div class="name">{{ name }}</div>
    <span class="chip price"><Coins :size="13" :stroke-width="2.4" />{{ item.price }}</span>
    <div class="note">
      <template v-if="isAccessory">
        <span v-if="item.owned > 0 && item.equipped" class="chip chip--success">
          {{ t('shop.wearing') }}
        </span>
        <span v-else-if="item.owned > 0" class="chip chip--primary">{{ t('shop.ownedOne') }}</span>
      </template>
      <span v-else-if="item.owned > 0" class="chip chip--primary">
        {{ t('shop.owned', { n: item.owned }) }}
      </span>
      <span v-if="!wearable && missing" class="miss">
        <UiIcon v-if="item.locked" name="lock" :size="12" />{{ missing }}
      </span>
    </div>
    <button
      v-if="wearable"
      type="button"
      class="btn btn--sm btn--block act"
      :disabled="busy"
      @click="emit('wear')"
    >
      {{ item.equipped ? t('shop.unwear') : t('shop.wear') }}
    </button>
    <button
      v-else
      type="button"
      class="btn btn--sm btn--block act"
      :disabled="busy || !canBuy"
      @click="emit('buy')"
    >
      {{ t('shop.buy') }}
    </button>
  </article>
</template>

<style scoped>
/* Thẻ cột dọc cùng chiều cao trong lưới; dòng ghi chú chừa chỗ cố định, nút nằm đáy */
.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  text-align: center;
  transition: border-color 0.15s ease;
}
.item.locked .art,
.item.locked .name {
  opacity: 0.6;
}
.item.trying {
  border-color: var(--c-primary);
}
.art {
  display: grid;
  place-items: center;
  width: 100%;
  height: 80px;
  border-radius: var(--r-md);
  background: var(--c-surface-2);
}
.name {
  font-weight: 700;
  line-height: 1.3;
}
.price {
  font-variant-numeric: tabular-nums;
}
.price :deep(svg) {
  color: var(--c-coin);
}
.note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  min-height: 24px;
}
.miss {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  color: var(--c-ink-soft);
  font-size: var(--fs-xs);
}
.act {
  margin-top: auto;
}
@media (prefers-reduced-motion: reduce) {
  .item {
    transition: none;
  }
}
</style>
