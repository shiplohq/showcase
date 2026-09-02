// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell: HUD (home / sound / start over), the stage where screens mount,
// and the picture-book caption band that carries prompt + feedback + actions
// for every screen. Owns screen routing and progress persistence; content
// lives in JSON, interaction logic in src/engine/, motion in src/lib/gsap.

import type { PhonicsData } from './engine/types';
import {
  loadProgress,
  saveProgress,
  recordListen,
  recordRoundup,
  resetProgress,
  setMuted as storeSetMuted,
  totalFireflies,
  treeProgress,
  type Progress,
} from './lib/storage';
import { isMuted, setMuted, unlockAudio, warmSpeech, chime } from './lib/audio';
import { icons } from './components/art';
import { h, moveFocus } from './lib/dom';
import { renderGrove } from './screens/grove';
import { renderClearing } from './screens/clearing';
import { renderRoundup } from './screens/roundup';

type Screen = 'grove' | 'clearing' | 'roundup';

export function mountApp(root: HTMLElement, data: PhonicsData): () => void {
  let progress: Progress = loadProgress();
  setMuted(progress.muted);

  root.replaceChildren();
  const app = h('div', { class: 'app' });

  // ---- HUD --------------------------------------------------------------------
  const soundBtn = h('button', { class: 'hud-btn', 'aria-label': 'Sound on', 'aria-pressed': 'false' });
  function paintSound(): void {
    const muted = isMuted();
    soundBtn.innerHTML = muted ? icons.soundOff : icons.soundOn;
    soundBtn.setAttribute('aria-pressed', String(muted));
    soundBtn.setAttribute('aria-label', muted ? 'Sound is off. Tap to turn sound on.' : 'Sound is on. Tap to mute.');
  }
  soundBtn.addEventListener('click', () => {
    unlockAudio();
    setMuted(!isMuted());
    progress = storeSetMuted(progress, isMuted());
    saveProgress(progress);
    paintSound();
  });

  const homeBtn = h('button', { class: 'hud-btn', 'aria-label': 'Back to the forest map', html: icons.home });
  const resetBtn = h('button', { class: 'hud-btn', 'aria-label': 'Start over — erase forest progress', html: icons.reset });

  app.append(
    h(
      'header',
      { class: 'hud' },
      h('p', { class: 'hud-brand', text: 'Phonics Forest' }),
      h('nav', { class: 'hud-actions', 'aria-label': 'Forest controls' }, homeBtn, soundBtn, resetBtn),
    ),
  );

  // ---- stage + caption ----------------------------------------------------------
  const stage = h('main', { class: 'stage', id: 'stage', tabindex: '-1' });
  const captionKicker = h('p', { class: 'caption-kicker' });
  const captionPrompt = h('h2', { class: 'caption-prompt' });
  const captionFeedback = h('p', { class: 'caption-feedback', role: 'status', 'aria-live': 'polite' });
  const captionActions = h('div', { class: 'caption-actions' });
  const caption = h('footer', { class: 'caption' }, captionKicker, captionPrompt, captionFeedback, captionActions);
  // Second, visually-hidden polite region for fuller round descriptions —
  // separate from the visible feedback line so screen readers hear the
  // round context without the two updates clobbering each other.
  const srStatus = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  app.append(stage, caption, srStatus);
  root.append(app);

  paintSound();
  warmSpeech();

  let clearingDestroy: (() => void) | null = null;

  const captionApi = {
    kicker(text: string): void {
      captionKicker.textContent = text;
    },
    prompt(text: string): void {
      captionPrompt.textContent = text;
    },
    feedback(text: string, tone: 'idle' | 'good' | 'nudge'): void {
      captionFeedback.textContent = text;
      captionFeedback.dataset.tone = tone;
    },
    actions(actions: { label: string; onClick(): void; kind?: 'primary' | 'ghost'; icon?: string }[]): void {
      captionActions.replaceChildren();
      for (const a of actions) {
        const btn = h(
          'button',
          { class: `caption-btn ${a.kind === 'primary' ? 'caption-btn-primary' : 'caption-btn-ghost'}` },
          h('span', { class: 'caption-btn-icon', html: a.icon ?? '', 'aria-hidden': 'true' }),
          h('span', { text: a.label }),
        );
        btn.addEventListener('click', a.onClick);
        captionActions.append(btn);
      }
    },
    announce(text: string): void {
      srStatus.textContent = text.slice(0, 240);
    },
  };

  // ---- routing --------------------------------------------------------------------

  let screen: Screen = 'grove';

  function goGrove(): void {
    clearingDestroy?.();
    clearingDestroy = null;
    screen = 'grove';
    stage.dataset.screen = 'grove';
    renderGrove(stage, data, progress, {
      onOpenTree(treeId) {
        unlockAudio();
        goClearing(treeId);
      },
      onRoundup() {
        unlockAudio();
        goRoundup();
      },
    });
    const flies = totalFireflies(progress);
    const max = data.trees.length * 3;
    captionApi.kicker('The sound forest');
    captionApi.prompt('Every tree keeps one sound. Tap a tree to listen and match.');
    captionApi.feedback(
      flies === 0 ? 'No fireflies yet — they wake up as you match sounds.' : `${flies} of ${max} fireflies are glowing.`,
      flies > 0 ? 'good' : 'idle',
    );
    // Ghost, not berry: the trees are the grove's primary path — the roundup
    // entry must not out-pull them (impeccable critique P2/minor).
    captionApi.actions([
      { label: 'Creature roundup', kind: 'ghost', icon: icons.next, onClick: () => goRoundup() },
    ]);
    moveFocus(stage);
  }

  function goClearing(treeId: string): void {
    clearingDestroy?.();
    const tree = data.trees.find((t) => t.id === treeId);
    if (!tree) {
      goGrove();
      return;
    }
    screen = 'clearing';
    stage.dataset.screen = 'clearing';
    const stored = treeProgress(progress, treeId);
    const handle = renderClearing(stage, data, tree, stored.fireflies, captionApi, {
      onBack: goGrove,
      onRoundComplete(treeId2, roundsDone, fireflies, done) {
        progress = recordListen(progress, treeId2, roundsDone, fireflies, done ? 'done' : 'correct');
        saveProgress(progress);
      },
      onSpeechMissing() {
        captionApi.feedback('No voice here — tap “Read it” to see the words.', 'nudge');
      },
    });
    clearingDestroy = handle.destroy;
    moveFocus(stage);
  }

  function goRoundup(): void {
    clearingDestroy?.();
    clearingDestroy = null;
    screen = 'roundup';
    stage.dataset.screen = 'roundup';
    renderRoundup(stage, data, captionApi, {
      onBack: goGrove,
      onComplete() {
        progress = recordRoundup(progress);
        saveProgress(progress);
      },
      onSpeechMissing() {
        captionApi.feedback('No voice here — every word is written on its leaf.', 'nudge');
      },
    });
    moveFocus(stage);
  }

  homeBtn.addEventListener('click', goGrove);

  // Escape: leave dialogs first (reset confirm is inline), else back to grove.
  // Document-level: focus may sit on body after a caption action re-render.
  const onKey = (ev: KeyboardEvent) => {
    if (ev.key !== 'Escape') return;
    if (root.querySelector('.confirm-open')) return;
    if (screen !== 'grove') goGrove();
  };
  document.addEventListener('keydown', onKey);

  // ---- start over (reset) -----------------------------------------------------------

  resetBtn.addEventListener('click', () => {
    captionApi.kicker('Start over?');
    captionApi.prompt('All fireflies go out and the forest forgets your visits.');
    captionApi.feedback('Nothing else changes — you can begin again any time.', 'idle');
    const yes = h('button', { class: 'caption-btn caption-btn-primary', text: 'Yes, start over' });
    const no = h('button', { class: 'caption-btn caption-btn-ghost', text: 'Keep my forest' });
    yes.addEventListener('click', () => {
      progress = resetProgress();
      setMuted(progress.muted);
      saveProgress(progress);
      paintSound();
      goGrove();
    });
    no.addEventListener('click', goGrove);
    const row = h('div', { class: 'caption-actions confirm-open' }, yes, no);
    captionActions.replaceChildren(row);
    yes.focus();
  });

  // Silence linter on unused chime import (used indirectly by screens).
  void chime;

  goGrove();

  return () => {
    clearingDestroy?.();
    document.removeEventListener('keydown', onKey);
  };
}
