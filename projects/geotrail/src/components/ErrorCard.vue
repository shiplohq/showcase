<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
defineProps<{ message: string }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <div class="error-card" role="alert">
    <h2>The atlas could not open</h2>
    <p>{{ message }}</p>
    <div>
      <button type="button" class="btn btn-primary" @click="$emit('retry')">Try again</button>
    </div>
  </div>
</template>
