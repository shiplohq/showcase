<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Comparison sign picker for the compare counter: less / equal / more.
import type { Sign } from '../features/cut/engine';

defineProps<{ modelValue: Sign | null }>();

const emit = defineEmits<{
  (e: 'update:modelValue', sign: Sign): void;
}>();

const options: { sign: Sign; glyph: string; label: string }[] = [
  { sign: '<', glyph: '<', label: 'is less than' },
  { sign: '=', glyph: '=', label: 'is equal to' },
  { sign: '>', glyph: '>', label: 'is more than' },
];
</script>

<template>
  <div class="sign-picker" role="group" aria-label="Choose the comparison sign">
    <button
      v-for="o in options"
      :key="o.sign"
      type="button"
      class="sign"
      :aria-pressed="modelValue === o.sign"
      :aria-label="o.label"
      @click="emit('update:modelValue', o.sign)"
    >
      <span aria-hidden="true">{{ o.glyph }}</span>
    </button>
  </div>
</template>
