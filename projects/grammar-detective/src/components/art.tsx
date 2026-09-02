// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Original SVG illustration tokens for the dossier art direction:
// 2px cobalt strokes, flat fills, no gradients, no emoji (spec asset strategy
// + DESIGN_DECISIONS §8). All artwork is authored in this project.

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
    ...props,
  };
}

/** Magnifying glass — the bureau's investigative eye. */
export function MagnifierIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
      <path d="M8 10.5h5M10.5 8v5" strokeWidth={1.5} />
    </svg>
  );
}

/** Round rubber stamp — verdicts and "RESOLVED" marks. */
export function StampIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 9.5 6.8 12l1.7 2.5M15.5 9.5l1.7 2.5-1.7 2.5" strokeWidth={1.5} />
      <path d="M10.8 15 13.2 9" />
    </svg>
  );
}

/** Paperclip — memos pinned to the evidence sheet. */
export function PaperclipIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17.5 8.5 10 16a3.2 3.2 0 0 0 4.5 4.5l6.5-6.5a5.4 5.4 0 0 0-7.6-7.6l-7 7a7.6 7.6 0 0 0 10.7 10.7l3-3" />
    </svg>
  );
}

/** Pen nib — the detective's marking pen. */
export function PenNibIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20c2.5.5 4.5-.5 6-2l9.5-9.5a2.5 2.5 0 0 0-3.5-3.5L6.5 14.5c-1.5 1.5-2.5 3-2.5 5.5Z" />
      <path d="m14 7 3.5 3.5" strokeWidth={1.5} />
      <circle cx="15.5" cy="8.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Folder tab chevron — board rows. */
export function FolderIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 7v11a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5H12L9.8 5.2A1.5 1.5 0 0 0 8.7 4.7H4.5A1.5 1.5 0 0 0 3 6.2Z" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Reset — sweep the board clean. */
export function ResetIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5v5h5" />
      <path d="M4.5 10a8 8 0 1 1 1.6 6.4" />
    </svg>
  );
}

/** Check mark inside a circle for gentle confirmations. */
export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.7 2.7L16 9.5" />
    </svg>
  );
}

/** Clue — a folded tip note. */
export function ClueIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4v5h5" />
      <path d="M8 13h8M8 16.5h5" strokeWidth={1.5} />
    </svg>
  );
}

/** Return to the board. */
export function BoardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9h17M8.5 4.5v4.5" />
    </svg>
  );
}

/**
 * Desk seal — the bureau roundel used in the masthead: a magnifier over a
 * folded docket, ringed by the bureau name (kept as text next to the SVG in
 * the masthead itself).
 */
export function BureauSeal(props: IconProps) {
  return (
    <svg {...base({ width: 56, height: 56, ...props })}>
      <circle cx="28" cy="28" r="25" strokeWidth={2.5} />
      <circle cx="28" cy="28" r="20.5" strokeWidth={1} strokeDasharray="2.5 3.5" />
      <path d="M18 34h20l-2.5-9H20.5L18 34Z" />
      <path d="M22 25v-3.5a6 6 0 0 1 12 0V25" strokeWidth={1.5} />
      <circle cx="33" cy="19.5" r="5" />
      <path d="m36.7 23.2 3.3 3.3" />
    </svg>
  );
}
