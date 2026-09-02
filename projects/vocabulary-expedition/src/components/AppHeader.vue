<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Journal header — expedition title, back-to-map, scrapbook, sound + VI layer
// toggles, reset. Everything is a real button ≥48px; no hover-only affordances.

import AppIcon from './AppIcon.vue';

defineProps<{
  foundCount: number;
  scenesDone: number;
  sound: boolean;
  translation: boolean;
  showBack: boolean;
}>();

const emit = defineEmits<{
  back: [];
  scrapbook: [];
  'toggle-sound': [];
  'toggle-translation': [];
  reset: [];
}>();
</script>

<template>
  <header class="app-header">
    <button
      v-if="showBack"
      class="btn btn--icon"
      type="button"
      aria-label="Back to the expedition map"
      @click="emit('back')"
    >
      <AppIcon name="back" :size="24" />
    </button>

    <h1 class="title">
      Vocabulary Expedition
      <small>{{ scenesDone }} scenes stamped · {{ foundCount }} words found</small>
    </h1>

    <span class="spacer" />

    <button
      class="btn"
      type="button"
      :aria-pressed="translation"
      :aria-label="translation ? 'Vietnamese help layer: on. Tap to hide translations.' : 'Vietnamese help layer: off. Tap to show translations.'"
      :title="translation ? 'Vietnamese help: on' : 'Vietnamese help: off'"
      @click="emit('toggle-translation')"
    >
      <AppIcon name="flag-vi" :size="24" />
      VI
    </button>

    <button
      class="btn btn--icon"
      type="button"
      :aria-pressed="sound"
      :aria-label="sound ? 'Sound: on. Tap to turn sounds off.' : 'Sound: off. Tap to turn sounds on.'"
      :title="sound ? 'Sound: on' : 'Sound: off'"
      @click="emit('toggle-sound')"
    >
      <AppIcon :name="sound ? 'speaker' : 'speaker-off'" :size="24" />
    </button>

    <button class="btn" type="button" @click="emit('scrapbook')">
      <AppIcon name="book" :size="22" />
      Scrapbook
    </button>

    <button
      class="btn btn--icon btn--ghost"
      type="button"
      aria-label="Reset expedition progress"
      title="Reset expedition"
      @click="emit('reset')"
    >
      <AppIcon name="refresh" :size="22" />
    </button>
  </header>
</template>
