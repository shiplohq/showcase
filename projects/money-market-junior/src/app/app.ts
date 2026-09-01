// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { MarketStore } from './features/market/store';
import { SignBand } from './features/market/sign-band';
import { MarketScreen } from './features/market/market-screen';
import { CheckoutScreen } from './features/market/checkout-screen';
import { ReceiptScreen } from './features/market/receipt-screen';

@Component({
  selector: 'mmj-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SignBand, MarketScreen, CheckoutScreen, ReceiptScreen],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(MarketStore);

  /** focus target when the screen changes (keyboard/AT continuity, design §13) */
  private readonly screenHeading = viewChild<ElementRef<HTMLElement>>('[data-screen-heading]');

  constructor() {
    void this.store.init();
    let first = true;
    effect(() => {
      this.store.screen(); // track screen changes
      if (first) {
        first = false;
        return;
      }
      const el = this.screenHeading()?.nativeElement;
      if (el) el.focus({ preventScroll: true });
    });
  }
}
