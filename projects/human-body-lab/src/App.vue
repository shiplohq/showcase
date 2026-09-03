<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// App shell: local-JSON data loading (degrades to a clear error card, never
// a white screen), single-page screen state (no router — spec), anonymous
// progress in localStorage with a two-step reset, masthead + footer.
import { nextTick, onMounted, ref, watch } from 'vue';
import type { LabData, SystemId } from './lib/types';
import { ContentError, loadLab } from './lib/data';
import { clearProgress, loadProgress, saveProgress, EMPTY_PROGRESS } from './lib/storage';
import OverviewScreen from './features/overview/OverviewScreen.vue';
import ExploreScreen from './features/explore/ExploreScreen.vue';
import PathwayScreen from './features/pathways/PathwayScreen.vue';
import QuizScreen from './features/quiz/QuizScreen.vue';
import ErrorCard from './components/ErrorCard.vue';

type Screen = 'overview' | 'explore' | 'pathways' | 'quiz';

const data = ref<LabData | null>(null);
const loadError = ref<string | null>(null);
const screen = ref<Screen>('overview');
const layers = ref<Set<SystemId>>(new Set());
const explored = ref<Set<string>>(new Set());
const completedPathways = ref<Set<string>>(new Set());
const quizBest = ref(0);
const resetArmed = ref(false);
let resetArmTimer: ReturnType<typeof setTimeout> | null = null;

async function openLab() {
  loadError.value = null;
  try {
    data.value = await loadLab(import.meta.env.BASE_URL);
    const saved = loadProgress();
    explored.value = new Set(saved.exploredOrgans);
    completedPathways.value = new Set(saved.completedPathways);
    quizBest.value = saved.quizBest;
  } catch (err) {
    loadError.value =
      err instanceof ContentError
        ? err.message
        : 'Something went wrong opening the lab. Reload the page to try again.';
  }
}

onMounted(openLab);

// move SR/keyboard focus to the new screen's heading so every navigation is
// announced (impeccable a11y pattern from the pilot)
watch(screen, async () => {
  await nextTick();
  const heading = document.querySelector('main h1, main h2') as HTMLElement | null;
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
});

const persist = () => {
  saveProgress({
    exploredOrgans: [...explored.value],
    completedPathways: [...completedPathways.value],
    quizBest: quizBest.value,
  });
};

const toggleLayer = (id: SystemId) => {
  const next = new Set(layers.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  layers.value = next;
};

const inspectOrgan = (organId: string) => {
  if (!explored.value.has(organId)) {
    const next = new Set(explored.value);
    next.add(organId);
    explored.value = next;
    persist();
  }
};

const completePathway = (pathwayId: string) => {
  if (!completedPathways.value.has(pathwayId)) {
    const next = new Set(completedPathways.value);
    next.add(pathwayId);
    completedPathways.value = next;
    persist();
  }
};

const recordQuizScore = (correct: number, _total: number) => {
  if (correct > quizBest.value) {
    quizBest.value = correct;
    persist();
  }
};

const gotoPathway = (pathwayId: string) => {
  screen.value = 'pathways';
  // the pathway screen reads the id via a query-less prop event
  activePathwayRequest.value = pathwayId;
};

const activePathwayRequest = ref<string | null>(null);
const consumePathwayRequest = () => {
  const id = activePathwayRequest.value;
  activePathwayRequest.value = null;
  return id;
};

const resetProgress = () => {
  if (!resetArmed.value) {
    resetArmed.value = true;
    resetArmTimer = setTimeout(() => (resetArmed.value = false), 4000);
    return;
  }
  if (resetArmTimer) clearTimeout(resetArmTimer);
  resetArmed.value = false;
  clearProgress();
  explored.value = new Set(EMPTY_PROGRESS.exploredOrgans);
  completedPathways.value = new Set(EMPTY_PROGRESS.completedPathways);
  quizBest.value = 0;
  layers.value = new Set();
};

/** Roving arrow-key navigation across the four section tabs (a11y, DD §9). */
const SCREENS: Screen[] = ['overview', 'explore', 'pathways', 'quiz'];
const onNavKeydown = (ev: KeyboardEvent) => {
  if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
  const tabs = [...(ev.currentTarget as HTMLElement).querySelectorAll('.nav-tab')];
  const idx = tabs.indexOf(document.activeElement as HTMLElement);
  if (idx < 0) return;
  ev.preventDefault();
  const dir = ev.key === 'ArrowRight' ? 1 : -1;
  const nextIdx = (idx + dir + SCREENS.length) % SCREENS.length;
  (tabs[nextIdx] as HTMLElement).focus();
  screen.value = SCREENS[nextIdx];
};
</script>

<template>
  <div class="app-shell">
    <header class="masthead">
      <a class="wordmark" href="#" @click.prevent="screen = 'overview'">
        Human Body Lab <span class="no">SHIPLO NO. 12</span>
      </a>
      <nav class="nav-tabs" aria-label="Sections" @keydown="onNavKeydown">
        <button
          v-for="s in [
            { id: 'overview', long: 'Overview', short: 'Home' },
            { id: 'explore', long: 'Explore', short: 'Layers' },
            { id: 'pathways', long: 'Pathways', short: 'Routes' },
            { id: 'quiz', long: 'Quiz', short: 'Quiz' },
          ]"
          :key="s.id"
          type="button"
          class="nav-tab"
          :aria-current="screen === s.id ? 'page' : undefined"
          @click="screen = s.id as Screen"
        >
          <span class="tab-label-long">{{ s.long }}</span>
          <span class="tab-label-short">{{ s.short }}</span>
        </button>
      </nav>
    </header>

    <main class="main-area">
      <ErrorCard v-if="loadError" :message="loadError" @retry="openLab" />
      <template v-else-if="data">
        <OverviewScreen
          v-if="screen === 'overview'"
          :data="data"
          :explored-count="explored.size"
          :pathways-done="completedPathways.size"
          @goto="(target) => (screen = target)"
        />
        <ExploreScreen
          v-if="screen === 'explore'"
          :data="data"
          :layers="layers"
          :explored="explored"
          @toggle-layer="toggleLayer"
          @inspect-organ="inspectOrgan"
          @goto-pathway="gotoPathway"
        />
        <PathwayScreen
          v-if="screen === 'pathways'"
          :data="data"
          :completed="completedPathways"
          :initial-pathway-id="activePathwayRequest"
          @complete-pathway="completePathway"
          @inspect-organ="inspectOrgan"
          @vue:mounted="consumePathwayRequest"
        />
        <QuizScreen
          v-if="screen === 'quiz'"
          :data="data"
          :best="quizBest"
          @quiz-score="recordQuizScore"
        />
      </template>
      <p v-else class="mono-note loading-note">OPENING THE LAB…</p>
    </main>

    <footer class="site-footer">
      <span class="mono-note">HUMAN BODY LAB — GENERAL-AUDIENCE ANATOMY, NOT MEDICAL ADVICE</span>
      <button type="button" class="btn btn-ghost reset-btn" @click="resetProgress">
        {{ resetArmed ? 'Sure? Reset everything' : 'Reset my progress' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.loading-note {
  margin: var(--s7) auto;
  text-align: center;
}

.reset-btn {
  min-height: 44px;
  font-size: 13px;
}
</style>
