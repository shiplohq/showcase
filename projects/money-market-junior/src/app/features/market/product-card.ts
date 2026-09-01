// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Product card — the market shelf item (design §7–§9). The whole card is a
// real <button> (keyboard/touch path). Mouse/pen users get a drag-to-basket
// enhancement: past a 6px movement threshold the item becomes a ghost that
// can drop anywhere inside the basket panel; a drop adds the item exactly
// like the button path. Touch users stay on tap-to-add so page scrolling is
// never hijacked (design §8: drag is an enhancement, buttons are the path).

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { Product } from './engine';
import { MarketStore } from './store';
import { Art } from '../../shared/art';
import { fx } from '../../lib/gsap';

@Component({
  selector: 'mmj-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Art],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly qty = input(0);
  readonly tilt = input<'l' | 'r'>('l');

  readonly store = inject(MarketStore);
  private readonly cardEl = viewChild.required<ElementRef<HTMLElement>>('card');
  private readonly artEl = viewChild.required<ElementRef<HTMLElement>>('art');

  private drag: { ghost: HTMLElement; moved: boolean; startX: number; startY: number } | null = null;

  add(): void {
    this.store.add(this.product().id);
    this.flyToBasket(this.artEl().nativeElement, /* fromClick */ true);
  }

  onPointerDown(event: PointerEvent): void {
    // drag is a mouse/pen enhancement only — touch keeps native scroll + tap
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const startX = event.clientX;
    const startY = event.clientY;
    const source = this.artEl().nativeElement;
    const ghost = makeGhost(source);
    let moved = false;
    const state = { ghost, moved, startX, startY };
    this.drag = state;

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!state.moved && Math.hypot(dx, dy) < 6) return;
      state.moved = true;
      ghost.style.opacity = '1';
      ghost.style.left = `${e.clientX - 36}px`;
      ghost.style.top = `${e.clientY - 36}px`;
      highlightBasket(true);
    };
    const onUp = (e: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      highlightBasket(false);
      const dropZone = state.moved
        ? ((document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-basket-drop]') ??
            null) as HTMLElement | null)
        : null;
      if (dropZone) {
        this.store.add(this.product().id);
        settleGhost(ghost, dropZone);
        this.drag = null;
      } else if (state.moved) {
        if (fx.prefersReducedMotion()) {
          ghost.remove();
        } else {
          fx.to(ghost, {
            left: source.getBoundingClientRect().left,
            top: source.getBoundingClientRect().top,
            x: 0,
            y: 0,
            scale: 1,
            opacity: 0,
            duration: 0.25,
            ease: 'power2.out',
            onComplete: () => ghost.remove(),
          });
        }
        this.drag = null;
      } else {
        ghost.remove();
        this.drag = null; // plain click → handled by (click)
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  /** short shelf→basket flight when the button path is used */
  private flyToBasket(source: HTMLElement, _fromClick: boolean): void {
    const basket = document.querySelector<HTMLElement>('[data-basket-icon]');
    if (!basket) return;
    const ghost = makeGhost(source);
    settleGhost(ghost, basket);
  }
}

// ---------------------------------------------------------------------------

function makeGhost(source: HTMLElement): HTMLElement {
  const ghost = document.createElement('div');
  ghost.className = 'fly-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const rect = source.getBoundingClientRect();
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  ghost.style.opacity = '0';
  const svg = source.querySelector('svg');
  if (svg) ghost.appendChild(svg.cloneNode(true));
  document.body.appendChild(ghost);
  return ghost;
}

function settleGhost(ghost: HTMLElement, target: HTMLElement): void {
  if (fx.prefersReducedMotion()) {
    ghost.remove();
    return;
  }
  const from = ghost.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  fx.to(ghost, {
    x: dx,
    y: dy,
    scale: 0.45,
    opacity: 0.9,
    duration: 0.3,
    ease: 'expo.out',
    onComplete: () => {
      ghost.remove();
      bumpBasket(target);
    },
  });
}

function bumpBasket(target: HTMLElement): void {
  fx.to(target, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' });
}

function highlightBasket(on: boolean): void {
  document.querySelectorAll<HTMLElement>('[data-basket-drop]').forEach((el) => {
    el.classList.toggle('basket--drop-target', on);
  });
}
