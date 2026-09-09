// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Element-forged reveal — the typographic moment (spec: "element name reveal
// bằng typographic transition") plus the result explanation required by the
// spec IA: element / isotope / charge breakdown in plain language.

import { useEffect, useRef } from 'react';
import { ParticleDisc } from '../../components/ParticleDisc';
import { fromTween, gsap } from '../../lib/gsap';
import type { Mission } from '../../lib/types';
import { chargeCopy, type MissionEvaluation } from '../forge/engine';
import { AtomCanvas } from '../forge/AtomCanvas';

interface RevealOverlayProps {
  mission: Mission;
  evaluation: MissionEvaluation;
  isLast: boolean;
  onNext: () => void;
  onReplay: () => void;
  /** Dismiss (ESC) — close the overlay but keep the built atom on the bench. */
  onDismiss: () => void;
  onLedger: () => void;
}

const FOCUS_COPY: Record<Mission['focus'], string> = {
  build: 'The proton count defines the element. Change it and you are forging a different substance.',
  shells: 'Shells fill inner-first and hold 2 · 8 · 8 · 2 electrons in this simplified model.',
  isotope: 'Same protons, different neutrons — a new isotope of the very same element.',
  ion: 'Electrons gained or lost — the element stays, the charge changes. That is an ion.',
};

export function RevealOverlay({ mission, evaluation, isLast, onNext, onReplay, onDismiss, onLedger }: RevealOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const target = evaluation.target;
  const el = target.element;

  useEffect(() => {
    nextRef.current?.focus();
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      fromTween('.reveal__element', { y: 26, opacity: 0, duration: 0.7, ease: 'expo.out' });
      fromTween('.reveal__row', { y: 14, opacity: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03 });
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id]);

  return (
    <div
      className="reveal-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-title"
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onDismiss();
          return;
        }
        // Minimal focus loop — aria-modal dialog keeps Tab inside itself.
        if (e.key === 'Tab') {
          const focusables = rootRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (!focusables || focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <div className="reveal">
        <div className="reveal__text">
        <p className="reveal__tag">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <rect width="16" height="16" fill="var(--ultramarine)" />
            <path d="M3.5 8.5 L6.5 11.5 L12.5 4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          FORGED · {target.isotopeNotation}
        </p>
        <h2 className="reveal__element" id="reveal-title">
          {el.name}
        </h2>
        <p className="reveal__notation">
          {target.isotopeNotation} · {el.name}-{target.element.atomicNumber + target.neutrons}
          {target.charge !== 0 ? (target.charge > 0 ? ` ${target.charge}+ ion` : ` ${Math.abs(target.charge)}− ion`) : ''}
        </p>
        <p className="reveal__concept">{FOCUS_COPY[mission.focus]}</p>

        <div className="reveal__breakdown">
          <div className="reveal__row">
            <span className="reveal__row-label">
              <ParticleDisc kind="proton" size={18} /> Protons — identity
            </span>
            <span className="reveal__row-value">
              {el.atomicNumber} <span className="mono-label">= Z · {el.symbol}</span>
            </span>
          </div>
          <div className="reveal__row">
            <span className="reveal__row-label">
              <ParticleDisc kind="neutron" size={18} /> Neutrons — isotope
            </span>
            <span className="reveal__row-value">
              {target.neutrons} <span className="mono-label">mass {target.element.atomicNumber + target.neutrons}</span>
            </span>
          </div>
          <div className="reveal__row">
            <span className="reveal__row-label">
              <ParticleDisc kind="electron" size={18} /> Electrons — shells
            </span>
            <span className="reveal__row-value">
              {target.electrons}{' '}
              <span className="mono-label">
                shells {target.config.join(' · ')}
                {target.config.length === 1
                  ? ` · ${target.config[0]} of ${target.config[0] === 1 ? 2 : 8} seats`
                  : ''}
              </span>
            </span>
          </div>
          <div className="reveal__row">
            <span className="reveal__row-label">Charge</span>
            <span className="reveal__row-value">
              {target.charge === 0 ? '0' : target.charge > 0 ? `+${target.charge}` : `−${Math.abs(target.charge)}`}
              <span className="mono-label">{chargeCopy(target.charge)}</span>
            </span>
          </div>
        </div>

        <div className="reveal__actions">
          {!isLast ? (
            <button type="button" ref={nextRef} className="btn btn--primary" onClick={onNext}>
              Next mission →
            </button>
          ) : (
            <button type="button" ref={nextRef} className="btn btn--primary" onClick={onLedger}>
              Every mission forged — back to the ledger
            </button>
          )}
          <button type="button" className="btn" onClick={onReplay}>
            Rebuild it myself
          </button>
          <button type="button" className="btn btn--ghost" onClick={onLedger}>
            Mission ledger
          </button>
        </div>
        <p className="reveal__note">
          Simplified shell model (2 · 8 · 8 · 2) — real atoms follow quantum mechanics, not fixed rings.
        </p>
        </div>
        <div className="reveal__diagram" aria-hidden="true">
          <AtomCanvas
            build={{ protons: el.atomicNumber, neutrons: target.neutrons, shells: target.config }}
            visibleShells={target.config.length}
            dragOver={null}
            summary=""
            onRemoveParticle={() => {}}
            interactive={false}
          />
        </div>
      </div>
    </div>
  );
}
