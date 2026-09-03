<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Pathway game: pick the next stop in the oxygen / food / blood sequences.
// Correct → the route segment draws on along the plate; wrong → a gentle
// hint that re-grounds the previous step (never punitive, no timer).
import { computed, onMounted, ref } from 'vue';
import type { LabData, PathwayDef, StopDef, SystemId } from '../../lib/types';
import BodyPlate from '../../components/BodyPlate.vue';
import SystemGlyph from '../../components/SystemGlyph.vue';
import {
  choicesForPathway,
  pickStop,
  startRoute,
  type RouteState,
} from './engine';
import { mountFade } from '../../lib/gsap';

const props = defineProps<{
  data: LabData;
  completed: ReadonlySet<string>;
  /** Pathway to open first (organ-sheet link-out); defaults to the first one. */
  initialPathwayId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'completePathway', pathwayId: string): void;
  (e: 'inspectOrgan', organId: string): void;
}>();

const screenEl = ref<HTMLElement | null>(null);
onMounted(() => {
  if (screenEl.value) mountFade(screenEl.value);
});

const activePathwayId = ref<string>(
  props.initialPathwayId && props.data.pathways.some((p) => p.id === props.initialPathwayId)
    ? props.initialPathwayId
    : (props.data.pathways[0]?.id ?? ''),
);
const state = ref<RouteState>(startRoute());
const feedback = ref<{ kind: 'correct' | 'wrong'; text: string } | null>(null);

const pathway = computed<PathwayDef | null>(
  () => props.data.pathways.find((p) => p.id === activePathwayId.value) ?? null,
);

const INK: Record<string, string> = {
  slate: 'var(--slate)',
  sage: 'var(--sage)',
  oxblood: 'var(--oxblood)',
};

const choices = computed<StopDef[]>(() =>
  pathway.value ? choicesForPathway(props.data, pathway.value) : [],
);

/** stops to draw: the start freebie + everything confirmed (no duplicate head) */
const routeStops = computed<StopDef[]>(() => {
  if (!pathway.value) return [];
  const startId = pathway.value.steps[0].stop;
  const confirmed = state.value.confirmed.map(
    (id) => props.data.stops.find((t) => t.id === id)!,
  );
  if (confirmed.length === 0) {
    const start = props.data.stops.find((t) => t.id === startId);
    return start ? [start] : [];
  }
  if (confirmed[0].id === startId) return confirmed;
  const start = props.data.stops.find((t) => t.id === startId);
  return start ? [start, ...confirmed] : confirmed;
});

const currentStepNumber = computed(() => state.value.index + 1);
const lastExplanation = computed(() => {
  if (!pathway.value || state.value.confirmed.length === 0) return null;
  const i = state.value.confirmed.length - 1;
  const stop = props.data.stops.find((t) => t.id === state.value.confirmed[i]);
  return { stop, explanation: pathway.value.steps[i].explanation };
});

const selectPathway = (id: string) => {
  activePathwayId.value = id;
  state.value = startRoute();
  feedback.value = null;
};

const choose = (stopId: string) => {
  if (!pathway.value || state.value.done) return;
  const result = pickStop(props.data, pathway.value, state.value, stopId);
  state.value = result.state;
  if (result.kind === 'correct') {
    const stop = props.data.stops.find((t) => t.id === stopId);
    feedback.value = { kind: 'correct', text: `Correct — ${stop?.blurb ?? ''}` };
    if (result.state.done) {
      emit('completePathway', pathway.value.id);
    }
  } else {
    feedback.value = { kind: 'wrong', text: result.hint };
  }
};

const restart = () => {
  state.value = startRoute();
  feedback.value = null;
};

/** Unique stops for the recap inspect buttons (blood loop revisits the heart). */
const uniqueRouteStops = computed<StopDef[]>(() => {
  const seen = new Set<string>();
  return routeStops.value.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
});

const organOfStop = (stop: StopDef): SystemId | 'node' => {
  if (!stop.organId) return 'node';
  for (const sys of props.data.systems) {
    if (sys.organs.some((o) => o.id === stop.organId)) return sys.id;
  }
  return 'node';
};

const inspectStopOrgan = (stop: StopDef) => {
  if (stop.organId) emit('inspectOrgan', stop.organId);
};
</script>

<template>
  <section ref="screenEl" class="screen pathways" aria-labelledby="pathways-title">
    <div class="screen-head">
      <div>
        <p class="eyebrow">PATHWAY GAME</p>
        <h2 id="pathways-title">Route it through the body.</h2>
      </div>
      <p class="head-note">
        Pick the next stop in order. Wrong turns are part of the trip — read the hint and
        try again.
      </p>
    </div>

    <div class="pathway-picker" role="group" aria-label="Choose a pathway">
      <button
        v-for="p in data.pathways"
        :key="p.id"
        type="button"
        class="pathway-btn"
        :class="[`ink-${p.ink}`, { active: p.id === activePathwayId }]"
        :aria-pressed="p.id === activePathwayId"
        @click="selectPathway(p.id)"
      >
        <span class="pathway-title">{{ p.title }}</span>
        <span class="pathway-sub">{{ p.subtitle }} · {{ p.steps.length }} stops</span>
        <span v-if="completed.has(p.id)" class="pathway-done">
          <span aria-hidden="true">✓</span> completed</span>
      </button>
    </div>

    <div v-if="pathway" class="route-grid">
      <div class="plate-col">
        <BodyPlate
          :data="data"
          mode="pathway"
          :layers="new Set()"
          :route-stops="routeStops"
          :route-ink="INK[pathway.ink]"
          :route-finished="state.done"
        />
      </div>

      <div class="panel-col">
        <div class="panel intro-panel" :class="`ink-${pathway.ink}`">
          <h3 class="section-heading">{{ pathway.title }} — {{ pathway.subtitle }}</h3>
          <p v-if="!state.done && state.index === 0" class="intro-text">{{ pathway.intro }}</p>

          <!-- progress dots -->
          <ol class="progress" :aria-label="`Stop ${currentStepNumber} of ${pathway.steps.length}`">
            <li
              v-for="(_step, i) in pathway.steps"
              :key="i"
              :class="{ done: i < state.index, current: i === state.index && !state.done }"
            >
              <span class="progress-num">{{ String(i + 1).padStart(2, '0') }}</span>
            </li>
          </ol>

          <template v-if="!state.done">
            <p class="ask">
              Stop {{ currentStepNumber }} of {{ pathway.steps.length }}:
              <strong v-if="state.index === 0">where does the journey start?</strong>
              <strong v-else>where does it go next?</strong>
            </p>
            <div class="choices" role="group" aria-label="Possible next stops">
              <button
                v-for="stop in choices"
                :key="stop.id"
                type="button"
                class="choice"
                :class="{ shake: feedback?.kind === 'wrong' }"
                @click="choose(stop.id)"
              >
                <span class="choice-glyph" aria-hidden="true">
                  <SystemGlyph :system="organOfStop(stop)" :size="20" />
                </span>
                {{ stop.name }}
              </button>
            </div>
          </template>

          <div
            v-if="feedback && !state.done"
            class="feedback"
            :class="feedback.kind"
            role="status"
          >
            <span aria-hidden="true">{{ feedback.kind === 'correct' ? '✓' : '↺' }}</span>
            <span>{{ feedback.text }}</span>
          </div>

          <div v-if="lastExplanation && !state.done" class="last-step">
            <p class="mono-note">LAST STOP — {{ lastExplanation.stop?.name.toUpperCase() }}</p>
            <p>{{ lastExplanation.explanation }}</p>
          </div>

          <div v-if="state.done" class="recap" role="status">
            <p class="eyebrow">ROUTE COMPLETE</p>
            <p class="recap-text">{{ pathway.recap }}</p>
            <p class="mono-note">
              Wrong turns on this run: {{ state.totalWrong }} — they're how the map sticks.
            </p>
            <div class="recap-actions">
              <button
                v-for="stop in uniqueRouteStops"
                :key="stop.id"
                type="button"
                class="btn btn-ghost recap-organ"
                @click="inspectStopOrgan(stop)"
              >
                Inspect {{ stop.name }}
              </button>
              <button type="button" class="btn btn-solid" @click="restart">Run it again</button>
            </div>
          </div>
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

.pathway-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s2);
}

.pathway-btn {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 64px;
  padding: var(--s3);
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper-raised);
  text-align: left;
  transition: border-color var(--dur-feedback) var(--ease), background var(--dur-feedback) var(--ease);
}

.pathway-btn:hover {
  border-color: var(--ink-soft);
}

.pathway-btn.active {
  border-color: var(--ink-soft);
  background: var(--paper-deep);
  border-bottom-width: 2px;
}

/* Selected pathway: same underline language as the nav tabs, in the
   pathway's own ink (glyph + name carry the same meaning, not color alone). */
.pathway-btn.ink-slate.active {
  border-bottom-color: var(--slate);
}
.pathway-btn.ink-sage.active {
  border-bottom-color: var(--sage);
}
.pathway-btn.ink-oxblood.active {
  border-bottom-color: var(--oxblood);
}

.pathway-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

.pathway-sub {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.pathway-done {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--ok);
}

.route-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(300px, 5fr);
  gap: var(--s5);
  align-items: start;
}

.plate-col {
  min-width: 0;
  max-width: 560px;
}

.panel-col {
  min-width: 0;
}

.intro-panel {
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}

/* Pathway ink is carried by the section heading + progress dots (never a
   colored top-rule on a rounded panel — accent-border card anti-pattern). */
.intro-panel.ink-slate .section-heading {
  color: var(--slate);
}
.intro-panel.ink-sage .section-heading {
  color: var(--sage);
}
.intro-panel.ink-oxblood .section-heading {
  color: var(--oxblood);
}

.intro-text {
  font-size: 16.5px;
}

.progress {
  list-style: none;
  display: flex;
  gap: var(--s2);
  margin: 0;
  padding: 0;
}

.progress li {
  flex: 1;
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--hairline);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-soft);
  background: var(--paper);
}

.progress li.done {
  background: var(--route-ink, var(--ink));
  border-color: var(--route-ink, var(--ink));
  color: #fff;
}

.intro-panel.ink-slate .progress li.done {
  background: var(--slate);
  border-color: var(--slate);
}
.intro-panel.ink-sage .progress li.done {
  background: var(--sage);
  border-color: var(--sage);
}
.intro-panel.ink-oxblood .progress li.done {
  background: var(--oxblood);
  border-color: var(--oxblood);
}

.progress li.current {
  border-color: var(--ink);
  border-width: 2px;
  color: var(--ink);
  font-weight: 500;
}

.ask {
  margin: 0;
  font-size: 16.5px;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s2);
}

.choice {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
  min-height: 48px;
  padding: var(--s2) var(--s4);
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper-raised);
  font-weight: 500;
  transition: border-color var(--dur-feedback) var(--ease), background var(--dur-feedback) var(--ease);
}

.choice:hover {
  border-color: var(--ink);
  background: var(--paper-deep);
}

.choice-glyph {
  display: inline-flex;
  color: var(--ink-soft);
}

.feedback {
  display: flex;
  gap: var(--s2);
  align-items: baseline;
  padding: var(--s3);
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.5;
}

.feedback.correct {
  background: #e7ede2;
  color: var(--ok);
}

.feedback.wrong {
  background: #f3e8d8;
  color: var(--warn);
}

.last-step {
  border-top: var(--hairline);
  padding-top: var(--s3);
  font-size: 15px;
  color: var(--ink);
}

.recap {
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}

.recap-text {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 19px;
  line-height: 1.5;
}

.recap-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s2);
}

.recap-organ {
  min-height: 44px;
  padding: var(--s2) var(--s3);
  font-size: 14px;
}

@keyframes shake-x {
  0%,
  100% {
    transform: none;
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

.choice.shake {
  animation: shake-x 0.18s var(--ease) 2;
}

@media (prefers-reduced-motion: reduce) {
  .choice.shake {
    animation: none;
    border-color: var(--warn);
  }
}

@media (max-width: 1023px) {
  .route-grid {
    grid-template-columns: 1fr;
  }

  .plate-col {
    max-width: 480px;
    margin: 0 auto;
    width: 100%;
  }
}

@media (max-width: 767px) {
  .pathway-picker {
    grid-template-columns: 1fr;
  }
}
</style>
