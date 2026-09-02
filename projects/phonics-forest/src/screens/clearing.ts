// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Clearing — the "Listen & pick" activity inside one sound tree: a sound
// stone speaks a word; grapheme leaves (or word leaves on minimal-pair
// rounds) wait to be picked. Wrong picks nudge, then hint. Correct picks
// send a firefly from the stone to the sign — sound made visible on its way
// to its letters.

import type { PhonicsData, PhonemeTree } from '../engine/types';
import {
  answer as engineAnswer,
  advance as engineAdvance,
  currentRound,
  feedbackCopy,
  startListen,
  ariaStatus,
  type ListenState,
} from '../engine/listen';
import { coniferTree, forestBackdrop, soundStone, fireflyDot, icons } from '../components/art';
import { h, svgFragment, center } from '../lib/dom';
import { tween, fireflyFlight, wakeTree, prefersReducedMotion } from '../lib/gsap';
import { playAudioUri, chime, speechAvailable } from '../lib/audio';

export interface ClearingDeps {
  onBack(): void;
  onRoundComplete(treeId: string, roundsDone: number, fireflies: number, done: boolean): void;
  onSpeechMissing(): void;
}

interface CaptionApi {
  kicker(text: string): void;
  prompt(text: string): void;
  feedback(text: string, tone: 'idle' | 'good' | 'nudge'): void;
  actions(actions: { label: string; onClick(): void; kind?: 'primary' | 'ghost'; icon?: string; pressed?: boolean }[]): void;
  announce(text: string): void;
}

export function renderClearing(
  stage: HTMLElement,
  data: PhonicsData,
  tree: PhonemeTree,
  startFireflies: number,
  caption: CaptionApi,
  deps: ClearingDeps,
): { destroy(): void } {
  stage.replaceChildren();
  let s: ListenState = startListen(data, tree.id);
  let finished = false;
  let noticeShown = false;

  const wrap = h('div', { class: 'clearing' });
  wrap.append(svgFragment(forestBackdrop(tree.id)));

  // The tree, big, with the sound stone resting at its foot — one column,
  // static flow, so the stone can never overlap the answer leaves.
  const treeHost = h(
    'div',
    { class: 'clearing-tree', html: coniferTree({ id: tree.id, grapheme: tree.graphemes[0], ipa: tree.phoneme, canopy: tree.canopy, tiers: tree.tiers, height: tree.height, fireflies: startFireflies }, 'clearing') },
  );
  const treeSvg = treeHost.querySelector('svg') as SVGSVGElement;

  // Sound stone at the foot of the tree.
  const stoneBtn = h('button', {
    class: 'stone-btn',
    'aria-label': 'Sound stone — play the word',
    html: soundStone(tree.id),
  });

  const left = h('div', { class: 'clearing-left' }, treeHost, stoneBtn);
  const leaves = h('div', { class: 'leaves', role: 'group', 'aria-label': 'Answer leaves' });
  wrap.append(left, leaves);
  stage.append(wrap);

  // ---- caption wiring --------------------------------------------------------

  function speakRound(auto = false): void {
    const round = currentRound(s);
    // Ripple: the stone visibly "sounds" (visual twin of every audio cue).
    stoneBtn.classList.remove('sounding');
    void stoneBtn.offsetWidth; // restart the CSS animation
    stoneBtn.classList.add('sounding');
    const ripple = document.createElement('span');
    ripple.className = 'stone-ripple';
    const c = center(stoneBtn);
    ripple.style.left = `${c.x}px`;
    ripple.style.top = `${c.y}px`;
    document.body.append(ripple);
    setTimeout(() => ripple.remove(), 420);
    if (!speechAvailable()) {
      if (!noticeShown) {
        noticeShown = true;
        deps.onSpeechMissing();
      }
      return;
    }
    void playAudioUri(`speech:${round.audioText}`);
    void auto;
  }

  stoneBtn.addEventListener('click', () => {
    if (finished) {
      // After the finale the stone replays the tree's cue word.
      void playAudioUri(`speech:${tree.examples[0].word}`);
      return;
    }
    speakRound();
  });

  function captionActions(): void {
    const acts: Parameters<CaptionApi['actions']>[0] = [];
    if (s.feedback === 'correct') {
      acts.push({ label: 'Next', kind: 'primary', icon: icons.next, onClick: nextRound });
    } else if (s.feedback === 'done') {
      acts.push({ label: 'Play again', kind: 'ghost', icon: icons.replay, onClick: () => rerenderTree() });
      acts.push({ label: 'Back to the forest', kind: 'primary', icon: icons.back, onClick: deps.onBack });
    } else {
      acts.push({ label: 'Play the word', kind: 'ghost', icon: icons.replay, onClick: () => speakRound() });
      const round = currentRound(s);
      if (round.hideText) {
        acts.push({ label: 'Read it', kind: 'ghost', icon: icons.eye, onClick: () => revealWords() });
      }
    }
    caption.actions(acts);
  }

  function revealWords(): void {
    s = { ...s, revealed: true };
    paintLeaves();
    caption.feedback('Read the words, then choose.', 'idle');
  }

  function nextRound(): void {
    const doneBefore = s.feedback === 'done';
    const next = engineAdvance(s);
    const roundsDone = next.feedback === 'done' ? next.rounds.length : next.index;
    deps.onRoundComplete(tree.id, roundsDone, next.fireflies, next.feedback === 'done');
    applyFireflies(next.fireflies);
    if (next.feedback === 'done' && !doneBefore) {
      // Assign state BEFORE finale() so captionActions() sees feedback 'done'
      // and renders "Play again / Back to the forest" instead of a stale
      // "Next" (found by the independent review of the deployed build).
      s = next;
      finished = true;
      finale();
      return;
    }
    s = next;
    paint();
  }

  function rerenderTree(): void {
    s = startListen(data, tree.id);
    finished = false;
    applyFireflies(s.fireflies);
    paint();
  }

  /** Displayed fireflies never go below what was already earned (stored progress). */
  function applyFireflies(sessionCount: number): void {
    litSlotsTo(Math.max(startFireflies, sessionCount));
  }

  function litSlotsTo(n: number): void {
    treeSvg.querySelectorAll('.fly-slot').forEach((slot, i) => slot.classList.toggle('lit', i < n));
  }

  function finale(): void {
    chime('wake');
    wakeTree(treeSvg, [...treeSvg.querySelectorAll('.fly-slot')], treeSvg.querySelector('.tree-sign'));
    caption.kicker(`${tree.graphemes[0]} tree · ${tree.phoneme}`);
    caption.prompt('The tree is awake!');
    caption.feedback('All sounds found. Every firefly is glowing.', 'good');
    captionActions();
    caption.announce('The tree is awake. All sounds found.');
  }

  function pick(optionId: string, leaf: HTMLButtonElement): void {
    if (finished || s.feedback === 'correct') return;
    s = engineAnswer(s, optionId);
    const round = currentRound(s);
    if (s.feedback === 'correct') {
      chime('correct');
      leaf.classList.add('picked-right');
      caption.feedback(feedbackCopy(s, round), 'good');
      flyFirefly(leaf);
      captionActions();
      caption.announce(ariaStatus(s));
    } else if (s.feedback === 'nudge') {
      leaf.classList.add('tilt');
      setTimeout(() => leaf.classList.remove('tilt'), 900);
      caption.feedback(feedbackCopy(s, round), 'nudge');
      // Gentle: replay the sound for the child, never a buzzer.
      setTimeout(() => speakRound(true), 500);
      caption.announce(ariaStatus(s));
    } else {
      caption.feedback(feedbackCopy(s, round), 'nudge');
      paintLeaves(); // second miss → hint highlight + reveal
      setTimeout(() => speakRound(true), 500);
      caption.announce(ariaStatus(s));
    }
  }

  /** Firefly: from the stone to the sign — sound traveling to its letters.
   *  Under reduced motion there is no flight, so the sign flashes instead
   *  (the sound→letters link keeps a visible mark). */
  function flyFirefly(_fromEl: HTMLElement): void {
    const signGrapheme = treeSvg.querySelector('.sg-grapheme');
    if (!signGrapheme) return;
    const from = center(stoneBtn);
    const to = center(signGrapheme);
    const dot = fireflyDot();
    dot.style.left = `${from.x}px`;
    dot.style.top = `${from.y}px`;
    document.body.append(dot);
    const mid = { x: (from.x + to.x) / 2 + (from.y < to.y ? 60 : -60), y: Math.min(from.y, to.y) - 90 };
    const litOnArrival = Math.min(3, firefliesNow() + 1);
    fireflyFlight(dot, [from, mid, to], () => {
      dot.remove();
      litSlotsTo(Math.max(startFireflies, litOnArrival));
    });
    if (prefersReducedMotion()) {
      const sign = treeSvg.querySelector('.tree-sign');
      sign?.classList.remove('sign-flash');
      void (sign as SVGElement).getBoundingClientRect?.();
      sign?.classList.add('sign-flash');
    }
  }

  function firefliesNow(): number {
    return [...treeSvg.querySelectorAll('.fly-slot')].filter((el) => el.classList.contains('lit')).length;
  }

  function paintLeaves(): void {
    const round = currentRound(s);
    leaves.replaceChildren();
    round.options.forEach((opt) => {
      const revealed = !round.hideText || s.revealed || s.feedback === 'correct';
      const label = round.kind === 'grapheme' ? opt.label : revealed ? opt.label : '·····';
      const leaf = h(
        'button',
        {
          class: 'leaf-btn' + (s.feedback === 'hint' && opt.correct ? ' hint' : '') + (s.lastPicked === opt.id && s.feedback !== 'idle' && !opt.correct ? ' picked-wrong' : ''),
          'data-leaf': opt.id,
          'aria-label': round.kind === 'grapheme' ? `Letters “${opt.label}” — sound ${opt.ipa ?? ''}` : `Word “${label}”`,
        },
        h('span', { class: 'leaf-shape' }),
        h('span', { class: 'leaf-grapheme', text: label }),
        opt.ipa && round.kind === 'grapheme' ? h('span', { class: 'leaf-ipa', text: opt.ipa }) : null,
        round.kind === 'pair' && !revealed ? h('span', { class: 'leaf-hidden-note', text: 'listen' }) : null,
      );
      leaf.addEventListener('click', () => pick(opt.id, leaf));
      leaves.append(leaf);
    });
    if (prefersReducedMotion()) return;
    tween([...leaves.querySelectorAll('.leaf-btn')], { opacity: 1, duration: 0.2, stagger: 0.03, clearProps: 'opacity' });
  }

  function paint(): void {
    const round = currentRound(s);
    caption.kicker(`${tree.graphemes[0]} tree · ${tree.phoneme} · Round ${Math.min(s.index + 1, s.rounds.length)} of ${s.rounds.length}`);
    caption.prompt(round.prompt);
    caption.feedback(s.feedback === 'idle' ? 'Tap the stone to hear the word.' : feedbackCopy(s, round), s.feedback === 'correct' || s.feedback === 'done' ? 'good' : s.feedback === 'idle' ? 'idle' : 'nudge');
    captionActions();
    paintLeaves();
    caption.announce(ariaStatus(s));
  }

  // Keyboard: R replays the round's sound (the stone is also a normal button).
  // Document-level so it works whatever currently holds focus.
  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'r' || ev.key === 'R') {
      if (!finished) speakRound();
    }
  };
  document.addEventListener('keydown', onKey);

  paint();
  const firstLeaf = leaves.querySelector<HTMLButtonElement>('.leaf-btn');
  if (firstLeaf) firstLeaf.focus({ preventScroll: true });

  return {
    destroy() {
      document.removeEventListener('keydown', onKey);
    },
  };
}
