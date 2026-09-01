// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Checkout — the cashier counter (design §7): wallet tokens above, cashier
// tray in the middle, pay/change status, then (change missions) the
// build-the-change exercise. Every token is a real button (keyboard path);
// paid/change totals count up to support the arithmetic (design §11), not
// to decorate it.

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MarketStore } from './store';
import { Art } from '../../shared/art';
import { Odometer } from '../../shared/odometer';
import { fx } from '../../lib/gsap';

@Component({
  selector: 'mmj-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Art, Odometer],
  host: { '(document:keydown.escape)': 'onEsc()' },
  templateUrl: './checkout-screen.html',
  styleUrl: './checkout-screen.css',
})
export class CheckoutScreen {
  readonly store = inject(MarketStore);

  /** animated paid total (count-up support, design §11) */
  protected readonly paidShown = signal(0);

  /** denominations usable for this change target (useless ones hidden: ≤4 options) */
  protected readonly changeDenoms = computed(() =>
    [20, 10, 5, 2, 1].filter((d) => d <= this.store.changeTarget()),
  );

  private readonly trayEl = viewChild<ElementRef<HTMLElement>>('tray');

  constructor() {
    effect(() => {
      const target = this.store.pay().paid;
      fx.countUp(this.paidShown(), target, (v) => this.paidShown.set(v));
      // gentle settle bounce when a new token lands
      const el = this.trayEl()?.nativeElement;
      if (el && !fx.prefersReducedMotion()) {
        fx.to(el, { scale: 1.01, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      }
    });
  }

  protected onEsc(): void {
    if (this.store.payPhase() !== 'done') this.store.backToMarket();
  }

  protected coinArt(denomination: number): string {
    return denomination === 20 ? 'note-20' : `coin-${denomination}`;
  }

  protected walletCount(denomination: number): number {
    return this.store.walletLeft().filter((t) => t === denomination).length;
  }

  protected get payStatusText(): string {
    const pay = this.store.pay();
    if (pay.exact) return 'Exact amount — nothing to give back!';
    if (pay.canPay) return `Change to give back: ${pay.change} tokens.`;
    if (pay.paid === 0) return 'Put tokens from your wallet into the tray.';
    return `${pay.remaining} more needed.`;
  }

  protected get changeFeedback(): string {
    const b = this.store.changeBuild();
    if (b.built === 0) return 'Pick coins that add up to the change.';
    if (b.ok) return 'That makes the change exactly. Well done!';
    if (b.delta < 0) return `${-b.delta} more still needed.`;
    return `That is ${b.delta} too many — swap a coin.`;
  }
}
