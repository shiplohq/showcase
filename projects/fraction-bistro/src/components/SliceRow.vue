<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The guest plate's row of plated slices. Each slice is the same clipped
// <use> of the dish art, transformed into its slot so the pieces read as a
// countable row. Slices are returnable (click / Enter returns to the dish).
import { computed, useId } from 'vue';
import type { Dish } from '../lib/types';
import { allSliceGeoms, rowSlotTransform } from '../lib/sliceGeom';
import { numberWord } from '../features/cut/engine';
import DishArt from './DishArt.vue';

const props = defineProps<{
  dish: Dish;
  partition: number;
  /** how many slices are plated */
  placed: number;
  /** allow returning slices to the dish */
  interactive?: boolean;
}>();

const emit = defineEmits<{
  (e: 'return', index: number): void;
}>();

const uid = useId();
const cid = (i: number) => `pclip-${uid}-${i}`;

const ROW_W = 340;
const ROW_H = 112;

const slots = computed(() => {
  const geoms = allSliceGeoms(props.dish.kind, props.partition);
  return Array.from({ length: props.placed }, (_, slot) => {
    const geom = geoms[slot];
    return {
      index: slot,
      d: geom.d,
      transform: rowSlotTransform(geom, slot, props.placed, ROW_W, ROW_H),
    };
  });
});

function onKeydown(ev: KeyboardEvent, index: number) {
  if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    emit('return', index);
  }
}
</script>

<template>
  <svg
    v-if="placed > 0"
    :viewBox="`0 0 ${ROW_W} ${ROW_H}`"
    class="plate-slices"
    role="group"
    :aria-label="`${placed} of ${partition} equal parts on the plate`"
  >
    <defs>
      <DishArt :dish="dish" :art-id="uid" />
      <clipPath v-for="s in slots" :key="s.index" :id="cid(s.index)">
        <path :d="s.d" />
      </clipPath>
    </defs>
    <template v-for="s in slots" :key="`slice-${s.index}`">
      <g :transform="s.transform">
        <g :clip-path="`url(#${cid(s.index)})`">
          <use :href="`#${uid}`" />
        </g>
      </g>
      <path
        v-if="interactive"
        class="slice-hit"
        :d="s.d"
        :transform="s.transform"
        role="button"
        tabindex="0"
        :aria-label="`Return slice ${numberWord(s.index + 1)} to the dish`"
        @click="emit('return', s.index)"
        @keydown="onKeydown($event, s.index)"
      />
      <path v-if="interactive" class="slice-outline" :d="s.d" :transform="s.transform" />
    </template>
  </svg>
</template>
