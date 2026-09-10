<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// UI icons — original 2px-stroke SVG glyphs (DD §9: no emoji, coherent set).
defineProps<{ name: 'compass' | 'flag' | 'mountain' | 'wave' | 'check' | 'clue' | 'stamp' | 'drag'; size?: number }>();
</script>

<template>
  <svg
    :width="size ?? 18"
    :height="size ?? 18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'compass'">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5Z" />
    </template>
    <template v-else-if="name === 'flag'">
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </template>
    <template v-else-if="name === 'mountain'">
      <path d="M3 19 9.5 7l3.5 6 2.5-4L21 19Z" />
    </template>
    <template v-else-if="name === 'wave'">
      <path d="M3 8c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0" />
      <path d="M3 15c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="M4.5 12.5 10 18 19.5 6.5" />
    </template>
    <template v-else-if="name === 'clue'">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </template>
    <template v-else-if="name === 'stamp'">
      <circle cx="12" cy="12" r="8.5" stroke-dasharray="3.2 2.6" />
      <path d="M12 7.5 13.4 11l3.6.3-2.7 2.4.8 3.6L12 15.3 8.9 17.3l.8-3.6L7 11.3 10.6 11Z" />
    </template>
    <template v-else-if="name === 'drag'">
      <path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" stroke-width="3" />
    </template>
  </svg>
</template>
