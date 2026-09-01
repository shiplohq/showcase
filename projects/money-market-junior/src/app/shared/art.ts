// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Original illustration registry (design §9): every visual in the app —
// produce, coins, notes, basket, icons — is an inline SVG drawn in the
// market-signage language: flat fills, 2.5px ink outline, hard offset
// sticker shadow. `key` strings come from products.json `svg` fields.

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'mmj-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  templateUrl: './art.html',
  styleUrl: './art.css',
})
export class Art {
  /** art key — a products.json `svg` value, or a coin/note/icon id */
  readonly key = input.required<string>();

  // shared SVG attribute bundles (template readability)
  protected readonly stroke =
    'stroke="#262B21" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  protected readonly strokeThin =
    'stroke="#262B21" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';
}
