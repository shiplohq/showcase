// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell — single-page state (no router; spec static-hosting rules).
// Three state layers stay separated (spec): content state from JSON,
// interaction state in the screens, anonymous personal state in
// localStorage with an explicit reset on the ledger.

import { useCallback, useEffect, useState } from 'react';
import { ContentError, loadContent } from './lib/data';
import { clearCompleted, loadCompleted, saveCompleted } from './lib/storage';
import type { Content } from './lib/types';
import { LedgerScreen } from './features/ledger/LedgerScreen';
import { ForgeScreen } from './features/forge/ForgeScreen';

type Phase =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; content: Content };

export function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [screen, setScreen] = useState<'ledger' | 'forge'>('ledger');
  const [missionIndex, setMissionIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    loadContent()
      .then((content) => setPhase({ kind: 'ready', content }))
      .catch((err: unknown) => {
        const message = err instanceof ContentError ? err.message : 'Something went wrong while loading the forge.';
        setPhase({ kind: 'error', message });
      });
  }, []);

  useEffect(() => {
    // Session start: pick up anonymous progress if the learner has any.
    setCompleted(loadCompleted());
  }, []);

  const handleForged = useCallback((missionId: string) => {
    setCompleted((prev) => {
      if (prev.includes(missionId)) return prev;
      const next = [...prev, missionId];
      saveCompleted(next);
      return next;
    });
  }, []);

  if (phase.kind === 'loading') {
    return (
      <div className="app-frame">
        <header className="app-header">
          <p className="app-header__wordmark">
            ATOM<span>/</span>FORGE
          </p>
        </header>
        <p className="mono-label" role="status">
          Loading the forge…
        </p>
      </div>
    );
  }

  if (phase.kind === 'error') {
    return (
      <div className="error-screen" role="alert">
        <h1>The forge bench is unavailable</h1>
        <p>{phase.message}</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  const { content } = phase;
  const mission = content.missions[missionIndex];
  const isLast = missionIndex === content.missions.length - 1;

  return (
    <>
      <div className="app-frame">
        <header className="app-header">
          <button
            type="button"
            className="app-header__wordmark"
            style={{ font: 'inherit', fontWeight: 800 }}
            onClick={() => setScreen('ledger')}
            aria-label="Atom Forge — back to the mission ledger"
          >
            ATOM<span>/</span>FORGE
          </button>
          <div className="app-header__meta">
            {screen === 'forge' ? (
              <span className="mono-label" aria-live="polite">
                {completed.length}/{content.missions.length} forged
              </span>
            ) : null}
          </div>
        </header>

        {screen === 'ledger' ? (
          <main>
            <LedgerScreen
              content={content}
              completed={completed}
              onSelect={(index) => {
                setMissionIndex(index);
                setScreen('forge');
              }}
              onReset={() => {
                clearCompleted();
                setCompleted([]);
              }}
            />
          </main>
        ) : (
          <main>
            <ForgeScreen
              key={mission.id}
              content={content}
              mission={mission}
              missionIndex={missionIndex}
              isLast={isLast}
              completed={completed}
              onForged={handleForged}
              onExit={() => setScreen('ledger')}
              onNext={() => {
                if (!isLast) {
                  setMissionIndex(missionIndex + 1);
                } else {
                  setScreen('ledger');
                }
              }}
            />
          </main>
        )}
      </div>
      <footer className="app-footer" id="app-footer-end" tabIndex={-1}>
        <p className="model-note">
          Simplified model — shells hold 2·8·8·2 here; real atoms follow quantum mechanics.
        </p>
        <p className="model-note">Shiplo Showcase #14 · static build</p>
      </footer>
    </>
  );
}
