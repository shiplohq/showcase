// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Type mode DOM overlay — the poster typography plate. Words land on
// downbeats with SplitText char staggers; under reduced motion the token
// swaps with a <=150 ms fade and nothing staggers.

import { SplitText, fade, killTweens, motionFrom } from '../lib/gsap';
import { isReduced } from '../lib/motionState';

export class TypeLayer {
  private wordEl: HTMLElement;
  private beatEl: HTMLElement;
  private split: SplitText | null = null;

  constructor(private el: HTMLElement) {
    this.wordEl = el.querySelector<HTMLElement>('.type-word')!;
    this.beatEl = el.querySelector<HTMLElement>('.type-beat')!;
    this.el.hidden = true;
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  show(): void {
    this.el.hidden = false;
  }

  hide(): void {
    killTweens([this.wordEl, this.beatEl]);
    this.revertSplit();
    this.el.hidden = true;
    this.wordEl.textContent = '';
    this.beatEl.textContent = '';
  }

  /** Swap the big word (called on downbeats). */
  setWord(word: string): void {
    killTweens(this.wordEl);
    this.revertSplit();
    this.wordEl.textContent = word;
    if (isReduced()) {
      fade(this.wordEl, { opacity: 1, overwrite: true });
      return;
    }
    this.split = new SplitText(this.wordEl, { type: 'chars' });
    if (this.split.chars.length > 0) {
      killTweens(this.split.chars);
      motionFrom(this.split.chars, {
        yPercent: 70,
        opacity: 0,
        stagger: 0.035,
        duration: 0.5,
        ease: 'poster',
      });
    }
  }

  /** Beat numeral 1..4 — discrete swap plus a tiny pulse in full motion. */
  setBeat(n: number): void {
    this.beatEl.textContent = String(n);
    if (!isReduced() && this.visible) {
      const el = this.beatEl;
      el.style.transform = 'scale(1.14)';
      el.style.transition = 'transform 140ms cubic-bezier(0.22,0.9,0.12,1)';
      requestAnimationFrame(() => {
        el.style.transform = 'scale(1)';
      });
    }
  }

  /** Snap to final state — called when motion is switched to reduced mid-tween. */
  settle(): void {
    this.revertSplit();
    this.wordEl.style.opacity = '1';
    this.beatEl.style.transform = '';
    this.beatEl.style.transition = '';
  }

  private revertSplit(): void {
    if (this.split) {
      try {
        this.split.revert();
      } catch {
        // Element already detached — nothing to restore.
      }
      this.split = null;
    }
  }
}
