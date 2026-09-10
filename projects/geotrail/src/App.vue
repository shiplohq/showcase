<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// App shell: local-JSON data loading (clear error card, never a white
// screen), single-page screen state (no router — spec), anonymous progress
// in localStorage with a two-step reset, atlas-spine masthead + footer.
import { nextTick, onMounted, ref, watch } from 'vue';
import type { AtlasData } from './lib/types';
import { ContentError, loadAtlas } from './lib/data';
import { clearProgress, EMPTY_PROGRESS, loadProgress, saveProgress } from './lib/storage';
import { totalStops } from './features/trail/engine';
import AtlasScreen from './screens/AtlasScreen.vue';
import TrailScreen from './screens/TrailScreen.vue';
import StampScreen from './screens/StampScreen.vue';
import ErrorCard from './components/ErrorCard.vue';
import AppIcon from './components/AppIcon.vue';

type Screen = { name: 'atlas' } | { name: 'stamps' } | { name: 'trail'; trailId: string };

const data = ref<AtlasData | null>(null);
const loadError = ref<string | null>(null);
const screen = ref<Screen>({ name: 'atlas' });
const completed = ref<string[]>([]);
const resetArmed = ref(false);
let resetArmTimer: ReturnType<typeof setTimeout> | null = null;

async function openAtlas() {
  loadError.value = null;
  try {
    data.value = await loadAtlas(import.meta.env.BASE_URL);
    completed.value = loadProgress().completedStops;
  } catch (err) {
    loadError.value =
      err instanceof ContentError
        ? err.message
        : 'Something went wrong opening the atlas. Reload the page to try again.';
  }
}

onMounted(openAtlas);

// Announce screen changes to keyboard/screen-reader focus (pilot pattern).
watch(screen, async () => {
  await nextTick();
  const heading = document.querySelector('main h1, main h2') as HTMLElement | null;
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
});

function persist() {
  saveProgress({ completedStops: completed.value });
}

function completeStop(stopId: string) {
  if (!completed.value.includes(stopId)) {
    completed.value = [...completed.value, stopId];
    persist();
  }
}

function resetProgress() {
  if (!resetArmed.value) {
    resetArmed.value = true;
    resetArmTimer = setTimeout(() => (resetArmed.value = false), 4000);
    return;
  }
  if (resetArmTimer) clearTimeout(resetArmTimer);
  resetArmed.value = false;
  clearProgress();
  completed.value = [...EMPTY_PROGRESS.completedStops];
  screen.value = { name: 'atlas' };
}

const stampTotal = () => (data.value ? totalStops(data.value) : 0);

function onNavKeydown(ev: KeyboardEvent) {
  if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
  const tabs = [...(ev.currentTarget as HTMLElement).querySelectorAll('.nav-tab')];
  const idx = tabs.indexOf(document.activeElement as HTMLElement);
  if (idx < 0) return;
  ev.preventDefault();
  const nextIdx = (idx + (ev.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  (tabs[nextIdx] as HTMLElement).focus();
  screen.value = nextIdx === 0 ? { name: 'atlas' } : { name: 'stamps' };
}
</script>

<template>
  <div class="app-shell">
    <header class="masthead">
      <button type="button" class="wordmark" @click="screen = { name: 'atlas' }">
        GeoTrail <span class="no">SHIPLO NO. 16</span>
      </button>
      <div class="mast-right">
        <span class="stamp-counter" aria-label="Stamps collected">
          <AppIcon name="stamp" :size="16" />
          {{ completed.length }}/{{ stampTotal() }}
        </span>
        <nav class="nav-tabs" aria-label="Sections" @keydown="onNavKeydown">
          <button
            v-for="t in [
              { id: 'atlas', label: 'Atlas' },
              { id: 'stamps', label: 'Stamps' },
            ]"
            :key="t.id"
            type="button"
            class="nav-tab"
            :aria-current="(screen.name === 'trail' ? 'atlas' : screen.name) === t.id ? 'page' : undefined"
            @click="screen = t.id === 'atlas' ? { name: 'atlas' } : { name: 'stamps' }"
          >
            {{ t.label }}
          </button>
        </nav>
      </div>
    </header>

    <main class="main-area">
      <ErrorCard v-if="loadError" :message="loadError" @retry="openAtlas" />
      <template v-else-if="data">
        <AtlasScreen
          v-if="screen.name === 'atlas'"
          :data="data"
          :completed="completed"
          @open="(trailId) => (screen = { name: 'trail', trailId })"
        />
        <TrailScreen
          v-else-if="screen.name === 'trail'"
          :key="screen.trailId"
          :data="data"
          :trail-id="screen.trailId"
          :completed="completed"
          @exit="screen = { name: 'atlas' }"
          @complete-stop="completeStop"
          @goto="(s) => (screen = s === 'stamps' ? { name: 'stamps' } : { name: 'atlas' })"
        />
        <StampScreen
          v-else
          :data="data"
          :completed="completed"
          @goto="(trailId) => (screen = { name: 'trail', trailId })"
        />
      </template>
      <p v-else class="loading-note">OPENING THE ATLAS…</p>
    </main>

    <footer class="site-footer">
      <span class="microcopy">GEOTRAIL — BOUNDARIES SIMPLIFIED FOR LEARNING · EDUCATIONAL DATASET ONLY</span>
      <button type="button" class="btn btn-ghost reset-btn" @click="resetProgress">
        {{ resetArmed ? 'Sure? Reset everything' : 'Reset my progress' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.reset-btn {
  min-height: 44px;
  font-size: 13px;
}
</style>
