<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Pip — the sparrow expedition guide (gouache mascot, one shared vector for
// map, clue deck and scrapbook). Decorative: aria-hidden, meaning is text.
withDefaults(defineProps<{ size?: number }>(), { size: 48 });
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    aria-hidden="true"
    focusable="false"
    class="pip"
  >
    <!-- explorer hat -->
    <path d="M14 26 q2 -12 18 -12 q16 0 18 12 z" fill="#e08a3c" stroke="#4a3527" stroke-width="2" stroke-linejoin="round" />
    <path d="M10 26 q22 6 44 0 l0 4 q-22 6 -44 0 z" fill="#f2c14e" stroke="#4a3527" stroke-width="2" stroke-linejoin="round" />
    <!-- head + body -->
    <ellipse cx="32" cy="38" rx="15" ry="14" fill="#e8d9bd" stroke="#4a3527" stroke-width="2" />
    <path d="M24 50 q-8 6 -12 5 q3 -7 8 -9 z" fill="#e8d9bd" stroke="#4a3527" stroke-width="2" stroke-linejoin="round" />
    <!-- wing dab (gouache detail) -->
    <path d="M36 36 q8 -2 10 5 q-7 4 -11 1 z" fill="#c9b290" stroke="#4a3527" stroke-width="1.6" stroke-linejoin="round" />
    <!-- eye + beak -->
    <circle cx="38" cy="34" r="2.6" fill="#4a3527" />
    <path d="M47 37 l9 3 l-9 3 z" fill="#f2c14e" stroke="#4a3527" stroke-width="1.6" stroke-linejoin="round" />
    <!-- tail -->
    <path d="M18 44 l-9 6 l11 1 z" fill="#c9b290" stroke="#4a3527" stroke-width="1.6" stroke-linejoin="round" />
  </svg>
</template>

<style scoped>
.pip {
  flex: none;
}
</style>
