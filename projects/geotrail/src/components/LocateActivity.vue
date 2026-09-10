<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Locate: drag a label chip onto the map — or tap it, or focus it and press
// Enter. Drag is enhancement; the chip row IS the keyboard/touch path
// (definition of done). Drop resolves through the parent's PlateMap with a
// forgiving 64px snap; a drop into the ocean is a gentle nudge, not an error.
import { ref } from 'vue';
import type { LocateStop, Place } from '../lib/types';
import AppIcon from './AppIcon.vue';

const props = defineProps<{
  stop: LocateStop;
  options: Place[];
  disabled: boolean;
  feedbackState: 'idle' | 'correct' | 'try-again';
  lastPicked: string | null;
  resolveDrop: (clientX: number, clientY: number) => { id: string; name: string } | null;
}>();

const emit = defineEmits<{ answer: [placeId: string] }>();

const seaNote = ref<string | null>(null);

// ---- drag (pointer events; Esc cancels) ------------------------------------

const drag = ref<{ id: string; name: string; x: number; y: number } | null>(null);
let dragStarted = false;
let startX = 0;
let startY = 0;
let activeId: string | null = null;

function onPointerDown(ev: PointerEvent, place: Place) {
  if (props.disabled) return;
  if (ev.button !== 0 && ev.pointerType === 'mouse') return;
  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  dragStarted = false;
  startX = ev.clientX;
  startY = ev.clientY;
  activeId = place.id;
}

function onPointerMove(ev: PointerEvent) {
  if (!activeId) return;
  const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
  if (!dragStarted && dist > 7) {
    dragStarted = true;
    const name = props.options.find((p) => p.id === activeId)?.name ?? '';
    drag.value = { id: activeId, name, x: ev.clientX, y: ev.clientY };
  } else if (dragStarted && drag.value) {
    drag.value.x = ev.clientX;
    drag.value.y = ev.clientY;
  }
}

function onPointerUp(ev: PointerEvent) {
  const id = activeId;
  const wasDrag = dragStarted;
  activeId = null;
  dragStarted = false;
  drag.value = null;
  if (!id) return;
  if (!wasDrag) {
    // plain tap/click on the chip
    emit('answer', id);
    return;
  }
  const hit = props.resolveDrop(ev.clientX, ev.clientY);
  if (hit) emit('answer', hit.id);
  else seaNote.value = 'That drop landed in the sea — try dropping the label on a country.';
}

function onDragEsc(ev: KeyboardEvent) {
  if (ev.key === 'Escape' && drag.value) {
    activeId = null;
    dragStarted = false;
    drag.value = null;
    seaNote.value = 'Drag cancelled — tap a label instead if you prefer.';
  }
}

/** Keyboard path: Enter/Space on a focused chip fires a click with no
 *  pointer session (detail === 0) — answer directly. Pointer clicks were
 *  already answered on pointerup. */
function onChipClick(placeId: string, ev: MouseEvent) {
  if (ev.detail === 0 && !props.disabled) emit('answer', placeId);
}
</script>

<template>
  <div
    class="locate-activity"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onDragEsc"
  >
    <p class="drag-hint">
      <AppIcon name="drag" :size="16" />
      <span>Drag a label onto the map — or just tap it.</span>
    </p>

    <div class="chip-row" :class="{ dragging: !!drag }">
      <button
        v-for="p in options"
        :key="p.id"
        type="button"
        class="place-chip"
        :class="{
          'is-answer': feedbackState === 'correct' && p.id === stop.answer,
          'was-tried': feedbackState === 'try-again' && p.id === lastPicked,
        }"
        :disabled="disabled"
        :aria-label="`Answer ${p.name}`"
        @pointerdown="(ev) => onPointerDown(ev, p)"
        @click="(ev) => onChipClick(p.id, ev)"
      >
        {{ p.name }}
      </button>
    </div>

    <p v-if="seaNote" class="drag-hint sea-note" aria-live="polite">{{ seaNote }}</p>

    <Teleport to="body">
      <div v-if="drag" class="drag-ghost" :style="{ left: drag.x + 'px', top: drag.y + 'px' }" aria-hidden="true">
        {{ drag.name }}
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.locate-activity {
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}

.drag-ghost {
  position: fixed;
  transform: translate(-50%, -60%);
  padding: var(--s2) var(--s4);
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  background: var(--parchment-raised);
  border: 1.5px solid var(--terra-deep);
  color: var(--ink);
  font-weight: 700;
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-paper-strong);
  pointer-events: none;
  z-index: 40;
}

.sea-note {
  color: var(--terra-deep);
}

.place-chip.was-tried {
  border-style: dashed;
  border-color: var(--terra);
}
</style>
