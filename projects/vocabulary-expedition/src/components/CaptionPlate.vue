<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Museum caption plate — the core vocabulary moment: WORD (large), phonetic
// respelling, phrase, Vietnamese support line (toggleable). Positioned by the
// caller near the object's hotspot.

import type { ItemData } from '../lib/types';

withDefaults(
  defineProps<{
    item: ItemData;
    showTranslation: boolean;
    compact?: boolean;
  }>(),
  { compact: false },
);
</script>

<template>
  <figure class="caption-plate" :class="{ 'caption-plate--compact': compact }">
    <span class="pin" aria-hidden="true" />
    <div>
      <span class="word">{{ item.word }}</span>
      <span class="say">{{ item.say }}</span>
    </div>
    <p class="phrase">“{{ item.phrase }}”</p>
    <figcaption v-if="showTranslation" class="vi" lang="vi">{{ item.translation }}</figcaption>
  </figure>
</template>

<style scoped>
.caption-plate--compact {
  max-width: 200px;
}

.caption-plate--compact .phrase {
  display: none;
}
</style>
