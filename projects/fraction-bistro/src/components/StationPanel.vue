<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// One cutting station: the dish, the partition picker, and the guest plate.
// Owns the full input triangle:
//   - pointer drag (slice → plate, with a following ghost + forgiving drop)
//   - tap/click (tap a slice = plate it; tap a plated slice = return it)
//   - keyboard (arrows roam slices, Enter/Space plates; plate slices return)
// All state changes go through the pure engine (features/cut/engine.ts).
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { Dish } from '../lib/types';
import {
  builtFraction,
  canPlace,
  denominatorPlural,
  placeSlice,
  returnSlice,
  setPartition,
  slicePhrase,
  type Station,
} from '../features/cut/engine';
import { drawCutLines, gsap, prefersReducedMotion } from '../lib/gsap';
import DishSvg from './DishSvg.vue';
import SliceRow from './SliceRow.vue';
import PartitionPicker from './PartitionPicker.vue';
import FractionReadout from './FractionReadout.vue';

const props = withDefaults(
  defineProps<{
    dish: Dish;
    station: Station;
    label: string;
    /** learner may cut and plate (false = the chef's fixed plate) */
    interactive?: boolean;
    compact?: boolean;
  }>(),
  { interactive: true, compact: false },
);

const emit = defineEmits<{ (e: 'update:station', station: Station): void }>();

const announce = ref('');
const dragging = ref(false);
const plateZoneEl = ref<HTMLElement | null>(null);
const dishWrapEl = ref<HTMLElement | null>(null);
const ghostEl = ref<HTMLElement | null>(null);

const built = computed(() => builtFraction(props.station));

function commit(next: Station) {
  emit('update:station', next);
}

function onPartition(p: number) {
  if (p === props.station.partition) return;
  const hadSlices = props.station.placed > 0;
  commit(setPartition(props.station, p));
  announce.value = hadSlices
    ? `Re-cut into ${p} equal ${denominatorPlural(p)}; the ${props.station.placed} plated slice${props.station.placed === 1 ? '' : 's'} went back to the dish.`
    : `Cut the ${props.dish.name} into ${p} equal ${denominatorPlural(p)}.`;
}

function onPlace() {
  if (!canPlace(props.station)) return;
  const next = placeSlice(props.station);
  commit(next);
  announce.value = `${slicePhrase(builtFraction(next))} on the plate.`;
}

function onReturn() {
  if (props.station.placed <= 0) return;
  commit(returnSlice(props.station));
  announce.value = 'Slice returned to the dish.';
}

// ---- drag (single-pointer, with tap fallback) --------------------------------

interface Ghost {
  index: number;
  x: number;
  y: number;
  w: number;
}

const ghost = ref<Ghost | null>(null);
let press: { index: number; x: number; y: number; started: boolean } | null = null;

function onSlicePress(index: number, ev: PointerEvent) {
  if (!props.interactive || !canPlace(props.station)) return;
  if (ev.button !== undefined && ev.button !== 0 && ev.pointerType === 'mouse') return;
  press = { index, x: ev.clientX, y: ev.clientY, started: false };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
}

function overPlate(x: number, y: number): boolean {
  const r = plateZoneEl.value?.getBoundingClientRect();
  if (!r) return false;
  // forgiving drop target: ±12px apron around the whole plate zone
  return x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12;
}

function onPointerMove(ev: PointerEvent) {
  if (!press) return;
  if (!press.started) {
    if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < 10) return;
    press.started = true;
    dragging.value = true;
    const w = Math.min(dishWrapEl.value?.getBoundingClientRect().width ?? 320, 380);
    ghost.value = { index: press.index, x: ev.clientX, y: ev.clientY, w };
  }
  if (ghost.value) {
    ghost.value.x = ev.clientX;
    ghost.value.y = ev.clientY;
  }
}

function flyGhostTo(rect: DOMRect | undefined, then: () => void) {
  const el = ghostEl.value;
  if (!el || !rect || prefersReducedMotion()) {
    ghost.value = null;
    then();
    return;
  }
  const w = ghost.value?.w ?? 0;
  gsap.to(el, {
    left: rect.left + rect.width / 2 - w / 2,
    top: rect.top + rect.height / 2 - w / 2,
    scale: 0.35,
    opacity: 0,
    duration: 0.28,
    ease: 'power3.out',
    onComplete: () => {
      ghost.value = null;
      then();
    },
  });
}

function stopListening() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerCancel);
}

function onPointerUp(ev: PointerEvent) {
  const p = press;
  press = null;
  dragging.value = false;
  stopListening();
  if (!p) return;
  if (!p.started) {
    onPlace(); // tap = click-to-place (WCAG 2.2 single-pointer path)
    return;
  }
  if (overPlate(ev.clientX, ev.clientY)) {
    flyGhostTo(plateZoneEl.value?.getBoundingClientRect(), onPlace);
  } else {
    flyGhostTo(dishWrapEl.value?.getBoundingClientRect(), () => {
      announce.value = 'Slice back on the dish.';
    });
  }
}

function onPointerCancel() {
  const p = press;
  press = null;
  dragging.value = false;
  stopListening();
  if (p?.started) {
    flyGhostTo(dishWrapEl.value?.getBoundingClientRect(), () => undefined);
  }
}

onBeforeUnmount(() => {
  stopListening();
  press = null;
  ghost.value = null;
});

// ---- purposeful motion -------------------------------------------------------

const uid = useId();
const rootEl = ref<HTMLElement | null>(null);

watch(
  () => props.station.partition,
  async (p) => {
    if (p < 2) return;
    await nextTick();
    const root = rootEl.value;
    if (!root) return;
    drawCutLines([...root.querySelectorAll('.cutline')]);
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        root.querySelectorAll('.slice-group'),
        { opacity: 0.55, scale: 1.045 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', stagger: 0.018, clearProps: 'transform' },
      );
    }
  },
);
</script>

<template>
  <div ref="rootEl" class="station" :data-station="label">
    <p class="picker-label">{{ label }}</p>
    <div ref="dishWrapEl" class="dish-wrap" :class="{ 'dish-wrap--compact': compact }">
      <DishSvg
        :dish="dish"
        :partition="station.partition"
        :placed="station.placed"
        :interactive="interactive && station.partition >= 2"
        :label="`${dish.name}, ${station.partition < 2 ? 'whole, not cut yet' : `cut into ${station.partition} equal parts`}`"
        @place="onPlace"
        @slice-press="onSlicePress"
      />
    </div>

    <div v-if="interactive">
      <p class="picker-label" :id="`cutlabel-${uid}`">Cut into</p>
      <PartitionPicker :model-value="station.partition" @update:model-value="onPartition" />
      <p class="sr-only">
        Arrow keys move between the slices of the dish. Enter or Space adds the focused slice to the
        plate. On the plate, Enter or Space returns a slice to the dish.
      </p>
    </div>

    <div ref="plateZoneEl" class="plate-zone" :class="{ 'plate-zone--drop': dragging }">
      <div class="plate-zone__head">
        <p class="picker-label">Plate</p>
        <FractionReadout :frac="built" whole-label="empty" />
      </div>
      <div class="plate">
        <SliceRow
          v-if="station.placed > 0"
          :key="`${station.partition}`"
          :dish="dish"
          :partition="station.partition"
          :placed="station.placed"
          :interactive="interactive"
          @return="onReturn"
        />
        <p v-else class="plate-empty">nothing plated yet</p>
      </div>
      <button
        v-if="interactive && station.placed > 0"
        type="button"
        class="btn btn--ghost return-btn"
        @click="onReturn"
      >
        Return last slice
      </button>
    </div>

    <p class="sr-only" aria-live="polite" role="status">{{ announce }}</p>

    <div
      v-if="ghost"
      ref="ghostEl"
      class="drag-ghost"
      :style="{ left: `${ghost.x - ghost.w / 2}px`, top: `${ghost.y - ghost.w / 2}px`, width: `${ghost.w}px` }"
      aria-hidden="true"
    >
      <DishSvg
        :dish="dish"
        :partition="station.partition"
        :placed="0"
        :separated="false"
        :interactive="false"
        :only-slice="ghost.index"
      />
    </div>
  </div>
</template>

<style scoped>
.station {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  min-width: 0;
}

.dish-wrap--compact {
  max-width: 340px;
}
</style>
