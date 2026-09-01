<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Line icons drawn in this project — 24px grid, 2px stroke, currentColor.
// No emoji-as-icon (spec), no icon font, no external icon set.
withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 });

export type IconName = 'check' | 'spoon' | 'arrow' | 'book' | 'stack' | 'ticket';
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-if="name === 'check'" d="M4 13 L9.5 18.5 L20 6" />
    <path v-else-if="name === 'spoon'" d="M14.5 3.5 a4.8 4.8 0 0 1 0 9.6 c-1.1 0 -2.1 -0.4 -2.9 -1 L7 16.7 a1.6 1.6 0 1 1 -2.3 -2.3 L9.3 9.8 a4.8 4.8 0 0 1 5.2 -6.3 Z" />
    <path v-else-if="name === 'arrow'" d="M4 12 H20 M13 5 L20 12 L13 19" />
    <path v-else-if="name === 'book'" d="M4 5.5 A2.5 2.5 0 0 1 6.5 3 H20 V21 H6.5 A2.5 2.5 0 0 1 4 18.5 Z M8 3 V21" />
    <path v-else-if="name === 'stack'" d="M12 3 L21 8 L12 13 L3 8 Z M3 12 L12 17 L21 12" />
    <path v-else-if="name === 'ticket'" d="M4 8 a2 2 0 0 0 2 -2 h12 a2 2 0 0 0 2 2 v2 a2 2 0 0 0 0 4 v2 a2 2 0 0 0 -2 2 h-12 a2 2 0 0 0 -2 -2 v-2 a2 2 0 0 0 0 -4 Z" />
  </svg>
</template>
