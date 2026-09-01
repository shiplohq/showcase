// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Art } from '../../shared/art';
import { MarketStore } from './store';

@Component({
  selector: 'mmj-sign-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [Art],
  templateUrl: './sign-band.html',
  styleUrl: './sign-band.css',
})
export class SignBand {
  readonly store = inject(MarketStore);
}
