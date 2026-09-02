// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Evidence-marking task: every word is a button; the active pen paints it.
// Keyboard: Tab walks the words, Enter/Space marks with the active pen,
// 1/2/3 switch pens (without stealing focus), arrows walk the pen tray,
// Backspace/Delete lifts the mark off the focused word.

import { useEffect, useRef } from 'react';
import type { Category, HighlightCase, MarkMap } from '../../lib/types';
import { categoryLabel, categoryLongLabel, isPunctuation } from '../investigation/engine';
import { tweenFrom } from '../../lib/gsap';

interface Props {
  caseFile: HighlightCase;
  marks: MarkMap;
  activePen: Category;
  onToggle: (tokenIndex: number) => void;
  onClear: (tokenIndex: number) => void;
  onPenChange: (pen: Category) => void;
}

const SWATCH_STYLE: Record<Category, React.CSSProperties> = {
  noun: { background: 'var(--mark-noun-wash)', borderBottom: '3px solid var(--mark-noun-line)' },
  verb: { background: 'var(--mark-verb-wash)', borderBottom: '4px double var(--mark-verb-line)' },
  adjective: { background: 'var(--mark-adj-wash)', borderBottom: '3px dotted var(--mark-adj-line)' },
};

export function HighlightTask({ caseFile, marks, activePen, onToggle, onClear, onPenChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const penRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Keyboard accelerators inside the task: 1/2/3 switch pens (aria-pressed
  // updates announce the change — focus stays in the sentence), and
  // Backspace/Delete lifts the mark off the focused word.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    function onKey(e: KeyboardEvent) {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= caseFile.categories.length) {
        onPenChange(caseFile.categories[n - 1]);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const el = e.target as HTMLElement | null;
        const token = el?.closest?.('.token');
        if (token instanceof HTMLElement && el?.tagName === 'BUTTON') {
          e.preventDefault();
          const idx = Number(token.dataset.tokenIndex);
          if (Number.isInteger(idx)) onClear(idx);
        }
      }
    }
    root.addEventListener('keydown', onKey);
    return () => root.removeEventListener('keydown', onKey);
  }, [caseFile.categories, onClear, onPenChange]);

  function penTrayKeys(e: React.KeyboardEvent) {
    const idx = caseFile.categories.indexOf(activePen);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = caseFile.categories[(idx + 1) % caseFile.categories.length];
      onPenChange(next);
      penRefs.current[caseFile.categories.indexOf(next)]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev =
        caseFile.categories[(idx - 1 + caseFile.categories.length) % caseFile.categories.length];
      onPenChange(prev);
      penRefs.current[caseFile.categories.indexOf(prev)]?.focus();
    }
  }

  return (
    <div ref={rootRef}>
      <p className="evidence" role="group" aria-label={`Evidence sentence: ${caseFile.sentence}`}>
        {caseFile.tokens.map((word, i) => {
          if (isPunctuation(word)) {
            return (
              <span key={i} className="token--plain">
                {word}
              </span>
            );
          }
          const cat = marks[i];
          return (
            <button
              type="button"
              key={i}
              className="token"
              data-cat={cat}
              data-token-index={i}
              aria-pressed={cat !== undefined}
              aria-label={`"${word}"${cat ? `, marked ${categoryLongLabel(cat)}` : ', unmarked'}. Activate to mark it with the ${categoryLongLabel(activePen)} pen.`}
              onClick={() => onToggle(i)}
            >
              <span className="token__word">{word}</span>
              {cat ? <MarkLayer key={`${i}-${cat}`} /> : null}
              {cat ? <span className="token__chip">{categoryLabel(cat)}</span> : null}
            </button>
          );
        })}
      </p>

      <div
        className="pen-tray"
        role="toolbar"
        aria-label="Marking pens"
        onKeyDown={penTrayKeys}
      >
        {caseFile.categories.map((cat, idx) => (
          <button
            type="button"
            key={cat}
            ref={(el) => {
              penRefs.current[idx] = el;
            }}
            className="pen"
            aria-pressed={activePen === cat}
            onClick={() => onPenChange(cat)}
          >
            <span className="pen__swatch" style={SWATCH_STYLE[cat]} aria-hidden="true" />
            {categoryLabel(cat)} pen
            <span className="pen__key" aria-hidden="true">
              {idx + 1}
            </span>
            <span className="visually-hidden">
              — activate to mark words as {categoryLongLabel(cat)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** The highlighter stroke. Animates in once per (token, pen) pair. */
function MarkLayer() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      tweenFrom(ref.current, { scaleX: 0, duration: 0.16, ease: 'power2.out' });
    }
  }, []);
  return <span ref={ref} className="token__mark" aria-hidden="true" />;
}
