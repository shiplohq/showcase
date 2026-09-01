<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Recipe book — the menu page of equivalences the learner has discovered by
// completing "same amount" orders. Entries derive from served progress; the
// book fills as the shift goes on (intrinsic reward, no scores).
import { onMounted, ref } from 'vue';
import type { Fraction, Recipe } from '../../lib/types';
import { spokenFraction } from '../cut/engine';
import { mountFade } from '../../lib/gsap';

defineProps<{
  recipes: Recipe[];
}>();

const rootEl = ref<HTMLElement | null>(null);
onMounted(() => {
  if (rootEl.value) mountFade(rootEl.value);
});

function pair(f: Fraction): string {
  return `${f[0]}/${f[1]}`;
}
</script>

<template>
  <section ref="rootEl" class="book-screen screen" aria-label="Recipe book">
    <div class="screen-head">
      <h2>Recipe book</h2>
    </div>
    <p class="board-intro">
      Equivalences discovered at the counter: two cuts, one amount. Complete a 'Same amount' order
      to add a page.
    </p>

    <ul v-if="recipes.length > 0" class="book-list">
      <li v-for="r in recipes" :key="r.orderId">
        <p class="pair">
          <span>{{ pair(r.left) }}</span>
          <span class="eq" aria-hidden="true">=</span>
          <span>{{ pair(r.right) }}</span>
          <span class="sr-only">
            {{ spokenFraction(r.left) }} equals {{ spokenFraction(r.right) }}
          </span>
        </p>
        <p class="book-dish">
          <span class="dish-name">{{ r.dishName }}</span>
          <span class="book-note">from Order {{ r.orderId.replace('ord-', 'No. ') }}</span>
        </p>
      </li>
    </ul>

    <div v-else class="book-empty">
      <p class="big">The book is still blank.</p>
      <p>
        Take a 'Same amount' ticket from the order board: cover the chef's amount with different
        cuts and the recipe lands here.
      </p>
    </div>
  </section>
</template>
