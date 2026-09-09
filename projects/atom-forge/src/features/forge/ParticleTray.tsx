// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Particle tray — the particle source. Every token supports three input
// paths: pointer drag (mouse/touch/pen), tap (adds to the default zone), and
// keyboard via the zone steppers (the tray itself stays a labelled button so
// tap-to-add also works with Enter/Space).

import { useRef } from 'react';
import { ParticleDisc } from '../../components/ParticleDisc';
import type { ParticleKind } from './engine';

interface ParticleTrayProps {
  /** Called while a pointer drag moves over zones (ghost handled by parent). */
  onDragStart: (kind: ParticleKind, origin: DOMRect) => void;
  onDragMove: (clientX: number, clientY: number) => void;
  onDragEnd: (clientX: number, clientY: number) => void;
  /** Tap / Enter / Space — add straight to the default zone. */
  onTap: (kind: ParticleKind) => void;
  disabled?: boolean;
}

const TOKENS: Array<{ kind: ParticleKind; label: string; aria: string }> = [
  { kind: 'proton', label: 'PROTON', aria: 'Proton, positive — drag into the atom, or activate to place it' },
  { kind: 'neutron', label: 'NEUTRON', aria: 'Neutron, neutral — drag into the atom, or activate to place it' },
  { kind: 'electron', label: 'ELECTRON', aria: 'Electron, negative — drag into the atom, or activate to place it' },
];

export function ParticleTray({ onDragStart, onDragMove, onDragEnd, onTap, disabled }: ParticleTrayProps) {
  const active = useRef<{ kind: ParticleKind; moved: boolean } | null>(null);

  return (
    <div className="tray" data-testid="particle-tray">
      <p className="tray__hint">Drag a particle into the atom — or tap to place it</p>
      <div className="tray__tokens" role="group" aria-label="Particle tray">
        {TOKENS.map(({ kind, label, aria }) => (
          <button
            key={kind}
            type="button"
            className="tray-token"
            disabled={disabled}
            aria-label={aria}
            data-testid={`tray-${kind}`}
            onPointerDown={(e) => {
              if (disabled || e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              active.current = { kind, moved: false };
              onDragStart(kind, e.currentTarget.getBoundingClientRect());
            }}
            onPointerMove={(e) => {
              if (!active.current) return;
              active.current.moved = true;
              onDragMove(e.clientX, e.clientY);
            }}
            onPointerCancel={() => {
              active.current = null;
              onDragEnd(-1, -1);
            }}
            onPointerUp={(e) => {
              const a = active.current;
              active.current = null;
              if (!a) return;
              if (a.moved) onDragEnd(e.clientX, e.clientY);
              else onTap(a.kind);
            }}
          >
            <ParticleDisc kind={kind} size={36} />
            <span className="tray-token__label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
