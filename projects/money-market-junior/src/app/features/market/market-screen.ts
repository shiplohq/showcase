// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Market screen — mission brief + the stall aisle + the basket drawer
// (design §7). Stalls reveal with a short stagger on mount (design §11);
// input is never blocked.

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { Product } from './engine';
import { MarketStore } from './store';
import { StallBand } from './stall-band';
import { BasketPanel } from './basket-panel';
import { fx } from '../../lib/gsap';

@Component({
  selector: 'mmj-market',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [StallBand, BasketPanel],
  templateUrl: './market-screen.html',
  styleUrl: './market-screen.css',
})
export class MarketScreen {
  readonly store = inject(MarketStore);

  /** <1024px the basket becomes a collapsible section (single instance) */
  protected readonly isNarrow = signal(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 1023px)').matches
      : false,
  );

  private readonly stallsEl = viewChild<ElementRef<HTMLElement>>('stalls');

  /** products per stall id (content grouping from JSON) */
  protected readonly productsByStall = computed(() => {
    const map = new Map<string, Product[]>();
    for (const stall of this.store.stalls()) {
      map.set(
        stall.id,
        this.store.products().filter((p) => stall.categories.includes(p.category)),
      );
    }
    return map;
  });

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(max-width: 1023px)');
      const onChange = (e: MediaQueryListEvent) => this.isNarrow.set(e.matches);
      mq.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', onChange));
    }
    afterNextRender(() => {
      const el = this.stallsEl()?.nativeElement;
      if (el) fx.reveal(el.querySelectorAll('.stall'), { opacity: 0, y: 14 });
    });
  }
}
