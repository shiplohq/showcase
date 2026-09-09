// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The programming board: room on the left, tokens + program + run controls
// on the right (bottom dock under 900px). Owns the interaction state:
// program tiles, caret, selection, run state, auto-run, celebrate overlay.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Concept, Level, Op } from '../../lib/types';
import {
  MAX_BODY,
  type Caret,
  type RunState,
  type Tile,
  type TileRepeat,
  addTileAt,
  adjustRepeatTimes,
  beginRun,
  moveTile,
  programToText,
  removeTile,
  rewind,
  runStatusText,
  stepOnce,
  topLevelCount,
} from './engine';
import { RoomView } from './RoomView';
import { Palette } from './Palette';
import { ProgramStrip } from './ProgramStrip';
import { RunControls } from './RunControls';

interface Props {
  level: Level;
  nextLevelId: string | null;
  concepts: Concept[];
  completed: boolean;
  onSelectLevel: (id: string) => void;
  onExit: () => void;
  onOpenNotebook: (conceptId?: string) => void;
  onComplete: (levelId: string, sparks: number) => void;
}

export function BoardScreen({
  level,
  nextLevelId,
  concepts,
  onSelectLevel,
  onExit,
  onOpenNotebook,
  onComplete,
}: Props) {
  const [program, setProgram] = useState<Tile[]>([]);
  const [caret, setCaret] = useState<Caret>({ scope: 'root', index: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [autoRun, setAutoRun] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const idRef = useRef(0);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const statusRef = useRef<HTMLParagraphElement | null>(null);

  const editing = run === null;
  const slotsUsed = topLevelCount(program);

  // Fresh board whenever the mission changes.
  useEffect(() => {
    setProgram([]);
    setCaret({ scope: 'root', index: 0 });
    setSelected(null);
    setRun(null);
    setAutoRun(false);
    setCelebrate(false);
    setHintOpen(false);
    idRef.current = 0;
  }, [level.id]);

  const nextId = () => `t${++idRef.current}`;

  // ---- editing -----------------------------------------------------------

  const canAdd = useMemo(() => {
    if (!editing) return false;
    if (caret.scope === 'root') return slotsUsed < level.maxCommands;
    const owner = program.find((t) => t.op === 'REPEAT' && t.id === caret.scope) as TileRepeat | undefined;
    return !!owner && owner.body.length < MAX_BODY;
  }, [editing, caret.scope, slotsUsed, level.maxCommands, program]);

  const addOp = useCallback(
    (op: Op, atEnd = false) => {
      if (!canAdd) return;
      const target: Caret = atEnd ? { scope: 'root', index: topLevelCount(program) } : caret;
      const res = addTileAt(program, target, op, nextId());
      if (res) {
        setProgram(res.program);
        setCaret(res.caret);
      }
    },
    [canAdd, caret, program],
  );

  const clampCaret = (p: Tile[], c: Caret): Caret => {
    if (c.scope === 'root') return { scope: 'root', index: Math.min(c.index, p.length) };
    const owner = p.find((t) => t.op === 'REPEAT' && t.id === c.scope) as TileRepeat | undefined;
    if (!owner) return { scope: 'root', index: Math.min(c.index, p.length) };
    return { scope: c.scope, index: Math.min(c.index, owner.body.length) };
  };

  const doRemove = (id: string) => {
    const at = program.find((t) => t.id === id);
    const next = removeTile(program, id);
    setProgram(next);
    if (selected === id) setSelected(null);
    if (caret.scope === id) setCaret({ scope: 'root', index: next.length });
    else setCaret((c) => clampCaret(next, c));
    void at;
  };

  const doMove = (id: string, delta: -1 | 1) => {
    setProgram((p) => moveTile(p, id, delta));
  };

  const doAdjustRepeat = (id: string, delta: number) => {
    setProgram((p) => adjustRepeatTimes(p, id, delta));
  };

  const doEditBody = (id: string) => {
    const owner = program.find((t) => t.op === 'REPEAT' && t.id === id) as TileRepeat | undefined;
    setCaret({ scope: id, index: owner ? owner.body.length : 0 });
    setSelected(null);
  };

  const caretHome = () => setCaret({ scope: 'root', index: program.length });

  const caretMove = (delta: -1 | 1) => {
    setCaret((c) => {
      if (c.scope === 'root') {
        return { scope: 'root', index: Math.max(0, Math.min(program.length, c.index + delta)) };
      }
      const owner = program.find((t) => t.op === 'REPEAT' && t.id === c.scope) as TileRepeat | undefined;
      if (!owner) return { scope: 'root', index: 0 };
      return { scope: c.scope, index: Math.max(0, Math.min(owner.body.length, c.index + delta)) };
    });
  };

  // ---- run ---------------------------------------------------------------

  const doStep = useCallback(() => {
    if (!run && program.length === 0) return; // nothing to execute yet
    setAutoRun(false);
    setRun((r) => {
      if (r) return stepOnce(r, level);
      return stepOnce(beginRun(level, program), level);
    });
  }, [level, program, run]);

  const doToggleRun = useCallback(() => {
    if (!run) {
      if (program.length === 0) return;
      setRun(beginRun(level, program));
      setAutoRun(true);
      return;
    }
    if (!['ready', 'running', 'paused'].includes(run.status)) return;
    setAutoRun((a) => !a);
  }, [run, level, program]);

  const doRewind = useCallback(() => {
    setAutoRun(false);
    setRun((r) => (r ? rewind(r) : r));
  }, []);

  const doReset = useCallback(() => {
    setAutoRun(false);
    setRun((r) => (r ? beginRun(level, program) : r));
  }, [level, program]);

  const doEdit = useCallback(() => {
    setAutoRun(false);
    setRun(null);
    setCelebrate(false);
  }, []);

  // Auto-run loop: one step per beat; any terminal state stops the beat.
  useEffect(() => {
    if (!autoRun || !run) return;
    if (!['ready', 'running', 'paused'].includes(run.status)) {
      setAutoRun(false);
      return;
    }
    const t = setTimeout(() => setRun((r) => (r ? stepOnce(r, level) : r)), 720);
    return () => clearTimeout(t);
  }, [autoRun, run, level]);

  // Completion: record progress, then celebrate.
  const completeRef = useRef(false);
  useEffect(() => {
    if (run?.status === 'complete' && !completeRef.current) {
      completeRef.current = true;
      setAutoRun(false);
      onComplete(level.id, run.collected.length);
      const t = setTimeout(() => setCelebrate(true), prefersFast() ? 60 : 620);
      return () => clearTimeout(t);
    }
    if (run?.status !== 'complete') completeRef.current = false;
  }, [run?.status, level.id, onComplete, run]);

  // Celebrate overlay is aria-modal: move focus in, trap Tab inside it,
  // allow Escape (= Build again) and restore focus on close.
  const celebrateRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!celebrate) return;
    const root = celebrateRef.current;
    const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = root ? [...root.querySelectorAll<HTMLElement>('button')] : [];
    focusables[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setCelebrate(false);
        setAutoRun(false);
        setRun(null);
        return;
      }
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!root?.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      // Return to the editing surface. The previously focused control (a run
      // button) can be mid-disable during the commit — the program strip is
      // the deterministic, always-present landing point after "Build again".
      requestAnimationFrame(() => {
        const tray = document.getElementById('rr-tray-focus');
        if (tray && document.contains(tray)) tray.focus();
        else prev?.focus();
      });
    };
  }, [celebrate]);

  // Keyboard shortcuts (pointer never required).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        doStep();
      } else if (k === 'r') {
        e.preventDefault();
        doToggleRun();
      } else if (k === 'w') {
        e.preventDefault();
        doRewind();
      } else if (k === 'e' && run) {
        e.preventDefault();
        doEdit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doStep, doToggleRun, doRewind, doEdit, run]);

  // ---- status + banners ---------------------------------------------------

  const statusText = run ? runStatusText(run, level) : `${level.brief} Program: ${programToText(program)}.`;

  useEffect(() => {
    // Announce run-state changes for screen readers.
    statusRef.current?.setAttribute('data-status', run?.status ?? 'editing');
  }, [run?.status, run]);

  const banner = (() => {
    if (!run) return null;
    switch (run.status) {
      case 'bumped':
        return {
          tone: 'debug' as const,
          text:
            run.bump?.kind === 'wall'
              ? 'Bump! The robot reached the wall. Which tile should change?'
              : 'Bump! The robot reached an exhibit. Which tile should change?',
          actions: 'debug' as const,
        };
      case 'docked-incomplete':
        return {
          tone: 'debug' as const,
          text: `Docked with ${run.collected.length} of ${level.collectibles.length} sparks. Rewind and route past the dark ones.`,
          actions: 'debug' as const,
        };
      case 'ended-incomplete':
        return {
          tone: 'debug' as const,
          text: 'The program ended before the dock. Add or change tiles.',
          actions: 'debug' as const,
        };
      default:
        return null;
    }
  })();

  const concept = concepts.find((c) => c.id === level.concept);
  const wingTitle = level.wing === 'loop-gallery' ? 'Loop Gallery' : 'Sequence Hall';

  return (
    <div className="rr-board" data-level={level.id}>
      <header className="rr-board-head">
        <button type="button" className="rr-btn rr-btn--ghost rr-back" onClick={onExit}>
          ← Museum map
        </button>
        <div className="rr-board-title">
          <span className="rr-kicker">{wingTitle} · mission {level.id.replace(/^[a-z]+-/, '').padStart(2, '0')}</span>
          <h1>{level.title}</h1>
        </div>
        <div className="rr-board-tools">
          <button type="button" className="rr-btn rr-btn--ghost" onClick={() => setHintOpen((h) => !h)} aria-expanded={hintOpen}>
            {hintOpen ? 'Hide hint' : 'Hint'}
          </button>
          <button type="button" className="rr-btn rr-btn--ghost" onClick={() => onOpenNotebook(level.concept)}>
            Notebook
          </button>
        </div>
      </header>

      <a className="rr-skip" href="#rr-tray-focus">
        Skip to program
      </a>

      <main className="rr-board-main">
        <section className="rr-room-col" aria-label="Museum room">
          <div className="rr-room-frame">
            <RoomView level={level} run={run} />
          </div>
          <p className={`rr-status${banner ? ' rr-status--debug' : ''}`} ref={statusRef} aria-live="polite">
            {banner ? banner.text : statusText}
          </p>
          {banner && (
            <div className="rr-debug-actions">
              <button type="button" className="rr-btn rr-btn--ghost" onClick={doRewind} disabled={!run || run.history.length === 0}>
                Rewind one step
              </button>
              <button type="button" className="rr-btn rr-btn--ghost" onClick={doEdit}>
                Edit program
              </button>
            </div>
          )}
          {hintOpen && (
            <p className="rr-hint" role="note">
              <span className="rr-kicker">Hint</span> {level.hint}
            </p>
          )}
        </section>

        <section className="rr-program-col" aria-label="Program builder">
          <Palette
            allowed={level.allowedCommands}
            program={program}
            caret={caret}
            editing={editing}
            maxCommands={level.maxCommands}
            onAdd={(op) => addOp(op)}
            trayRef={trayRef}
          />
          <div id="rr-tray-focus" tabIndex={-1} />
          <ProgramStrip
            program={program}
            caret={caret}
            selected={selected}
            run={run}
            editing={editing}
            maxCommands={level.maxCommands}
            trayRef={trayRef}
            onSelect={setSelected}
            onRemove={doRemove}
            onMove={doMove}
            onAdjustRepeat={doAdjustRepeat}
            onEditBody={doEditBody}
            onCaretMove={caretMove}
            onCaretHome={caretHome}
          />
          <RunControls
            run={run}
            autoRun={autoRun}
            hasProgram={program.length > 0}
            onStep={doStep}
            onToggleRun={doToggleRun}
            onRewind={doRewind}
            onReset={doReset}
            onEdit={doEdit}
          />
          {/* screen-reader reading order of the program (not just tiles) */}
          <p className="rr-sr-only" aria-live="polite">
            {run ? runStatusText(run, level) : `Program: ${programToText(program)}. ${slotsUsed} of ${level.maxCommands} slots used.`}
          </p>
        </section>
      </main>

      {celebrate && (
        <div className="rr-celebrate" ref={celebrateRef} role="dialog" aria-modal="true" aria-label="Mission complete">
          <div className="rr-celebrate-card">
            <div className="rr-stamp" aria-hidden="true">
              COMPLETE
            </div>
            <h2>{level.title} — done!</h2>
            <p>
              The robot is docked{level.collectibles.length > 0 ? ` and all ${level.collectibles.length} sparks are lit` : ''}.
              {concept ? ` ${concept.title}: ${concept.tagline}` : ''}
            </p>
            <div className="rr-celebrate-actions">
              {nextLevelId && (
                <button type="button" className="rr-btn rr-btn--primary" onClick={() => onSelectLevel(nextLevelId)}>
                  Next mission →
                </button>
              )}
              <button
                type="button"
                className="rr-btn rr-btn--ghost"
                onClick={() => {
                  setCelebrate(false);
                  setAutoRun(false);
                  setRun(null);
                }}
              >
                Build again
              </button>
              <button type="button" className="rr-btn rr-btn--ghost" onClick={onExit}>
                Museum map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function prefersFast(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
