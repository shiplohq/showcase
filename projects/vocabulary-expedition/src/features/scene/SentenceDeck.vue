<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Sentence deck — magnetic words fill the blank; the child presses Check
// (agency — never auto-judged). Solved sentences join the field dialogue with
// their Vietnamese line. The chip → blank move uses GSAP Flip (spec).

import { computed } from 'vue';
import { nextTick } from 'vue';
import type { UnitData } from '../../lib/types';
import type { SentenceState } from '../sentences/engine';
import { currentSentence, sentenceParts, wordOf } from '../sentences/engine';
import { Flip, prefersReducedMotion } from '../../lib/gsap';
import AppIcon from '../../components/AppIcon.vue';

const props = defineProps<{ unit: UnitData; state: SentenceState; showVi: boolean }>();
const emit = defineEmits<{
  place: [itemId: string | null];
  check: [];
  next: [];
  scrapbook: [];
}>();

const sentence = computed(() => currentSentence(props.unit, props.state));
const parts = computed(() => sentenceParts(sentence.value));
/** True when the text after the blank starts with punctuation — collapses the
 *  flex gap so "picture !" never gains a hole (impeccable P3). */
const tightAfter = computed(() => /^[!.,;:?]/.test(parts.value.after));
const solvedCards = computed(() =>
  props.state.solved.map((id) => props.unit.sentences.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => Boolean(s)),
);

/** Flip the picked chip into the blank (shared data-flip-id), reduced-motion safe. */
function place(itemId: string): void {
  if (props.state.feedback === 'correct') return;
  const state = prefersReducedMotion() ? null : Flip.getState('[data-flip-id]');
  emit('place', itemId);
  void nextTick(() => {
    if (!state) return;
    Flip.from(state, {
      duration: 0.3,
      ease: 'power2.out',
      targets: `[data-flip-id="chip-${itemId}"]`,
      absolute: true,
      scale: false,
    });
  });
}
</script>

<template>
  <div class="dock-head">
    <h2>Build a sentence</h2>
    <span class="count">{{ state.solved.length }}/{{ state.order.length }} done</span>
  </div>

  <template v-if="!state.done || state.feedback === 'correct'">
    <p class="sentence" aria-label="Sentence with a blank. Choose the word that fits.">
      <span>{{ parts.before }}</span>
      <button
        type="button"
        class="blank"
        :class="{ 'blank--filled': state.blank, 'blank--tight': tightAfter }"
        :aria-label="state.blank ? `Blank holds the word ${wordOf(unit, state.blank)}. Tap to remove it.` : 'Empty blank. Choose a word below.'"
        @click="emit('place', null)"
      >
        <span v-if="state.blank" :data-flip-id="`chip-${state.blank}`" class="blank-word">{{ wordOf(unit, state.blank) }}</span>
        <span v-else class="blank-hole" aria-hidden="true">＿＿＿</span>
      </button>
      <span>{{ parts.after }}</span>
    </p>

    <div class="chip-row">
      <button
        v-for="id in state.chips"
        :key="id"
        type="button"
        class="chip"
        :class="{ 'chip--held': state.blank === id }"
        :data-flip-id="`chip-${id}`"
        :aria-label="`word: ${wordOf(unit, id)}`"
        :disabled="state.feedback === 'correct'"
        @click="place(id)"
      >
        {{ wordOf(unit, id) }}
      </button>
    </div>

    <div v-if="state.feedback === 'nudge'" class="feedback-strip" data-kind="nudge">
      <AppIcon name="glass" :size="20" />
      <span>Almost! Read the sentence again and try another word.</span>
    </div>
    <div v-else-if="state.feedback === 'correct'" class="feedback-strip" data-kind="correct">
      <AppIcon name="leaf" :size="20" />
      <span>Great sentence! “{{ sentence.full }}”</span>
    </div>

    <div class="actions">
      <button
        v-if="state.feedback !== 'correct'"
        class="btn btn--primary"
        type="button"
        :disabled="!state.blank"
        @click="emit('check')"
      >
        <AppIcon name="check" :size="22" />
        Check
      </button>
      <button v-else-if="!state.done" class="btn btn--primary" type="button" @click="emit('next')">
        Next sentence
        <AppIcon name="chat" :size="20" />
      </button>
      <button v-else class="btn btn--primary" type="button" @click="emit('scrapbook')">
        <AppIcon name="book" :size="22" />
        See it in the scrapbook
      </button>
    </div>
  </template>

  <!-- field dialogue — the sentences the child built -->
  <ul v-if="solvedCards.length" class="dialogue" aria-label="Sentences you built">
    <li v-for="s in solvedCards" :key="s.id" class="dialogue-card">
      <p class="line">“{{ s.full }}”</p>
      <p v-if="showVi" class="vi" lang="vi">{{ s.translation }}</p>
    </li>
  </ul>
</template>

<style scoped>
.sentence {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
}

.blank {
  font: inherit;
  min-width: 110px;
  min-height: 48px;
  border: 2.5px dashed var(--lake);
  border-radius: 10px;
  background: #eef6f4;
  color: var(--lake-deep);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 12px;
}

.blank--filled {
  border-style: solid;
  border-color: var(--lake-deep);
  color: var(--ink);
}

.blank-hole {
  letter-spacing: 2px;
  opacity: 0.6;
}

.blank--tight {
  margin-right: -6px;
}

.actions {
  display: flex;
  gap: var(--s3);
  flex-wrap: wrap;
}

.dialogue {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s2);
}

.dialogue-card {
  background: var(--plate);
  border: 1.5px solid var(--line);
  border-radius: 4px 14px 14px 4px;
  padding: var(--s2) var(--s4);
}

.dialogue-card .line {
  margin: 0;
  font-weight: 700;
}

.dialogue-card .vi {
  margin: 2px 0 0;
  font-size: 14px;
}
</style>
