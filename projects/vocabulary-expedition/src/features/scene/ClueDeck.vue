<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Clue deck — the field-task card in the dock: Pip the guide reads the clue;
// wrong taps nudge gently; found words show their plate on the art.

import type { UnitData } from '../../lib/types';
import { clueCountText, clueItem, nudgeCopy } from '../clues/engine';
import type { ClueState } from '../clues/engine';
import AppIcon from '../../components/AppIcon.vue';
import PipIcon from '../../components/PipIcon.vue';

const props = defineProps<{ unit: UnitData; state: ClueState }>();
const emit = defineEmits<{ next: [] }>();

const item = () => clueItem(props.unit, props.state);
</script>

<template>
  <div class="dock-head">
    <PipIcon :size="44" />
    <h2>Clue {{ clueCountText(state) }}</h2>
    <span class="count">find it in the picture</span>
  </div>

  <p v-if="!state.done" class="clue-text">“{{ item().clue }}”</p>
  <p v-else class="clue-text">
    All clues found — every word is pinned on the picture!
  </p>
  <!-- NB: no Vietnamese line here — the answer's translation would spoil the
       riddle for an A1 child. L1 support lands on the caption plate AFTER the
       word is found (impeccable critique P1a). -->

  <div v-if="state.feedback === 'nudge'" class="feedback-strip" data-kind="nudge">
    <AppIcon name="glass" :size="20" />
    <span>{{ nudgeCopy(state) }}</span>
  </div>

  <div v-else-if="state.feedback === 'correct'" class="feedback-strip" data-kind="correct">
    <AppIcon name="leaf" :size="20" />
    <span>Great find! <strong>{{ item().word }}</strong> — {{ item().say }}</span>
  </div>

  <button v-if="state.feedback === 'correct' && !state.done" class="btn btn--primary" type="button" @click="emit('next')">
    Next clue
    <AppIcon name="glass" :size="20" />
  </button>
  <button v-else-if="state.done" class="btn btn--primary" type="button" @click="emit('next')">
    Pin the word labels
    <AppIcon name="tag" :size="20" />
  </button>
</template>

<style scoped>
.clue-text {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}

.clue-vi {
  margin: 0;
  font-size: 15px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
