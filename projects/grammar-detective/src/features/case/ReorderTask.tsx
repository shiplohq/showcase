// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Rebuild-order task: word cards on the desk. Primary manipulation is the
// ◀ ▶ move buttons on every card (mouse, touch AND keyboard); HTML5 drag is
// the desktop-mouse shortcut. Flip keeps spatial continuity across moves.

import { useLayoutEffect, useRef, useState } from 'react';
import type { ReorderCase } from '../../lib/types';
import { isPunctuation, joinTokens } from '../investigation/engine';
import { Flip, flipRelayout } from '../../lib/gsap';
import { ArrowLeftIcon, ArrowRightIcon } from '../../components/art';

interface Props {
  caseFile: ReorderCase;
  order: number[];
  onMove: (from: number, to: number) => void;
}

export function ReorderTask({ caseFile, order, onMove }: Props) {
  const rayRef = useRef<HTMLDivElement>(null);
  const pendingFlip = useRef<Flip.FlipState | null>(null);
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null);

  // After the DOM settles a new order, replay the layout change as motion.
  useLayoutEffect(() => {
    if (pendingFlip.current && rayRef.current) {
      flipRelayout(pendingFlip.current);
      pendingFlip.current = null;
    }
  }, [order]);

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    if (rayRef.current) pendingFlip.current = Flip.getState(rayRef.current.children);
    onMove(from, to);
  }

  const draft = joinTokens(order.map((i) => caseFile.tokens[i]));

  return (
    <div>
      <div className="card-ray" ref={rayRef} aria-label="Word cards. Use the move buttons on each card to rebuild the sentence.">
        {order.map((tokenIdx, pos) => {
          const word = caseFile.tokens[tokenIdx];
          const punct = isPunctuation(word);
          const cap = !punct && /^[A-Z]/.test(word);
          return (
            <div
              key={tokenIdx}
              className={`word-card${punct ? ' word-card--punctuation' : ''}${
                drag?.from === pos ? ' word-card--dragging' : ''
              }${drag?.over === pos && drag.from !== pos ? ' word-card--over' : ''}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(pos));
                e.dataTransfer.effectAllowed = 'move';
                setDrag({ from: pos, over: pos });
              }}
              onDragEnd={() => setDrag(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDrag((d) => (d && d.over !== pos ? { ...d, over: pos } : d));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData('text/plain'));
                setDrag(null);
                if (Number.isInteger(from)) move(from, pos);
              }}
            >
              <span className="word-card__no" aria-hidden="true">
                {String(pos + 1).padStart(2, '0')}
              </span>
              <span className="word-card__word">
                {cap ? <mark>{word[0]}</mark> : null}
                {cap ? word.slice(1) : word}
              </span>
              <span className="word-card__controls">
                <button
                  type="button"
                  className="move-btn"
                  disabled={pos === 0}
                  aria-label={`Move the card "${word}" one place left`}
                  onClick={() => move(pos, pos - 1)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      move(pos, pos - 1);
                    }
                  }}
                >
                  <ArrowLeftIcon width={20} height={20} />
                </button>
                <button
                  type="button"
                  className="move-btn"
                  disabled={pos === order.length - 1}
                  aria-label={`Move the card "${word}" one place right`}
                  onClick={() => move(pos, pos + 1)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      move(pos, pos + 1);
                    }
                  }}
                >
                  <ArrowRightIcon width={20} height={20} />
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <p className="draft-line" aria-hidden="true">
        Your line reads: <b>{draft}</b>
      </p>
      <p className="visually-hidden">Your line currently reads: {draft}.</p>
    </div>
  );
}
