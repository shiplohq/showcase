// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Add-habit dialog (spec IA: "Add demo habit modal client-only") — a real
// <dialog>-style modal with focus trap, Esc to close and focus return. The
// new habit starts as a seedling with an empty history.

import { useEffect, useId, useRef, useState } from 'react';
import type { Cadence, PlantKind } from '../lib/types';
import { leafSpec } from '../lib/stems';

interface Props {
  onClose: () => void;
  onAdd: (draft: { name: string; plant: PlantKind; cadence: Cadence }) => void;
}

const PLANT_CHOICES: Array<{ kind: PlantKind; label: string; note: string }> = [
  { kind: 'fern', label: 'Fern', note: 'feathered fronds' },
  { kind: 'sprout', label: 'Sprout', note: 'simple pointed leaves' },
  { kind: 'blossom', label: 'Blossom', note: 'orchid blooms every 7 leaves' },
  { kind: 'marigold', label: 'Marigold', note: 'notched leaves, golden blooms' },
];

export function AddHabitDialog({ onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [plant, setPlant] = useState<PlantKind>('sprout');
  const [cadence, setCadence] = useState<Cadence>('daily');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const returnRef = useRef<Element | null>(null);
  const titleId = useId();

  // Focus the name field on open; restore focus to the opener on close.
  useEffect(() => {
    returnRef.current = document.activeElement;
    nameRef.current?.focus();
    return () => {
      if (returnRef.current instanceof HTMLElement) returnRef.current.focus();
    };
  }, []);

  // Esc closes; Tab cycles inside the dialog (focus trap).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      nameRef.current?.focus();
      return;
    }
    onAdd({ name: trimmed.slice(0, 48), plant, cadence });
  }

  return (
    <div className="modal-veil" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <h2 id={titleId} className="modal__title">
          Plant a new habit
        </h2>
        <p className="modal__hint">
          It starts as a seedling — the first check-in grows its first leaf.
        </p>

        <label className="field-label" htmlFor="habit-name">
          Habit name
        </label>
        <input
          id="habit-name"
          ref={nameRef}
          className="field-input"
          type="text"
          value={name}
          maxLength={48}
          autoComplete="off"
          placeholder="e.g. Water the plants"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />

        <fieldset className="field-group">
          <legend className="field-label">Plant family</legend>
          <div className="plant-picker">
            {PLANT_CHOICES.map((choice) => (
              <label key={choice.kind} className={`plant-option${plant === choice.kind ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="plant"
                  value={choice.kind}
                  checked={plant === choice.kind}
                  onChange={() => setPlant(choice.kind)}
                />
                <PlantPreview kind={choice.kind} />
                <span className="plant-option__label">{choice.label}</span>
                <span className="plant-option__note">{choice.note}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend className="field-label">Rhythm</legend>
          <div className="cadence-picker" role="radiogroup" aria-label="Rhythm">
            {(['daily', 'weekly'] as Cadence[]).map((value) => (
              <label key={value} className={`cadence-option${cadence === value ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="cadence"
                  value={value}
                  checked={cadence === value}
                  onChange={() => setCadence(value)}
                />
                {value === 'daily' ? 'Daily — a leaf each day' : 'Weekly — a leaf each week'}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="modal__actions">
          <button type="button" className="btn btn--primary" onClick={submit}>
            Plant it
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tiny line-art preview of a plant family (reuses the leaf geometry). */
function PlantPreview({ kind }: { kind: PlantKind }) {
  const spec = leafSpec(kind);
  return (
    <svg className="plant-option__preview" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 37 C 20 30 18.6 26 20 20" className="pp-stem" />
      <g transform="translate(20 28) rotate(-130)">
        <path d={spec.paths[0]} className={`pp-blade pp-blade--${spec.colorKey}`} />
      </g>
      <g transform="translate(20 22) rotate(-50)">
        <path d={spec.paths[0]} className={`pp-blade pp-blade--${spec.colorKey}`} />
      </g>
    </svg>
  );
}
