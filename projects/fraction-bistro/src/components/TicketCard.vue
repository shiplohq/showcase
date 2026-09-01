<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// One order as a paper ticket on the board rail. The whole ticket is one
// button — click/Enter/Space/tap opens it on the cutting table.
import { defineComponent, h } from 'vue';
import type { ResolvedOrder } from '../lib/types';
import { modeLabel, spokenFraction } from '../features/cut/engine';
import Icon from './Icon.vue';
import StampBadge from './StampBadge.vue';

defineProps<{ order: ResolvedOrder; served: boolean }>();

const emit = defineEmits<{ (e: 'open', orderId: string): void }>();

function orderNo(id: string): string {
  return id.replace('ord-', 'No. ');
}

// Small render helper so the fraction stays inline inside the ticket button.
const FractionText = defineComponent({
  props: { frac: { type: Array as unknown as () => [number, number], required: true } },
  setup(props2) {
    return () =>
      h('span', { class: 'frac' }, [
        h('b', { key: 'n' }, String(props2.frac[0])),
        h('span', { class: 'slash', key: 's' }, '/'),
        h('b', { key: 'd' }, String(props2.frac[1])),
        h('span', { class: 'sr-only', key: 'sr' }, spokenFraction(props2.frac)),
      ]);
  },
});
</script>

<template>
  <button type="button" class="ticket" @click="emit('open', order.id)">
    <span class="ticket-head">
      <span>Order {{ orderNo(order.id) }}</span>
      <span class="mode-chip">{{ modeLabel(order.mode) }}</span>
    </span>
    <span class="ticket-body">
      <span class="dish-name">{{ order.dishName }}</span>
      <span class="customer">{{ order.customer }}</span>
      <span class="ask">
        <span class="ask-label">Serve</span>
        <FractionText :frac="order.requestedFraction" />
        <template v-if="order.mode !== 'build' && order.compareWith">
          <span class="ask-join">{{ order.mode === 'compare' ? 'or' : 'as' }}</span>
          <FractionText :frac="order.compareWith" />
        </template>
      </span>
      <span class="take">
        <Icon name="arrow" :size="18" />
        <span>{{ served ? 'Cook again' : 'Take this order' }}</span>
      </span>
    </span>
    <StampBadge v-if="served" />
  </button>
</template>

<style scoped>
.ask-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.ask-join {
  font-style: italic;
  color: var(--ink-soft);
}
</style>
