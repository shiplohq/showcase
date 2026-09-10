<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Masthead: wordmark, volume meta, site nav (hash links — real anchors),
// motion settings toggle (localStorage 'pp:motion', reset by toggling back).

import { computed, onMounted, ref } from 'vue';
import { motionPref, onMotionChange, setMotionPref, motionReduced } from '../lib/gsap';
import type { Studio } from '../lib/types';
import type { Route } from '../lib/router';

const props = defineProps<{ studio: Studio; route: Route }>();

const pref = ref<null | 'on' | 'off'>(null);
const reduced = ref(false);

function sync(): void {
  pref.value = motionPref();
  reduced.value = motionReduced();
}

onMounted(() => {
  sync();
  onMotionChange(sync);
});

const pressed = computed(() => pref.value === 'off');

function toggle(): void {
  // null (follow system) → 'off' → 'on' → back to null; reset built in.
  if (pref.value === null) setMotionPref('off');
  else if (pref.value === 'off') setMotionPref('on');
  else setMotionPref(null);
  sync();
}

const toggleLabel = computed(() => {
  if (pref.value === 'off') return 'Motion off';
  if (pref.value === 'on') return 'Motion on (forced)';
  return reduced.value ? 'Motion: system (reduced)' : 'Motion: system';
});

const navItems: { label: string; hash: string; match: Route['view'] }[] = [
  { label: 'Index', hash: '#/', match: 'index' },
  { label: 'Studio', hash: '#/studio', match: 'studio' },
  { label: 'Contact', hash: '#/contact', match: 'contact' },
];
</script>

<template>
  <header class="masthead">
    <div class="shell masthead__inner">
      <a class="wordmark" href="#/" aria-label="Paper & Pixel — home index"
        >Paper <span class="amp">&amp;</span> Pixel</a
      >
      <div class="masthead__meta">
        <span class="meta meta--faint">{{ studio.volume }} · {{ studio.yearsActive }}</span>
        <nav aria-label="Site">
          <ul class="sitenav">
            <li v-for="item in navItems" :key="item.hash">
              <a :href="item.hash" :aria-current="route.view === item.match ? 'page' : undefined">
                {{ item.label }}
              </a>
            </li>
          </ul>
        </nav>
        <button
          type="button"
          class="motion-toggle"
          :aria-pressed="pressed"
          :title="'Motion preference — cycles: system → off → on. Stored on this device only.'"
          @click="toggle"
        >
          {{ toggleLabel }}
        </button>
      </div>
    </div>
  </header>
</template>
