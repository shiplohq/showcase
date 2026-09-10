<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Compare: two fact sheets side by side with the real numbers — the child
// reads the data, the engine grades against the same data. The compared
// field row is highlighted on both cards, so the answer is a reading
// exercise, not a guess.
import { computed } from 'vue';
import type { CompareStop, Place } from '../lib/types';
import { climateLabel, fmtArea, fmtMeters, fmtPeople } from '../features/trail/engine';

const props = defineProps<{
  stop: CompareStop;
  a: Place;
  b: Place;
  disabled: boolean;
  feedbackState: 'idle' | 'correct' | 'try-again';
  lastPicked: string | null;
}>();

defineEmits<{ answer: [placeId: string] }>();

const correctId = computed(() => {
  const av = props.a.facts[props.stop.field];
  const bv = props.b.facts[props.stop.field];
  return av >= bv ? props.a.id : props.b.id;
});

function rows(place: Place): { label: string; value: string; hl: boolean }[] {
  const f = props.stop.field;
  return [
    { label: 'Area', value: fmtArea(place.facts.areaKm2), hl: f === 'areaKm2' },
    { label: 'People', value: fmtPeople(place.facts.populationM), hl: f === 'populationM' },
    { label: 'Highest point', value: `${fmtMeters(place.facts.highestPointM)} · ${place.facts.highestPointName}`, hl: f === 'highestPointM' },
    { label: 'Capital', value: place.facts.capital, hl: false },
    { label: 'Climate', value: climateLabel(place.facts.climate), hl: false },
  ];
}
</script>

<template>
  <div class="compare-activity">
    <div class="compare-grid">
      <div v-for="p in [a, b]" :key="p.id" class="fact-card">
        <p class="fact-title">{{ p.name }}</p>
        <table class="fact-table">
          <tbody>
            <tr v-for="r in rows(p)" :key="r.label" :class="{ hl: r.hl }">
              <th scope="row">{{ r.label }}</th>
              <td>{{ r.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="compare-q">
      <button
        v-for="p in [a, b]"
        :key="'opt-' + p.id"
        type="button"
        class="option-btn"
        :class="{
          'is-answer': feedbackState === 'correct' && p.id === correctId,
          'was-tried': feedbackState === 'try-again' && p.id === lastPicked,
        }"
        :disabled="disabled"
        @click="$emit('answer', p.id)"
      >
        <span>{{ p.name }}</span>
        <span class="mark" aria-hidden="true">answer</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.compare-activity {
  display: flex;
  flex-direction: column;
  gap: var(--s4);
}

.option-btn.is-answer {
  border-color: var(--forest);
}

.option-btn.was-tried {
  border-style: dashed;
  border-color: var(--terra);
}
</style>
