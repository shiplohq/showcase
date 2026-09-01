<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Cutting table — build mode. Cut the dish, plate the exact fraction, serve.
// The order completes with a ticket stamp (never full-screen confetti).
import { computed, onMounted, ref, toRef, watch } from 'vue';
import type { Dish, ResolvedOrder } from '../../lib/types';
import {
  modeLabel,
  serveBuild,
  slicePhrase,
  type ServeOutcome,
} from './engine';
import { orderSession } from '../../lib/session';
import { mountFade, stampIn } from '../../lib/gsap';
import StationPanel from '../../components/StationPanel.vue';
import StampBadge from '../../components/StampBadge.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps<{
  order: ResolvedOrder;
  dish: Dish;
  nextOrderId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'served', orderId: string): void;
  (e: 'back'): void;
  (e: 'open', orderId: string): void;
}>();

// session-scoped state: leaving and returning to this ticket keeps the work
const session = orderSession(props.order.id);
const station = toRef(session, 'main');
const feedback = ref<ServeOutcome | null>(null);
const rootEl = ref<HTMLElement | null>(null);

const served = computed(() => feedback.value?.ok === true);

onMounted(() => {
  if (rootEl.value) mountFade(rootEl.value);
});

watch(served, (ok) => {
  if (!ok) return;
  const el = rootEl.value?.querySelector('.stamp--lg');
  if (el) stampIn(el);
});

function serve() {
  feedback.value = serveBuild(props.order, station.value);
  if (feedback.value.ok) emit('served', props.order.id);
}
</script>

<template>
  <section ref="rootEl" class="cut-screen screen" aria-label="Cutting table">
    <div class="screen-head">
      <h2>Cutting table</h2>
      <button type="button" class="btn btn--ghost" @click="emit('back')">← Order board</button>
    </div>

    <div class="mini-ticket">
      <p class="who">Order {{ order.id.replace('ord-', 'No. ') }} · {{ modeLabel(order.mode) }}</p>
      <h3 class="what">
        {{ order.customer }}
        <span class="sr-only">Serve {{ slicePhrase(order.requestedFraction) }}.</span>
      </h3>
    </div>

    <div class="stage">
      <div class="stage-col stage-station">
        <StationPanel v-model:station="station" :dish="dish" :label="`Cutting the ${dish.name}`" />
        <StampBadge v-if="served" large class="station-stamp" />
      </div>

      <div class="stage-col">
        <div class="serve-block">
          <p class="picker-label">Order asks for</p>
          <p class="ask-frac frac">
            <b>{{ order.requestedFraction[0] }}</b><span class="slash">/</span><b>{{ order.requestedFraction[1] }}</b>
            <span class="sr-only">{{ slicePhrase(order.requestedFraction) }}</span>
          </p>
          <button type="button" class="btn btn--primary btn--big" @click="serve">Serve order</button>
        </div>

        <div
          class="feedback"
          :class="feedback ? (feedback.ok ? 'feedback--servito' : 'feedback--nudge') : ''"
          role="status"
          aria-live="polite"
        >
          <span class="fb-icon" aria-hidden="true">
            <Icon :name="feedback?.ok ? 'check' : 'spoon'" :size="22" />
          </span>
          <span v-if="feedback">{{ feedback.message }}</span>
          <span v-else>Plate your slices, then serve.</span>
        </div>

        <div v-if="served" class="explainer">
          <p class="k-label">From the kitchen</p>
          <p>{{ order.explanation }}</p>
          <div class="explainer-actions">
            <button v-if="nextOrderId" type="button" class="btn btn--olive" @click="emit('open', nextOrderId)">
              Next order
              <Icon name="arrow" :size="18" />
            </button>
            <button type="button" class="btn" @click="emit('back')">Order board</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stage-station {
  position: relative;
}

.station-stamp {
  position: absolute;
  top: 18%;
  left: 50%;
  translate: -50% -50%;
  pointer-events: none;
}

.serve-block {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  align-items: flex-start;
}

.ask-frac {
  font-size: clamp(40px, 5vw, 56px);
}
</style>
