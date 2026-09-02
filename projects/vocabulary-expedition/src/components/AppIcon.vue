<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script lang="ts">
// UI icon set — hand-drawn SVG strokes (2px), no raster, no emoji.
// Icons carry meaning alongside color/text (never color-only states).

export type IconName =
  | 'glass'
  | 'tag'
  | 'chat'
  | 'eye'
  | 'check'
  | 'leaf'
  | 'pin'
  | 'speaker'
  | 'speaker-off'
  | 'book'
  | 'back'
  | 'refresh'
  | 'sparkle'
  | 'flag-vi';
</script>

<script setup lang="ts">
defineProps<{ name: IconName; size?: number }>();
</script>

<template>
  <svg
    :width="size ?? 22"
    :height="size ?? 22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <!-- magnifier — clue hunt -->
    <template v-if="name === 'glass'">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 L21 21" />
    </template>

    <!-- label tag — word match -->
    <template v-else-if="name === 'tag'">
      <path d="M3.5 12.5 L11 5 a2 2 0 0 1 2.8 0 l5.2 5.2 a2 2 0 0 1 0 2.8 L12 18 a2 2 0 0 1 -2.8 0 z" />
      <circle cx="8.5" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
    </template>

    <!-- speech bubbles — sentence builder -->
    <template v-else-if="name === 'chat'">
      <path d="M4 6 a2 2 0 0 1 2 -2 h9 a2 2 0 0 1 2 2 v6 a2 2 0 0 1 -2 2 h-6 l-4 3.5 v-3.5 h-1 a2 2 0 0 1 -2 -2 z" />
      <path d="M19 9 h1 a2 2 0 0 1 2 2 v5 a2 2 0 0 1 -2 2 h-1 v3 l-3.5 -3" />
    </template>

    <!-- eye — look around -->
    <template v-else-if="name === 'eye'">
      <path d="M2.5 12 c3 -5.5 6.5 -7.5 9.5 -7.5 s6.5 2 9.5 7.5 c-3 5.5 -6.5 7.5 -9.5 7.5 s-6.5 -2 -9.5 -7.5 z" />
      <circle cx="12" cy="12" r="3" />
    </template>

    <template v-else-if="name === 'check'">
      <path d="M4.5 12.5 l5 5 L19.5 7" />
    </template>

    <template v-else-if="name === 'leaf'">
      <path d="M5 19 C5 9 12 4 20 4 C20 14 14 19 6.5 19 z" />
      <path d="M5 19 C8 14 12 10.5 17 7.5" />
    </template>

    <template v-else-if="name === 'pin'">
      <path d="M12 21 v-7" />
      <path d="M8.5 3.5 h7 l-1 6.5 2.5 3 h-10 l2.5 -3 z" />
    </template>

    <template v-else-if="name === 'speaker'">
      <path d="M4 9.5 v5 h3.5 L13 19 V5 L7.5 9.5 z" />
      <path d="M16 9 c1.5 1.5 1.5 4.5 0 6" />
      <path d="M18.5 6.5 c3 3 3 8 0 11" />
    </template>

    <template v-else-if="name === 'speaker-off'">
      <path d="M4 9.5 v5 h3.5 L13 19 V5 L7.5 9.5 z" />
      <path d="M16.5 9.5 l5 5 M21.5 9.5 l-5 5" />
    </template>

    <template v-else-if="name === 'book'">
      <path d="M4 5.5 a2 2 0 0 1 2 -2 h5.5 v17 h-5.5 a2 2 0 0 1 -2 -2 z" />
      <path d="M20 5.5 a2 2 0 0 0 -2 -2 h-5.5 v17 h5.5 a2 2 0 0 0 2 -2 z" />
    </template>

    <template v-else-if="name === 'back'">
      <path d="M14.5 5 L7.5 12 l7 7" />
      <path d="M7 12 h12" />
    </template>

    <template v-else-if="name === 'refresh'">
      <path d="M4.5 12 a7.5 7.5 0 0 1 13 -5.2 L20.5 9" />
      <path d="M20.5 4.5 V9 h-4.5" />
      <path d="M19.5 12 a7.5 7.5 0 0 1 -13 5.2 L3.5 15" />
      <path d="M3.5 19.5 V15 h4.5" />
    </template>

    <template v-else-if="name === 'sparkle'">
      <path d="M12 3.5 c1 4.5 2.5 6 7 7 -4.5 1 -6 2.5 -7 7 -1 -4.5 -2.5 -6 -7 -7 4.5 -1 6 -2.5 7 -7 z" />
      <path d="M19 16.5 c.4 1.8 1 2.4 2.8 2.8 -1.8 .4 -2.4 1 -2.8 2.8 -.4 -1.8 -1 -2.4 -2.8 -2.8 1.8 -.4 2.4 -1 2.8 -2.8 z" />
    </template>

    <!-- VI layer flag — small marker, not a real flag -->
    <template v-else-if="name === 'flag-vi'">
      <path d="M6 21 V4" />
      <path d="M6 5 h11 l-2.5 3.5 L17 12 H6" />
    </template>
  </svg>
</template>
