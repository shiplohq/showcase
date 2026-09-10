<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Case study — 100% content-state driven (projects.json): hero plate (wide
// crop, shared-element target), type-led title rise, sectioned flow with
// margin-note aside, specs ledger and a "next case" filed link.

import { onMounted } from 'vue';
import PlateArt from '../../components/PlateArt.vue';
import { gsap, tween } from '../../lib/gsap';
import type { Project } from '../../lib/types';

defineProps<{
  project: Project;
  index: number;
  total: number;
  next: Project;
}>();

onMounted(() => {
  // Type-led entrance: the title rises from its mask; meta settles in behind.
  const title = document.querySelector('.case-titleblock .type-rise__inner');
  if (title) {
    gsap.set(title, { yPercent: 108 });
    tween(title, { yPercent: 0, duration: 0.32, ease: 'power2.out', delay: 0.12 });
  }
  const meta = document.querySelector('.case-titleblock__meta');
  if (meta) {
    gsap.set(meta, { opacity: 0, y: 8 });
    tween(meta, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', delay: 0.22 });
  }
});

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

const SECTION_LABEL: Record<string, string> = {
  text: 'Notes',
  quote: 'Margin quote',
  figure: 'Plate',
  specs: 'Specification',
};

/** Deterministic editorial cropping — each figure gets its own window. */
function figureFrame(i: number): 'tall' | 'card' | 'wide' {
  return i % 3 === 0 ? 'tall' : i % 3 === 1 ? 'card' : 'wide';
}

function plateCrop(frame: 'tall' | 'card' | 'wide'): 'tall' | 'card' | 'flow' {
  return frame === 'wide' ? 'flow' : frame;
}
</script>

<template>
  <article :aria-labelledby="`case-${project.slug}-title`">
    <header class="case-hero">
      <p class="meta meta--soft">
        Case {{ pad(index + 1) }}/{{ pad(total) }} — filed for {{ project.client }}
      </p>
      <div
        class="case-hero__plate"
        :data-slug="project.slug"
        role="img"
        :aria-label="project.alt"
      >
        <PlateArt :art="project.heroAsset" crop="flow" />
      </div>
      <div class="case-titleblock">
        <h1 :id="`case-${project.slug}-title`" class="type-rise">
          <span class="type-rise__inner">{{ project.title }}</span>
        </h1>
        <div class="case-titleblock__meta meta meta--soft">
          <span>{{ project.year }}</span>
          <span v-for="d in project.discipline" :key="d">{{ d }}</span>
        </div>
      </div>
    </header>

    <div class="case-body">
      <div class="case-body__flow">
        <section v-reveal class="case-section case-lede">
          <p class="case-section__copy case-lede__text">{{ project.summary }}</p>
        </section>

        <section
          v-for="(s, i) in project.sections"
          :key="i"
          v-reveal
          class="case-section"
          :class="[`case-section--${s.type}`, s.type === 'figure' ? `case-figure case-figure--${figureFrame(i)}` : '']"
        >
          <p class="meta case-section__kicker">§ {{ pad(i + 1) }} — {{ SECTION_LABEL[s.type] }}</p>

          <p v-if="s.type === 'text'" class="case-section__copy">{{ s.copy }}</p>

          <blockquote v-else-if="s.type === 'quote'">
            <p>{{ s.copy }}</p>
          </blockquote>

          <figure v-else-if="s.type === 'figure'">
            <div class="case-figure__window" role="img" :aria-label="s.alt">
              <PlateArt :art="s.asset ?? project.heroAsset" :crop="plateCrop(figureFrame(i))" />
            </div>
            <figcaption v-if="s.caption" class="meta meta--soft">
              {{ s.caption }}
            </figcaption>
          </figure>

          <dl v-else-if="s.type === 'specs'" class="specs">
            <div v-for="([label, value], r) in s.items" :key="r" class="specs__row">
              <dt class="meta meta--soft">{{ label }}</dt>
              <dd>{{ value }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <aside class="case-body__margin" aria-label="Case margin note">
        <p class="meta meta--soft">Filed note</p>
        <p class="case-body__margin-copy">{{ project.summary }}</p>
        <p class="meta meta--soft" style="margin-top: 1.2rem">
          Client — {{ project.client }}
        </p>
        <p class="meta meta--soft">Year — {{ project.year }}</p>
      </aside>
    </div>

    <nav class="case-next" aria-label="Continue browsing">
      <div class="case-next__inner">
        <a :href="`#/work/${next.slug}`" class="case-next__link">
          <span class="meta meta--soft">Next case — {{ pad(((index + 1) % total) + 1) }}</span>
          <span class="case-next__title">{{ next.title }}&nbsp;→</span>
        </a>
        <a href="#/" class="meta meta--soft">Back to index · Esc</a>
      </div>
    </nav>
  </article>
</template>
