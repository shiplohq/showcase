// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Original inline SVG icons — 2px strokes, currentColor, no icon font.
// Status glyphs always accompany status colors (never color-only meaning).

import type { JSX } from 'react';

function base(children: JSX.Element, label?: string): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {children}
    </svg>
  );
}

export const IconArrowLeft = () => base(<path d="M19 12H5M11 18l-6-6 6-6" />);

export const IconArrowRight = () => base(<path d="M5 12h14M13 6l6 6-6 6" />);

export const IconClose = () => base(<path d="M18 6L6 18M6 6l12 12" />);

export const IconCheck = () => base(<path d="M20 6L9 17l-5-5" />);

export const IconReturn = () => base(<path d="M9 14L4 9l5-5" />);

export const IconInfo = () => base(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v4h1" />
  </>,
);

export const IconColumns = () => base(
  <>
    <rect x="3" y="4" width="6" height="16" />
    <rect x="15" y="4" width="6" height="16" />
  </>,
);

export const IconMedallion = () => base(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M4 12h16" />
  </>,
);

export const IconMoon = () => base(<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />);

export const IconReset = () => base(<path d="M3 12a9 9 0 109-9 9 9 0 00-6.7 3L3 8" />);

export const IconPlus = () => base(<path d="M12 5v14M5 12h14" />);
