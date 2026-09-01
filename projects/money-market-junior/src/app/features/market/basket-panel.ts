// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Basket panel — the basket drawer (design §7): sticky column ≥1024px, a
// collapsible section below. Shows every line with steppers, the running
// total as an odometer + token coin strip, requirement progress chips, the
// budget bar, and the checkout gate with its spoken reason (never a silent
// disabled button — design §10).

import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MarketStore } from './store';
import { breakdown } from './engine';
import { Art } from '../../shared/art';
import { Odometer } from '../../shared/odometer';

@Component({
  selector: 'mmj-basket-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Art, Odometer],
  templateUrl: './basket-panel.html',
  styleUrl: './basket-panel.css',
})
export class BasketPanel {
  readonly store = inject(MarketStore);
  /** compact mode = collapsible section under the market (narrow screens) */
  readonly compact = input(false);

  protected readonly open = signal(false);

  protected readonly budgetFraction = computed(() => {
    const b = this.store.budget();
    if (b.budget <= 0) return 0;
    return Math.min(1, b.total / b.budget) * 100;
  });

  protected readonly overFraction = computed(() => {
    const b = this.store.budget();
    if (b.budget <= 0 || b.overBy <= 0) return 0;
    return Math.min(1, b.overBy / b.budget) * 100;
  });

  /** total shown as token coins (pedagogy §3.2 — numeral AND coins together) */
  protected readonly totalCoins = computed(() => {
    const coins = breakdown(this.store.total(), [20, 10, 5, 2, 1]);
    return coins.slice(0, 8);
  });

  protected readonly gateReasonText = computed(() => {
    switch (this.store.gate().reason) {
      case 'empty':
        return 'Add something to the basket to check out.';
      case 'requirements': {
        const missing = this.store
          .reqStatuses()
          .filter((r) => !r.met)
          .map((r) => {
            const n = Math.max(0, r.required - r.have);
            const noun = this.categorySingular(r.category);
            return `${n} more ${noun}${n === 1 ? '' : 's'}`;
          })
          .join(', ');
        return `Still needed: ${missing}.`;
      }
      case 'over':
        return `${this.store.budget().overBy} tokens over the budget — put something back.`;
      default:
        return 'Ready to check out!';
    }
  });

  protected readonly statusText = computed(() => {
    const b = this.store.budget();
    if (b.overBy > 0) return `Total ${b.total}. ${b.overBy} tokens over the budget.`;
    return `Total ${b.total} of ${b.budget} tokens. ${b.remaining} left.`;
  });

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  /** chip progress capped at the requirement (2 bought of 1 needed → 1/1 ✓) */
  protected chipHave(r: { have: number; required: number }): number {
    return Math.min(r.have, r.required);
  }

  protected coinArt(denomination: number): string {
    return denomination === 20 ? 'note-20' : `coin-${denomination}`;
  }

  private categorySingular(id: string): string {
    const cat = this.store.categories().find((c) => c.id === id);
    return cat?.singular ?? cat?.name?.toLowerCase() ?? id;
  }
}
