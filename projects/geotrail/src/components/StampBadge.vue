<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Travel stamp — cogged ring + the place's own map silhouette, reusing the
// plate geometry (DD §9). Unearned stamps stay as dashed placeholders.
import { computed } from 'vue';
import type { Place } from '../lib/types';

const props = defineProps<{ place: Place | null; earned: boolean }>();

const SIZE = 96;
const BOX = 40;

const silhouette = computed<string[]>(() => {
  if (!props.place) return [];
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const ring of props.place.polys) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  const spanLon = Math.max(maxLon - minLon, 0.01);
  const spanLat = Math.max(maxLat - minLat, 0.01);
  const k = BOX / Math.max(spanLon, spanLat);
  const ox = (SIZE - spanLon * k) / 2;
  const oy = (SIZE - spanLat * k) / 2;
  return props.place.polys.map((ring) =>
    ring
      .map(([lon, lat]) => `${(ox + (lon - minLon) * k).toFixed(1)},${(oy + (maxLat - lat) * k).toFixed(1)}`)
      .join(' '),
  );
});

const label = computed(() => props.place?.name ?? 'Unexplored');
</script>

<template>
  <div class="stamp-badge" :class="{ earned }">
    <svg
      :width="SIZE"
      :height="SIZE"
      :viewBox="`0 0 ${SIZE} ${SIZE}`"
      role="img"
      :aria-label="earned ? `${label} stamp earned` : `${label} stamp not earned yet`"
    >
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="SIZE / 2 - 2"
        fill="none"
        :stroke="earned ? 'var(--terra)' : 'var(--line-strong)'"
        stroke-width="1.6"
        stroke-dasharray="3.4 2.8"
      />
      <circle
        :cx="SIZE / 2"
        :cy="SIZE / 2"
        :r="SIZE / 2 - 9"
        fill="none"
        :stroke="earned ? 'var(--terra-deep)' : 'var(--line-strong)'"
        stroke-width="1"
        :stroke-dasharray="earned ? 'none' : '2 3'"
      />
      <template v-if="earned && place">
        <polygon
          v-for="(pts, i) in silhouette"
          :key="i"
          :points="pts"
          fill="var(--terra)"
          fill-opacity="0.22"
          stroke="var(--terra-deep)"
          stroke-width="1.4"
          stroke-linejoin="round"
        />
      </template>
      <template v-else>
        <text
          :x="SIZE / 2"
          :y="SIZE / 2 + 4"
          text-anchor="middle"
          class="stamp-eta"
          aria-hidden="true"
        >
          ···
        </text>
      </template>
    </svg>
    <p class="stamp-name" aria-hidden="true">{{ label }}</p>
  </div>
</template>

<style scoped>
.stamp-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 1;
}

.stamp-badge:not(.earned) {
  opacity: 0.55;
}

.stamp-eta {
  font-family: var(--font-display);
  font-size: 18px;
  fill: var(--line-strong);
  letter-spacing: 0.2em;
}

.stamp-name {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  text-align: center;
  max-width: 120px;
  overflow-wrap: break-word;
}

.earned .stamp-name {
  color: var(--terra-deep);
}
</style>
