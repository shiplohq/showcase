<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
import AppIcon from './AppIcon.vue';

defineProps<{ state: 'idle' | 'correct' | 'try-again'; text: string }>();
</script>

<template>
  <p
    v-if="text"
    class="feedback"
    :data-state="state"
    aria-live="polite"
  >
    <AppIcon :name="state === 'correct' ? 'check' : 'compass'" :size="20" class="fb-icon" />
    <span>{{ text }}</span>
  </p>
  <p v-else class="feedback" data-state="idle" aria-live="polite">
    <AppIcon name="clue" :size="20" class="fb-icon" />
    <span class="visually-hidden">Waiting for your answer.</span>
    <span aria-hidden="true" class="microcopy">Pick an answer on the map or in the list.</span>
  </p>
</template>
