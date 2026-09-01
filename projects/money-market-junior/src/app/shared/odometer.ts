// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Odometer — the basket-total digit roll (design §10). Each digit is a strip
// of 0–9 translated to its position; a CSS transition produces the short
// 200ms roll (and collapses to instant under prefers-reduced-motion via
// motion.css). Pure CSS: no JS animation, no layout thrash.

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'mmj-odometer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  templateUrl: './odometer.html',
  styleUrl: './odometer.css',
})
export class Odometer {
  readonly value = input.required<number>();

  /** the fixed 0–9 strip inside every column */
  protected readonly nums: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  /** right-aligned digits of the current value ('0' when the value is 0) */
  protected readonly digits = computed<string[]>(() => {
    const v = Math.max(0, Math.trunc(this.value()));
    return String(v).split('');
  });
}
