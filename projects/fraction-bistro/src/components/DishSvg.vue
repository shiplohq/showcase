<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The dish on the cutting table: dish art clipped into N slices, dashed cut
// edges, optional slight separation, and accessible slice controls
// (SVG role=button wedges with a roving tabindex — arrow keys move, Enter
// or Space places). `onlySlice` renders a single slice for the drag ghost.
import { computed, ref, useId } from 'vue';
import type { Dish } from '../lib/types';
import { allSliceGeoms, gridFor, RECT, ROUND_CX, ROUND_CY, ROUND_R, VB } from '../lib/sliceGeom';
import { numberWord } from '../features/cut/engine';
import DishArt from './DishArt.vue';

const props = withDefaults(
  defineProps<{
    dish: Dish;
    partition: number;
    /** first `placed` slice indexes are on the plate, not on the dish */
    placed?: number;
    separated?: boolean;
    interactive?: boolean;
    onlySlice?: number | null;
    label?: string;
  }>(),
  { placed: 0, separated: true, interactive: false, onlySlice: null, label: '' },
);

const emit = defineEmits<{
  (e: 'place', index: number): void;
  (e: 'slice-press', index: number, ev: PointerEvent): void;
}>();

const uid = useId().replace(/[^a-zA-Z0-9-]/g, 'fb');
const cid = (i: number) => `clip-${uid}-${i}`;

const geoms = computed(() => allSliceGeoms(props.dish.kind, props.partition));

const focusIdx = ref(0);
const hitEls = ref<(SVGPathElement | null)[]>([]);

const visible = computed(() => geoms.value.filter((g) => g.index >= props.placed));

const shown = computed(() =>
  props.onlySlice !== null ? geoms.value.filter((g) => g.index === props.onlySlice) : visible.value,
);

function sep(g: { dx: number; dy: number }): string {
  if (!props.separated || props.partition < 2) return '';
  return `translate(${(g.dx * 6).toFixed(2)} ${(g.dy * 6).toFixed(2)})`;
}

/** internal cut edge that travels with each slice (start edge for rounds) */
function edgeFor(index: number): { x1: number; y1: number; x2: number; y2: number } | null {
  if (props.dish.kind === 'round') {
    const step = 360 / props.partition;
    const a = ((-90 + index * step) * Math.PI) / 180;
    return {
      x1: ROUND_CX,
      y1: ROUND_CY,
      x2: ROUND_CX + (ROUND_R - 1) * Math.cos(a),
      y2: ROUND_CY + (ROUND_R - 1) * Math.sin(a),
    };
  }
  const { rows, cols } = gridFor(props.partition);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const cw = RECT.w / cols;
  const ch = RECT.h / rows;
  const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (col > 0) segs.push({ x1: RECT.x + col * cw, y1: RECT.y, x2: RECT.x + col * cw, y2: RECT.y + RECT.h });
  if (row > 0) segs.push({ x1: RECT.x, y1: RECT.y + row * ch, x2: RECT.x + RECT.w, y2: RECT.y + row * ch });
  return segs[0] ?? null;
}

const edges = computed(() =>
  props.partition < 2 || props.onlySlice !== null
    ? []
    : shown.value.map((g) => ({ index: g.index, line: edgeFor(g.index) })),
);

const isWhole = computed(() => props.partition < 2 && props.onlySlice === null);

const hitLabel = (i: number) =>
  `${props.dish.name} slice ${numberWord(i + 1)} of ${numberWord(props.partition)} — add to plate`;

function moveFocus(delta: number) {
  const n = visible.value.length;
  if (n === 0) return;
  focusIdx.value = ((focusIdx.value + delta) % n + n) % n;
  hitEls.value[focusIdx.value]?.focus();
}

function onKeydown(ev: KeyboardEvent, index: number) {
  if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
    ev.preventDefault();
    moveFocus(1);
  } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
    ev.preventDefault();
    moveFocus(-1);
  } else if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    emit('place', index);
  }
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${VB} ${VB}`"
    class="dish-svg"
    role="group"
    :aria-label="label || `${dish.name} on the cutting table`"
  >
    <defs>
      <DishArt :dish="dish" :art-id="uid" />
      <clipPath v-for="g in geoms" :key="g.index" :id="cid(g.index)">
        <path :d="g.d" />
      </clipPath>
    </defs>

    <g v-if="isWhole">
      <use :href="`#${uid}`" />
    </g>

    <g v-for="g in shown" :key="g.index" :transform="sep(g)" class="slice-group">
      <g :clip-path="`url(#${cid(g.index)})`">
        <use :href="`#${uid}`" />
      </g>
    </g>

    <template v-if="partition >= 2 && onlySlice === null">
      <g v-for="e in edges" :key="e.index" :transform="sep(geoms[e.index])" class="cutlines">
        <line
          v-if="e.line"
          :x1="e.line.x1"
          :y1="e.line.y1"
          :x2="e.line.x2"
          :y2="e.line.y2"
          class="cutline"
        />
      </g>
    </template>

    <template v-if="interactive">
      <template v-for="(g, vi) in visible" :key="`hit-${g.index}`">
        <path
          :ref="(el) => (hitEls[vi] = el as SVGPathElement | null)"
          class="slice-hit"
          :d="g.d"
          role="button"
          :tabindex="vi === focusIdx ? 0 : -1"
          :aria-label="hitLabel(g.index)"
          data-slice-index
          @pointerdown="emit('slice-press', g.index, $event)"
          @keydown="onKeydown($event, g.index)"
        />
        <path class="slice-outline" :d="g.d" />
      </template>
    </template>
  </svg>
</template>

<style scoped>
.dish-svg {
  display: block;
  width: 100%;
  height: auto;
}

.cutline {
  stroke: var(--ink);
  stroke-width: 1.6;
  stroke-dasharray: 5 4;
  opacity: 0.85;
  pointer-events: none;
}
</style>
