<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Review scrapbook — the words collected in the field, grouped by scene as
// sticker plates on a journal page. Tapping a sticker opens the full caption
// card (word, respelling, phrase, translation).

import { computed, ref } from 'vue';
import type { ItemData, UnitData } from '../../lib/types';
import type { Progress } from '../../lib/storage';
import CaptionPlate from '../../components/CaptionPlate.vue';
import AppIcon from '../../components/AppIcon.vue';
import PipIcon from '../../components/PipIcon.vue';

const props = defineProps<{ units: UnitData[]; progress: Progress }>();
const emit = defineEmits<{ exit: [] }>();

const detail = ref<ItemData | null>(null);

const totalWords = computed(() => props.units.reduce((n, u) => n + u.items.length, 0));
const foundCount = computed(() => props.progress.foundWords.length);

const groups = computed(() =>
  props.units.map((u) => ({
    unit: u,
    words: u.items.filter((i) => props.progress.foundWords.includes(i.id)),
    done: props.progress.scenesDone.includes(u.id),
  })),
);
</script>

<template>
  <section class="scrapbook" aria-label="Word scrapbook">
    <div class="sb-head">
      <PipIcon :size="52" />
      <div>
        <h2 class="sb-title">Field scrapbook</h2>
        <p class="sb-sub">{{ foundCount }} of {{ totalWords }} words collected</p>
      </div>
      <button class="btn" type="button" @click="emit('exit')">
        <AppIcon name="back" :size="20" />
        Back to map
      </button>
    </div>

    <div v-if="foundCount === 0" class="empty">
      <PipIcon :size="72" />
      <p>
        No words yet! Pick a scene on the map, tap the things you see and hunt
        the clues — every word you find gets a sticker here.
      </p>
      <p class="vi" lang="vi" v-if="progress.settings.translation">Chưa có từ nào! Hãy vào một khung cảnh và chạm vào mọi vật thể nhé.</p>
      <button class="btn btn--primary" type="button" @click="emit('exit')">
        <AppIcon name="glass" :size="22" />
        Start exploring
      </button>
    </div>

    <div v-else class="groups">
      <section v-for="g in groups.filter((x) => x.words.length > 0)" :key="g.unit.id" class="group" :aria-label="g.unit.title">
        <h3 class="group-title">
          {{ g.unit.title }}
          <span class="vi group-native">{{ g.unit.nativeTitle }}</span>
          <span v-if="g.done" class="group-done" title="Scene stamped">
            <AppIcon name="check" :size="16" />
            stamped
          </span>
        </h3>
        <ul class="stickers">
          <li v-for="w in g.words" :key="w.id">
            <button
              type="button"
              class="sticker"
              :aria-label="`${w.word} — ${w.translation}. Tap for the full caption.`"
              @click="detail = w"
            >
              <span class="dot" aria-hidden="true" />
              {{ w.word }}
            </button>
          </li>
        </ul>
      </section>
    </div>

    <!-- caption detail -->
    <div v-if="detail" class="overlay" role="dialog" aria-modal="true" :aria-label="`Caption: ${detail.word}`" @click.self="detail = null">
      <div class="card">
        <CaptionPlate :item="detail" :show-translation="progress.settings.translation" class="detail-plate" />
        <div class="card-actions">
          <button class="btn btn--primary" type="button" autofocus @click="detail = null">Close</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scrapbook {
  display: flex;
  flex-direction: column;
  gap: var(--s5);
}

.sb-head {
  display: flex;
  align-items: center;
  gap: var(--s4);
  flex-wrap: wrap;
}

.sb-head > div {
  flex: 1;
  min-width: 200px;
}

.sb-title {
  font-family: var(--font-journal);
  font-weight: 700;
  font-size: clamp(30px, 4.5vw, 42px);
  margin: 0;
  line-height: 1.05;
}

.sb-sub {
  margin: 2px 0 0;
  color: var(--ink-soft);
  font-weight: 700;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s4);
  text-align: center;
  max-width: 460px;
  margin: var(--s10) auto;
  color: var(--ink-soft);
}

.empty p {
  margin: 0;
}

.groups {
  display: flex;
  flex-direction: column;
  gap: var(--s6);
}

.group-title {
  font-family: var(--font-journal);
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 var(--s2);
  display: flex;
  align-items: center;
  gap: var(--s3);
  flex-wrap: wrap;
}

.group-native {
  font-family: var(--font-reading);
  font-size: 14px;
  font-weight: 400;
}

.group-done {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-reading);
  font-size: 12px;
  font-weight: 700;
  color: #fff8ec;
  background: var(--berry);
  border-radius: 999px;
  padding: 3px 10px;
}

.stickers {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--s3);
  margin: 0;
  padding: var(--s3) 0 0;
}

.sticker {
  font-family: var(--font-reading);
  font-weight: 700;
  font-size: 18px;
  color: var(--ink);
  background: var(--plate);
  border: 1.5px solid var(--line);
  border-radius: 4px 14px 14px 4px;
  box-shadow: var(--shadow-plate);
  min-height: 48px;
  padding: var(--s2) var(--s4) var(--s2) var(--s5);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
  position: relative;
  transition: transform 130ms ease;
}

.sticker:hover {
  transform: translateY(-2px) rotate(-1deg);
}

.sticker .dot {
  position: absolute;
  top: -6px;
  left: 8px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--berry);
  border: 2px solid var(--plate);
}

.detail-plate {
  position: static;
  max-width: none;
}

.card-actions {
  margin-top: var(--s4);
  display: flex;
  justify-content: flex-end;
}
</style>
