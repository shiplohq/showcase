<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Mini system glyphs (bone / heart / lungs / stomach / brain) — hand-authored
// stroke icons in the same line weight as the body plate. Never used as the
// sole carrier of meaning (names + labels always pair).
import { computed } from 'vue';
import type { SystemId } from '../lib/types';

const props = defineProps<{ system: SystemId | 'node'; size?: number }>();

const paths = computed<Record<string, string[]>>(() => ({
  skeletal: [
    'M 8.1 8.1 L 15.9 15.9',
    'M 6.2 6.2 m -2.3 0 a 2.3 2.3 0 1 0 4.6 0 a 2.3 2.3 0 1 0 -4.6 0',
    'M 9.9 2.5 m -2.3 0 a 2.3 2.3 0 1 0 4.6 0 a 2.3 2.3 0 1 0 -4.6 0',
    'M 14.1 21.5 m -2.3 0 a 2.3 2.3 0 1 0 4.6 0 a 2.3 2.3 0 1 0 -4.6 0',
    'M 17.8 17.8 m -2.3 0 a 2.3 2.3 0 1 0 4.6 0 a 2.3 2.3 0 1 0 -4.6 0',
  ],
  circulatory: [
    'M12 20 C 7 16 4 12.5 4 9.5 C 4 7 6 5.5 8 5.5 C 9.7 5.5 11.2 6.6 12 8 C 12.8 6.6 14.3 5.5 16 5.5 C 18 5.5 20 7 20 9.5 C 20 12.5 17 16 12 20 Z',
  ],
  respiratory: [
    'M12 3.5 L12 9',
    'M12 9 C 8.5 9 7 11 6.4 14 C 5.8 17.2 6.8 19.5 8.4 19.5 C 10 19.5 10.4 17.4 10.4 14.4 L10.4 11.5',
    'M12 9 C 15.5 9 17 11 17.6 14 C 18.2 17.2 17.2 19.5 15.6 19.5 C 14 19.5 13.6 17.4 13.6 14.4 L13.6 11.5',
  ],
  digestive: [
    'M7.5 4.5 C 4.8 6.2 4 10 5.5 13.2 C 7 16.5 10.8 18.6 13.8 17.2 C 16.2 16.1 16.6 13.2 19.4 13.8',
  ],
  nervous: [
    'M9 5 C 6 5 5 7 5.5 8.5 C 4 9.5 4 12 5.5 12.8 C 5 15 7 17 9 16 L 15 16 C 17.5 16 18.6 13.4 17.4 11.9 C 19 10.4 18 7.4 15.8 7.2 C 15.5 5.4 13 4.3 11.5 5.4 C 10.8 4.9 10 5 9 5 Z',
    'M8.2 9.2 C 9.6 8.1 11 10.2 12.8 8.9',
    'M9.5 12.5 C 11 11.5 12.4 13.4 14.2 12.2',
  ],
  node: ['M12 8 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0', 'M12 11 L12 17', 'M9 20 L15 20'],
}));

const strokeWidth = computed<Record<string, number>>(() => ({
  skeletal: 1.8,
  circulatory: 1.8,
  respiratory: 1.8,
  digestive: 2,
  nervous: 1.6,
  node: 1.8,
}));

/** Bone glyph: the four lobes are filled, the shaft is stroked. */
const filled = computed(() => props.system === 'skeletal');
</script>

<template>
  <svg
    :width="size ?? 22"
    :height="size ?? 22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth[system] ?? 1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="(d, i) in paths[system] ?? paths.node"
      :key="i"
      :d="d"
      :fill="filled && i > 0 ? 'currentColor' : 'none'"
    />
  </svg>
</template>
