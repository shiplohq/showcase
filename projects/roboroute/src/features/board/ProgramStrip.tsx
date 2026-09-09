// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The program strip: slots for tiles, the insertion caret, the selected-tile
// toolbar (keyboard path for every edit) and the executing-tile highlight
// with the repeat round badge. Reorder animates with GSAP Flip.

import { useEffect, useRef } from 'react';
import type { SimpleOp } from '../../lib/types';
import {
  type Caret,
  type RunState,
  type Tile,
  type TileRepeat,
  opLabel,
  topLevelCount,
} from './engine';
import { TileIcon } from '../../components/art';
import { Flip, flipRelayout } from '../../lib/gsap';

interface Props {
  program: Tile[];
  caret: Caret;
  selected: string | null;
  run: RunState | null;
  editing: boolean;
  maxCommands: number;
  trayRef: React.RefObject<HTMLDivElement>;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onAdjustRepeat: (id: string, delta: number) => void;
  onEditBody: (id: string) => void;
  onCaretMove: (delta: -1 | 1) => void;
  onCaretHome: () => void;
}

const OP_SHORT: Record<SimpleOp | 'REPEAT', string> = {
  F: 'FWD',
  L: 'LEFT',
  R: 'RIGHT',
  REPEAT: 'REPEAT',
};

export function ProgramStrip(props: Props) {
  const {
    program,
    caret,
    selected,
    run,
    editing,
    maxCommands,
    trayRef,
    onSelect,
    onRemove,
    onMove,
    onAdjustRepeat,
    onEditBody,
    onCaretMove,
    onCaretHome,
  } = props;

  const flipState = useRef<Flip.FlipState | null>(null);
  const prevKey = useRef<string | null>(null);

  // Flip-animate reorders: capture tile positions after every commit; when the
  // order changed since the last capture, animate from the old positions.
  // (Skipped entirely under reduced motion inside flipRelayout.)
  const key = program.map((t) => t.id).join('|') + ':' + program.map((t) => (t.op === 'REPEAT' ? `r${t.times}` : '')).join('');
  useEffect(() => {
    const nodes = trayRef.current?.querySelectorAll('.rr-tile');
    if (!nodes || nodes.length === 0) {
      prevKey.current = key;
      flipState.current = null;
      return;
    }
    if (prevKey.current !== null && prevKey.current !== key && flipState.current) {
      flipRelayout(flipState.current);
    }
    flipState.current = Flip.getState(nodes);
    prevKey.current = key;
  });

  const executingId =
    run && (run.status === 'running' || run.status === 'paused' || run.status === 'bumped')
      ? run.lastStep?.tileId ?? null
      : null;
  const executingRepeat =
    run && run.lastStep?.repeat && (run.status === 'running' || run.status === 'paused') ? run.lastStep.repeat : null;
  const bumpTileId = run?.status === 'bumped' ? run.bump?.tileId ?? null : null;

  const slotsUsed = topLevelCount(program);
  const repeatOwner =
    caret.scope === 'root'
      ? null
      : (program.find((t) => t.op === 'REPEAT' && t.id === caret.scope) as TileRepeat | undefined);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!editing) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onCaretMove(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onCaretMove(1);
    } else if (e.key === 'Escape') {
      onSelect(null);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
      e.preventDefault();
      onRemove(selected);
    }
  };

  const tileClass = (id: string) =>
    [
      'rr-tile',
      selected === id ? 'is-selected' : '',
      executingId === id ? 'is-executing' : '',
      bumpTileId === id ? 'is-bump' : '',
    ]
      .filter(Boolean)
      .join(' ');

  const repeatBody = (t: TileRepeat) => (
    <span className="rr-tile-body">
      {t.body.map((b, bi) => (
        <span key={b.id} className="rr-tile-body-slot">
          {caret.scope === t.id && caret.index === bi && <span className="rr-caret rr-caret--body" />}
          <button
            type="button"
            className={tileClass(b.id)}
            aria-pressed={selected === b.id}
            onClick={() => onSelect(selected === b.id ? null : b.id)}
            aria-label={`${opLabel(b.op)} — tile ${bi + 1} inside repeat`}
          >
            <TileIcon op={b.op} size={22} />
            <span className="rr-tile-label">{OP_SHORT[b.op]}</span>
          </button>
        </span>
      ))}
      {caret.scope === t.id && caret.index >= t.body.length && <span className="rr-caret rr-caret--body" />}
      {t.body.length === 0 && <span className="rr-tile-body-empty">drop tiles inside</span>}
    </span>
  );

  return (
    <section className="rr-tray-section" aria-label="Program strip">
      <div className="rr-side-label">
        Program <span className="rr-side-note">{slotsUsed} / {maxCommands} slots</span>
      </div>

      {(selected || caret.scope !== 'root') && editing && (
        <div className="rr-toolbar" role="toolbar" aria-label="Tile actions">
          {selected && (
            <>
              <button type="button" className="rr-btn rr-btn--ghost" onClick={() => onMove(selected, -1)}>
                ← Move left
              </button>
              <button type="button" className="rr-btn rr-btn--ghost" onClick={() => onMove(selected, 1)}>
                Move right →
              </button>
              <button type="button" className="rr-btn rr-btn--ghost" onClick={() => onRemove(selected)}>
                Remove
              </button>
              {program.find((t) => t.id === selected)?.op === 'REPEAT' && (
                <>
                  <button type="button" className="rr-btn rr-btn--ghost" onClick={() => onAdjustRepeat(selected, -1)}>
                    − round
                  </button>
                  <button type="button" className="rr-btn rr-btn--ghost" onClick={() => onAdjustRepeat(selected, 1)}>
                    + round
                  </button>
                  <button
                    type="button"
                    className="rr-btn rr-btn--ghost"
                    onClick={() => onEditBody(selected)}
                    aria-label="Edit tiles inside this repeat"
                  >
                    Edit inside
                  </button>
                </>
              )}
            </>
          )}
          {caret.scope !== 'root' && repeatOwner && (
            <button type="button" className="rr-btn rr-btn--ghost" onClick={onCaretHome}>
              ← Back to main line ({opLabel('REPEAT')} ×{repeatOwner.times})
            </button>
          )}
        </div>
      )}

      <div
        ref={trayRef}
        className={`rr-tray${editing ? '' : ' is-locked'}${caret.scope !== 'root' ? ' is-inside' : ''}`}
        role="list"
        aria-label={`Program, ${slotsUsed} of ${maxCommands} slots used`}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {program.length === 0 && caret.scope === 'root' && (
          <p className="rr-tray-empty">Tap a token above to start the program.</p>
        )}
        {program.map((t, i) => (
          <span key={t.id} className="rr-tile-slot" role="listitem">
            {caret.scope === 'root' && caret.index === i && <span className="rr-caret" />}
            {t.op === 'REPEAT' ? (
              <span className={`rr-tile rr-tile--repeat ${tileClass(t.id).replace('rr-tile', '').trim()}`}>
                <button
                  type="button"
                  className={`rr-tile-head ${tileClass(t.id)}`}
                  aria-pressed={selected === t.id}
                  onClick={() => onSelect(selected === t.id ? null : t.id)}
                  aria-label={`Repeat ${t.times} times — container tile ${i + 1}`}
                >
                  <TileIcon op="REPEAT" size={22} />
                  <span className="rr-tile-label">×{t.times}</span>
                  {executingRepeat?.id === t.id && (
                    <span className="rr-round-badge">
                      {executingRepeat.round}/{executingRepeat.rounds}
                    </span>
                  )}
                </button>
                {repeatBody(t)}
              </span>
            ) : (
              <button
                type="button"
                className={tileClass(t.id)}
                aria-pressed={selected === t.id}
                onClick={() => onSelect(selected === t.id ? null : t.id)}
                aria-label={`${opLabel(t.op)} — tile ${i + 1} of the program`}
              >
                <TileIcon op={t.op} size={22} />
                <span className="rr-tile-label">{OP_SHORT[t.op]}</span>
              </button>
            )}
          </span>
        ))}
        {caret.scope === 'root' && caret.index >= program.length && <span className="rr-caret" />}
        {program.length < maxCommands &&
          Array.from({ length: Math.min(3, maxCommands - program.length) }, (_, k) => (
            <span key={`empty${k}`} className="rr-tile rr-tile--empty" aria-hidden="true" />
          ))}
      </div>
    </section>
  );
}
