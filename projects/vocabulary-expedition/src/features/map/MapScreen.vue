<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// World map — the expedition route: a gouache landscape band with six field
// stations along a dotted footpath (NOT a card grid — spec forbids flashcard
// grids as the main screen). Stations are real buttons placed by mapPos %.

import { computed } from 'vue';
import type { UnitData } from '../../lib/types';
import AppIcon from '../../components/AppIcon.vue';
import PipIcon from '../../components/PipIcon.vue';

const props = defineProps<{ units: UnitData[]; scenesDone: string[]; showVi: boolean }>();
const emit = defineEmits<{ open: [unitId: string]; scrapbook: [] }>();

/** First uncompleted station — the "you are here" start marker. */
const startId = computed(
  () => props.units.find((u) => !props.scenesDone.includes(u.id))?.id ?? null,
);

/** Mini gouache silhouettes for the station badges (one per scene). */
const GLYPHS: Record<string, string> = {
  'living-room': 'M8 34 V22 q0 -8 8 -8 h24 q8 0 8 8 v12 z M6 26 q-3 0 -3 4 v4 h6 M50 26 q3 0 3 4 v4 h-6 M14 24 q8 -4 16 0 M34 24 q8 -4 14 0',
  kitchen: 'M18 40 q-8 -10 0 -20 q10 -8 20 0 q8 10 0 20 z M38 30 q8 -2 8 -10 M26 20 v-6',
  classroom: 'M8 20 h44 v20 h-44 z M14 26 h14 M14 32 h20 M36 26 h10',
  market: 'M14 42 q-4 -18 8 -22 q2 -10 12 -8 q10 0 12 10 q10 4 6 20 z',
  farm: 'M12 42 q-2 -16 10 -18 q10 -2 14 6 q6 2 4 12 z M24 24 v-8 M20 18 q4 -4 8 0',
  park: 'M30 8 L38 22 L30 34 L22 22 Z M30 34 q-4 6 -8 10 M34 40 h8',
};
</script>

<template>
  <section class="world" aria-label="Expedition map — choose a scene">
    <div class="map-head">
      <PipIcon :size="52" />
      <div>
        <h2 class="map-title">Where do we explore today?</h2>
        <p class="map-sub">
          Six scenes · 42 words · {{ scenesDone.length > 0 ? `${scenesDone.length} stamped` : 'start where Pip is standing!' }}
        </p>
      </div>
    </div>

    <div class="map-stage">
      <!-- gouache landscape -->
      <svg class="landscape" viewBox="0 0 1200 560" aria-hidden="true" focusable="false">
        <rect width="1200" height="560" fill="#bcd9e8" />
        <circle cx="90" cy="80" r="40" fill="#f2c14e" />
        <path d="M880 60 q14 -26 44 -20 q10 -20 36 -14 q24 -6 32 16 q20 2 14 18 h-118 q-12 -8 -8 -14 z" fill="#fffdf4" opacity="0.9" />
        <path d="M0 330 q160 -90 320 -40 q140 44 280 -10 q180 -70 360 14 q120 54 240 6 L1200 560 L0 560 Z" fill="#a4bf6b" />
        <path d="M0 420 q240 -60 480 0 q220 54 440 -14 q160 -46 280 8 L1200 560 L0 560 Z" fill="#8ba657" />
        <ellipse cx="180" cy="500" rx="90" ry="26" fill="#8fb6c4" />
        <circle cx="420" cy="330" r="26" fill="#5f8f3e" />
        <rect x="416" y="345" width="8" height="22" fill="#8a6b4f" />
        <circle cx="452" cy="340" r="20" fill="#6b9a44" />
        <circle cx="760" cy="420" r="30" fill="#5f8f3e" />
        <rect x="755" y="438" width="9" height="26" fill="#8a6b4f" />
        <circle cx="960" cy="440" r="22" fill="#6b9a44" />
        <!-- dotted footpath -->
        <path
          d="M108 392 C 160 320 240 300 324 258 C 400 220 480 320 540 370 C 600 420 660 280 744 202 C 810 150 880 280 960 336 C 1010 370 1060 220 1104 134"
          fill="none"
          stroke="#c0504a"
          stroke-width="6"
          stroke-linecap="round"
          stroke-dasharray="2 20"
          opacity="0.85"
        />
      </svg>

      <!-- stations (real buttons over the art) -->
      <button
        v-for="(u, i) in units"
        :key="u.id"
        type="button"
        class="map-marker"
        :class="{ 'map-marker--done': scenesDone.includes(u.id), 'map-marker--current': u.id === startId }"
        :style="{ left: `${u.mapPos[0]}%`, top: `${u.mapPos[1]}%` }"
        :aria-label="`${u.title} — ${u.nativeTitle}. Station ${i + 1}.${u.id === startId ? ' Start here.' : ''}${scenesDone.includes(u.id) ? ' Completed.' : ''}`"
        @click="emit('open', u.id)"
      >
        <span class="badge">
          <svg viewBox="0 0 60 48" width="42" height="34" aria-hidden="true" focusable="false">
            <path :d="GLYPHS[u.scene] ?? GLYPHS.kitchen" fill="none" stroke="#4a3527" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span v-if="scenesDone.includes(u.id)" class="done-check">
            <AppIcon name="check" :size="18" />
          </span>
        </span>
        <span v-if="u.id === startId" class="pip-here" aria-hidden="true">
          <PipIcon :size="40" />
        </span>
        <span class="meta">
          <span class="name">{{ u.title }}</span>
          <span v-if="u.id === startId" class="blurb">{{ u.mapBlurb }}</span>
          <span v-if="showVi" class="native vi" lang="vi">{{ u.nativeTitle }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.world {
  display: flex;
  flex-direction: column;
  gap: var(--s4);
}

.map-head {
  display: flex;
  align-items: center;
  gap: var(--s4);
  flex-wrap: wrap;
}

.map-head > div {
  flex: 1;
  min-width: 220px;
}

.map-title {
  font-family: var(--font-journal);
  font-weight: 700;
  font-size: clamp(30px, 4.5vw, 42px);
  margin: 0;
  line-height: 1.05;
}

.map-sub {
  margin: 2px 0 0;
  color: var(--ink-soft);
  font-weight: 700;
}

.map-stage {
  border: 2px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: var(--canvas-deep);
}

.done-check {
  position: absolute;
  right: -4px;
  bottom: -2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--berry);
  color: #fff8ec;
  display: grid;
  place-items: center;
  border: 2px solid var(--plate);
}

.pip-here {
  position: absolute;
  left: -34px;
  top: -18px;
  pointer-events: none;
}

.blurb {
  font-size: 13px;
  font-style: italic;
  color: var(--ink-soft);
  background: var(--plate);
  border-radius: 6px;
  padding: 0 6px;
}

@media (max-width: 479px) {
  /* Phones: the % positioned landscape can't keep six labelled stations
     legible at 390px (clipping + overlap) — switch to a vertical trail list
     over the same journal chrome. Stations stay real buttons in route order. */
  .map-stage {
    display: flex;
    flex-direction: column;
    border: 2px dashed var(--line);
    background: var(--canvas);
    position: relative;
    overflow: visible;
  }

  .map-stage svg.landscape {
    display: none;
  }

  .map-stage::before {
    content: '';
    position: absolute;
    left: 38px;
    top: 28px;
    bottom: 28px;
    border-left: 4px dotted var(--berry);
    opacity: 0.55;
  }

  .map-marker {
    position: static;
    transform: none;
    flex-direction: row;
    align-items: center;
    gap: var(--s4);
    width: 100%;
    padding: var(--s3) var(--s4);
    text-align: left;
    z-index: auto;
  }

  .map-marker .badge {
    flex: none;
    width: 56px;
    height: 56px;
    background: var(--canvas);
  }

  .map-marker .meta {
    align-items: flex-start;
    gap: 1px;
  }

  .map-marker .name {
    font-size: 16px;
    max-width: none;
    white-space: normal;
    display: block;
  }

  .map-marker .native {
    font-size: 13px;
    display: block;
  }

  .map-marker .blurb {
    display: block;
    font-size: 12px;
    background: transparent;
    padding: 0;
  }

  .pip-here {
    left: auto;
    top: auto;
    position: static;
    order: 3;
    margin-left: auto;
    flex: none;
  }
}

@media (min-width: 480px) and (max-width: 767px) {
  .map-marker .badge {
    width: 48px;
    height: 48px;
  }

  .map-marker .name {
    font-size: 13px;
    max-width: 120px;
    white-space: normal;
  }

  .map-marker .native {
    font-size: 12px;
  }

  .pip-here {
    left: -24px;
    top: -10px;
  }
}
</style>
