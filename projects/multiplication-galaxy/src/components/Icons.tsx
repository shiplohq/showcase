// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Chart-furniture icons — inline SVG strokes matched to the plate line weight.
// State icons always pair with text (never color-only, DESIGN_DECISIONS §4).

export interface IconProps {
  size?: number;
  className?: string;
}

/** Check-ring: orbit locked (correct). Mineral teal + cream check. */
export function LockRingIcon({ size = 20, className }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.2 10.3l2.6 2.6 5-5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Drift-arrow: signal drifted (retry). Ember, points back to course. */
export function DriftIcon({ size = 20, className }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path d="M4 10c0-4 2.6-6.4 6.4-6.4 2.6 0 4.6 1.4 5.4 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16.4 3.2v4h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Orbit glyph — the mastery-matrix / map cell mark. */
export function OrbitGlyph({ size = 22, state }: IconProps & { state: 'locked' | 'drifted' | 'unvisited' }): JSX.Element {
  const color = state === 'locked' ? 'var(--mineral)' : state === 'drifted' ? 'var(--ember)' : 'var(--rule)';
  const dash = state === 'unvisited' ? '2 3' : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="9" fill="none" stroke={color} strokeWidth="1.4" strokeDasharray={dash} />
      {state === 'locked' && <circle cx="11" cy="11" r="3.4" fill="var(--mineral)" />}
      {state === 'drifted' && <circle cx="11" cy="11" r="3.4" fill="none" stroke="var(--ember)" strokeWidth="1.4" />}
      {state === 'unvisited' && <circle cx="11" cy="11" r="1.6" fill="var(--rule)" />}
    </svg>
  );
}

/** Probe craft — small geometric vessel with saffron flame tick. */
export function Probe({ size = 34 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <path d="M17 6.5l4.6 14.5h-9.2z" fill="var(--cream)" />
      <rect x="12.4" y="21" width="9.2" height="4.6" rx="1.2" fill="var(--mineral)" />
      <path d="M14.8 25.6l2.2 3.4 2.2-3.4z" fill="var(--saffron)" />
      <path d="M6 15.5l4.4 3.2M28 15.5l-4.4 3.2" stroke="var(--rule)" strokeWidth="1.4" />
      <path d="M23.6 9.2l-2.4 4M10.4 9.2l2.4 4" stroke="var(--cream-dim)" strokeWidth="1.2" />
    </svg>
  );
}
