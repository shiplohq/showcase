<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
withDefaults(defineProps<{ text?: string; large?: boolean }>(), { text: 'Servito', large: false });
</script>

<template>
  <span class="stamp" :class="{ 'stamp--lg': large }" aria-hidden="true">{{ text }}</span>
</template>
