// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Command palette — the physical token tray. Tap/Enter places a tile at the
// caret; pointer drag onto the program strip is an enhancement (the button
// path alone fully operates the app — WCAG 2.2 dragging-movements rule).

import { useRef, useState } from 'react';
import type { Op } from '../../lib/types';
import { opLabel, type Caret, type Tile, MAX_BODY, topLevelCount } from './engine';
import { TileIcon } from '../../components/art';

const LABELS: Record<Op, string> = {
  F: 'Forward',
  L: 'Turn left',
  R: 'Turn right',
  REPEAT: 'Repeat',
};

interface Props {
  allowed: Op[];
  program: Tile[];
  caret: Caret;
  editing: boolean;
  maxCommands: number;
  onAdd: (op: Op) => void;
  /** Live element the drop is tested against (the program strip). */
  trayRef: React.RefObject<HTMLElement>;
}

interface DragState {
  op: Op;
  x: number;
  y: number;
}

export function Palette({ allowed, program, caret, editing, maxCommands, onAdd, trayRef }: Props) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const armedRef = useRef(false);
  const suppressClickRef = useRef(false);

  const repeatOwner =
    caret.scope === 'root'
      ? null
      : (program.find((t) => t.op === 'REPEAT' && t.id === caret.scope) ?? null);
  const bodyLen = repeatOwner && repeatOwner.op === 'REPEAT' ? repeatOwner.body.length : 0;
  const slotsUsed = topLevelCount(program);
  const full = caret.scope === 'root' ? slotsUsed >= maxCommands : bodyLen >= MAX_BODY;
  const canAdd = editing && !full;

  const onPointerDown = (e: React.PointerEvent, op: Op) => {
    suppressClickRef.current = false;
    if (!canAdd) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = { op, x: e.clientX, y: e.clientY };
    armedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (!armedRef.current && dist > 8) armedRef.current = true;
    if (armedRef.current) setDrag({ op: d.op, x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent, op: Op) => {
    const wasArmed = armedRef.current;
    dragRef.current = null;
    armedRef.current = false;
    setDrag(null);
    if (!canAdd) return;
    if (wasArmed) {
      // A completed drag also produces a click on the captured element —
      // the click handler must not add a second tile.
      suppressClickRef.current = true;
      const tray = trayRef.current;
      const r = tray?.getBoundingClientRect();
      if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        onAdd(op); // dropped on the program strip
      }
    }
    // Non-drag pointer release: the native click handler does the adding,
    // which also covers keyboard Enter/Space activation.
  };

  const onClick = (op: Op) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!canAdd) return;
    onAdd(op);
  };

  return (
    <section className="rr-palette" aria-label="Command palette">
      <div className="rr-side-label">
        Tokens {!editing && <span className="rr-side-note">· editing paused while running</span>}
        {editing && full && <span className="rr-side-note">· no room left</span>}
      </div>
      <div className="rr-palette-row">
        {allowed.map((op) => {
          const disabled = !canAdd;
          return (
            <button
              key={op}
              type="button"
              className={`rr-token rr-token--${op.toLowerCase()}${disabled ? ' is-disabled' : ''}`}
              disabled={disabled}
              onPointerDown={(e) => onPointerDown(e, op)}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => onPointerUp(e, op)}
              onPointerCancel={() => {
                dragRef.current = null;
                armedRef.current = false;
                setDrag(null);
              }}
              onClick={() => onClick(op)}
              aria-label={`Add ${opLabel(op)} tile${op === 'REPEAT' ? ' (holds other tiles)' : ''}`}
            >
              <TileIcon op={op} size={26} />
              <span className="rr-token-label">{LABELS[op]}</span>
            </button>
          );
        })}
      </div>
      {drag && (
        <div className="rr-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <span className="rr-token rr-token--ghost">
            <TileIcon op={drag.op} size={26} />
            <span className="rr-token-label">{LABELS[drag.op]}</span>
          </span>
        </div>
      )}
    </section>
  );
}
