<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Fraction notation + spoken equivalent. A fraction is NEVER shown as a
// picture alone: every visual fraction carries its n/d symbols and an
// accessible "n of d equal parts" reading (spec accessibility rule).
import { computed } from 'vue';
import type { Fraction } from '../lib/types';
import { spokenFraction } from '../features/cut/engine';

const props = withDefaults(
  defineProps<{
    frac: Fraction;
    /** shown while the dish is still whole */
    wholeLabel?: string;
  }>(),
  { wholeLabel: 'the whole dish' },
);

const isWhole = computed(() => props.frac[0] === 0 && props.frac[1] === 1);
</script>

<template>
  <p class="fraction-readout">
    <span v-if="isWhole" class="whole">{{ wholeLabel }}</span>
    <template v-else>
      <span class="frac" aria-hidden="true"><b>{{ frac[0] }}</b><span class="slash">/</span><b>{{ frac[1] }}</b></span>
      <span class="sr-only">{{ spokenFraction(frac) }}</span>
    </template>
  </p>
</template>

<style scoped>
.fraction-readout {
  margin: 0;
}

.whole {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 24px;
  color: var(--ink-soft);
}
</style>
