<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Compare counter — two plates side by side.
//  - compare mode: build BOTH fractions, then choose < = > between them.
//  - equivalent mode ("same amount"): the chef's plate is fixed; cover the
//    same amount using the other cut. The overlay stacks the two dishes so
//    equal areas visibly coincide (spec: overlay area shows 1/2 = 2/4).
import { computed, onMounted, ref, toRef, watch } from 'vue';
import type { Dish, ResolvedOrder } from '../../lib/types';
import {
  modeLabel,
  serveCompare,
  serveEquivalent,
  slicePhrase,
  spokenFraction,
  type ServeOutcome,
  type Station,
} from '../cut/engine';
import { orderSession } from '../../lib/session';
import { mountFade, stampIn } from '../../lib/gsap';
import StationPanel from '../../components/StationPanel.vue';
import SignPicker from '../../components/SignPicker.vue';
import StampBadge from '../../components/StampBadge.vue';
import Icon from '../../components/Icon.vue';
import DishSvg from '../../components/DishSvg.vue';

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

const isCompare = computed(() => props.order.mode === 'compare');

// session-scoped state: leaving and returning keeps both stations + sign
const session = orderSession(props.order.id);
const left = toRef(session, 'main');
const right = toRef(session, 'right');
const sign = toRef(session, 'sign');
const feedback = ref<ServeOutcome | null>(null);
const overlay = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const signHintShown = ref(false);

// equivalent mode: the chef's plate is fixed at requestedFraction
const chef = computed<Station>(() => ({
  partition: props.order.requestedFraction[1],
  placed: props.order.requestedFraction[0],
}));

// the left panel models the learner's station in compare mode and the
// read-only chef's plate in equivalent mode
const leftStation = computed<Station>({
  get: () => (isCompare.value ? left.value : chef.value),
  set: (v: Station) => {
    left.value = v;
  },
});

const served = computed(() => feedback.value?.ok === true);

onMounted(() => {
  if (rootEl.value) mountFade(rootEl.value);
});

watch(served, (ok) => {
  if (!ok) return;
  const el = rootEl.value?.querySelector('.stamp--lg');
  if (el) stampIn(el);
});

const overlayLeft = computed<Station>(() => (isCompare.value ? left.value : chef.value));

const leftLabel = computed(() => (isCompare.value ? 'Left order' : "The chef's plate"));

function serve() {
  const outcome = isCompare.value
    ? serveCompare(props.order, left.value, right.value, sign.value)
    : serveEquivalent(props.order, right.value);
  feedback.value = outcome;
  if (outcome.ok) {
    emit('served', props.order.id);
  } else if (outcome.kind === 'sign-mismatch') {
    overlay.value = true;
    signHintShown.value = true;
  }
}
</script>

<template>
  <section ref="rootEl" class="compare-screen screen" aria-label="Compare counter">
    <div class="screen-head">
      <h2>Compare counter</h2>
      <button type="button" class="btn btn--ghost" @click="emit('back')">← Order board</button>
    </div>

    <div class="mini-ticket">
      <p class="who">Order {{ order.id.replace('ord-', 'No. ') }} · {{ modeLabel(order.mode) }}</p>
      <h3 class="what">{{ order.customer }}</h3>
    </div>

    <div class="compare-grid">
      <StationPanel
        v-model:station="leftStation"
        :dish="dish"
        :interactive="isCompare"
        :compact="true"
        :label="leftLabel"
      />

      <div class="compare-mid">
        <template v-if="isCompare">
          <p class="picker-label">Which is more?</p>
          <p class="sign-question frac" aria-hidden="true">
            <b>{{ order.requestedFraction[0] }}/{{ order.requestedFraction[1] }}</b>
            <span class="qmark">?</span>
            <b>{{ order.compareWith?.[0] }}/{{ order.compareWith?.[1] }}</b>
          </p>
          <p class="sr-only">
            Is {{ spokenFraction(order.requestedFraction) }} less than, equal to, or more than
            {{ order.compareWith ? spokenFraction(order.compareWith) : '' }}?
          </p>
          <SignPicker v-model="sign" />
        </template>
        <template v-else>
          <p class="picker-label">Same amount, different cuts</p>
          <p class="same-ask frac" aria-hidden="true">
            <b>{{ order.requestedFraction[0] }}/{{ order.requestedFraction[1] }}</b>
            <span class="qmark">=</span>
            <b>?/{{ order.partitionCount }}</b>
          </p>
          <p class="sr-only">
            The chef plated {{ slicePhrase(order.requestedFraction) }}. Cover the same amount with
            parts of {{ order.partitionCount }}.
          </p>
        </template>

        <button
          type="button"
          class="btn"
          :aria-pressed="overlay"
          @click="overlay = !overlay"
        >
          <Icon name="stack" :size="18" />
          {{ overlay ? 'Hide overlay' : 'Overlay plates' }}
        </button>

        <div v-if="overlay" class="overlay-stage">
          <div class="layer">
            <DishSvg
              :dish="dish"
              :partition="overlayLeft.partition"
              :placed="overlayLeft.placed"
              :interactive="false"
              :label="`${dish.name}, left amount`"
            />
          </div>
          <div class="layer layer--top">
            <DishSvg
              :dish="dish"
              :partition="right.partition"
              :placed="right.placed"
              :interactive="false"
              :label="`${dish.name}, right amount`"
            />
          </div>
        </div>
        <p v-if="overlay" class="overlay-caption">
          {{ signHintShown
            ? 'The plates are stacked: compare the gaps, then try the sign again.'
            : 'The top dish is see-through: matching gaps mean matching amounts.' }}
        </p>
      </div>

      <StationPanel
        v-model:station="right"
        :dish="dish"
        :compact="true"
        :label="isCompare ? 'Right order' : 'Your station'"
      />
    </div>

    <div class="compare-actions">
      <button type="button" class="btn btn--primary btn--big" @click="serve">Serve order</button>
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
        <span v-else>Plate both sides, then serve.</span>
      </div>
    </div>

    <div v-if="served" class="explainer served-row">
      <StampBadge large />
      <div>
        <p class="k-label">From the kitchen</p>
        <p>{{ order.explanation }}</p>
      </div>
      <div class="explainer-actions">
        <button v-if="nextOrderId" type="button" class="btn btn--olive" @click="emit('open', nextOrderId)">
          Next order
          <Icon name="arrow" :size="18" />
        </button>
        <button type="button" class="btn" @click="emit('back')">Order board</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sign-question,
.same-ask {
  font-size: clamp(26px, 3vw, 34px);
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
}

.qmark {
  color: var(--tomato-deep);
  font-weight: 400;
  padding-inline: var(--sp-1);
}

.compare-mid {
  min-width: 200px;
}

.compare-actions {
  margin-top: var(--sp-6);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  align-items: center;
}

.compare-actions .feedback {
  flex: 1 1 320px;
}

.served-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-5);
}
</style>
