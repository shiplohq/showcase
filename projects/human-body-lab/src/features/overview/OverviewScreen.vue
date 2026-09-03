<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Landing: the atlas plate with all layers ghosted (the "what's inside"
// teaser), one clear paragraph, and three entry cards. Landing state for
// desktop/tablet captures.
import type { LabData } from '../../lib/types';
import BodyPlate from '../../components/BodyPlate.vue';
import SystemGlyph from '../../components/SystemGlyph.vue';
import { mountFade } from '../../lib/gsap';
import { onMounted, ref } from 'vue';

defineProps<{
  data: LabData;
  exploredCount: number;
  pathwaysDone: number;
}>();

const emit = defineEmits<{
  (e: 'goto', screen: 'explore' | 'pathways' | 'quiz'): void;
}>();

const screenEl = ref<HTMLElement | null>(null);
onMounted(() => {
  if (screenEl.value) mountFade(screenEl.value);
});
</script>

<template>
  <section ref="screenEl" class="screen overview" aria-labelledby="overview-title">
    <div class="overview-grid">
      <div class="overview-copy">
        <p class="eyebrow">SHIPLO SHOWCASE NO. 12 · AGES 9–14</p>
        <h1 id="overview-title">An atlas you can operate.</h1>
        <p class="lede">
          Human Body Lab is a layer-by-layer model of the body. Lift the systems apart,
          organ by organ, then take the controls: route one breath of oxygen and one bite
          of breakfast all the way to your cells.
        </p>

        <div class="entry-row">
          <button type="button" class="entry" @click="emit('goto', 'explore')">
            <span class="entry-glyph" aria-hidden="true"><SystemGlyph system="skeletal" :size="26" /></span>
            <span class="entry-body">
              <span class="entry-title">Explore systems</span>
              <span class="entry-sub">Lift 5 layers · {{ data.systems.reduce((n, s) => n + s.organs.length, 0) }} organs</span>
            </span>
          </button>
          <button type="button" class="entry" @click="emit('goto', 'pathways')">
            <span class="entry-glyph" aria-hidden="true"><SystemGlyph system="circulatory" :size="26" /></span>
            <span class="entry-body">
              <span class="entry-title">Route oxygen &amp; food</span>
              <span class="entry-sub">3 journeys through the body</span>
            </span>
          </button>
          <button type="button" class="entry" @click="emit('goto', 'quiz')">
            <span class="entry-glyph" aria-hidden="true"><SystemGlyph system="nervous" :size="26" /></span>
            <span class="entry-body">
              <span class="entry-title">Check yourself</span>
              <span class="entry-sub">{{ data.quiz.length }}-question review</span>
            </span>
          </button>
        </div>

        <p class="mono-note lab-status">
          LAB RECORD — {{ exploredCount }}/{{ data.systems.reduce((n, s) => n + s.organs.length, 0) }}
          organs · {{ pathwaysDone }}/{{ data.pathways.length }} journeys
        </p>
      </div>

      <div class="overview-plate">
        <BodyPlate
          :data="data"
          mode="overview"
          :layers="new Set()"
          :ghost-layers="new Set(['skeletal', 'circulatory', 'digestive'])"
        />
        <p class="plate-note mono-note">
          Three of the five layers ghosted. Switch to <strong>Explore</strong> to lift them
          apart.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.overview {
  gap: var(--s5);
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s7);
  align-items: center;
}

.overview-copy {
  display: flex;
  flex-direction: column;
  gap: var(--s4);
}

.lede {
  font-size: 18px;
  line-height: 1.65;
  color: var(--ink);
  max-width: 46ch;
}

.entry-row {
  display: flex;
  flex-direction: column;
  gap: var(--s2);
  margin-top: var(--s2);
}

.entry {
  display: flex;
  align-items: center;
  gap: var(--s3);
  min-height: 64px;
  padding: var(--s3) var(--s4);
  border: var(--hairline);
  border-radius: var(--radius);
  background: var(--paper-raised);
  text-align: left;
  transition: border-color var(--dur-feedback) var(--ease), background var(--dur-feedback) var(--ease);
}

.entry:hover {
  border-color: var(--ink-soft);
  background: var(--paper-deep);
}

.entry-glyph {
  display: inline-flex;
  color: var(--oxblood);
}

.entry:nth-child(2) .entry-glyph {
  color: var(--slate);
}
.entry:nth-child(3) .entry-glyph {
  color: var(--sage);
}

.entry-body {
  display: flex;
  flex-direction: column;
}

.entry-title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
}

.entry-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.lab-status {
  margin-top: var(--s3);
}

.overview-plate {
  display: flex;
  flex-direction: column;
  gap: var(--s2);
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

.plate-note {
  text-align: center;
}

@media (max-width: 1199px) {
  /* tablet landscape: the landing fits the 768px viewport without a
     scrollbar (smaller plate + tighter rhythm) */
  .overview-grid {
    gap: var(--s5);
  }

  .overview h1 {
    font-size: 36px;
  }

  .lede {
    font-size: 16.5px;
  }

  .entry {
    min-height: 54px;
    padding: var(--s2) var(--s3);
  }

  .overview-plate {
    max-width: 368px;
  }
}

@media (max-width: 1023px) {
  .overview-grid {
    grid-template-columns: 1fr;
    gap: var(--s5);
  }

  .overview-plate {
    max-width: 420px;
  }
}
</style>
