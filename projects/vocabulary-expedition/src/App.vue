<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// App shell — single-page state machine (no router: map | scene | scrapbook),
// content loading with friendly degradation, anonymous progress, settings.

import { computed, onMounted, ref } from 'vue';
import type { UnitsFile } from './lib/types';
import { ContentError, loadUnits } from './lib/data';
import {
  defaultProgress,
  loadProgress,
  resetProgress,
  saveProgress,
  type Progress,
} from './lib/storage';
import AppHeader from './components/AppHeader.vue';
import MapScreen from './features/map/MapScreen.vue';
import SceneScreen from './features/scene/SceneScreen.vue';
import ScrapbookScreen from './features/scrapbook/ScrapbookScreen.vue';

const units = ref<UnitsFile | null>(null);
const loadError = ref<string | null>(null);
const view = ref<{ name: 'map' } | { name: 'scene'; unitId: string } | { name: 'scrapbook' }>({ name: 'map' });
const progress = ref<Progress>({ ...defaultProgress, settings: { ...defaultProgress.settings } });

onMounted(async () => {
  progress.value = loadProgress();
  try {
    units.value = await loadUnits();
  } catch (err) {
    loadError.value =
      err instanceof ContentError
        ? err.message
        : 'The expedition journal could not be opened. Please refresh the page.';
  }
});

function persist(): void {
  saveProgress(progress.value);
}

function openScene(unitId: string): void {
  view.value = { name: 'scene', unitId };
}

function backToMap(): void {
  view.value = { name: 'map' };
}

function openScrapbook(): void {
  view.value = { name: 'scrapbook' };
}

function onOpenScrapbookFromScene(): void {
  view.value = { name: 'scrapbook' };
}

function onFoundWord(itemId: string): void {
  if (!progress.value.foundWords.includes(itemId)) {
    progress.value = { ...progress.value, foundWords: [...progress.value.foundWords, itemId] };
    persist();
  }
}

function onLabeledWord(itemId: string): void {
  if (!progress.value.labeledWords.includes(itemId)) {
    progress.value = { ...progress.value, labeledWords: [...progress.value.labeledWords, itemId] };
    persist();
  }
}

function onSceneDone(unitId: string): void {
  if (!progress.value.scenesDone.includes(unitId)) {
    progress.value = { ...progress.value, scenesDone: [...progress.value.scenesDone, unitId] };
    persist();
  }
}

function onToggleSound(): void {
  progress.value = {
    ...progress.value,
    settings: { ...progress.value.settings, sound: !progress.value.settings.sound },
  };
  persist();
}

function onToggleTranslation(): void {
  progress.value = {
    ...progress.value,
    settings: { ...progress.value.settings, translation: !progress.value.settings.translation },
  };
  persist();
}

function onReset(): void {
  overlayConfirm.value = true;
}

function onResetConfirmed(): void {
  overlayConfirm.value = false;
  progress.value = resetProgress();
  view.value = { name: 'map' };
}

const activeUnit = computed(() => {
  const v = view.value;
  if (v.name !== 'scene' || !units.value) return null;
  return units.value.units.find((u) => u.id === v.unitId) ?? null;
});

const unitList = computed(() => units.value?.units ?? []);

const nextUnit = computed(() => {
  const v = view.value;
  if (v.name !== 'scene' || !units.value) return null;
  const i = units.value.units.findIndex((u) => u.id === v.unitId);
  return i >= 0 ? (units.value.units[i + 1] ?? null) : null;
});

function openNextScene(unitId: string): void {
  overlayConfirm.value = false;
  view.value = { name: 'scene', unitId };
}

const overlayConfirm = ref(false);

function reload(): void {
  location.reload();
}
</script>

<template>
  <AppHeader
    :found-count="progress.foundWords.length"
    :scenes-done="progress.scenesDone.length"
    :sound="progress.settings.sound"
    :translation="progress.settings.translation"
    :show-back="view.name !== 'map'"
    @back="backToMap"
    @scrapbook="openScrapbook"
    @toggle-sound="onToggleSound"
    @toggle-translation="onToggleTranslation"
    @reset="onReset"
  />

  <main class="app-main" aria-live="off">
    <!-- graceful degradation — never a white screen -->
    <div v-if="loadError" class="load-error" role="alert">
      <h1>Oh no — the journal is stuck!</h1>
      <p>{{ loadError }}</p>
      <button class="btn btn--primary" type="button" @click="reload">Open it again</button>
    </div>

    <div v-else-if="!units" class="loading" role="status">
      <p>Opening the expedition journal…</p>
    </div>

    <Transition name="view" mode="out-in">
      <MapScreen
        v-if="view.name === 'map'"
        key="map"
        :units="unitList"
        :scenes-done="progress.scenesDone"
        :show-vi="progress.settings.translation"
        @open="openScene"
        @scrapbook="openScrapbook"
      />
      <SceneScreen
        v-else-if="view.name === 'scene' && activeUnit"
        :key="`scene-${activeUnit.id}`"
        :unit="activeUnit"
        :progress="progress"
        :next-unit="nextUnit"
        @exit="backToMap"
        @found="onFoundWord"
        @labeled="onLabeledWord"
        @scene-done="onSceneDone"
        @open-scrapbook="onOpenScrapbookFromScene"
        @open-next="openNextScene"
        @toggle-sound="onToggleSound"
        @toggle-translation="onToggleTranslation"
      />
      <ScrapbookScreen
        v-else-if="view.name === 'scrapbook'"
        key="scrapbook"
        :units="unitList"
        :progress="progress"
        @exit="backToMap"
      />
    </Transition>

    <!-- reset confirmation — styled journal overlay, not a native confirm -->
    <div v-if="overlayConfirm" class="overlay" role="dialog" aria-modal="true" aria-label="Reset expedition?">
      <div class="card">
        <h2>Start a fresh expedition?</h2>
        <p>All found words and stamps will be cleared. This cannot be undone.</p>
        <p class="vi" lang="vi">Xoá toàn bộ tiến độ và bắt đầu lại nhé?</p>
        <div class="card-actions">
          <button class="btn btn--primary" type="button" @click="onResetConfirmed">
            Yes, reset
          </button>
          <button class="btn" type="button" @click="overlayConfirm = false">
            Keep my journal
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.load-error,
.loading {
  margin: auto;
  text-align: center;
  padding: var(--s10) var(--s4);
  max-width: 460px;
}

.load-error h1 {
  font-family: var(--font-journal);
  font-size: 32px;
  margin: 0 0 var(--s3);
}

.loading p,
.load-error p {
  color: var(--ink-soft);
  font-size: 18px;
}
</style>
