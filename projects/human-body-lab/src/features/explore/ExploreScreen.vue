<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// System layer explorer: the plate + toggle chips + organ list (text
// equivalent of the SVG) + organ detail side sheet. Layer state is pure
// (engine.ts); hover/focus highlight is bidirectional between list and plate.
import { computed, nextTick, ref } from 'vue';
import type { LabData, SystemId } from '../../lib/types';
import BodyPlate from '../../components/BodyPlate.vue';
import SystemChip from '../../components/SystemChip.vue';
import SystemGlyph from '../../components/SystemGlyph.vue';
import OrganSheet from '../../components/OrganSheet.vue';
import { ALL_SYSTEMS, pathwaysThrough } from './engine';
import { mountFade } from '../../lib/gsap';
import { onMounted } from 'vue';

const props = defineProps<{
  data: LabData;
  layers: ReadonlySet<SystemId>;
  explored: ReadonlySet<string>;
}>();

const emit = defineEmits<{
  (e: 'toggleLayer', id: SystemId): void;
  (e: 'inspectOrgan', organId: string): void;
  (e: 'gotoPathway', pathwayId: string): void;
}>();

const screenEl = ref<HTMLElement | null>(null);
onMounted(() => {
  if (screenEl.value) mountFade(screenEl.value);
});

const highlight = ref<string | null>(null);
const openOrganId = ref<string | null>(null);

const systems = computed(() =>
  ALL_SYSTEMS.map((id) => props.data.systems.find((s) => s.id === id)!),
);

const visibleOrgans = computed(() =>
  systems.value
    .filter((s) => props.layers.has(s.id))
    .map((s) => ({ system: s, organs: s.organs })),
);

const openOrgan = computed(() => {
  if (!openOrganId.value) return null;
  for (const s of props.data.systems) {
    const organ = s.organs.find((o) => o.id === openOrganId.value);
    if (organ) return { organ, system: s };
  }
  return null;
});

const pathwayNames = computed<Record<string, string>>(() =>
  Object.fromEntries(props.data.pathways.map((p) => [p.id, p.title])),
);

const onToggle = (id: SystemId) => {
  // closing the system that owns the open organ closes the sheet
  if (openOrgan.value && openOrgan.value.system.id === id && props.layers.has(id)) {
    openOrganId.value = null;
  }
  emit('toggleLayer', id);
};

const inspectByPathId = (pathId: string) => {
  const organ = props.data.systems.flatMap((s) => s.organs).find((o) => o.pathId === pathId);
  if (!organ) return;
  rememberTrigger();
  openOrganId.value = organ.id;
  emit('inspectOrgan', organ.id);
};

const inspectById = (organId: string) => {
  rememberTrigger();
  openOrganId.value = organId;
  emit('inspectOrgan', organId);
};

/** The element to return focus to when the sheet closes (a11y). */
let sheetTrigger: HTMLElement | null = null;
const rememberTrigger = () => {
  const el = document.activeElement;
  if (el instanceof HTMLElement && !el.closest('.sheet')) sheetTrigger = el;
};

const closeSheet = async () => {
  openOrganId.value = null;
  await nextTick();
  sheetTrigger?.focus();
  sheetTrigger = null;
};
</script>

<template>
  <section ref="screenEl" class="screen explore" aria-labelledby="explore-title">
    <div class="screen-head">
      <div>
        <p class="eyebrow">LAYER EXPLORER</p>
        <h2 id="explore-title">Lift the layers apart.</h2>
      </div>
      <p class="head-note">
        Switch systems on and off. Tap any organ — on the plate or in the list — to read
        its job.
      </p>
    </div>

    <div class="explore-grid">
      <!-- Panel first in DOM so the keyboard/tab order matches the locked
           decision (nav → layers → organ list → plate organs); CSS order
           puts the plate visually first on wide and stacked layouts. -->
      <div class="panel-col">
        <div class="panel chips-panel">
          <h3 class="section-heading">System layers</h3>
          <div class="chips" role="group" aria-label="Toggle system layers">
            <SystemChip
              v-for="sys in systems"
              :key="sys.id"
              :system="sys"
              :on="layers.has(sys.id)"
              @toggle="onToggle(sys.id)"
            />
          </div>
          <p v-if="layers.size === 0" class="mono-note empty-note">
            NO LAYER ON — SWITCH ONE ON TO BEGIN
          </p>
        </div>

        <div
          v-for="group in visibleOrgans"
          :key="group.system.id"
          class="panel organs-panel"
          :class="`sys-${group.system.id}`"
        >
          <div class="organs-head">
            <span class="organs-glyph" aria-hidden="true">
              <SystemGlyph :system="group.system.id" :size="18" />
            </span>
            <h3 class="section-heading">{{ group.system.name }} — {{ group.system.tagline }}</h3>
          </div>
          <ul class="organ-list">
            <li v-for="organ in group.organs" :key="organ.id">
              <button
                type="button"
                class="organ-item"
                :class="{
                  active: openOrganId === organ.id,
                  seen: explored.has(organ.id),
                }"
                :aria-label="
                  `${organ.name}, ${group.system.name.toLowerCase()} system` +
                  (explored.has(organ.id) ? ' — inspected' : '')
                "
                @mouseenter="highlight = organ.pathId"
                @mouseleave="highlight = null"
                @focus="highlight = organ.pathId"
                @blur="highlight = null"
                @click="inspectById(organ.id)"
              >
                <span class="organ-item-name">{{ organ.name }}</span>
                <span class="organ-item-seen" aria-hidden="true">{{
                  explored.has(organ.id) ? '✓' : ''
                }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="plate-col">
        <BodyPlate
          :data="data"
          mode="explore"
          :layers="layers"
          :highlight-path-id="highlight ?? openOrgan?.organ.pathId ?? null"
          :explored="explored"
          @inspect="inspectByPathId"
          @organ-focus="highlight = $event"
        />
      </div>

      <!-- Sheet sits at grid level, over the panel column: the organ being
           read (its lit shape + callout) stays visible on the plate. -->
      <OrganSheet
        v-if="openOrgan"
        :organ="openOrgan.organ"
        :system="openOrgan.system"
        :pathways-through="pathwaysThrough(data, openOrgan.organ.id)"
        :pathway-names="pathwayNames"
        @close="closeSheet"
        @goto-pathway="emit('gotoPathway', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.head-note {
  color: var(--ink-soft);
  max-width: 44ch;
  font-size: 15px;
}

.explore-grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(280px, 5fr);
  gap: var(--s5);
  align-items: start;
}

/* DOM order (panel first, for tab order) differs from visual order. */
.plate-col {
  order: 1;
  min-width: 0;
}

.panel-col {
  order: 2;
  display: flex;
  flex-direction: column;
  gap: var(--s3);
  min-width: 0;
}

.chips-panel,
.organs-panel {
  padding: var(--s4);
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}

.chips {
  display: flex;
  flex-direction: column;
  gap: var(--s2);
}

.empty-note {
  margin: 0;
}

.organs-head {
  display: flex;
  align-items: center;
  gap: var(--s2);
  color: var(--sys-ink);
}

.organ-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--s2);
}

.organ-item {
  min-height: 48px;
  padding: var(--s2) var(--s3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s2);
  border: var(--hairline);
  border-radius: 8px;
  background: var(--paper);
  text-align: left;
  width: 100%;
  transition: border-color var(--dur-feedback) var(--ease), background var(--dur-feedback) var(--ease);
}

.organ-item:hover,
.organ-item.active {
  border-color: var(--sys-ink);
  background: var(--paper-deep);
}

.organ-item-name {
  font-weight: 500;
}

.organ-item-seen {
  color: var(--ok);
  font-weight: 600;
}

@media (max-width: 1023px) {
  .explore-grid {
    grid-template-columns: 1fr;
  }

  .plate-col {
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
  }
}
</style>
