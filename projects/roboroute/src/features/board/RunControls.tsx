// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Run/debug controls — every action is a real button with a keyboard
// shortcut; the app never requires a pointer. No time pressure anywhere.

import type { RunState } from './engine';

interface Props {
  run: RunState | null;
  autoRun: boolean;
  hasProgram: boolean;
  onStep: () => void;
  onToggleRun: () => void;
  onRewind: () => void;
  onReset: () => void;
  onEdit: () => void;
}

export function RunControls({ run, autoRun, hasProgram, onStep, onToggleRun, onRewind, onReset, onEdit }: Props) {
  const status = run?.status ?? 'editing';
  const canStep = !run ? hasProgram : ['ready', 'running', 'paused'].includes(status);
  const canRun = !run ? hasProgram : ['ready', 'running', 'paused'].includes(status);
  const canRewind = !!run && run.history.length > 0 && status !== 'complete';
  const canReset = !!run;
  const canEdit = !!run && status !== 'complete';
  const playing = autoRun && canRun;

  return (
    <section className="rr-controls" aria-label="Run controls">
      <button type="button" className="rr-btn rr-btn--primary" onClick={onStep} disabled={!canStep}>
        Step <kbd aria-hidden="true">S</kbd>
      </button>
      <button type="button" className={`rr-btn ${playing ? 'rr-btn--pause' : 'rr-btn--orange'}`} onClick={onToggleRun} disabled={!canRun}>
        {playing ? (
          <>
            Pause <kbd aria-hidden="true">R</kbd>
          </>
        ) : (
          <>
            Run <kbd aria-hidden="true">R</kbd>
          </>
        )}
      </button>
      <button type="button" className="rr-btn rr-btn--ghost" onClick={onRewind} disabled={!canRewind}>
        Rewind <kbd aria-hidden="true">W</kbd>
      </button>
      <button type="button" className="rr-btn rr-btn--ghost" onClick={onReset} disabled={!canReset}>
        Reset
      </button>
      {run && (
        <button type="button" className="rr-btn rr-btn--ghost" onClick={onEdit} disabled={!canEdit}>
          Edit <kbd aria-hidden="true">E</kbd>
        </button>
      )}
    </section>
  );
}
