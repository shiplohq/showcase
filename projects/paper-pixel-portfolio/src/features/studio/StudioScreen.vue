<script setup lang="ts">
// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Studio manifesto — principles as a numbered index, people as ledger cards
// with typographic monograms. All content-state from studio.json.

import type { Studio } from '../../lib/types';

defineProps<{ studio: Studio }>();

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-zÀ-ỹ]/g, ''))
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}
</script>

<template>
  <section aria-labelledby="studio-title">
    <header class="page-head">
      <p class="meta meta--soft">{{ studio.volume }} — the studio behind the index</p>
      <h1 id="studio-title" class="type-rise">
        <span class="type-rise__inner">{{ studio.name }}</span>
      </h1>
    </header>

    <div class="page-flow">
      <p v-for="(para, i) in studio.manifesto" :key="i" v-reveal>{{ para }}</p>
    </div>

    <ol class="principles" role="list" aria-label="Studio principles">
      <li v-for="p in studio.principles" :key="p.n" v-reveal>
        <span class="principles__no meta" aria-hidden="true">{{ p.n }}</span>
        <div>
          <h2>{{ p.title }}</h2>
          <p class="case-section__copy">{{ p.copy }}</p>
        </div>
      </li>
    </ol>

    <section aria-labelledby="people-title" class="people-block">
      <p class="meta meta--soft people-block__head" id="people-title">The two of us</p>
      <div class="people">
        <article v-for="person in studio.people" :key="person.name" class="people__card" v-reveal>
          <svg
            class="people__monogram"
            viewBox="0 0 56 56"
            width="56"
            height="56"
            role="img"
            :aria-label="`Monogram of ${person.name}`"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1" y="1" width="54" height="54" fill="none" stroke="#1C1A16" stroke-width="1.5" />
            <text
              x="28"
              y="35"
              text-anchor="middle"
              fill="#2B36B5"
              style="font-family: var(--font-serif); font-size: 22px; font-weight: 600"
            >
              {{ initials(person.name) }}
            </text>
          </svg>
          <p class="people__name">{{ person.name }}</p>
          <p class="meta meta--soft people__role">{{ person.role }}</p>
          <p class="people__note">{{ person.note }}</p>
        </article>
      </div>
    </section>
  </section>
</template>
