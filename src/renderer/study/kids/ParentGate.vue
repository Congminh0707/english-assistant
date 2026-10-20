<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { invoke, IpcError } from '@renderer/shared/ipc'

// Cổng phụ huynh: bàn phím số to nhập PIN 4 số. Ba chế độ: nhập PIN để vào khu vực phụ huynh (enter), đặt PIN lần đầu
// hoặc đổi PIN (set), nhập PIN để cho bé dùng thêm giờ (extend). PIN chỉ là khoá chặn bé bấm nhầm, không phải bảo mật cao.
const props = defineProps<{
  mode: 'enter' | 'set' | 'extend'
  /** Đổi PIN: nhập PIN hiện tại trước */
  changing?: boolean
}>()
const emit = defineEmits<{ ok: []; close: [] }>()

const { t } = useI18n()

type Step = 'current' | 'new' | 'confirm' | 'verify'
const step = ref<Step>(props.mode === 'set' ? (props.changing ? 'current' : 'new') : 'verify')
const digits = ref('')
const firstPin = ref('')
const currentPin = ref('')
const message = ref('')
const retryAfter = ref(0)
const busy = ref(false)
let lockTimer = 0

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok']

const title = computed(() => {
  if (step.value === 'new') return t('kids.gate.newPin')
  if (step.value === 'confirm') return t('kids.gate.confirmPin')
  if (step.value === 'current') return t('kids.gate.currentPin')
  return props.mode === 'extend' ? t('kids.gate.extendTitle') : t('kids.gate.enterPin')
})

function press(key: string): void {
  if (busy.value || retryAfter.value > 0) return
  message.value = ''
  if (key === 'del') digits.value = digits.value.slice(0, -1)
  else if (key === 'ok') void submit()
  else if (digits.value.length < 4) {
    digits.value += key
    if (digits.value.length === 4) void submit()
  }
}

function fail(text: string): void {
  message.value = text
  digits.value = ''
}

async function submit(): Promise<void> {
  const pin = digits.value
  if (pin.length !== 4) return
  busy.value = true
  try {
    if (step.value === 'verify') {
      if (props.mode === 'extend') {
        await invoke('parent:extend', { pin, minutes: 10 })
        emit('ok')
      } else {
        const res = await invoke('parent:verify', { pin })
        if (res.ok) emit('ok')
        else if (res.retryAfterSeconds > 0) startLock(res.retryAfterSeconds)
        else fail(t('kids.gate.wrong'))
      }
    } else if (step.value === 'current') {
      currentPin.value = pin
      digits.value = ''
      step.value = 'new'
    } else if (step.value === 'new') {
      firstPin.value = pin
      digits.value = ''
      step.value = 'confirm'
    } else if (pin !== firstPin.value) {
      firstPin.value = ''
      step.value = 'new'
      fail(t('kids.gate.mismatch'))
    } else {
      await invoke('parent:set-pin', {
        pin,
        currentPin: props.changing ? currentPin.value : undefined
      })
      emit('ok')
    }
  } catch (err) {
    // PIN sai khi gia hạn / đổi PIN
    const key = err instanceof IpcError ? err.info.messageKey : 'errors.unknown'
    fail(t(key))
    if (props.changing && step.value === 'new') step.value = 'current'
  } finally {
    busy.value = false
    if (step.value === 'verify' && props.mode === 'extend' && !message.value) digits.value = ''
  }
}

function startLock(seconds: number): void {
  digits.value = ''
  retryAfter.value = seconds
  message.value = t('kids.gate.locked', { n: seconds })
  window.clearInterval(lockTimer)
  lockTimer = window.setInterval(() => {
    retryAfter.value--
    if (retryAfter.value <= 0) {
      window.clearInterval(lockTimer)
      message.value = ''
    } else message.value = t('kids.gate.locked', { n: retryAfter.value })
  }, 1000)
}

function onKeyDown(e: KeyboardEvent): void {
  if (/^[0-9]$/.test(e.key)) press(e.key)
  else if (e.key === 'Backspace') press('del')
  else if (e.key === 'Enter') press('ok')
  else if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.clearInterval(lockTimer)
})
</script>

<template>
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="gate">
      <h2>{{ title }}</h2>
      <p v-if="mode === 'set' && step === 'new' && !changing" class="muted">
        {{ t('kids.gate.setHint') }}
      </p>
      <div class="dots" aria-hidden="true">
        <span v-for="i in 4" :key="i" class="dot" :class="{ on: digits.length >= i }" />
      </div>
      <p class="msg" :class="{ show: message }">{{ message }}</p>
      <div class="pad">
        <button
          v-for="k in KEYS"
          :key="k"
          type="button"
          class="key"
          :class="{ action: k === 'del' || k === 'ok' }"
          :disabled="busy || retryAfter > 0"
          @click="press(k)"
        >
          {{ k === 'del' ? '⌫' : k === 'ok' ? '✓' : k }}
        </button>
      </div>
      <button type="button" class="cancel" @click="emit('close')">
        {{ t('kids.gate.cancel') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgb(30 27 46 / 70%);
}
.gate {
  display: grid;
  gap: 10px;
  justify-items: center;
  width: min(340px, 92vw);
  padding: 22px 24px;
  color: var(--c-ink);
  background: var(--c-bg);
  border: var(--px) solid var(--c-border);
  box-shadow: 6px 6px 0 0 var(--c-border);
}
h2 {
  margin: 0;
  font-size: 18px;
  text-align: center;
}
.muted {
  margin: 0;
  font-size: 13px;
  color: var(--c-ink-soft);
  text-align: center;
}
.dots {
  display: flex;
  gap: 14px;
}
.dot {
  width: 18px;
  height: 18px;
  border: var(--px) solid var(--c-border);
  border-radius: 50%;
  background: var(--c-surface);
}
.dot.on {
  background: var(--c-primary);
}
.msg {
  min-height: 1.4em;
  margin: 0;
  font-size: 13px;
  color: var(--c-danger);
  text-align: center;
}
.pad {
  display: grid;
  grid-template-columns: repeat(3, 76px);
  gap: 10px;
}
.key {
  height: 60px;
  border: var(--px) solid var(--c-border);
  background: var(--c-surface);
  font: inherit;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--px) var(--px) 0 0 var(--c-border);
}
.key:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}
.key.action {
  background: #eef3ff;
}
.key:disabled {
  opacity: 0.5;
  cursor: default;
}
.cancel {
  border: none;
  background: transparent;
  color: var(--c-ink-soft);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
</style>
