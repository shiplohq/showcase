<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Review quiz: 4-option questions, gentle feedback with an explanation for
// every answer, no timer, restartable. Progress dots mirror the pathway
// screens (mono numerals — consistent visual language).
import { computed, onMounted, ref, watch } from 'vue';
import type { LabData } from '../../lib/types';
import { answer, next, restart, score, startQuiz } from './engine';
import { mountFade } from '../../lib/gsap';

const props = defineProps<{
  data: LabData;
  best: number;
}>();

const emit = defineEmits<{
  (e: 'quizScore', correct: number, total: number): void;
}>();

const screenEl = ref<HTMLElement | null>(null);
onMounted(() => {
  if (screenEl.value) mountFade(screenEl.value);
});

const state = ref(startQuiz(props.data.quiz.length));
const lastResult = ref<'correct' | 'wrong' | null>(null);
const announced = ref(false);

const question = computed(() => props.data.quiz[state.value.index]);

const chosen = computed(() => state.value.picks[state.value.index] ?? null);

const finalScore = computed(() => score(state.value, props.data.quiz));

const choose = (i: number) => {
  if (chosen.value !== null || state.value.finished) return;
  const res = answer(state.value, question.value, i);
  state.value = res.state;
  lastResult.value = res.result.kind;
  announced.value = true;
};

const goNext = () => {
  state.value = next(state.value);
  lastResult.value = null;
  announced.value = false;
};

const restartRun = () => {
  state.value = restart(props.data.quiz.length);
  lastResult.value = null;
  announced.value = false;
};

const finishMessage = computed(() => {
  const s = finalScore.value;
  const total = props.data.quiz.length;
  if (s === total) return 'Perfect round — the atlas is yours.';
  if (s >= total * 0.7) return 'Strong round — a couple of routes still need a walk.';
  if (s >= total * 0.4) return 'A good start — revisit the layers and try again.';
  return 'First pass done — explore the systems, then come back.';
});

// report the final score once when the run finishes
watch(
  () => state.value.finished,
  (fin) => {
    if (fin) emit('quizScore', finalScore.value, props.data.quiz.length);
  },
);
</script>

<template>
  <section ref="screenEl" class="screen quiz" aria-labelledby="quiz-title">
    <div class="screen-head">
      <div>
        <p class="eyebrow">REVIEW QUIZ</p>
        <h2 id="quiz-title">Check what stuck.</h2>
      </div>
      <p class="head-note">
        {{ data.quiz.length }} quick questions. Every answer comes with the why — no
        timer, no scoreboards.
      </p>
    </div>

    <div class="quiz-grid">
      <div v-if="!state.finished" class="panel quiz-card">
        <ol class="progress" aria-hidden="true">
          <li
            v-for="(q, i) in data.quiz"
            :key="q.id"
            :class="{ done: state.picks[i] !== null, current: i === state.index }"
          >
            {{ String(i + 1).padStart(2, '0') }}
          </li>
        </ol>
        <p class="q-count mono-note" aria-live="polite">
          QUESTION {{ state.index + 1 }} OF {{ data.quiz.length }}
        </p>
        <h3 class="q-prompt">{{ question.prompt }}</h3>

        <div class="options" role="group" :aria-label="`Options for question ${state.index + 1}`">
          <button
            v-for="(opt, i) in question.options"
            :key="i"
            type="button"
            class="option"
            :class="{
              chosen: chosen === i,
              correct: chosen !== null && i === question.answer,
              wrong: chosen === i && i !== question.answer,
            }"
            :aria-label="`${String.fromCharCode(65 + i)}. ${opt}`"
            @click="choose(i)"
          >
            <span class="option-key" aria-hidden="true">{{ String.fromCharCode(65 + i) }}</span>
            <span>{{ opt }}</span>
            <span
              v-if="chosen !== null && i === question.answer"
              class="option-mark"
              aria-hidden="true"
              >✓</span
            >
            <span
              v-else-if="chosen === i && i !== question.answer"
              class="option-mark"
              aria-hidden="true"
              >↺</span
            >
          </button>
        </div>

        <div v-if="lastResult" class="explain" :class="lastResult" role="status">
          <strong>{{ lastResult === 'correct' ? 'Right.' : 'Not this one.' }}</strong>
          {{ question.explain }}
        </div>

        <div class="quiz-actions">
          <button
            type="button"
            class="btn btn-solid"
            :disabled="chosen === null"
            @click="goNext"
          >
            {{ state.index === data.quiz.length - 1 ? 'See the round' : 'Next question' }}
          </button>
        </div>
      </div>

      <div v-else class="panel quiz-summary">
        <p class="eyebrow">ROUND COMPLETE</p>
        <p class="score-line">
          <span class="score-num">{{ finalScore }}</span>
          <span class="score-frac">/ {{ data.quiz.length }}</span>
        </p>
        <p class="finish-message">{{ finishMessage }}</p>
        <p class="mono-note">BEST SO FAR — {{ Math.max(best, finalScore) }} / {{ data.quiz.length }}</p>
        <div class="quiz-actions">
          <button type="button" class="btn btn-solid" @click="restartRun">Run it again</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.head-note {
  color: var(--ink-soft);
  max-width: 44ch;
  font-size: 15px;
}

.quiz-grid {
  max-width: 720px;
  margin-inline: auto;
}

.quiz-card,
.quiz-summary {
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}

.progress {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s1);
  margin: 0;
  padding: 0;
}

.progress li {
  min-width: 34px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--hairline);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-soft);
  background: var(--paper);
}

.progress li.done {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper-raised);
}

.progress li.current {
  border-color: var(--ink);
  border-width: 2px;
  color: var(--ink);
}

.q-prompt {
  font-size: 22px;
  max-width: 40ch;
}

.options {
  display: flex;
  flex-direction: column;
  gap: var(--s2);
}

.option {
  display: flex;
  align-items: center;
  gap: var(--s3);
  min-height: 52px;
  padding: var(--s2) var(--s4);
  border: var(--hairline);
  border-radius: 8px;
  background: var(--paper-raised);
  text-align: left;
  font-size: 16px;
  transition: border-color var(--dur-feedback) var(--ease), background var(--dur-feedback) var(--ease);
}

.option:hover:not(:disabled) {
  border-color: var(--ink-soft);
}

.option.correct {
  border-color: var(--ok);
  background: #e7ede2;
}

.option.wrong {
  border-color: var(--warn);
  background: #f3e8d8;
}

.option-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-soft);
  flex-shrink: 0;
}

.option.correct .option-key {
  border-color: var(--ok);
  color: var(--ok);
}

.option.wrong .option-key {
  border-color: var(--warn);
  color: var(--warn);
}

.option-mark {
  margin-left: auto;
  font-weight: 600;
}

.option.correct .option-mark {
  color: var(--ok);
}

.option.wrong .option-mark {
  color: var(--warn);
}

.explain {
  padding: var(--s3);
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.55;
}

.explain.correct {
  background: #e7ede2;
  color: var(--ok);
}

.explain.wrong {
  background: #f3e8d8;
  color: var(--warn);
}

.quiz-actions {
  display: flex;
  justify-content: flex-end;
}

.score-line {
  display: flex;
  align-items: baseline;
  gap: var(--s2);
}

.score-num {
  font-family: var(--font-display);
  font-size: 64px;
  font-weight: 600;
  line-height: 1;
}

.score-frac {
  font-family: var(--font-mono);
  font-size: 18px;
  color: var(--ink-soft);
}

.finish-message {
  font-size: 18px;
  max-width: 40ch;
}
</style>
