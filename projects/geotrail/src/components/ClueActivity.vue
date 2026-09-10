<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Clue: clues reveal one at a time; each revealed relation also appears on
// the map (outline + direction arrow — never an arrow to the answer). More
// clues are always free; wrong picks add the hint instead of a penalty.
import { computed } from 'vue';
import type { ClueStop, Place } from '../lib/types';
import { clueText } from '../features/trail/engine';
import AppIcon from './AppIcon.vue';

const props = defineProps<{
  stop: ClueStop;
  byId: Map<string, Place>;
  revealed: number;
  disabled: boolean;
  feedbackState: 'idle' | 'correct' | 'try-again';
  lastPicked: string | null;
}>();

defineEmits<{ answer: [placeId: string]; reveal: [] }>();

const revealedClues = computed(() => props.stop.clues.slice(0, props.revealed));
const canReveal = computed(() => !props.disabled && props.revealed < props.stop.clues.length);
const options = computed(() => props.stop.options.map((id) => props.byId.get(id)).filter((p): p is Place => !!p));
</script>

<template>
  <div class="clue-activity">
    <ol class="clue-list" :aria-label="`Clues for this question, ${revealed} of ${stop.clues.length} shown`">
      <li v-for="(c, i) in revealedClues" :key="i" class="clue-item">
        <span class="n" aria-hidden="true">{{ i + 1 }}</span>
        <span>{{ clueText(c, byId) }}</span>
      </li>
    </ol>

    <button
      v-if="canReveal"
      type="button"
      class="clue-more"
      @click="$emit('reveal')"
    >
      <AppIcon name="clue" :size="16" />
      Reveal another clue
    </button>
    <p v-else-if="!disabled" class="drag-hint">All clues are out — the map highlights show where to look.</p>

    <div class="compare-q">
      <button
        v-for="p in options"
        :key="'opt-' + p.id"
        type="button"
        class="option-btn"
        :class="{
          'is-answer': feedbackState === 'correct' && p.id === stop.answer,
          'was-tried': feedbackState === 'try-again' && p.id === lastPicked,
        }"
        :disabled="disabled"
        @click="$emit('answer', p.id)"
      >
        <span>{{ p.name }}</span>
        <span class="mark" aria-hidden="true">answer</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.clue-activity {
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}

.option-btn.is-answer {
  border-color: var(--forest);
}

.option-btn.was-tried {
  border-style: dashed;
  border-color: var(--terra);
}
</style>
