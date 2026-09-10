<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The atlas opening page: a stylized world with the four trail plates as
// framed, keyboard-reachable "atlas plates" (plate-select only — the real
// geography lives on the trail plates). Continents are original low-poly
// blobs, muted context tone; the four windows are the interactive layer.
import { computed } from 'vue';
import type { Plate } from '../lib/types';
import { plateView, polygonPoints, project } from '../lib/geo';

const props = defineProps<{
  plates: Plate[];
  progressByPlate: Record<string, { done: number; total: number }>;
}>();

defineEmits<{ open: [plateId: string] }>();

const BOUNDS: [number, number, number, number] = [-180, -58, 180, 80];
const view = plateView(BOUNDS);

// Rough continent silhouettes (stylized, decorative — no borders drawn).
const CONTINENTS: [number, number][][] = [
  // North America
  [[-166, 68], [-150, 71], [-130, 71], [-110, 69], [-95, 68], [-82, 70], [-72, 71], [-60, 62], [-64, 50], [-70, 44], [-76, 36], [-81, 26], [-90, 29], [-97, 26], [-97, 20], [-92, 16], [-88, 17], [-87, 22], [-82, 25], [-85, 30], [-95, 35], [-105, 42], [-115, 50], [-125, 55], [-135, 58], [-150, 60], [-160, 63]],
  // South America
  [[-77, 8], [-70, 12], [-62, 11], [-55, 6], [-50, 0], [-42, -3], [-38, -8], [-40, -14], [-44, -22], [-48, -26], [-54, -32], [-57, -36], [-62, -40], [-65, -45], [-68, -50], [-70, -54], [-73, -52], [-72, -44], [-71, -36], [-70, -28], [-70, -20], [-74, -16], [-78, -8], [-80, -4], [-81, 2], [-78, 5]],
  // Africa
  [[-8, 32], [0, 34], [10, 34], [20, 32], [30, 31], [34, 28], [38, 20], [42, 12], [48, 12], [51, 12], [48, 5], [42, -2], [40, -10], [38, -16], [34, -22], [30, -30], [24, -34], [19, -35], [15, -30], [13, -22], [12, -14], [9, -2], [6, 4], [-4, 5], [-8, 5], [-12, 8], [-14, 14], [-16, 20], [-14, 26]],
  // Eurasia
  [[-8, 43], [-2, 44], [3, 42], [8, 44], [15, 41], [20, 40], [27, 41], [33, 42], [40, 43], [48, 42], [55, 40], [60, 38], [62, 30], [68, 24], [72, 20], [77, 8], [80, 12], [87, 21], [92, 21], [95, 16], [100, 13], [104, 10], [107, 11], [109, 15], [107, 20], [110, 21], [115, 23], [120, 26], [122, 30], [120, 34], [126, 38], [130, 42], [135, 46], [140, 52], [145, 58], [150, 60], [160, 62], [170, 66], [178, 68], [178, 72], [160, 72], [140, 74], [120, 74], [100, 74], [80, 74], [60, 72], [40, 70], [30, 70], [28, 66], [24, 66], [20, 64], [15, 62], [12, 58], [8, 56], [5, 52], [2, 50], [-2, 48]],
  // Maritime Southeast Asia island arc
  [[95, 6], [105, 2], [115, 0], [125, 3], [130, -2], [135, -4], [140, -6], [138, -9], [130, -8], [120, -9], [114, -8], [106, -7], [100, -4]],
  // Australia
  [[114, -22], [118, -20], [124, -17], [130, -13], [136, -12], [140, -17], [144, -14], [148, -20], [153, -27], [150, -37], [144, -38], [138, -35], [132, -32], [126, -32], [120, -34], [115, -33], [113, -27]],
  // Greenland
  [[-45, 60], [-40, 64], [-35, 68], [-30, 72], [-25, 76], [-30, 80], [-45, 83], [-58, 82], [-68, 80], [-72, 78], [-65, 74], [-58, 70], [-52, 66]],
  // British Isles
  [[-5, 50], [-2, 53], [-4, 56], [-6, 58], [-8, 55], [-6, 52]],
  // Japan
  [[130, 32], [135, 35], [139, 38], [143, 42], [145, 44], [142, 45], [138, 37], [133, 34]],
  // Madagascar
  [[49.3, -12.1], [50.5, -18], [49.5, -22], [47, -25], [45.2, -25.6], [43.9, -24], [44, -20], [46.3, -15.8], [48, -13.4]],
  // New Zealand
  [[173, -35], [176, -38], [172, -42], [168, -46], [166, -45], [170, -41]],
];

const continents = computed(() => CONTINENTS.map((ring) => polygonPoints(view, ring)));

const frames = computed(() =>
  props.plates.map((p) => {
    const [x1, y1] = project(view, p.bounds[0], p.bounds[3]);
    const [x2, y2] = project(view, p.bounds[2], p.bounds[1]);
    const prog = props.progressByPlate[p.id] ?? { done: 0, total: 0 };
    return {
      plate: p,
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      w: Math.abs(x2 - x1),
      h: Math.abs(y2 - y1),
      done: prog.done,
      total: prog.total,
    };
  }),
);

const labelFs = computed(() => 13);
const etaFs = computed(() => 11);
</script>

<template>
  <div class="plate-stage world-stage">
    <div class="plate-tag"><span class="rn">ATLAS</span><span>INDEX MAP</span></div>
    <svg :viewBox="`0 0 ${view.width} ${view.height}`" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" :width="view.width" :height="view.height" fill="var(--ocean)" />
      <polygon
        v-for="(pts, i) in continents"
        :key="i"
        class="map-context"
        :points="pts"
      />
      <text
        x="160" y="640"
        class="map-sea-label"
        text-anchor="middle"
        :font-size="15"
      >PACIFIC OCEAN</text>
      <text
        x="820" y="300"
        class="map-sea-label"
        text-anchor="middle"
        :font-size="15"
      >ATLANTIC OCEAN</text>
      <text
        x="640" y="700"
        class="map-sea-label"
        text-anchor="middle"
        :font-size="15"
      >INDIAN OCEAN</text>

      <g
        v-for="f in frames"
        :key="f.plate.id"
        class="plate-frame"
        role="button"
        tabindex="0"
        :aria-label="`Open plate ${f.plate.numeral} — ${f.plate.name}. ${f.plate.caption}. ${f.done} of ${f.total} stops done.`"
        @click="$emit('open', f.plate.id)"
        @keydown.enter.prevent="$emit('open', f.plate.id)"
        @keydown.space.prevent="$emit('open', f.plate.id)"
      >
        <rect
          :x="f.x" :y="f.y" :width="f.w" :height="f.h"
          class="frame-rect"
          rx="4"
        />
        <rect
          :x="f.x + 5" :y="f.y + 5" :width="f.w - 10" :height="f.h - 10"
          class="frame-rect-inner"
          rx="2"
          fill="none"
        />
        <text :x="f.x + 16" :y="f.y + 30" class="frame-rn" :font-size="26">{{ f.plate.numeral }}</text>
        <text :x="f.x + 16" :y="f.y + 56" class="frame-name" :font-size="labelFs * 1.15">{{ f.plate.name.toUpperCase() }}</text>
        <text :x="f.x + 16" :y="f.y + 76" class="frame-eta" :font-size="etaFs">
          {{ f.done }} / {{ f.total }} STOPS
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.world-stage {
  height: 100%;
  min-height: 300px;
}

.world-stage svg {
  width: 100%;
  height: 100%;
  display: block;
}

.plate-frame {
  cursor: pointer;
}

.frame-rect {
  fill: rgba(239, 226, 190, 0.06);
  stroke: var(--brass);
  stroke-width: 2;
  transition: fill 160ms ease;
}

.plate-frame:hover .frame-rect,
.plate-frame:focus-visible .frame-rect {
  fill: rgba(239, 226, 190, 0.18);
}

.frame-rect-inner {
  stroke: var(--brass);
  stroke-width: 0.8;
  opacity: 0.7;
  pointer-events: none;
}

.frame-rn {
  font-family: var(--font-display);
  font-weight: 700;
  fill: var(--parchment);
  pointer-events: none;
}

.frame-name {
  font-family: var(--font-body);
  font-weight: 600;
  letter-spacing: 0.14em;
  fill: var(--parchment);
  pointer-events: none;
}

.frame-eta {
  font-family: var(--font-body);
  font-weight: 600;
  letter-spacing: 0.1em;
  fill: var(--ocean-ink);
  pointer-events: none;
}

.plate-frame:focus-visible {
  outline: none;
}

.plate-frame:focus-visible .frame-rect {
  stroke: var(--parchment);
  stroke-width: 3;
}
</style>
