<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { invoke, IpcError } from '@renderer/shared/ipc'
import UiIcon from '@renderer/shared/components/UiIcon.vue'

// Cổng phụ huynh: bàn phím số to nhập PIN 4 số. Ba chế độ: nhập PIN để vào khu vực phụ huynh (enter), đặt PIN lần đầu
// hoặc đổi PIN (set), nhập PIN để cho bé dùng thêm giờ (extend). PIN chỉ là khoá chặn bé bấm nhầm, không phải bảo mật cao.
const props = defineProps<{
  mode: 'enter' | 'set' | 'extend'
  /** Đổi PIN: nhập PIN hiện tại trước */
  changing?: boolean
}>()
const emit = defineEmits<{ ok: []; close: [] }>()

const { t } = useI18n()

type Step = 'current' | 'new' | 'confirm' | 'verify' | 'forgot'
const step = ref<Step>(props.mode === 'set' ? (props.changing ? 'current' : 'new') : 'verify')
const digits = ref('')
const firstPin = ref('')
const currentPin = ref('')
const message = ref('')
const retryAfter = ref(0)
/** Quên PIN: phép nhân phải giải để đặt lại */
const forgot = ref<{ id: string; a: number; b: number } | null>(null)
const busy = ref(false)
let lockTimer = 0

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok']

const title = computed(() => {
  if (step.value === 'forgot') return t('kids.gate.forgotTitle')
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
  else if (step.value === 'forgot') {
    if (digits.value.length < 4) digits.value += key // đáp án có thể 2–3 chữ số: bấm ✓ để gửi
  } else if (digits.value.length < 4) {
    digits.value += key
    if (digits.value.length === 4) void submit()
  }
}

function fail(text: string): void {
  message.value = text
  digits.value = ''
}

async function startForgot(): Promise<void> {
  forgot.value = await invoke('parent:forgot')
  digits.value = ''
  message.value = ''
  step.value = 'forgot'
}

async function submitForgot(): Promise<void> {
  if (!forgot.value || !digits.value) return
  busy.value = true
  try {
    const res = await invoke('parent:reset', { id: forgot.value.id, answer: Number(digits.value) })
    if (res.ok) {
      // PIN cũ đã bị xoá → đặt PIN mới (không cần PIN hiện tại)
      forgot.value = null
      digits.value = ''
      step.value = 'new'
      message.value = t('kids.gate.resetOk')
    } else if (res.retryAfterSeconds > 0) {
      startLock(res.retryAfterSeconds)
    } else {
      fail(t('kids.gate.forgotWrong'))
      forgot.value = await invoke('parent:forgot') // mỗi câu hỏi chỉ trả lời một lần
    }
  } finally {
    busy.value = false
  }
}

async function submit(): Promise<void> {
  if (step.value === 'forgot') return submitForgot()
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
  <div class="overlay" role="dialog" aria-modal="true" :aria-label="title">
    <div class="gate" :class="{ confirm: step === 'confirm', bad: !!message && retryAfter === 0 }">
      <div class="info">
        <UiIcon name="lock" :size="40" class="lock" />
        <h2>{{ title }}</h2>
        <p v-if="mode === 'set' && step === 'new' && !changing" class="muted">
          {{ t('kids.gate.setHint') }}
        </p>
        <p v-if="step === 'forgot' && forgot" class="question">
          {{ forgot.a }} × {{ forgot.b }} = ?
        </p>
        <div v-if="step !== 'forgot'" class="dots" aria-hidden="true">
          <span v-for="i in 4" :key="i" class="dot" :class="{ on: digits.length >= i }" />
        </div>
        <p v-else class="answer">{{ digits || '…' }}</p>
        <p class="msg" :class="{ show: message }" role="status">{{ message }}</p>
        <div class="actions">
          <button
            v-if="step === 'verify' && mode !== 'extend'"
            type="button"
            class="k-ghost"
            @click="startForgot"
          >
            {{ t('kids.gate.forgot') }}
          </button>
          <button type="button" class="k-ghost" @click="emit('close')">
            {{ t('kids.gate.cancel') }}
          </button>
        </div>
      </div>
      <div class="pad">
        <button
          v-for="k in KEYS"
          :key="k"
          type="button"
          class="key"
          :class="{ action: k === 'del' || k === 'ok' }"
          :disabled="busy || retryAfter > 0"
          :aria-label="k === 'del' ? t('kids.gate.delete') : k === 'ok' ? t('kids.gate.ok') : k"
          @click="press(k)"
        >
          <UiIcon v-if="k === 'del'" name="backspace" :size="28" />
          <UiIcon v-else-if="k === 'ok'" name="check" :size="28" />
          <template v-else>{{ k }}</template>
        </button>
      </div>
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
  font-family: var(--font-kids);
}
.gate {
  --gate-color: var(--c-xp);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--sp-6);
  align-items: center;
  width: min(840px, 94vw);
  padding: var(--sp-6) var(--sp-7);
  color: var(--c-ink);
  background: var(--c-bg);
  border: 4px solid var(--c-ink);
  box-shadow: 0 8px 0 var(--c-ink);
  border-radius: var(--r-lg);
}
.gate.confirm {
  --gate-color: var(--c-primary);
}
.info {
  display: grid;
  gap: var(--sp-3);
  justify-items: center;
}
.lock {
  color: var(--gate-color);
}
.gate.bad .lock {
  color: var(--c-danger);
}
h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.15;
  text-align: center;
}
.muted {
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  color: var(--c-ink-soft);
  text-align: center;
}
.dots {
  display: flex;
  gap: var(--sp-4);
}
.dot {
  width: 24px;
  height: 24px;
  border: 3px solid var(--c-ink);
  border-radius: var(--r-pill);
  background: var(--c-surface);
}
.dot.on {
  background: var(--gate-color);
}
.question {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
}
.answer {
  min-width: 110px;
  margin: 0;
  padding: var(--sp-1) var(--sp-4);
  font-size: 34px;
  font-weight: 800;
  text-align: center;
  color: var(--c-xp);
  border-bottom: 4px solid var(--c-ink);
}
.msg {
  min-height: 1.4em;
  margin: 0;
  font-family: var(--font-ui);
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--c-danger);
  text-align: center;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-3);
}
.pad {
  display: grid;
  grid-template-columns: repeat(3, 84px);
  gap: var(--sp-3);
}
.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  padding: 0;
  border: 3px solid var(--c-ink);
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-size: 32px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--c-ink);
}
.key:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--c-ink);
}
.key.action {
  background: var(--c-xp-soft);
  color: var(--c-xp);
}
.gate.confirm .key.action {
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.gate.bad .key.action {
  background: var(--c-danger-soft);
  color: var(--c-danger);
}
.key:disabled {
  opacity: 0.5;
  cursor: default;
}
@media (max-width: 700px) {
  .gate {
    grid-template-columns: 1fr;
    justify-items: center;
  }
}
</style>
