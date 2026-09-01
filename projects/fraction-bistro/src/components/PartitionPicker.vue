<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Partition selector: how many equal parts to cut the dish into.
// The denominator as a physical act. aria-pressed carries selection both
// visually and semantically (never color-only).
import { PARTITIONS, denominatorPlural } from '../features/cut/engine';

defineProps<{ modelValue: number }>();

const emit = defineEmits<{
  (e: 'update:modelValue', partition: number): void;
}>();
</script>

<template>
  <div class="partition-picker" role="group" aria-label="Cut the dish into equal parts">
    <button
      v-for="p in PARTITIONS"
      :key="p"
      type="button"
      class="chip"
      :aria-pressed="modelValue === p"
      @click="emit('update:modelValue', p)"
    >
      <b>{{ p }}</b>
      <span>{{ denominatorPlural(p) }}</span>
    </button>
  </div>
</template>
