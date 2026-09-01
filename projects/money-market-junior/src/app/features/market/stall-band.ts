// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Product, Stall } from './engine';
import { ProductCard } from './product-card';
import { Art } from '../../shared/art';

@Component({
  selector: 'mmj-stall-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ProductCard, Art],
  templateUrl: './stall-band.html',
  styleUrl: './stall-band.css',
})
export class StallBand {
  readonly stall = input.required<Stall>();
  readonly products = input.required<Product[]>();
  readonly basket = input.required<Record<string, number>>();

  protected readonly items = computed(() => this.products());
}
