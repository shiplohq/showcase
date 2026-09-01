// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Receipt — the printed till ticket with perforated edge (design §1). Slides
// up ≤500ms; the PAID stamp is the one ≤900ms delight (design §11). The
// change is shown as numeral AND coin strip (pedagogy §3.2).

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { MarketStore } from './store';
import { Art } from '../../shared/art';
import { fx } from '../../lib/gsap';

@Component({
  selector: 'mmj-receipt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Art],
  templateUrl: './receipt-screen.html',
  styleUrl: './receipt-screen.css',
})
export class ReceiptScreen {
  readonly store = inject(MarketStore);

  private readonly ticketEl = viewChild<ElementRef<HTMLElement>>('ticket');
  private readonly stampEl = viewChild<ElementRef<HTMLElement>>('stamp');

  constructor() {
    afterNextRender(() => {
      const ticket = this.ticketEl()?.nativeElement;
      if (ticket) {
        fx.to(ticket, { y: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, { y: 0, opacity: 1 });
      }
      const stamp = this.stampEl()?.nativeElement;
      if (stamp && !fx.prefersReducedMotion()) {
        fx.to(
          stamp,
          { scale: 1, opacity: 1, rotate: -8, duration: 0.5, delay: 0.15, ease: 'back.out(1.6)' },
          { scale: 1, opacity: 1, rotate: -8 },
        );
      }
    });
  }

  protected coinArt(denomination: number): string {
    return denomination === 20 ? 'note-20' : `coin-${denomination}`;
  }

  protected get summaryLine(): string {
    const r = this.store.receipt();
    if (!r) return '';
    if (r.exact) return 'You paid the exact amount — no change at all.';
    if (r.change > 0) {
      return `You paid ${r.paid} for ${r.total} and gave back ${r.change}.`;
    }
    return '';
  }
}
