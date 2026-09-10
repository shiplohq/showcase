<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The order board: a clear first-shift primer, illustrated menu, and grouped
// ticket rail. Order and dish content still comes 100% from local JSON.
import { computed, onMounted, ref } from 'vue';
import type { Dish, ResolvedOrder } from '../../lib/types';
import { mountFade } from '../../lib/gsap';
import TicketCard from '../../components/TicketCard.vue';
import DishSvg from '../../components/DishSvg.vue';

const props = defineProps<{
  orders: ResolvedOrder[];
  dishes: Dish[];
  servedIds: Set<string>;
}>();

const emit = defineEmits<{ (e: 'open', orderId: string): void }>();

const rootEl = ref<HTMLElement | null>(null);

const lessonGroups = computed(() => [
  {
    id: 'build',
    eyebrow: 'Lesson 01',
    title: 'Build a fraction',
    note: 'Cut a whole into equal parts, then plate the number the table ordered.',
    orders: props.orders.filter((order) => order.mode === 'build'),
  },
  {
    id: 'equivalent',
    eyebrow: 'Lesson 02',
    title: 'Same amount, new cut',
    note: 'Discover why two different-looking fractions can cover the same amount.',
    orders: props.orders.filter((order) => order.mode === 'equivalent'),
  },
  {
    id: 'compare',
    eyebrow: 'Lesson 03',
    title: 'Which plate has more?',
    note: 'Build two plates side by side, then choose <, =, or >.',
    orders: props.orders.filter((order) => order.mode === 'compare'),
  },
]);

const firstOpenOrder = computed(
  () => props.orders.find((order) => !props.servedIds.has(order.id)) ?? props.orders[0],
);
onMounted(() => {
  if (rootEl.value) mountFade(rootEl.value);
});
</script>

<template>
  <section ref="rootEl" class="board screen" aria-label="Order board">
    <div class="shift-primer">
      <div class="primer-copy">
        <p class="section-label">Today’s lesson</p>
        <h2>Fractions you can cut, count, and serve.</h2>
        <p class="primer-lede">
          You’re working the lunch shift. Read a ticket, divide the dish into equal parts,
          and plate exactly what the table asked for.
        </p>
        <ol class="service-steps" aria-label="How to play">
          <li><b>1</b><span><strong>Cut</strong> the whole into equal parts.</span></li>
          <li><b>2</b><span><strong>Plate</strong> the requested number of slices.</span></li>
          <li><b>3</b><span><strong>Serve</strong> it and stamp the ticket.</span></li>
        </ol>
        <button
          v-if="firstOpenOrder"
          type="button"
          class="btn btn--primary btn--big primer-cta"
          @click="emit('open', firstOpenOrder.id)"
        >
          {{ servedIds.size ? 'Continue your shift' : 'Start with 1/2' }}
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div class="primer-art" aria-label="Today’s three dishes">
        <div v-for="(dish, index) in dishes" :key="dish.id" class="primer-dish">
          <div class="primer-dish__art" aria-hidden="true">
            <DishSvg :dish="dish" :partition="index === 0 ? 2 : index === 1 ? 3 : 4" />
          </div>
          <p>{{ dish.name }}</p>
        </div>
        <p class="art-caption">One whole. Equal parts. A fraction on every plate.</p>
      </div>
    </div>

    <div class="board-workspace">
      <aside class="menu-col">
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
          The bottom number tells you how many equal parts to cut. The top number tells you
          how many parts to plate.
        </p>
      </aside>

      <div class="tickets-col">
        <div class="rail-heading">
          <div>
            <p class="section-label">Order board</p>
            <h2>Choose your next ticket</h2>
          </div>
          <p><strong>{{ servedIds.size }}</strong> of {{ orders.length }} served</p>
        </div>

        <section v-for="group in lessonGroups" :key="group.id" class="lesson-group">
          <header class="lesson-head">
            <p>{{ group.eyebrow }}</p>
            <h3>{{ group.title }}</h3>
            <span>{{ group.note }}</span>
          </header>
          <div class="ticket-rail">
            <TicketCard
              v-for="order in group.orders"
              :key="order.id"
              :order="order"
              :served="servedIds.has(order.id)"
              @open="emit('open', $event)"
            />
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.menu-col-note {
  margin-top: var(--sp-4);
  font-style: italic;
}

.rail-heading h2 {
  font-family: var(--font-display);
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.1;
}
</style>
