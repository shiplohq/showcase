// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Answer "orbital nodes" — four satellite dials instead of a button-card row
// (spec interaction). Roving radiogroup: arrows move between nodes,
// Enter/Space selects — the full keyboard path for answering facts.

import { useEffect, useRef } from 'react';

export interface AnswerNodesProps {
  options: number[];
  answer: number;
  /** Values already picked (wrong) — dimmed but still selectable (forgiving). */
  picked: number[];
  phase: 'question' | 'locked' | 'drifted';
  onPick: (value: number) => void;
  /** Bumped after a drift so focus returns to the group for the retry. */
  driftKey: number;
}

export function AnswerNodes({ options, answer, picked, phase, onPick, driftKey }: AnswerNodesProps): JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);

  // After a wrong pick, put focus back into the group (keyboard retry path).
  useEffect(() => {
    if (driftKey === 0 || !groupRef.current) return;
    const nodes = groupRef.current.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    const active = document.activeElement;
    const stillInside = active && groupRef.current.contains(active);
    if (!stillInside && nodes.length) nodes[0].focus();
  }, [driftKey]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const nodes = Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
    if (!nodes.length) return;
    const idx = nodes.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1 + nodes.length) % nodes.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + nodes.length) % nodes.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = nodes.length - 1;
    if (next >= 0) {
      e.preventDefault();
      nodes[next].focus();
    }
  };

  return (
    <div
      ref={groupRef}
      className="answer-nodes"
      role="radiogroup"
      aria-label="Answer nodes — choose one value"
      onKeyDown={handleKeyDown}
    >
      {options.map((value) => {
        const isAnswer = value === answer;
        const isPickedWrong = picked.includes(value) && !(phase === 'locked' && isAnswer);
        const stateClass = phase === 'locked' && isAnswer ? ' correct' : isPickedWrong ? ' wrong' : '';
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={phase === 'locked' && isAnswer ? 'true' : 'false'}
            className={`answer-node${stateClass}`}
            onClick={() => onPick(value)}
            disabled={phase === 'locked'}
          >
            <span className="node-dial" aria-hidden="true">
              <span className="node-value">{value}</span>
            </span>
            <span className="node-state" aria-hidden="true">
              {phase === 'locked' && isAnswer ? (
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="var(--mineral)" strokeWidth="1.5" />
                  <path d="M6.2 10.3l2.6 2.6 5-5.4" fill="none" stroke="var(--mineral)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : isPickedWrong ? (
                <svg viewBox="0 0 20 20" width="18" height="18">
                  <path d="M4 10c0-4 2.6-6.4 6.4-6.4 2.6 0 4.6 1.4 5.4 3.4" fill="none" stroke="var(--ember)" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M16.4 3.2v4h-4" fill="none" stroke="var(--ember)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
