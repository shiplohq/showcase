<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The passport: one stamp slot per stop, staggered like a real travel
// journal. Earned stamps carry the place's own map silhouette.
import type { AtlasData } from '../lib/types';
import StampBadge from '../components/StampBadge.vue';

const props = defineProps<{ data: AtlasData; completed: string[] }>();
defineEmits<{ goto: [trailId: string] }>();

function placeOf(stopPlaceId: string) {
  return props.data.places.find((p) => p.id === stopPlaceId) ?? null;
}

function rot(i: number): string {
  return `${((i % 3) - 1) * 2.5}deg`;
}
</script>

<template>
  <div class="stamp-spread">
    <header class="stamp-head">
      <p class="kicker">Travel record</p>
      <h2>Passport of stamps</h2>
    </header>

    <section
      v-for="t in data.trails"
      :key="t.id"
      class="stamp-trail"
      :aria-labelledby="'st-' + t.id"
    >
      <div class="stamp-trail-head">
        <h3 :id="'st-' + t.id">
          Plate {{ data.plates.find((p) => p.id === t.plate)?.numeral }} — {{ t.title }}
        </h3>
        <button type="button" class="btn btn-ghost" @click="$emit('goto', t.id)">
          Walk this trail →
        </button>
      </div>
      <div class="stamp-grid">
        <div
          v-for="(s, i) in t.stops"
          :key="s.id"
          class="stamp-slot"
          :style="{ '--stamp-rot': rot(i) }"
        >
          <StampBadge :place="placeOf(s.at)" :earned="completed.includes(s.id)" />
        </div>
      </div>
    </section>

    <p class="stamp-legend">
      Stamps are saved on this device only — nothing leaves your browser. Use
      “Reset my progress” in the footer to start a fresh passport.
    </p>
  </div>
</template>

<style scoped>
.kicker {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--terra-deep);
  margin-bottom: var(--s2);
}

.stamp-trail {
  display: flex;
  flex-direction: column;
  gap: var(--s4);
}

.stamp-trail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s4);
  border-bottom: 2px solid var(--ink);
  padding-bottom: var(--s2);
}

.stamp-trail-head h3 {
  font-size: 21px;
}
</style>
