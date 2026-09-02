// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Creature Roundup — word sorting. Word creatures wait in a tray; each goes
// to the tree whose sound it carries. Three equivalent input paths by design
// (WCAG 2.2 dragging): pointer drag with forgiving snap, tap-tap
// (pick up creature, tap tree), and keyboard carry (Enter to lift, Enter to
// drop, Escape to return). Wrong drops send the creature gently back with a
// positional hint — replayed, not punished.

import type { PhonicsData } from '../engine/types';
import { placeCreature, startSort, sortHint, ariaStatusSort, nestCreatures, type SortState, type SortCreature } from '../engine/sort';
import { creature, forestBackdrop, icons, canopyVar, type SpriteVariant } from '../components/art';
import { h, svgFragment } from '../lib/dom';
import { flipInto } from '../lib/gsap';
import { playAudioUri, chime, speechAvailable } from '../lib/audio';

export interface RoundupDeps {
  onBack(): void;
  onComplete(): void;
  onSpeechMissing(): void;
}

interface CaptionApi {
  kicker(text: string): void;
  prompt(text: string): void;
  feedback(text: string, tone: 'idle' | 'good' | 'nudge'): void;
  actions(actions: { label: string; onClick(): void; kind?: 'primary' | 'ghost'; icon?: string }[]): void;
  announce(text: string): void;
}

const SNAP_RADIUS = 56;

export function renderRoundup(
  stage: HTMLElement,
  data: PhonicsData,
  caption: CaptionApi,
  deps: RoundupDeps,
): void {
  stage.replaceChildren();
  let s: SortState = startSort(data);
  let carrying: string | null = null;
  let noticeShown = false;

  const wrap = h('div', { class: 'roundup' });
  wrap.append(svgFragment(forestBackdrop('roundup')));

  // Nests: one tree-stump home per sound, sign carries grapheme + IPA.
  const nests = h('div', { class: 'nests', role: 'group', 'aria-label': 'Sound nests' });
  const nestEls = new Map<string, HTMLButtonElement>();
  data.trees.forEach((t) => {
    const nest = h('button', {
      class: 'nest',
      'data-nest': t.id,
      'aria-label': `${t.graphemes[0]} tree nest — sound ${t.phoneme}`,
    });
    nest.append(
      h('span', {
        class: 'nest-art',
        html: `<svg viewBox="0 0 120 96" aria-hidden="true" focusable="false">
          <ellipse cx="60" cy="88" rx="44" ry="7" fill="var(--ivory-deep)" stroke="var(--ink)" stroke-width="2.4"/>
          <path d="M28 42 L26 84 L94 84 L92 42 Z" fill="var(--bark)" stroke="var(--ink)" stroke-width="3.4" stroke-linejoin="round"/>
          <path d="M30 46 Q60 38 90 46 L92 42 Q60 32 28 42 Z" fill="${canopyVar(t.canopy)}" stroke="var(--ink)" stroke-width="3"/>
          <rect x="18" y="8" width="84" height="34" rx="7" fill="var(--ivory-raised)" stroke="var(--ink)" stroke-width="3.2"/>
          <text class="nest-grapheme" x="60" y="30" text-anchor="middle">${t.graphemes[0]}</text>
          <text class="nest-ipa" x="60" y="40" text-anchor="middle">${t.phoneme}</text>
        </svg>`,
      }),
      h('span', { class: 'nest-count', 'aria-hidden': 'true', text: '0' }),
      h('span', { class: 'nest-cards' }),
    );
    nest.addEventListener('click', () => dropOnNest(t.id));
    nestEls.set(t.id, nest);
    nests.append(nest);
  });

  // Tray of creatures.
  const tray = h('div', { class: 'tray', role: 'group', 'aria-label': 'Word creatures waiting in the tray' });
  wrap.append(nests, tray);
  stage.append(wrap);

  // ---- actions ----------------------------------------------------------------

  function spriteFor(word: string): SpriteVariant {
    // Deterministic variant per word (stable across re-deals).
    const key = word.charCodeAt(0) + word.length;
    const variants: SpriteVariant[] = ['pod-a', 'pod-b', 'pod-c', 'pod-d'];
    return variants[key % variants.length];
  }

  function homeTree(phonemeId: string) {
    return data.trees.find((t) => t.id === phonemeId);
  }

  function speakWord(word: string): void {
    if (!speechAvailable()) {
      if (!noticeShown) {
        noticeShown = true;
        deps.onSpeechMissing();
      }
      return;
    }
    void playAudioUri(`speech:${word}`);
  }

  function creatureCard(c: SortCreature): HTMLButtonElement {
    const home = homeTree(c.phonemeId);
    const card = h('button', {
      class: 'creature-btn',
      'data-uid': c.uid,
      'aria-label': `Creature carrying the word “${c.word}”. Take it to a tree.`,
      html: creature(c.word, spriteFor(c.word), home ? canopyVar(home.canopy) : 'var(--moss)'),
    });
    card.addEventListener('click', () => pickUp(c.uid));
    attachDrag(card, c);
    return card;
  }

  function pickUp(uid: string): void {
    if (carrying === uid) {
      putDown(uid);
      return;
    }
    if (carrying) putDown(carrying);
    const c = s.creatures.find((x) => x.uid === uid);
    if (!c || c.status !== 'tray') return;
    carrying = uid;
    cardOf(uid)?.classList.add('carrying');
    nests.classList.add('droppable');
    nestEls.forEach((n) => n.classList.add('open'));
    speakWord(c.word);
    caption.feedback(`Carrying “${c.word}”. Choose its tree.`, 'idle');
    caption.announce(`Carrying ${c.word}. Choose its tree.`);
  }

  function putDown(uid: string, quiet = false): void {
    carrying = null;
    cardOf(uid)?.classList.remove('carrying');
    nests.classList.remove('droppable');
    nestEls.forEach((n) => n.classList.remove('open'));
    if (!quiet) caption.feedback('The creature is back in the tray.', 'idle');
  }

  function cardOf(uid: string): HTMLButtonElement | null {
    return wrap.querySelector<HTMLButtonElement>(`.creature-btn[data-uid="${uid}"]`);
  }

  function dropOnNest(nestId: string): void {
    if (!carrying) return;
    const uid = carrying;
    const card = cardOf(uid);
    const nestEl = nestEls.get(nestId);
    if (!card || !nestEl) return;
    const before = s;
    s = placeCreature(s, uid, nestId);
    if (s === before) return; // already placed / completed — no-op

    if (s.feedback === 'placed' || s.feedback === 'done') {
      carrying = null;
      card.classList.remove('carrying');
      card.setAttribute('aria-label', `“${card.querySelector('.creature-word')?.textContent ?? ''}” is home at the ${nestId} tree.`);
      card.disabled = true;
      card.classList.add('homed');
      const host = nestEl.querySelector('.nest-cards');
      if (host) {
        flipInto(card, () => {
          host.append(card);
          card.classList.add('mini');
        });
      }
      updateCounts();
      chime('place');
      caption.feedback(
        s.feedback === 'done'
          ? `All creatures are home — ${s.placed} words sorted. The forest hums.`
          : `“${wordOf(uid)}” is home. ${s.placed} of ${s.creatures.length} creatures settled.`,
        'good',
      );
      if (s.feedback === 'done') {
        chime('complete');
        deps.onComplete();
        celebrateDone();
        caption.actions([
          { label: 'Round up more', kind: 'primary', icon: icons.replay, onClick: redeal },
          { label: 'Back to the forest', kind: 'ghost', icon: icons.back, onClick: deps.onBack },
        ]);
      }
      caption.announce(ariaStatusSort(s, data));
    } else {
      // Wrong tree: creature stays in the tray, hint + replay, gentle return.
      card.classList.add('returned');
      setTimeout(() => card.classList.remove('returned'), 500);
      caption.feedback(sortHint(s, data), 'nudge');
      speakWord(wordOf(uid));
      caption.announce(ariaStatusSort(s, data));
      putDown(uid, true);
    }
  }

  function wordOf(uid: string): string {
    return s.creatures.find((c) => c.uid === uid)?.word ?? '';
  }

  function updateCounts(): void {
    for (const t of data.trees) {
      const count = nestCreatures(s, t.id).length;
      const el = nestEls.get(t.id)?.querySelector('.nest-count');
      if (el) el.textContent = String(count);
      const nest = nestEls.get(t.id);
      if (nest) {
        nest.setAttribute(
          'aria-label',
          `${t.graphemes[0]} tree nest — sound ${t.phoneme}${count > 0 ? `. ${count} word${count > 1 ? 's' : ''} home` : ''}`,
        );
      }
    }
  }

  function redeal(): void {
    s = startSort(data);
    carrying = null;
    paint();
    caption.announce('New creatures are waiting in the tray.');
  }

  /** Finale: the emptied tray folds into a carved summary line and a ring of
   *  lantern light sweeps the nests (≤900ms; collapses under reduced motion). */
  function celebrateDone(): void {
    tray.classList.add('done');
    tray.replaceChildren(
      h('p', { class: 'tray-done-note', text: `All ${s.creatures.length} creatures are home. Every word is back at its sound tree.` }),
    );
    const ring = document.createElement('div');
    ring.className = 'hum-ring';
    ring.setAttribute('aria-hidden', 'true');
    nests.append(ring);
    setTimeout(() => ring.remove(), 1000);
  }

  // ---- pointer drag (with tap fallback: a drag that never moves = tap) --------

  function attachDrag(card: HTMLButtonElement, c: SortCreature): void {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    card.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      if (card.disabled) return;
      dragging = true;
      moved = false;
      startX = ev.clientX;
      startY = ev.clientY;
      card.setPointerCapture(ev.pointerId);
    });
    card.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 8) return;
      if (!moved) {
        moved = true;
        card.classList.add('dragging');
        nests.classList.add('droppable');
        nestEls.forEach((n) => n.classList.add('open'));
        speakWord(c.word);
        if (carrying && carrying !== c.uid) putDown(carrying);
        carrying = c.uid;
      }
      card.style.transform = `translate(${dx}px, ${dy}px) scale(1.06) rotate(2deg)`;
      highlightNearestNest(ev.clientX, ev.clientY);
    });
    const finish = (ev: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        card.classList.remove('dragging');
        card.style.transform = '';
        const nest = nearestNest(ev.clientX, ev.clientY);
        highlightNearestNest(-9999, -9999);
        if (nest) {
          dropOnNest(nest);
        } else {
          putDown(c.uid);
          card.style.transform = '';
        }
      }
      // !moved → plain click; the click handler (pickUp) runs next.
    };
    card.addEventListener('pointerup', finish);
    card.addEventListener('pointercancel', finish);
  }

  function nearestNest(x: number, y: number): string | null {
    let best: string | null = null;
    let bestDist = SNAP_RADIUS;
    nestEls.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestDist) {
        bestDist = d;
        best = id;
      }
    });
    return best;
  }

  function highlightNearestNest(x: number, y: number): void {
    const near = nearestNest(x, y);
    nestEls.forEach((el, id) => el.classList.toggle('near', id === near));
  }

  // ---- keyboard carry ----------------------------------------------------------

  wrap.addEventListener('keydown', (ev) => {
    if (!(ev instanceof KeyboardEvent)) return;
    if (ev.key === 'Escape' && carrying) {
      ev.preventDefault();
      putDown(carrying);
    }
    if (ev.key === 'Enter' && carrying) {
      const focused = document.activeElement;
      for (const [id, el] of nestEls) {
        if (el === focused) {
          ev.preventDefault();
          dropOnNest(id);
          return;
        }
      }
    }
  });

  // Reduced motion: Flip collapses to instant placement (handled in flipInto).

  function paint(): void {
    tray.replaceChildren();
    for (const c of s.creatures) {
      if (c.status === 'tray') tray.append(creatureCard(c));
    }
    for (const t of data.trees) {
      const host = nestEls.get(t.id)?.querySelector('.nest-cards');
      if (host) host.replaceChildren();
    }
    for (const c of s.creatures) {
      if (c.status === 'nest') {
        const card = creatureCard(c);
        card.disabled = true;
        card.classList.add('mini', 'homed');
        nestEls.get(c.phonemeId)?.querySelector('.nest-cards')?.append(card);
      }
    }
    nests.classList.remove('droppable');
    nestEls.forEach((n) => n.classList.remove('open'));
    updateCounts();
    caption.kicker('Creature roundup · word sorting');
    caption.prompt('Take each creature to the tree that keeps its sound.');
    caption.feedback(`${s.creatures.length} creatures are waiting in the tray.`, 'idle');
    caption.actions([{ label: 'Back to the forest', kind: 'ghost', icon: icons.back, onClick: deps.onBack }]);
    caption.announce(ariaStatusSort(s, data));
  }

  paint();
}
