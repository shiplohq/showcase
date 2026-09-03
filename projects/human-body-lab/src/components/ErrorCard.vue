<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Content-failure card: a clear, retryable message instead of a white
// screen (spec requirement). No blame copy.
defineProps<{ message: string }>();
defineEmits<{ (e: 'retry'): void }>();
</script>

<template>
  <div class="error-card panel" role="alert">
    <span class="eyebrow">SPECIMEN BOX UNAVAILABLE</span>
    <p class="msg">
      {{ message }}
    </p>
    <button type="button" class="btn btn-solid" @click="$emit('retry')">Try again</button>
  </div>
</template>

<style scoped>
.error-card {
  margin: var(--s7) auto;
  max-width: 460px;
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s3);
  text-align: left;
}

.msg {
  color: var(--ink-soft);
}
</style>
