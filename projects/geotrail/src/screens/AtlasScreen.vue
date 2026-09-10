<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The atlas spread: world index map on the left page, trail ledger on the
// right. Opening a trail happens from either side (map plate or ledger row).
import type { AtlasData } from '../lib/types';
import { trailProgress } from '../features/trail/engine';
import WorldMap from '../components/WorldMap.vue';

const props = defineProps<{ data: AtlasData; completed: string[] }>();
defineEmits<{ open: [trailId: string] }>();

function progressOf(trailId: string): { done: number; total: number } {
  const trail = props.data.trails.find((t) => t.id === trailId);
  if (!trail) return { done: 0, total: 0 };
  return { done: trailProgress(trail, props.completed), total: trail.stops.length };
}

const progressByPlate = Object.fromEntries(
  props.data.trails.map((t) => [t.plate, progressOf(t.id)]),
);
</script>

<template>
  <div class="atlas-spread">
    <div class="atlas-page">
      <div class="atlas-intro">
        <p class="kicker">Shiplo Showcase No. 16 · Geography for ages 8–14</p>
        <h1>An atlas that asks questions.</h1>
        <p class="lede">
          Four trails, twenty-four stops. Find places, compare real facts and
          follow clues — every stop is a question about where things are and why.
        </p>
      </div>
      <WorldMap
        :plates="data.plates"
        :progress-by-plate="progressByPlate"
        @open="(plateId) => {
          const t = data.trails.find((tr) => tr.plate === plateId);
          if (t) $emit('open', t.id);
        }"
      />
    </div>

    <div class="atlas-fold" aria-hidden="true"></div>

    <section class="ledger" aria-labelledby="ledger-title">
      <div class="ledger-head">
        <h2 id="ledger-title">Trail index</h2>
        <span class="hint">4 plates · 24 stops</span>
      </div>
      <button
        v-for="t in data.trails"
        :key="t.id"
        type="button"
        class="ledger-row"
        @click="$emit('open', t.id)"
      >
        <span class="numeral" aria-hidden="true">
          {{ data.plates.find((p) => p.id === t.plate)?.numeral }}
        </span>
        <span class="meta">
          <span class="title">{{ t.title }}</span>
          <span class="region">{{ data.plates.find((p) => p.id === t.plate)?.name }} · {{ t.subtitle }}</span>
        </span>
        <span class="prog">
          <span class="dots" aria-hidden="true">
            <span
              v-for="(s, i) in t.stops"
              :key="i"
              class="dot"
              :class="{ done: completed.includes(s.id) }"
            />
          </span>
          <span class="count">{{ progressOf(t.id).done }}/{{ t.stops.length }} stops · <span class="go">walk it →</span></span>
        </span>
      </button>
    </section>
  </div>
</template>
