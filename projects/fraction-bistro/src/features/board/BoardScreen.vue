<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The order board: menu column (Menu del giorno) + rail of paper tickets.
// Content comes 100% from JSON — no lesson is hard-coded in the component.
import { onMounted, ref } from 'vue';
import type { Dish, ResolvedOrder } from '../../lib/types';
import { mountFade } from '../../lib/gsap';
import TicketCard from '../../components/TicketCard.vue';

defineProps<{
  orders: ResolvedOrder[];
  dishes: Dish[];
  servedIds: Set<string>;
}>();

const emit = defineEmits<{ (e: 'open', orderId: string): void }>();

const rootEl = ref<HTMLElement | null>(null);
onMounted(() => {
  if (rootEl.value) mountFade(rootEl.value);
});
</script>

<template>
  <section ref="rootEl" class="board screen" aria-label="Order board">
    <div class="menu-col">
      <p class="section-label">Menu del giorno</p>
      <ul class="menu-list">
        <li v-for="dish in dishes" :key="dish.id">
          <div class="dish-name">
            <span>{{ dish.name }}</span>
            <span class="dish-dots" aria-hidden="true"></span>
            <span class="dish-kind">{{ dish.kind === 'round' ? 'round pan' : 'square pan' }}</span>
          </div>
          <p class="dish-note">{{ dish.menuNote }}</p>
        </li>
      </ul>
      <p class="dish-note menu-col-note">
        Every dish is cut into equal parts only: fair shares, served as fractions.
      </p>
    </div>

    <div class="tickets-col">
      <p class="section-label">Order board</p>
      <p class="board-intro">
        Benvenuti! Take a ticket, cut the dish into fair parts and serve the exact fraction.
        Stamped tickets stay on the rail.
      </p>
      <div class="ticket-rail">
        <TicketCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          :served="servedIds.has(order.id)"
          @open="emit('open', $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.menu-col-note {
  margin-top: var(--sp-4);
  font-style: italic;
}
</style>
