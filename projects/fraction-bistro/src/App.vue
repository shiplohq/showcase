<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// App shell: data loading (local JSON, error-degraded), the single-page
// screen state machine (board / cut / compare / book — no router needed),
// anonymous served-progress in localStorage with a reset, masthead + footer.
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { BistroData } from './lib/data';
import { ContentError, loadBistro } from './lib/data';
import type { Recipe, ResolvedOrder } from './lib/types';
import { clearProgress, loadProgress, saveProgress } from './lib/storage';
import { clearSessions } from './lib/session';
import BoardScreen from './features/board/BoardScreen.vue';
import CutScreen from './features/cut/CutScreen.vue';
import CompareScreen from './features/compare/CompareScreen.vue';
import BookScreen from './features/book/BookScreen.vue';

type Screen = 'board' | 'cut' | 'compare' | 'book';

const data = ref<BistroData | null>(null);
const loadError = ref<string | null>(null);
const screen = ref<Screen>('board');
const activeOrderId = ref<string | null>(null);
const servedIds = ref<Set<string>>(new Set());
const resetArmed = ref(false);
let resetArmTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  try {
    data.value = await loadBistro(import.meta.env.BASE_URL);
    servedIds.value = new Set(loadProgress().servedIds);
  } catch (err) {
    loadError.value =
      err instanceof ContentError
        ? err.message
        : 'Something went wrong opening the bistro. Reload the page to try again.';
  }
});

// move screen-reader/keyboard focus to the new screen's heading so every
// navigation is announced (impeccable a11y finding)
watch([screen, activeOrderId], async () => {
  await nextTick();
  const heading = document.querySelector('main h1, main h2') as HTMLElement | null;
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
});

const activeOrder = computed<ResolvedOrder | null>(() => {
  if (!data.value || !activeOrderId.value) return null;
  return data.value.orders.find((o) => o.id === activeOrderId.value) ?? null;
});

const activeDish = computed(() =>
  data.value?.dishes.find((d) => d.id === activeOrder.value?.dish) ?? null,
);

/** first unserved order after the active one (wraps) — the "Next order" target */
const nextOrderId = computed<string | null>(() => {
  if (!data.value || !activeOrder.value) return null;
  const orders = data.value.orders;
  const start = orders.findIndex((o) => o.id === activeOrder.value!.id);
  for (let step = 1; step <= orders.length; step++) {
    const candidate = orders[(start + step) % orders.length];
    if (!servedIds.value.has(candidate.id)) return candidate.id;
  }
  return null;
});

const recipes = computed<Recipe[]>(() => {
  if (!data.value) return [];
  return data.value.orders
    .filter((o) => o.mode === 'equivalent' && servedIds.value.has(o.id))
    .map((o) => ({
      orderId: o.id,
      left: o.requestedFraction,
      right: o.compareWith ?? [1, 1],
      dish: o.dish,
      dishName: o.dishName,
    }));
});

function openOrder(id: string) {
  const order = data.value?.orders.find((o) => o.id === id);
  if (!order) return;
  activeOrderId.value = id;
  screen.value = order.mode === 'build' ? 'cut' : 'compare';
}

function markServed(id: string) {
  if (servedIds.value.has(id)) return;
  const next = new Set(servedIds.value);
  next.add(id);
  servedIds.value = next;
  saveProgress({ servedIds: [...next] });
}

function resetShift() {
  if (!resetArmed.value) {
    // destructive for a child's whole shift — ask once, in place, no popup
    resetArmed.value = true;
    if (resetArmTimer) clearTimeout(resetArmTimer);
    resetArmTimer = setTimeout(() => (resetArmed.value = false), 5000);
    return;
  }
  if (resetArmTimer) clearTimeout(resetArmTimer);
  resetArmed.value = false;
  clearProgress();
  clearSessions();
  servedIds.value = new Set();
  screen.value = 'board';
  activeOrderId.value = null;
}

function goBoard() {
  screen.value = 'board';
  activeOrderId.value = null;
}

const whereAmI = computed(() =>
  screen.value === 'board'
    ? 'Order board'
    : screen.value === 'book'
      ? 'Recipe book'
      : screen.value === 'cut'
        ? 'Cutting table'
        : 'Compare counter',
);
</script>

<template>
  <header class="topbar">
    <p class="where">{{ whereAmI }}</p>
    <nav class="nav" aria-label="Main">
      <button
        type="button"
        class="btn btn--ghost"
        :aria-current="screen === 'board' ? 'page' : undefined"
        @click="goBoard"
      >
        Order board
      </button>
      <button
        type="button"
        class="btn btn--ghost"
        :aria-current="screen === 'book' ? 'page' : undefined"
        @click="screen = 'book'"
      >
        Recipe book
      </button>
    </nav>
  </header>

  <main id="main">
    <div v-if="loadError" class="error-panel" role="alert">
      <h2>The kitchen is closed for a moment</h2>
      <p>{{ loadError }}</p>
    </div>

    <template v-else-if="data">
      <header v-if="screen === 'board'" class="masthead">
        <p class="overline">Trattoria Aritmetica</p>
        <h1>Fraction Bistro</h1>
        <p class="tagline">Cut fairly. Plate exactly. Serve fractions · Est. 2026</p>
        <div class="rule-double" aria-hidden="true"></div>
      </header>

      <BoardScreen
        v-if="screen === 'board'"
        :orders="data.orders"
        :dishes="data.dishes"
        :served-ids="servedIds"
        @open="openOrder"
      />

      <CutScreen
        v-else-if="screen === 'cut' && activeOrder && activeDish"
        :key="activeOrder.id"
        :order="activeOrder"
        :dish="activeDish"
        :next-order-id="nextOrderId"
        @served="markServed"
        @back="goBoard"
        @open="openOrder"
      />

      <CompareScreen
        v-else-if="screen === 'compare' && activeOrder && activeDish"
        :key="activeOrder.id"
        :order="activeOrder"
        :dish="activeDish"
        :next-order-id="nextOrderId"
        @served="markServed"
        @back="goBoard"
        @open="openOrder"
      />

      <BookScreen v-else-if="screen === 'book'" :recipes="recipes" />
    </template>
  </main>

  <footer class="site-foot">
    <p class="progress-line">
      Orders served
      <strong>{{ servedIds.size }} / {{ data?.orders.length ?? 0 }}</strong>
    </p>
    <button
      type="button"
      class="btn btn--ghost"
      :class="{ 'btn--danger': resetArmed }"
      @click="resetShift"
    >
      {{ resetArmed ? 'Clear all stamps?' : 'New shift (reset)' }}
    </button>
    <p class="colophon">A Shiplo Showcase — static front-end, local JSON, no kitchen backend.</p>
  </footer>
</template>
