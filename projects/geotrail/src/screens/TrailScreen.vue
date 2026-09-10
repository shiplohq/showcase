<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The trail screen: plate map (62%) + mission sheet. Owns the engine state
// for the active trail, feeds the map (focus, route, relations, grading
// highlights) and records completed stops upward for stamps + storage.
import { computed, nextTick, ref, watch } from 'vue';
import type { AtlasData, Place, Trail } from '../lib/types';
import {
  advance as engineAdvance,
  buildPlaceMap,
  correctAnswerId,
  currentStop,
  feedbackText as engineFeedback,
  findTrail,
  pick as enginePick,
  revealClue as engineReveal,
  startTrail,
  ariaStatus as engineAria,
} from '../features/trail/engine';
import { mountFade, stampPop } from '../lib/gsap';
import PlateMap from '../components/PlateMap.vue';
import MissionPanel from '../components/MissionPanel.vue';
import LocateActivity from '../components/LocateActivity.vue';
import CompareActivity from '../components/CompareActivity.vue';
import ClueActivity from '../components/ClueActivity.vue';
import StampBadge from '../components/StampBadge.vue';
import AppIcon from '../components/AppIcon.vue';

const props = defineProps<{ data: AtlasData; trailId: string; completed: string[] }>();
const emit = defineEmits<{ exit: []; completeStop: [stopId: string]; goto: [screen: 'stamps' | 'atlas'] }>();

const trail = computed<Trail>(() => findTrail(props.data, props.trailId));
const plate = computed(() => props.data.plates.find((p) => p.id === trail.value.plate)!);
const places = computed(() => props.data.places.filter((p) => p.plate === trail.value.plate));
const byId = computed(() => buildPlaceMap(places.value));

const state = ref(startTrail(props.trailId));
const wrongId = ref<string | null>(null);
const stampRef = ref<HTMLElement | null>(null);
const mapRef = ref<InstanceType<typeof PlateMap> | null>(null);
const screenEl = ref<HTMLElement | null>(null);

const stop = computed(() => currentStop(state.value, trail.value));

// resume at the first stop that is not yet completed (fresh walk otherwise)
if (props.completed.length > 0) {
  const idx = trail.value.stops.findIndex((s) => !props.completed.includes(s.id));
  if (idx > 0) {
    state.value = { ...state.value, stopIndex: idx };
  }
}

const stepper = computed(() =>
  trail.value.stops.map((s, i) => ({
    n: i + 1,
    done: props.completed.includes(s.id) && i !== state.value.stopIndex,
    current: i === state.value.stopIndex,
  })),
);

const routeNodes = computed(() =>
  trail.value.stops.map((s, i) => {
    const isCurrent = i === state.value.stopIndex;
    return {
      n: i + 1,
      placeId: s.at,
      done: props.completed.includes(s.id) && !isCurrent,
      current: isCurrent,
    };
  }),
);

const interactive = computed(() => stop.value.kind === 'locate' && state.value.feedback !== 'correct');

const correctId = computed(() =>
  state.value.feedback === 'correct' ? correctAnswerId(stop.value, byId.value) : null,
);

const highlightIds = computed(() =>
  stop.value.kind === 'compare' && state.value.feedback !== 'correct'
    ? [stop.value.a, stop.value.b]
    : [],
);

const relations = computed(() => {
  if (stop.value.kind !== 'clue') return [];
  return stop.value.clues.slice(0, state.value.revealedClues);
});

const focusPlaceId = computed(() => {
  if (state.value.finished) return null;
  return stop.value.at;
});

const feedback = computed(() => engineFeedback(state.value, stop.value, byId.value));

function answer(placeId: string) {
  if (state.value.feedback === 'correct') return;
  const next = enginePick(state.value, stop.value, placeId, byId.value);
  state.value = next;
  if (next.feedback === 'correct') {
    wrongId.value = null;
    emit('completeStop', stop.value.id);
    nextTick(() => {
      if (stampRef.value) stampPop(stampRef.value);
    });
  } else {
    wrongId.value = placeId;
    window.setTimeout(() => {
      if (wrongId.value === placeId) wrongId.value = null;
    }, 900);
  }
}

function reveal() {
  state.value = engineReveal(state.value, stop.value);
}

function nextStop() {
  state.value = engineAdvance(state.value, trail.value);
}

function resolveDrop(clientX: number, clientY: number) {
  return mapRef.value?.placeAtPoint(clientX, clientY) ?? null;
}

watch(state, (s) => {
  // moving on clears any lingering wrong outline
  if (s.feedback === 'idle') wrongId.value = null;
});

watch(
  () => props.trailId,
  () => {
    state.value = startTrail(props.trailId);
  },
);

onMountFade();
function onMountFade() {
  nextTick(() => {
    if (screenEl.value) mountFade(screenEl.value);
  });
}

const stopPlaces = computed(() =>
  stop.value.kind === 'locate'
    ? stop.value.options.map((id) => byId.value.get(id)!).filter(Boolean)
    : [],
);

const optionA = computed(() => (stop.value.kind === 'compare' ? byId.value.get(stop.value.a)! : null));
const optionB = computed(() => (stop.value.kind === 'compare' ? byId.value.get(stop.value.b)! : null));

const stampPlace = computed<Place | null>(() => {
  const id = state.value.feedback === 'correct' ? correctAnswerId(stop.value, byId.value) : null;
  return id ? byId.value.get(id) ?? null : null;
});

const ariaStatusText = computed(() => engineAria(state.value, trail.value));

function onScreenKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') emit('exit');
}
</script>

<template>
  <div ref="screenEl" class="trail-screen" @keydown="onScreenKeydown">
    <div class="trail-layout">
      <div class="trail-map-col">
        <div class="trail-toolbar">
          <div class="trail-title-block">
            <span class="rn" aria-hidden="true">{{ plate.numeral }}</span>
            <h2>{{ trail.title }}</h2>
          </div>
          <button type="button" class="btn btn-ghost" @click="emit('exit')">
            ← Atlas
          </button>
        </div>
        <PlateMap
          ref="mapRef"
          :plate="plate"
          :places="places"
          :route="routeNodes"
          :interactive="interactive"
          :highlight-ids="highlightIds"
          :relations="relations"
          :correct-id="correctId"
          :wrong-id="wrongId"
          :focus-place-id="focusPlaceId"
          @pick="answer"
        />
      </div>

      <MissionPanel
        :step-kind="stop.kind"
        :prompt="stop.prompt"
        :stop-number="state.stopIndex + 1"
        :stop-total="trail.stops.length"
        :stepper="stepper"
        :feedback-state="state.feedback"
        :feedback-text="feedback"
        :finished="state.finished"
        :status-text="ariaStatusText"
        @next="nextStop"
      >
        <template #default>
          <LocateActivity
            v-if="stop.kind === 'locate'"
            :stop="stop"
            :options="stopPlaces"
            :disabled="state.feedback === 'correct'"
            :feedback-state="state.feedback"
            :last-picked="state.lastPicked"
            :resolve-drop="resolveDrop"
            @answer="answer"
          />
          <CompareActivity
            v-else-if="stop.kind === 'compare' && optionA && optionB"
            :stop="stop"
            :a="optionA"
            :b="optionB"
            :disabled="state.feedback === 'correct'"
            :feedback-state="state.feedback"
            :last-picked="state.lastPicked"
            @answer="answer"
          />
          <ClueActivity
            v-else-if="stop.kind === 'clue'"
            :stop="stop"
            :by-id="byId"
            :revealed="state.revealedClues"
            :disabled="state.feedback === 'correct'"
            :feedback-state="state.feedback"
            :last-picked="state.lastPicked"
            @answer="answer"
            @reveal="reveal"
          />

          <div v-if="state.feedback === 'correct' && stampPlace" class="award" aria-hidden="true">
            <div ref="stampRef" class="award-stamp">
              <StampBadge :place="stampPlace" :earned="true" />
            </div>
            <p class="award-copy">
              <AppIcon name="stamp" :size="15" />
              Stamp collected
            </p>
          </div>
          <div v-if="state.finished" class="finish-actions">
            <button type="button" class="btn btn-primary" @click="emit('goto', 'stamps')">
              <AppIcon name="stamp" :size="16" /> View passport
            </button>
            <button type="button" class="btn" @click="emit('goto', 'atlas')">Back to the atlas</button>
          </div>
        </template>
      </MissionPanel>
    </div>
  </div>
</template>

<style scoped>
.trail-screen {
  min-height: 0;
}

.trail-map-col {
  height: 100%;
}

.trail-map-col :deep(.plate-stage) {
  flex: 1;
}

.award {
  display: flex;
  align-items: center;
  gap: var(--s4);
  padding-top: var(--s2);
}

.award-stamp {
  width: 84px;
  flex: none;
  transform-origin: center;
}

.award-stamp :deep(.stamp-name) {
  display: none;
}

.award-copy {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
  font-weight: 700;
  color: var(--forest);
  font-size: 15px;
  letter-spacing: 0.04em;
}

.finish-actions {
  display: flex;
  gap: var(--s3);
  flex-wrap: wrap;
  padding-top: var(--s2);
}

@media (min-width: 1024px) {
  .trail-screen {
    height: calc(100dvh - 176px);
  }

  .trail-layout {
    height: 100%;
    align-items: stretch;
  }

  .trail-map-col {
    display: flex;
    flex-direction: column;
    gap: var(--s3);
    min-height: 0;
  }

  .trail-map-col .plate-stage {
    flex: 1 1 auto;
    min-height: 340px;
  }
}

@media (max-width: 1023px) {
  .trail-map-col {
    display: flex;
    flex-direction: column;
    gap: var(--s3);
  }

  .trail-map-col .plate-stage {
    height: clamp(320px, 58vw, 540px);
  }
}
</style>
