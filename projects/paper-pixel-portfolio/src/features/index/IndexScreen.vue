<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Home = the editorial index: manifesto intro, numbered ruled rows, sticky
// preview frame driven by hover/focus (desktop) and inline crops everywhere
// else. Rows are real anchors — the keyboard path is the pointer path.

import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import PlateArt from '../../components/PlateArt.vue';
import { gsap, killTweensOf, tween } from '../../lib/gsap';
import type { Project, Studio } from '../../lib/types';

const props = defineProps<{ studio: Studio; projects: Project[] }>();

const previewSlug = ref(props.projects[0]?.slug ?? '');

function setPreview(slug: string): void {
  if (previewSlug.value !== slug) previewSlug.value = slug;
}

const preview = computed(
  () => props.projects.find((p) => p.slug === previewSlug.value) ?? props.projects[0],
);

const previewEl = ref<HTMLElement | null>(null);

let alive = true;

onMounted(() => {
  // Index intro: masked lines rise into place — the type-led entrance.
  const inners = document.querySelectorAll('.index-intro .type-rise__inner');
  gsap.set(inners, { yPercent: 108 });
  tween(inners, { yPercent: 0, duration: 0.46, ease: 'power2.out', stagger: 0.07, delay: 0.05 });
});

watch(previewSlug, async () => {
  await nextTick();
  if (!alive || !previewEl.value) return;
  const plate = previewEl.value.querySelector('.preview-frame__plate');
  if (!plate) return;
  killTweensOf(plate);
  // Slide-in of the newly filed plate (crop = editorial statement).
  gsap.set(plate, { xPercent: 4, opacity: 0 });
  tween(plate, { xPercent: 0, opacity: 1, duration: 0.26, ease: 'power2.out' });
});

onUnmounted(() => {
  alive = false;
});

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
</script>

<template>
  <section aria-labelledby="index-title">
    <div class="index-intro">
      <p class="meta meta--soft">№ 01–{{ pad(projects.length) }} · {{ studio.volume }}</p>
      <h1 id="index-title" class="index-intro__lede type-rise">
        <span class="type-rise__inner">{{ studio.tagline }}.</span>
      </h1>
      <p class="index-intro__body type-rise">
        <span class="type-rise__inner">{{ studio.manifesto[1] }}</span>
      </p>
      <p class="type-rise">
        <span class="type-rise__inner"
          ><a href="#/studio">Read the studio manifesto&nbsp;→</a></span
        >
      </p>
    </div>

    <div class="index-layout">
      <nav aria-label="Selected works" class="index-rows-nav">
        <p class="meta meta--soft index-rows-head">Selected works</p>
        <ul class="index-rows" role="list">
          <li v-for="(p, i) in projects" :key="p.slug">
            <a
              class="index-row"
              :href="`#/work/${p.slug}`"
              :data-slug="p.slug"
              @mouseenter="setPreview(p.slug)"
              @focus="setPreview(p.slug)"
            >
              <span class="index-row__no" aria-hidden="true">{{ pad(i + 1) }}</span>
              <span class="index-row__body">
                <span class="index-row__title">{{ p.title }}</span>
                <span class="index-row__meta meta meta--soft">
                  <span v-for="d in p.discipline" :key="d">{{ d }}</span>
                  <span class="index-row__year">{{ p.year }}</span>
                  <span class="visually-hidden">— open case study</span>
                </span>
              </span>
              <span class="index-row__arrow" aria-hidden="true">→</span>
              <span class="index-row__inline" :data-slug="p.slug" aria-hidden="true">
                <PlateArt :art="p.heroAsset" crop="card" />
              </span>
            </a>
          </li>
        </ul>
      </nav>

      <aside class="preview-frame" ref="previewEl" aria-hidden="true">
        <p class="meta meta--soft preview-frame__kicker">On the lightbox</p>
        <div class="preview-frame__window">
          <div class="preview-frame__plate" :key="previewSlug" :data-slug="previewSlug">
            <PlateArt :art="preview?.heroAsset ?? ''" crop="card" />
          </div>
        </div>
        <div class="preview-frame__caption meta meta--faint">
          <span>{{ preview?.title }}</span>
          <span>{{ preview?.year }}</span>
        </div>
        <p class="meta meta--faint preview-frame__hint">
          Hover or focus a row — the plate files itself here.
        </p>
      </aside>
    </div>
  </section>
</template>
