<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// One raised sheet per stop: route stepper, stop kind, the question, the
// activity (slot), feedback and the advance action. No card soup — the
// sheet is the only panel on the trail screen.
import AppIcon from './AppIcon.vue';
import FeedbackLine from './FeedbackLine.vue';

defineProps<{
  stepKind: 'locate' | 'compare' | 'clue';
  prompt: string;
  stopNumber: number;
  stopTotal: number;
  stepper: { n: number; done: boolean; current: boolean }[];
  feedbackState: 'idle' | 'correct' | 'try-again';
  feedbackText: string;
  finished: boolean;
  statusText: string;
}>();

defineEmits<{ next: [] }>();

const KIND_META: Record<'locate' | 'compare' | 'clue', { label: string; icon: 'compass' | 'wave' | 'clue' }> = {
  locate: { label: 'Locate', icon: 'compass' },
  compare: { label: 'Compare', icon: 'wave' },
  clue: { label: 'Clue', icon: 'clue' },
};
</script>

<template>
  <section class="mission" aria-labelledby="mission-prompt">
    <p class="visually-hidden" role="status">{{ statusText }}</p>

    <div class="stepper" aria-hidden="true">
      <template v-for="(s, i) in stepper" :key="s.n">
        <span class="seg" v-if="i > 0" :class="{ done: s.done || s.current }" />
        <span
          class="node"
          :class="{ done: s.done, current: s.current }"
        />
      </template>
    </div>

    <div class="stop-kind">
      <AppIcon :name="KIND_META[stepKind].icon" :size="16" />
      <span>{{ KIND_META[stepKind].label }} · stop {{ stopNumber }} of {{ stopTotal }}</span>
    </div>

    <h3 id="mission-prompt" class="prompt">{{ prompt }}</h3>

    <slot />

    <FeedbackLine :state="feedbackState" :text="feedbackText" />

    <div v-if="finished" class="mission-actions">
      <p class="microcopy">Trail complete — every stop answered. Your stamps are in the passport.</p>
    </div>
    <div v-else-if="feedbackState === 'correct'" class="mission-actions">
      <button type="button" class="btn btn-primary" @click="$emit('next')">
        Next stop
        <AppIcon name="flag" :size="16" />
      </button>
    </div>
  </section>
</template>
