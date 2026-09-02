<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Art dispatcher — the scene key from units.json picks the gouache plate.
// Adding a unit = new JSON + one component registered here (spec: content
// extensibility without touching screen logic).

import { computed, type Component } from 'vue';
import LivingRoomScene from '../scenes/LivingRoomScene.vue';
import KitchenScene from '../scenes/KitchenScene.vue';
import ClassroomScene from '../scenes/ClassroomScene.vue';
import MarketScene from '../scenes/MarketScene.vue';
import FarmScene from '../scenes/FarmScene.vue';
import ParkScene from '../scenes/ParkScene.vue';

const SCENES: Record<string, Component> = {
  'living-room': LivingRoomScene,
  kitchen: KitchenScene,
  classroom: ClassroomScene,
  market: MarketScene,
  farm: FarmScene,
  park: ParkScene,
};

const props = defineProps<{ scene: string }>();
const art = computed(() => SCENES[props.scene] ?? LivingRoomScene);
</script>

<template>
  <component :is="art" />
</template>
