<script setup lang="ts">
import type { Component } from 'vue'
import {
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  Box,
  Check,
  Circle,
  CircleCheck,
  Delete,
  Droplets,
  Gamepad2,
  Gift,
  Headphones,
  House,
  Lightbulb,
  Lock,
  Map as MapIcon,
  Mic,
  PartyPopper,
  Pause,
  PawPrint,
  PenLine,
  Pencil,
  Play,
  Repeat,
  RotateCcw,
  Square,
  Star,
  FlaskConical,
  Flower2,
  Trash2,
  Turtle,
  Volume2,
  VolumeX,
  X
} from 'lucide-vue-next'

// Một chỗ duy nhất ánh xạ tên icon → icon lucide (docs/18-ui-rules.md). Không dùng emoji làm icon trong giao diện.
const ICONS = {
  volume: Volume2,
  slow: Turtle,
  mic: Mic,
  stop: Square,
  save: BookmarkPlus,
  saved: BookmarkCheck,
  check: Check,
  done: CircleCheck,
  dot: Circle,
  play: Play,
  pause: Pause,
  trash: Trash2,
  hint: Lightbulb,
  lock: Lock,
  close: X,
  repeat: Repeat,
  reset: RotateCcw,
  star: Star,
  headphones: Headphones,
  test: FlaskConical,
  home: House,
  game: Gamepad2,
  pencil: Pencil,
  write: PenLine,
  party: PartyPopper,
  pet: PawPrint,
  backspace: Delete,
  next: ArrowRight,
  water: Droplets,
  gift: Gift,
  map: MapIcon,
  flower: Flower2,
  box: Box,
  mute: VolumeX
} as const satisfies Record<string, Component>

export type UiIconName = keyof typeof ICONS

withDefaults(defineProps<{ name: UiIconName; size?: number }>(), { size: 16 })
</script>

<template>
  <component
    :is="ICONS[name]"
    class="ui-icon"
    :size="size"
    :stroke-width="2.2"
    aria-hidden="true"
  />
</template>

<style>
.ui-icon {
  flex: none;
  vertical-align: -0.2em;
}
</style>
