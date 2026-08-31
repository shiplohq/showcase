// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Ten-frame — quantities always visible as dots AND numerals. `hinted`
// marks the cells the child still needs (used by the nudge state, never red).

import { useId } from 'react';

export function TenFrame({
  value,
  hintedFrom,
  label,
}: {
  value: number;
  /** Index (0-based) from which dots are still missing — highlights them. */
  hintedFrom?: number;
  label: string;
}): JSX.Element {
  const cells = value > 10 ? 20 : 10;
  const describedBy = useId();
  return (
    <div
      className="tenframe"
      role="img"
      aria-label={`${label}: ${value} hạt.` + (hintedFrom !== undefined && hintedFrom < cells ? ` Còn thiếu ${cells - Math.max(value, hintedFrom)} ô.` : '')}
      id={describedBy}
    >
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          className={
            'tenframe-dot' +
            (i < value ? ' filled' : '') +
            (hintedFrom !== undefined && i >= hintedFrom ? ' hinted' : '')
          }
        />
      ))}
    </div>
  );
}
