<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// System layer toggle chip: glyph + name + organ count (never color-only).
// min-height 44px, 8px gap from neighbours — touch definition of done.
import type { SystemDef } from '../lib/types';
import SystemGlyph from './SystemGlyph.vue';

defineProps<{
  system: SystemDef;
  on: boolean;
}>();

defineEmits<{
  (e: 'toggle'): void;
}>();
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="[`sys-${system.id}`, { on }]"
    :aria-pressed="on"
    @click="$emit('toggle')"
  >
    <span class="chip-glyph" aria-hidden="true">
      <SystemGlyph :system="system.id" :size="20" />
    </span>
    <span class="chip-text">
      <span class="chip-name">{{ system.name }}</span>
      <span class="chip-count">{{ system.organs.length }} organs</span>
    </span>
    <span class="chip-state" aria-hidden="true">{{ on ? 'ON' : 'OFF' }}</span>
  </button>
</template>

<style scoped>
.chip {
  display: flex;
  align-items: center;
  gap: var(--s2);
  min-height: 48px;
  padding: var(--s2) var(--s3);
  border: 1px solid var(--sys-ink);
  border-radius: 8px;
  background: var(--paper-raised);
  color: var(--ink);
  text-align: left;
  transition: background var(--dur-feedback) var(--ease), color var(--dur-feedback) var(--ease);
}

.chip:hover {
  background: var(--paper-deep);
}

.chip.on {
  background: var(--sys-ink);
  color: #fff;
}

.chip.on .chip-count {
  color: rgba(255, 255, 255, 0.82);
}

.chip-glyph {
  display: inline-flex;
  color: var(--sys-ink-deep);
}

.chip.on .chip-glyph {
  color: #fff;
}

.chip-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  flex: 1;
}

.chip-name {
  font-weight: 600;
  font-size: 15px;
}

.chip-count {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.chip-state {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  opacity: 0.75;
}
</style>
