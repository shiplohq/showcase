<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Organ detail side sheet (spec IA). Desktop/tablet-landscape: right sheet;
// small screens: bottom sheet. Focus trap is light-weight: focus starts on
// the close button, Esc returns focus to the trigger (passed via prop).
import { nextTick, ref, watch } from 'vue';
import type { OrganDef, SystemDef } from '../lib/types';

const props = defineProps<{
  organ: OrganDef;
  system: SystemDef;
  /** Pathway ids that pass through this organ, for the link-out row. */
  pathwaysThrough: string[];
  /** Label for the link-out (screen switch is owned by App). */
  pathwayNames: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'gotoPathway', pathwayId: string): void;
}>();

const panel = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);

watch(
  () => props.organ.id,
  async () => {
    await nextTick();
    closeBtn.value?.focus();
  },
  { immediate: true },
);

const onKeydown = (ev: KeyboardEvent) => {
  if (ev.key === 'Escape') {
    ev.stopPropagation();
    emit('close');
    return;
  }
  // simple focus trap: keep Tab inside the sheet
  if (ev.key !== 'Tab' || !panel.value) return;
  const focusables = panel.value.querySelectorAll<HTMLElement>(
    'button, [href], [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (ev.shiftKey && document.activeElement === first) {
    ev.preventDefault();
    last.focus();
  } else if (!ev.shiftKey && document.activeElement === last) {
    ev.preventDefault();
    first.focus();
  }
};
</script>

<template>
  <div class="sheet-backdrop" @click="emit('close')">
    <div
      ref="panel"
      class="sheet"
      :class="`sys-${system.id}`"
      role="dialog"
      aria-modal="true"
      :aria-label="`${organ.name} — details`"
      @click.stop
      @keydown="onKeydown"
    >
      <div class="sheet-head">
        <span class="sheet-eyebrow eyebrow">ORGAN SHEET · {{ system.name.toUpperCase() }}</span>
        <button
          ref="closeBtn"
          type="button"
          class="sheet-close"
          aria-label="Close organ details"
          @click="emit('close')"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <h2 class="sheet-title">{{ organ.name }}</h2>
      <p class="sheet-function">{{ organ.function }}</p>

      <h3 class="section-heading">Field notes</h3>
      <ul class="fact-list">
        <li v-for="(fact, i) in organ.facts" :key="i">{{ fact }}</li>
      </ul>

      <div v-if="pathwaysThrough.length" class="sheet-links">
        <h3 class="section-heading">On a route</h3>
        <button
          v-for="pid in pathwaysThrough"
          :key="pid"
          type="button"
          class="link-btn"
          @click="emit('gotoPathway', pid)"
        >
          {{ pathwayNames[pid] ?? pid }} →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sheet-backdrop {
  position: absolute;
  inset: 0;
  z-index: 30;
  /* transparent click-catcher: the sheet overlays the panel column, so the
     plate — including the organ being read — stays fully visible and lit */
  background: transparent;
  display: flex;
  justify-content: flex-end;
}

.sheet {
  width: min(420px, 92%);
  height: 100%;
  overflow-y: auto;
  background: var(--paper-raised);
  border-left: var(--hairline);
  box-shadow: var(--sheet-shadow);
  padding: var(--s4) var(--s5) var(--s6);
  display: flex;
  flex-direction: column;
  gap: var(--s3);
  animation: sheet-in var(--dur-spatial) var(--ease);
}

@keyframes sheet-in {
  from {
    transform: translateX(24px);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s3);
}

.sheet-close {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: var(--hairline);
  background: var(--paper);
  color: var(--ink);
}

.sheet-close:hover {
  border-color: var(--ink-soft);
}

.sheet-title {
  font-size: 28px;
  color: var(--sys-ink-deep, var(--ink));
}

.sheet-function {
  font-size: 17px;
  line-height: 1.55;
}

.fact-list {
  list-style: none;
  margin: var(--s2) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s2);
}

.fact-list li {
  padding-left: var(--s4);
  position: relative;
  font-size: 15px;
  line-height: 1.55;
  color: var(--ink);
}

.fact-list li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 0.62em;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sys-ink, var(--ink-soft));
}

.sheet-links {
  margin-top: var(--s3);
  display: flex;
  flex-direction: column;
  gap: var(--s2);
  align-items: flex-start;
}

.link-btn {
  min-height: 44px;
  padding: var(--s2) var(--s3);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sys-ink-deep, var(--ink));
  border-bottom: 2px solid var(--sys-ink, var(--line));
}

.link-btn:hover {
  background: var(--paper-deep);
}

@media (max-width: 767px) {
  .sheet-backdrop {
    align-items: flex-end;
  }

  .sheet {
    width: 100%;
    height: 72%;
    border-left: none;
    border-top: var(--hairline);
    border-radius: 14px 14px 0 0;
    animation-name: sheet-up;
  }

  @keyframes sheet-up {
    from {
      transform: translateY(32px);
      opacity: 0;
    }
    to {
      transform: none;
      opacity: 1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    animation: none;
  }
}
</style>
