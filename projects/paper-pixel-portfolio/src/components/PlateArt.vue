<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The studio's artwork registry — three abstract plates, each mixing the
// studio's two materials: PAPER (contour rings, ledger lines, torn edges) and
// PIXEL (stepped blocks, dot matrix, square grids). One plate per project;
// cropping is editing (DESIGN_DECISIONS.md §1 / principle 02).
//
// Crops: the container's CSS aspect-ratio + preserveAspectRatio slice does
// the cutting; 'card'/'tall' pin an explicit editorial crop window instead.

import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    art: string;
    crop?: 'flow' | 'card' | 'tall';
  }>(),
  { crop: 'flow' },
);

const CROPS: Record<'flow' | 'card' | 'tall', { viewBox: string; preserve: string }> = {
  flow: { viewBox: '0 0 1200 900', preserve: 'xMidYMid slice' },
  card: { viewBox: '230 70 660 495', preserve: 'xMidYMid meet' },
  tall: { viewBox: '290 40 560 746', preserve: 'xMidYMid meet' },
};

const crop = computed(() => CROPS[props.crop]);
</script>

<template>
  <!-- Decorative by default; case-view figures pass role="img" + aria-label. -->
  <svg
    :viewBox="crop.viewBox"
    :preserveAspectRatio="crop.preserve"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- ================= plate-atlas — contour territory interrupted by pixels -->
    <g v-if="art === 'plate-atlas'">
      <!-- contour isolines (paper) -->
      <g fill="none" stroke="#57503F" stroke-width="2">
        <path d="M495 435c-60 4-118-22-150-64-36-47-26-104 14-142 46-44 122-52 182-24 64 30 96 96 72 154-20 50-70 72-118 76Z" />
        <path d="M498 452c-84 6-162-30-206-88-48-64-32-142 24-192 64-57 168-64 248-28 86 39 128 129 92 206-28 60-94 96-158 102Z" />
        <path d="M502 470c-110 8-210-38-266-112-60-80-38-178 36-238 82-66 214-72 316-24 110 51 160 167 112 264-38 78-124 102-198 110Z" />
        <path d="M506 488c-136 10-258-46-326-136-72-96-44-214 48-284 100-77 260-80 384-20 134 64 192 204 132 322-48 94-152 110-238 118Z" opacity="0.75" />
        <path d="M510 506c-162 12-306-54-386-160-84-112-50-250 60-330 118-88 306-88 452-16 158 77 224 241 152 380-58 110-178 116-278 126Z" opacity="0.5" />
      </g>
      <!-- pixel block: territory grid (pixel) -->
      <g transform="translate(736 286)">
        <rect
          v-for="c in 32"
          :key="c"
          :x="((c - 1) % 8) * 30"
          :y="Math.floor((c - 1) / 8) * 30"
          width="30"
          height="30"
          :fill="c % 7 === 0 ? 'none' : c % 5 === 0 ? '#E6E5F4' : '#2B36B5'"
          :stroke="c % 7 === 0 ? '#2B36B5' : 'none'"
          stroke-width="2"
        />
      </g>
      <!-- salmon survey marker -->
      <circle cx="552" cy="322" r="11" fill="#E98C55" />
      <path d="M552 296v52M526 322h52" stroke="#AE4A17" stroke-width="2.5" />
      <!-- baseline rules (paper) -->
      <g stroke="#1C1A16" stroke-width="2">
        <path d="M120 760h920M120 788h920M120 816h560" />
      </g>
      <!-- stepped marker column (pixel) -->
      <g fill="#E98C55">
        <rect x="140" y="238" width="24" height="24" />
        <rect x="140" y="274" width="24" height="24" />
        <rect x="176" y="274" width="24" height="24" />
      </g>
    </g>

    <!-- ================= plate-signal — halftone issue, one row enlarged -->
    <g v-else-if="art === 'plate-signal'">
      <!-- halftone matrix (pixel), density falling to the lower right -->
      <g fill="#1C1A16">
        <template v-for="row in 12" :key="row">
          <circle
            v-for="col in 16"
            :key="col"
            :cx="96 + (col - 1) * 67"
            :cy="80 + (row - 1) * 52"
            :r="Math.max(1.4, 8.5 - 0.5 * Math.abs(col - row * 1.1))"
            :opacity="0.28 + 0.5 * (1 - Math.abs(col - row * 1.1) / 16)"
          />
        </template>
      </g>
      <!-- ultramarine dots scattered in the matrix -->
      <g fill="#2B36B5">
        <circle cx="634" cy="132" r="7" />
        <circle cx="701" cy="184" r="7" />
        <circle cx="768" cy="236" r="7" />
        <circle cx="502" cy="236" r="7" />
      </g>
      <!-- the enlarged row: lead story (pixel) -->
      <g transform="translate(120 528)">
        <rect
          v-for="c in 8"
          :key="c"
          :x="(c - 1) * 120"
          y="0"
          width="88"
          height="88"
          :fill="c === 6 ? '#E98C55' : '#2B36B5'"
        />
      </g>
      <!-- ink waveform (paper) -->
      <path
        d="M40 320c60-96 120-96 180 0s120 96 180 0 120-96 180 0 120 96 180 0 120-96 180 0 120 96 180 0 100-80 180 0"
        fill="none"
        stroke="#1C1A16"
        stroke-width="3"
      />
      <!-- salmon ruler ticks along the top (paper) -->
      <g stroke="#AE4A17" stroke-width="3">
        <path v-for="t in 10" :key="t" :d="`M${60 + (t - 1) * 120} 40v${t % 2 ? 26 : 14}`" />
      </g>
    </g>

    <!-- ================= plate-margins — ledger text, torn edge, blue stair -->
    <g v-else-if="art === 'plate-margins'">
      <!-- ledger bars: the book's own contents (paper) -->
      <g fill="#1C1A16">
        <rect v-for="(w, i) in [860, 910, 780, 920, 640, 900, 890, 560, 920, 870, 700, 910, 420]" :key="i" :x="150" :y="168 + i * 44" :width="w" :height="12" />
      </g>
      <!-- fine appendix rules (paper) -->
      <g stroke="#57503F" stroke-width="2">
        <path d="M150 760h760M150 784h540M150 808h680" />
      </g>
      <!-- torn fore-edge (paper) -->
      <path
        d="M96 60l22 74-38 66 30 82-40 74 34 88-44 80 38 84-30 76 42 86-24 70h-70V60Z"
        fill="#EAE3D3"
        stroke="#57503F"
        stroke-width="2"
      />
      <!-- ultramarine stair: the one purchased colour (pixel) -->
      <g fill="#2B36B5">
        <rect x="330" y="668" width="56" height="56" />
        <rect x="386" y="612" width="56" height="56" />
        <rect x="442" y="556" width="56" height="56" />
        <rect x="498" y="500" width="56" height="56" />
        <rect x="554" y="444" width="56" height="56" />
        <rect x="610" y="388" width="56" height="56" />
      </g>
      <!-- salmon end-mark -->
      <rect x="610" y="322" width="56" height="56" fill="#E98C55" />
      <!-- page number -->
      <path d="M980 830h96M980 850h54" stroke="#1C1A16" stroke-width="2" />
    </g>

    <!-- Unknown asset id — a quiet placeholder ruled plate, never a crash -->
    <g v-else>
      <path d="M0 450h1200" stroke="#D8D0BD" stroke-width="2" />
      <path d="M0 470h1200" stroke="#D8D0BD" stroke-width="2" />
      <rect x="560" y="410" width="80" height="80" fill="none" stroke="#8C8271" stroke-width="2" />
    </g>
  </svg>
</template>
