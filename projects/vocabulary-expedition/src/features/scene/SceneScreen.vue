<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// Scene screen — the journal spread: art plate + hotspot layer + caption
// plates + task rail + activity docks. Engine state lives here; decks are
// pure presentation that emit intents.

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { ItemData, UnitData } from '../../lib/types';
import type { Progress } from '../../lib/storage';
import { Flip, killTweensOf, prefersReducedMotion, tween } from '../../lib/gsap';
import * as chime from '../../lib/audio';
import * as clueEngine from '../clues/engine';
import * as matchEngine from '../match/engine';
import * as sentenceEngine from '../sentences/engine';
import SceneArt from './SceneArt.vue';
import ClueDeck from './ClueDeck.vue';
import MatchDeck from './MatchDeck.vue';
import SentenceDeck from './SentenceDeck.vue';
import CaptionPlate from '../../components/CaptionPlate.vue';
import AppIcon from '../../components/AppIcon.vue';
import { annotationStyle, hotspotStyle, plateStyle } from './overlay';

type Tab = 'look' | 'clues' | 'labels' | 'sentences';

const props = defineProps<{ unit: UnitData; progress: Progress; nextUnit: UnitData | null }>();
const emit = defineEmits<{
  exit: [];
  found: [itemId: string];
  labeled: [itemId: string];
  'scene-done': [unitId: string];
  'open-scrapbook': [];
  'open-next': [unitId: string];
}>();

const doneBefore = computed(() => props.progress.scenesDone.includes(props.unit.id));
const sound = computed(() => props.progress.settings.sound);
const showVi = computed(() => props.progress.settings.translation);

// -- session state ------------------------------------------------------------
const tab = ref<Tab>('look');
const clueState = ref<clueEngine.ClueState>(clueEngine.startClues(props.unit));
const matchState = ref<matchEngine.MatchState>(matchEngine.startMatch(props.unit));
const sentenceState = ref<sentenceEngine.SentenceState>(sentenceEngine.startSentences(props.unit));
const activeExplore = ref<string | null>(null);
const celebrated = ref(false);

const cluesDone = computed(() => clueState.value.done || doneBefore.value);
const labelsDone = computed(() => matchState.value.done || doneBefore.value);
const sentencesDone = computed(() => sentenceState.value.done || doneBefore.value);

const foundSet = computed(
  () => new Set([...props.progress.foundWords, ...clueState.value.found]),
);
const labeledMap = computed<Record<string, string>>(() => ({ ...matchState.value.placed }));

// -- hotspots -------------------------------------------------------------------
const clueTarget = computed(() =>
  tab.value === 'clues' && !clueState.value.done ? clueEngine.clueItem(props.unit, clueState.value).id : null,
);

function hotspotClass(item: ItemData): string[] {
  const cls = ['hotspot'];
  if (tab.value === 'labels' && matchState.value.holding) cls.push('hotspot--target');
  if (clueTarget.value === item.id && clueEngine.shouldGlowHint(clueState.value)) cls.push('hotspot--glow');
  if (tab.value === 'labels' && matchEngine.shouldGlowMatchTarget(matchState.value) && item.id === matchState.value.holding) {
    cls.push('hotspot--glow');
  }
  if (clueState.value.justFoundId === item.id || matchState.value.justPlacedId === item.id) cls.push('hotspot--hit');
  if (clueState.value.lastMissId === item.id || matchState.value.lastMissId === item.id) cls.push('hotspot--miss');
  return cls;
}

function onHotspot(item: ItemData): void {
  if (tab.value === 'look') {
    activeExplore.value = activeExplore.value === item.id ? null : item.id;
    if (activeExplore.value) {
      emit('found', item.id);
      chime.click(sound.value);
    }
    return;
  }
  if (tab.value === 'clues') {
    const next = clueEngine.answerClue(clueState.value, item.id);
    clueState.value = next;
    if (next.feedback === 'correct') {
      emit('found', next.justFoundId ?? item.id);
      chime.chime(sound.value);
      void popPlate();
    } else if (next.feedback === 'nudge') {
      chime.click(sound.value);
      window.setTimeout(() => {
        if (clueState.value.lastMissId === item.id) {
          clueState.value = { ...clueState.value, lastMissId: null };
        }
      }, 900);
    }
    return;
  }
  if (tab.value === 'labels' && matchState.value.holding) {
    placeOn(item.id);
  }
}

// -- clue deck actions -----------------------------------------------------------
function nextClue(): void {
  clueState.value = clueEngine.advanceClue(clueState.value);
  if (clueState.value.done) {
    popStamp(1);
    if (!matchState.value.done) tab.value = 'labels';
  }
}

function switchTab(t: Tab): void {
  if (t === 'labels' && !cluesDone.value) return;
  if (t === 'sentences' && !labelsDone.value) return;
  activeExplore.value = null;
  matchState.value = matchEngine.putDown(matchState.value);
  tab.value = t;
}

// -- match deck actions ------------------------------------------------------------
function pickUp(labelId: string): void {
  matchState.value = matchEngine.pickUp(matchState.value, labelId);
  chime.click(sound.value);
}

function putDown(): void {
  matchState.value = matchEngine.putDown(matchState.value);
}

function placeOn(itemId: string): void {
  const before = matchState.value;
  // Flip: chip (tray) → annotation (scene). State captured before the DOM
  // change; reduced motion skips straight to the final layout.
  const flipState = prefersReducedMotion() ? null : Flip.getState('[data-flip-id]');
  matchState.value = matchEngine.placeLabel(props.unit, before, itemId);
  if (matchState.value.feedback === 'correct') {
    emit('labeled', itemId);
    emit('found', itemId); // a matched word joins the scrapbook too
    chime.chime(sound.value);
    void nextTick(() => {
      if (flipState) {
        Flip.from(flipState, {
          duration: 0.4,
          ease: 'expo.out',
          targets: `[data-flip-id="label-${itemId}"]`,
          absolute: true,
          scale: false,
        });
      }
    });
    popStamp(matchState.value.done ? 2 : -1);
    if (matchState.value.done) window.setTimeout(() => {
      if (!sentenceState.value.done) tab.value = 'sentences';
    }, 600);
  } else {
    chime.click(sound.value);
    window.setTimeout(() => {
      if (matchState.value.lastMissId === itemId) {
        matchState.value = { ...matchState.value, lastMissId: null };
      }
    }, 900);
  }
}

function dropOn(labelId: string, itemId: string | null): void {
  if (!itemId) {
    putDown();
    return;
  }
  const before = matchState.value;
  matchState.value = matchEngine.dropLabel(props.unit, before, labelId, itemId);
  if (matchState.value.feedback === 'correct') {
    emit('labeled', itemId);
    emit('found', itemId); // a matched word joins the scrapbook too
    chime.chime(sound.value);
    // drag already ended at the object — pop the annotation in place
    void nextTick(async () => {
      const el = document.querySelector(`[data-flip-id="label-${labelId}"]`);
      if (el instanceof HTMLElement) {
        tween(el, { scale: 0.9, duration: 0 });
        tween(el, { scale: 1, duration: 0.26, ease: 'back.out(1.4)' });
      }
    });
    popStamp(matchState.value.done ? 2 : -1);
    if (matchState.value.done) window.setTimeout(() => {
      if (!sentenceState.value.done) tab.value = 'sentences';
    }, 600);
  }
}

// -- sentence deck actions ------------------------------------------------------------
function placeWord(itemId: string | null): void {
  sentenceState.value = sentenceEngine.placeWord(sentenceState.value, itemId);
}

function checkSentence(): void {
  const next = sentenceEngine.checkSentence(props.unit, sentenceState.value);
  sentenceState.value = next;
  if (next.feedback === 'correct') {
    chime.chime(sound.value);
    if (next.done && !celebrated.value) {
      celebrated.value = true;
      chime.fanfare(sound.value);
      emit('scene-done', props.unit.id);
      popStamp(3);
    }
  }
}

function nextSentence(): void {
  sentenceState.value = sentenceEngine.advanceSentence(props.unit, sentenceState.value);
}

// -- esc cancels a held chip ------------------------------------------------------------
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    if (overlayOpen.value) {
      overlayOpen.value = false;
    } else if (matchState.value.holding) {
      putDown();
    } else if (tab.value !== 'look') {
      emit('exit');
    }
  }
}

// -- celebration overlay ----------------------------------------------------------------
const overlayOpen = ref(false);
const sealEl = ref<HTMLElement | null>(null);
watch(
  () => sentenceState.value.done && celebrated.value,
  (v) => {
    if (v) overlayOpen.value = true;
  },
);
watch(overlayOpen, async (open) => {
  if (!open) return;
  await nextTick();
  if (sealEl.value) {
    tween(sealEl.value, { scale: 0, rotate: -18, duration: 0 });
    tween(sealEl.value, { scale: 1.12, rotate: 4, duration: 0.34, ease: 'back.out(1.6)' });
    tween(sealEl.value, { scale: 1, rotate: 0, duration: 0.22, delay: 0.34, ease: 'power2.out' });
  }
});

// -- motion (GSAP via reduced-motion-aware wrapper) --------------------------------------
const artWrap = ref<HTMLElement | null>(null);

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  if (artWrap.value) {
    tween(artWrap.value, { x: -14, y: 10, opacity: 0.85, duration: 0, ease: 'none' });
    tween(artWrap.value, { x: 0, y: 0, opacity: 1, duration: 0.38, ease: 'power2.out' });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (artWrap.value) killTweensOf(artWrap.value);
});

async function popPlate(): Promise<void> {
  await nextTick();
  // The plate is a Vue component — animate its root element (a plain gsap
  // target must be a DOM node or GSAP warns about unknown properties).
  const el = document.querySelector('.caption-plate');
  if (el instanceof HTMLElement) {
    tween(el, { scale: 0.92, duration: 0 });
    tween(el, { scale: 1, duration: 0.22, ease: 'back.out(1.4)' });
  }
}

async function popStamp(index: number): Promise<void> {
  await nextTick();
  const seal = document.querySelectorAll('.task-rail .stamp')[index === -1 ? 99 : index];
  if (seal instanceof HTMLElement) {
    tween(seal, { scale: 0.8, duration: 0 });
    tween(seal, { scale: 1, duration: 0.3, ease: 'back.out(1.4)' });
  }
}

// -- template helpers --------------------------------------------------------------------
const itemById = computed(() => {
  const m = new Map<string, ItemData>();
  for (const it of props.unit.items) m.set(it.id, it);
  return m;
});

const plateItem = computed<ItemData | null>(() => {
  if (tab.value === 'look' && activeExplore.value) return itemById.value.get(activeExplore.value) ?? null;
  if (tab.value === 'clues' && clueState.value.justFoundId) return itemById.value.get(clueState.value.justFoundId) ?? null;
  return null;
});

const rail = computed(() => [
  {
    id: 'look',
    icon: 'eye',
    label: 'Look around',
    sub: `${foundSet.value.size}/${props.unit.items.length} discovered`,
    active: tab.value === 'look',
    done: false,
    locked: false,
  },
  { id: 'clues', icon: 'glass', label: 'Clue hunt', sub: `${clueState.value.found.length}/${clueState.value.order.length} found`, active: tab.value === 'clues', done: cluesDone.value, locked: false },
  { id: 'labels', icon: 'tag', label: 'Word labels', sub: `${Object.keys(matchState.value.placed).length}/${matchState.value.targets.length} placed`, active: tab.value === 'labels', done: labelsDone.value, locked: !cluesDone.value },
  { id: 'sentences', icon: 'chat', label: 'Sentences', sub: `${sentenceState.value.solved.length}/${sentenceState.value.order.length} built`, active: tab.value === 'sentences', done: sentencesDone.value, locked: !labelsDone.value },
] as const);
</script>

<template>
  <section class="scene" :aria-label="`${unit.title} — ${unit.nativeTitle}`">
    <div class="scene-head">
      <div>
        <h2 class="scene-title">{{ unit.title }}</h2>
        <p v-if="showVi" class="scene-native vi">{{ unit.nativeTitle }}</p>
      </div>
      <nav class="task-rail" aria-label="Field tasks">
        <button
          v-for="t in rail"
          :key="t.id"
          type="button"
          class="stamp"
          :class="{ 'stamp--active': t.active, 'stamp--done': t.done && !t.active, 'stamp--locked': t.locked }"
          :aria-current="t.active ? 'step' : undefined"
          :disabled="t.locked"
          :aria-label="`${t.label}: ${t.sub}${t.locked ? ' — finish the task before it first' : ''}`"
          @click="switchTab(t.id)"
        >
          <span class="seal">
            <AppIcon :name="t.done && !t.active ? 'check' : t.icon" :size="20" />
          </span>
          <span>
            <span class="label">{{ t.label }}</span>
            <span class="sub">{{ t.sub }}</span>
          </span>
        </button>
      </nav>
    </div>

    <div ref="artWrap" class="art-wrap">
      <SceneArt :scene="unit.scene" />
      <div class="art-frame" aria-hidden="true" />

      <!-- hotspots: real buttons over the art, positioned by JSON bbox -->
      <button
        v-for="item in unit.items"
        :key="item.id"
        type="button"
        :class="hotspotClass(item)"
        :style="hotspotStyle(item.bbox)"
        :data-hotspot="item.id"
        :aria-label="foundSet.has(item.id) ? `${item.word} — ${item.translation}` : `Something in the picture: ${item.word}`"
        @click="onHotspot(item)"
      >
        <span v-if="foundSet.has(item.id)" class="pin-dot" aria-hidden="true" />
      </button>

      <!-- explore / clue caption plate -->
      <CaptionPlate
        v-if="plateItem"

        :key="plateItem.id"
        :item="plateItem"
        :show-translation="showVi"
        :style="plateStyle(plateItem.bbox)"
      />

      <!-- pinned word annotations after a correct label match -->
      <span
        v-for="(labelId, itemId) in labeledMap"
        :key="`ann-${itemId}`"
        class="annotation"
        :data-flip-id="`label-${labelId}`"
        :style="annotationStyle(itemById.get(itemId)?.bbox ?? [40, 40, 10, 10])"
      >
        <span class="pin" aria-hidden="true" />
        {{ itemById.get(itemId)?.word ?? labelId }}
      </span>
    </div>

    <!-- activity docks -->
    <div class="dock" :data-tab="tab">
      <p v-if="tab === 'look'" class="dock-hint">
        <AppIcon name="eye" :size="20" />
        Tap anything in the picture to learn its name. When you are ready, start the clue hunt!
      </p>
      <button v-if="tab === 'look'" class="btn btn--primary" type="button" @click="switchTab('clues')">
        <AppIcon name="glass" :size="22" />
        Start the clue hunt
      </button>

      <ClueDeck
        v-else-if="tab === 'clues'"
        :unit="unit"
        :state="clueState"
        @next="nextClue"
      />

      <MatchDeck
        v-else-if="tab === 'labels'"
        :unit="unit"
        :state="matchState"
        @pickup="pickUp"
        @drop="dropOn"
      />

      <SentenceDeck
        v-else
        :unit="unit"
        :state="sentenceState"
        :show-vi="showVi"
        @place="placeWord"
        @check="checkSentence"
        @next="nextSentence"
        @scrapbook="emit('open-scrapbook')"
      />
    </div>

    <p class="sr-status" role="status" aria-live="polite">
      {{
        tab === 'clues'
          ? clueEngine.clueAriaStatus(unit, clueState)
          : tab === 'labels'
            ? matchEngine.matchAriaStatus(unit, matchState)
            : tab === 'sentences'
              ? sentenceEngine.sentenceAriaStatus(unit, sentenceState)
              : ''
      }}
    </p>

    <!-- scene complete -->
    <div v-if="overlayOpen" class="overlay" role="dialog" aria-modal="true" aria-label="Scene complete">
      <div class="card">
        <div ref="sealEl" class="seal-reveal" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="116" height="116">
            <circle cx="60" cy="60" r="52" fill="#c0504a" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#a8453f" stroke-width="6" />
            <circle cx="60" cy="60" r="40" fill="none" stroke="#fff8ec" stroke-width="3" stroke-dasharray="4 7" />
            <text x="60" y="72" text-anchor="middle" font-size="34" fill="#fff8ec" font-weight="700">✓</text>
          </svg>
        </div>
        <h2>Scene stamped!</h2>
        <p>
          All done — every word in <strong>{{ unit.title }}</strong> is in your journal!
        </p>
        <p v-if="showVi" class="vi" lang="vi">Hoàn thành {{ unit.nativeTitle }} — con giỏi lắm!</p>
        <div class="card-actions">
          <button
            v-if="nextUnit"
            class="btn btn--primary"
            type="button"
            @click="emit('open-next', nextUnit.id)"
          >
            <AppIcon name="sparkle" :size="22" />
            Explore {{ nextUnit.title }}
          </button>
          <button v-if="nextUnit" class="btn" type="button" @click="emit('open-scrapbook')">
            <AppIcon name="book" :size="20" />
            Scrapbook
          </button>
          <button v-if="!nextUnit" class="btn btn--primary" type="button" @click="emit('open-scrapbook')">
            <AppIcon name="book" :size="22" />
            Open scrapbook
          </button>
          <button class="btn" type="button" @click="overlayOpen = false; emit('exit')">
            <AppIcon name="back" :size="20" />
            Back to map
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scene {
  display: flex;
  flex-direction: column;
  gap: var(--s4);
  flex: 1;
}

.scene-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s4);
  flex-wrap: wrap;
}

.scene-title {
  font-family: var(--font-journal);
  font-weight: 700;
  font-size: clamp(30px, 4.5vw, 44px);
  line-height: 1.05;
  margin: 0;
}

.scene-native {
  margin: 0;
  font-size: 15px;
}

.art-wrap {
  position: relative;
  /* Fold budget (impeccable P0): the whole spread — rail + art + dock with its
     primary CTA — must fit one viewport height. Budget ~470px for chrome
     (header + rail + dock + gaps) and cap the plate by what remains, while
     keeping the 1200x800 aspect so hotspot percent geometry maps 1:1. */
  width: min(100%, calc((100vh - 470px) * 1.5), calc(62vh * 1.5));
  margin-inline: auto;
  aspect-ratio: 1200 / 800;
  border: 2px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: var(--canvas-deep);
  touch-action: manipulation;
}

/* gouache paper grain over the plate (same procedural texture as the page) */
.art-wrap::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 15;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url%28%23g%29'/%3E%3C/svg%3E");
}

.art-wrap :deep(svg.scene-art) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.art-frame {
  position: absolute;
  inset: 6px;
  border: 2px solid rgba(255, 253, 244, 0.6);
  border-radius: 10px;
  pointer-events: none;
  z-index: var(--z-art);
}

.dock-hint {
  display: flex;
  align-items: center;
  gap: var(--s2);
  margin: 0;
  color: var(--ink-soft);
  font-weight: 700;
}

.sr-status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: var(--s3);
  flex-wrap: wrap;
  margin-top: var(--s4);
}

.seal-reveal {
  width: 116px;
  margin: 0 auto var(--s2);
}

@media (max-width: 767px) {
  .scene-head {
    align-items: flex-start;
  }

  /* Hotspots are placed by viewBox percent — the plate must keep the 1200x800
     aspect at every size so % geometry stays true; the ≥44px hit-rect lives on
     .hotspot globally (motion.css), not just on narrow screens. */
  .art-wrap {
    min-height: 0;
  }
}
</style>
