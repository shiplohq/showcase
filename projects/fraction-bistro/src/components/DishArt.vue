<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Original flat net-ink dish artwork, rendered from dishes.json data
// (vector parameters, toppings, color tokens). Placed inside <defs> and
// stamped into each slice via <use> + clipPath. Presentation attributes are
// used on purpose: CSS selectors cannot reach into <use> shadow trees, but
// attributes (and CSS custom properties) clone with the content.
import type { Dish, Topping } from '../lib/types';
import { RECT, ROUND_CX, ROUND_CY, ROUND_R } from '../lib/sliceGeom';

defineProps<{ dish: Dish; artId: string }>();

function toppingTransform(t: Topping): string {
  return `translate(${t.x} ${t.y}) rotate(${t.r}) scale(${t.s})`;
}
</script>

<template>
  <g :id="artId">
    <!-- solid offset shadow (editorial paper feel: hard, no blur) -->
    <circle
      v-if="dish.kind === 'round'"
      :cx="ROUND_CX + 5"
      :cy="ROUND_CY + 7"
      :r="ROUND_R"
      fill="rgba(34,27,16,0.14)"
    />
    <rect
      v-else
      :x="RECT.x + 5"
      :y="RECT.y + 7"
      :width="RECT.w"
      :height="RECT.h"
      rx="10"
      fill="rgba(34,27,16,0.14)"
    />

    <template v-if="dish.kind === 'round'">
      <!-- crust -->
      <circle :cx="ROUND_CX" :cy="ROUND_CY" :r="ROUND_R" :fill="dish.colors.rim" stroke="var(--ink)" stroke-width="2.5" />
      <!-- sauce / custard base -->
      <circle :cx="ROUND_CX" :cy="ROUND_CY" :r="84" :fill="dish.colors.base" stroke="var(--ink)" stroke-width="2" />
    </template>
    <template v-else>
      <!-- pan rim -->
      <rect :x="RECT.x" :y="RECT.y" :width="RECT.w" :height="RECT.h" rx="10" :fill="dish.colors.rim" stroke="var(--ink)" stroke-width="2.5" />
      <!-- baked top -->
      <rect :x="RECT.x + 10" :y="RECT.y + 10" :width="RECT.w - 20" :height="RECT.h - 20" rx="6" :fill="dish.colors.base" stroke="var(--ink)" stroke-width="1.5" />
    </template>

    <g v-for="(t, i) in dish.toppings" :key="i" :transform="toppingTransform(t)">
      <ellipse v-if="t.type === 'mozzarella'" rx="13" ry="10" :fill="dish.colors.cheese" stroke="var(--ink)" stroke-width="1.5" />
      <template v-else-if="t.type === 'basil'">
        <path d="M0 -11 C7 -7 9 3 0 11 C-9 3 -7 -7 0 -11 Z" :fill="dish.colors.leaf" stroke="var(--ink)" stroke-width="1.5" />
        <path d="M0 -8 L0 8" fill="none" stroke="var(--ink)" stroke-width="1" />
      </template>
      <template v-else-if="t.type === 'strawberry'">
        <path d="M0 -5 C6 -5 9 0 8 5 C7 10 3 12 0 12 C-3 12 -7 10 -8 5 C-9 0 -6 -5 0 -5 Z" fill="#c8402e" stroke="var(--ink)" stroke-width="1.5" />
        <path d="M-4 -4 L0 -7.5 L4 -4" fill="none" :stroke="dish.colors.leaf" stroke-width="1.5" stroke-linecap="round" />
      </template>
      <template v-else-if="t.type === 'blueberry'">
        <circle r="6" fill="#3e4570" stroke="var(--ink)" stroke-width="1.5" />
        <path d="M-2 -4 L0 -2 L2 -4" fill="none" :stroke="dish.colors.cheese" stroke-width="1.2" stroke-linecap="round" />
      </template>
      <ellipse v-else-if="t.type === 'dimple'" rx="9" ry="5.5" :fill="dish.colors.rim" opacity="0.75" />
      <g v-else-if="t.type === 'rosemary'" stroke="#46532c" fill="none" stroke-linecap="round">
        <path d="M0 11 L0 -9" stroke-width="2" />
        <path d="M0 7 L-5 3 M0 7 L5 3 M0 1 L-5 -3 M0 1 L5 -3 M0 -5 L-4 -8 M0 -5 L4 -8" stroke-width="1.5" />
      </g>
      <circle v-else-if="t.type === 'salt'" r="1.7" fill="#fffdf4" />
    </g>
  </g>
</template>
