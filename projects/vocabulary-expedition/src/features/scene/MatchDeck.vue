<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Word-label dock — the signature museum act: drag a word chip onto its object
// (pointer), or pick-and-place (tap chip → tap object / Enter chip → Tab →
// Enter object). Correct labels pin onto the scene; wrong ones drift back.

import { ref } from 'vue';
import type { UnitData } from '../../lib/types';
import type { MatchState } from '../match/engine';
import { matchNudgeCopy } from '../match/engine';
import AppIcon from '../../components/AppIcon.vue';

const props = defineProps<{ unit: UnitData; state: MatchState }>();
const emit = defineEmits<{
  pickup: [labelId: string];
  drop: [labelId: string, itemId: string | null];
}>();

function wordOf(id: string): string {
  return props.unit.items.find((i) => i.id === id)?.word ?? id;
}

function ariaOf(id: string): string {
  const it = props.unit.items.find((i) => i.id === id);
  return it ? `${it.word} — ${it.translation}` : id;
}

// ---- pointer drag (mouse + touch unify through pointer events) -------------
const dragGhost = ref<{ id: string; x: number; y: number } | null>(null);
let dragStart: { x: number; y: number; id: string } | null = null;

function onPointerDown(e: PointerEvent, id: string): void {
  dragStart = { x: e.clientX, y: e.clientY, id };
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {
    /* synthetic/edge-case pointers have no active id — drag still works via
       the row-level move/up handlers */
  }
}

function onPointerMove(e: PointerEvent): void {
  if (!dragStart) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (!dragGhost.value && Math.hypot(dx, dy) > 8) {
    dragGhost.value = { id: dragStart.id, x: e.clientX, y: e.clientY };
  }
  if (dragGhost.value) {
    dragGhost.value = { ...dragGhost.value, x: e.clientX, y: e.clientY };
  }
}

function onPointerUp(e: PointerEvent): void {
  if (!dragStart) return;
  const { id } = dragStart;
  dragStart = null;
  if (dragGhost.value) {
    dragGhost.value = null;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const hotspot = el?.closest('[data-hotspot]');
    emit('drop', id, hotspot ? hotspot.getAttribute('data-hotspot') : null);
  } else {
    // a plain tap = pick up / put down (touch + keyboard share this path)
    emit('pickup', id);
  }
}

function onKeyUp(e: KeyboardEvent, id: string): void {
  if (e.key === 'Enter' || e.key === ' ') emit('pickup', id);
}
</script>

<template>
  <div class="dock-head">
    <h2>Word labels</h2>
    <span class="count">{{ Object.keys(state.placed).length }}/{{ state.targets.length }} pinned</span>
  </div>

  <p class="hint">
    <template v-if="state.holding">
      <AppIcon name="pin" :size="20" />
      Holding <strong>{{ wordOf(state.holding) }}</strong> — tap the object it names. Esc puts it back.
    </template>
    <template v-else>
      <AppIcon name="tag" :size="20" />
      Drag a word onto its picture — or tap the word, then tap the picture.
    </template>
  </p>

  <div class="chip-row" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
    <button
      v-for="id in state.tray"
      :key="id"
      type="button"
      class="chip"
      :class="{ 'chip--held': state.holding === id, 'chip--ghost': dragGhost?.id === id }"
      :data-flip-id="`label-${id}`"
      :aria-label="`word: ${ariaOf(id)}`"
      @pointerdown="(e) => onPointerDown(e, id)"
      @keyup="(e) => onKeyUp(e, id)"
      @click.prevent
    >
      {{ wordOf(id) }}
    </button>
    <p v-if="state.tray.length === 0" class="all-done">All labels pinned on the scene!</p>
  </div>

  <div v-if="state.feedback === 'nudge'" class="feedback-strip" data-kind="nudge">
    <AppIcon name="glass" :size="20" />
    <span>{{ matchNudgeCopy(state) }}</span>
  </div>
  <div v-else-if="state.feedback === 'correct'" class="feedback-strip" data-kind="correct">
    <AppIcon name="leaf" :size="20" />
    <span>Yes! <strong>{{ state.justPlacedId ? wordOf(state.justPlacedId) : '' }}</strong> is pinned.</span>
  </div>

  <!-- floating drag ghost -->
  <Teleport to="body">
    <span
      v-if="dragGhost"
      class="chip chip--drag"
      :style="{ left: `${dragGhost.x}px`, top: `${dragGhost.y}px` }"
      aria-hidden="true"
    >
      {{ wordOf(dragGhost.id) }}
    </span>
  </Teleport>
</template>

<style scoped>
.hint {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--s2);
  color: var(--ink-soft);
  font-weight: 700;
}

.all-done {
  margin: 0;
  color: var(--meadow-deep);
  font-weight: 700;
}

.chip--ghost {
  opacity: 0.35;
}
</style>
