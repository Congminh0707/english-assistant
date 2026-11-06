<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Play, X } from 'lucide-vue-next'
import type { VideoPlay, VideoResult, VideoSummary } from '@shared/schemas/video'
import { invoke } from '@renderer/shared/ipc'
import { useLeaveGuard } from '../leaveGuard'

// Thư viện video (docs/29 bước 3): nhúng YouTube qua eaplayer://, dừng ở mốc để hỏi; đáp án chấm ở main.
const { t } = useI18n()

type Phase = 'list' | 'watch' | 'result'
const phase = ref<Phase>('list')
useLeaveGuard(() => phase.value === 'watch')

const videos = ref<VideoSummary[]>([])
const play = ref<VideoPlay | null>(null)
const result = ref<VideoResult | null>(null)
const busy = ref(false)
const frame = ref<HTMLIFrameElement | null>(null)
const ready = ref(false)
const failed = ref(false)
const ended = ref(false)
const answers = ref<Array<number | null>>([])
/** Chỉ số câu hỏi đang hiện (null = đang xem video) */
const asking = ref<number | null>(null)
let done = 0

const LETTERS = ['A', 'B', 'C', 'D']
const src = computed(() => {
  const p = play.value
  if (!p) return ''
  const q = new URLSearchParams({ v: p.videoId })
  if (p.startSec) q.set('start', String(p.startSec))
  if (p.endSec) q.set('end', String(p.endSec))
  return `eaplayer://player/index.html?${q.toString()}`
})
const levelName = (level: string): string => level.replace('_', '.')
const current = computed(() =>
  play.value && asking.value !== null ? play.value.checkpoints[asking.value] : null
)

async function load(): Promise<void> {
  videos.value = await invoke('video:list')
}

async function open(id: string): Promise<void> {
  if (busy.value) return
  busy.value = true
  try {
    const p = await invoke('video:play', { id })
    play.value = p
    result.value = null
    answers.value = p.checkpoints.map(() => null)
    asking.value = null
    done = 0
    ready.value = false
    failed.value = false
    ended.value = false
    phase.value = 'watch'
  } finally {
    busy.value = false
  }
}

function command(type: 'play' | 'pause' | 'seek', t?: number): void {
  frame.value?.contentWindow?.postMessage({ target: 'ea-player', type, t }, '*')
}

/** Tới mốc của câu kế tiếp thì dừng video và hỏi */
function check(time: number): void {
  const p = play.value
  if (!p || asking.value !== null || done >= p.checkpoints.length) return
  const next = p.checkpoints[done]
  if (next.at !== 'end' && time >= next.at) ask()
}

function ask(): void {
  command('pause')
  asking.value = done
}

function choose(i: number): void {
  if (asking.value === null) return
  answers.value[asking.value] = i
  answers.value = [...answers.value]
}

async function next(): Promise<void> {
  const p = play.value
  if (!p || asking.value === null) return
  done++
  asking.value = null
  if (done >= p.checkpoints.length) return void finish()
  const after = p.checkpoints[done]
  // Mốc 'end' mà video đã hết thì hỏi luôn; ngược lại xem tiếp
  if (after.at === 'end' && ended.value) ask()
  else command('play')
}

async function finish(): Promise<void> {
  const p = play.value
  if (!p || busy.value) return
  busy.value = true
  try {
    result.value = await invoke('video:submit', { playId: p.playId, answers: answers.value })
    phase.value = 'result'
    void load()
  } finally {
    busy.value = false
  }
}

/** Không phát được (lỗi nhúng/mạng): cho làm thẳng các câu hỏi */
function skipToQuestions(): void {
  const p = play.value
  if (!p) return
  command('pause')
  if (asking.value === null && done < p.checkpoints.length) asking.value = done
}

function onMessage(e: MessageEvent): void {
  if (e.source !== frame.value?.contentWindow) return
  const m = e.data as { source?: string; type?: string; t?: number; state?: number }
  if (m?.source !== 'ea-player') return
  if (m.type === 'ready') ready.value = true
  else if (m.type === 'error') failed.value = true
  else if (m.type === 'time' && typeof m.t === 'number') check(m.t)
  else if (m.type === 'state' && m.state === 0) {
    ended.value = true
    // Video kết thúc: nếu còn câu hỏi 'end' thì hỏi
    const p = play.value
    if (p && asking.value === null && done < p.checkpoints.length) ask()
  }
}

function backToList(): void {
  play.value = null
  result.value = null
  phase.value = 'list'
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  void load()
})
onUnmounted(() => window.removeEventListener('message', onMessage))
</script>

<template>
  <section class="videos">
    <h1>{{ t('study.videos.title') }}</h1>

    <template v-if="phase === 'list'">
      <p class="muted">{{ t('study.videos.intro') }}</p>
      <p v-if="!videos.length" class="card box">{{ t('study.videos.empty') }}</p>
      <div class="grid">
        <button v-for="v in videos" :key="v.id" type="button" class="card item" @click="open(v.id)">
          <span class="icon"><Play :size="20" /></span>
          <strong>{{ v.title }}</strong>
          <span class="muted">{{ v.channel }}</span>
          <p>{{ v.summary }}</p>
          <span class="meta">
            <span class="chip">{{ levelName(v.level) }}</span>
            <span class="muted">{{ t('study.videos.questions', { n: v.questions }) }}</span>
            <span v-if="v.last" class="chip chip--xp">{{ v.last.correct }}/{{ v.last.total }}</span>
          </span>
        </button>
      </div>
    </template>

    <template v-else-if="phase === 'watch' && play">
      <div class="card box">
        <div class="frame">
          <iframe
            ref="frame"
            :src="src"
            :title="play.title"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen
          />
        </div>
        <p v-if="failed" class="warn">{{ t('study.videos.failed') }}</p>
        <p v-else-if="!ready" class="muted">{{ t('study.videos.loading') }}</p>
        <div v-if="play.vocab.length" class="vocab">
          <span class="muted">{{ t('study.videos.vocab') }}</span>
          <span v-for="w in play.vocab" :key="w" class="chip">{{ w }}</span>
        </div>
        <div class="row">
          <button type="button" class="btn btn--ghost btn--sm" @click="backToList">
            {{ t('study.videos.back') }}
          </button>
          <button
            v-if="asking === null"
            type="button"
            class="btn btn--ghost btn--sm"
            @click="skipToQuestions"
          >
            {{ t('study.videos.skip') }}
          </button>
        </div>
      </div>

      <div v-if="current" class="card box">
        <p class="prompt">
          {{
            t('study.videos.questionN', { n: (asking ?? 0) + 1, total: play.checkpoints.length })
          }}
          — {{ current.prompt }}
        </p>
        <div class="choices">
          <button
            v-for="(c, i) in current.choices"
            :key="i"
            type="button"
            class="choice"
            :class="{ on: answers[asking ?? 0] === i }"
            @click="choose(i)"
          >
            <span class="num">{{ LETTERS[i] }}</span> {{ c }}
          </button>
        </div>
        <div class="row">
          <button
            type="button"
            class="btn btn--primary"
            :disabled="answers[asking ?? 0] === null || busy"
            @click="next"
          >
            {{
              (asking ?? 0) + 1 < play.checkpoints.length
                ? t('study.videos.continue')
                : t('study.videos.finish')
            }}
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="phase === 'result' && result && play">
      <div class="card box result">
        <h2>
          {{ t('study.videos.resultTitle', { correct: result.correct, total: result.total }) }}
        </h2>
        <p v-if="result.xp" class="chip chip--xp">+{{ result.xp }} XP</p>
        <ul class="review">
          <li v-for="(r, i) in result.review" :key="i">
            <p class="prompt">{{ play.checkpoints[i].prompt }}</p>
            <p :class="r.picked === r.answer ? 'ok' : 'bad'">
              <Check v-if="r.picked === r.answer" :size="14" />
              <X v-else :size="14" />
              {{
                r.picked === null
                  ? t('study.videos.skipped')
                  : play.checkpoints[i].choices[r.picked]
              }}
            </p>
            <p v-if="r.picked !== r.answer" class="right">
              {{ play.checkpoints[i].choices[r.answer] }}
            </p>
            <p class="muted">{{ r.explain }}</p>
          </li>
        </ul>
        <div class="row">
          <button type="button" class="btn btn--primary" @click="backToList">
            {{ t('study.videos.back') }}
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.videos {
  display: grid;
  gap: var(--sp-3);
  max-width: 900px;
  margin: 0 auto;
}
h1 {
  margin: 0;
  font-size: var(--fs-2xl);
}
h2 {
  margin: 0;
  font-size: var(--fs-xl);
}
.muted {
  margin: 0;
  color: var(--c-ink-soft);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.box {
  display: grid;
  gap: var(--sp-3);
  padding: var(--sp-5);
}
.box p {
  margin: 0;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--sp-3);
}
.item {
  display: grid;
  gap: var(--sp-2);
  align-content: start;
  padding: var(--sp-4);
  font: inherit;
  color: var(--c-ink);
  text-align: left;
  cursor: pointer;
}
.item p {
  margin: 0;
  font-size: var(--fs-sm);
}
.icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--r-pill);
  background: var(--c-primary-soft);
  color: var(--c-primary);
}
.meta {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--r-md);
  background: var(--c-ink);
}
.frame iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.warn {
  color: var(--c-danger);
  font-weight: 700;
}
.vocab {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}
.prompt {
  font-weight: 700;
}
.choices {
  display: grid;
  gap: var(--sp-2);
}
.choice {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid var(--c-line);
  border-radius: var(--r-md);
  background: var(--c-surface);
  color: var(--c-ink);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.choice:hover {
  background: var(--c-primary-soft);
}
.choice.on {
  border-color: var(--c-primary);
  background: var(--c-primary-soft);
}
.num {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  border-radius: var(--r-sm);
  background: var(--c-surface-2);
  font-size: var(--fs-xs);
  font-weight: 700;
}
.row {
  display: flex;
  justify-content: center;
  gap: var(--sp-3);
}
.result {
  text-align: center;
  justify-items: center;
}
.review {
  display: grid;
  gap: var(--sp-3);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
}
.review .ok {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--c-success);
  font-weight: 700;
}
.review .bad {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--c-danger);
  font-weight: 700;
}
.review .right {
  color: var(--c-success);
  font-weight: 700;
}
</style>
