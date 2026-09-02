// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Verdict strip — icon + text (never color-only), announced politely to
// assistive tech. "Not yet" copy is gentle and points back to the clues.

import { MagnifierIcon, StampIcon } from '../../components/art';
import type { Verdict } from '../../lib/types';

interface Props {
  verdict: Verdict;
  seq: number;
}

export function VerdictStrip({ verdict, seq }: Props) {
  const correct = verdict.status === 'correct';
  return (
    <div
      className={`verdict verdict--${correct ? 'correct' : 'not-yet'}`}
      role="status"
      aria-live="polite"
      data-fresh="true"
      key={seq}
    >
      {correct ? (
        <StampIcon width={22} height={22} />
      ) : (
        <MagnifierIcon width={22} height={22} />
      )}
      <p>{verdict.message}</p>
    </div>
  );
}
