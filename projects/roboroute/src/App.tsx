// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell: loads content JSON (content state), holds the session screen
// state and the anonymous progress layer. Single-page state, no router
// (spec static-hosting rule).

import { useCallback, useEffect, useState } from 'react';
import type { ConceptsFile, LevelsFile } from './lib/types';
import { ContentError, loadContent } from './lib/data';
import { clearProgress, loadProgress, recordComplete, type Progress } from './lib/storage';
import { MapScreen } from './features/map/MapScreen';
import { BoardScreen } from './features/board/BoardScreen';
import { NotebookPanel } from './features/notebook/NotebookPanel';

type Screen = { kind: 'map' } | { kind: 'board'; levelId: string };

export function App() {
  const [data, setData] = useState<{ levels: LevelsFile; concepts: ConceptsFile } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: 'map' });
  const [progress, setProgress] = useState<Progress>({ completed: [], sparks: {} });
  const [notebook, setNotebook] = useState<{ open: boolean; concept?: string }>({ open: false });

  useEffect(() => {
    setProgress(loadProgress());
    loadContent()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof ContentError ? e.message : 'Something went wrong loading the museum.'));
  }, []);

  const onComplete = useCallback((levelId: string, sparks: number) => {
    setProgress((p) => recordComplete(p, levelId, sparks));
  }, []);

  const onResetProgress = useCallback(() => {
    setProgress(clearProgress());
  }, []);

  if (error) {
    return (
      <div className="rr-error" role="alert">
        <h1>The museum is closed for maintenance</h1>
        <p>{error}</p>
        <button type="button" className="rr-btn rr-btn--primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rr-loading" role="status">
        <span className="rr-logo-mark rr-logo-mark--big" aria-hidden="true" />
        Unrolling the floor plan…
      </div>
    );
  }

  const levels = data.levels.levels;
  const level = screen.kind === 'board' ? levels.find((l) => l.id === screen.levelId) : undefined;

  return (
    <>
      {screen.kind === 'map' || !level ? (
        <MapScreen
          data={data.levels}
          progress={progress}
          onSelect={(id) => setScreen({ kind: 'board', levelId: id })}
          onOpenNotebook={() => setNotebook({ open: true })}
          onResetProgress={onResetProgress}
        />
      ) : (
        <BoardScreen
          level={level}
          nextLevelId={(() => {
            const i = levels.findIndex((l) => l.id === level.id);
            return i >= 0 && i + 1 < levels.length ? levels[i + 1].id : null;
          })()}
          concepts={data.concepts.concepts}
          completed={progress.completed.includes(level.id)}
          onSelectLevel={(id) => setScreen({ kind: 'board', levelId: id })}
          onExit={() => setScreen({ kind: 'map' })}
          onOpenNotebook={(concept) => setNotebook({ open: true, concept })}
          onComplete={onComplete}
        />
      )}
      <NotebookPanel
        concepts={data.concepts.concepts}
        open={notebook.open}
        focusConcept={notebook.concept}
        onClose={() => setNotebook({ open: false })}
      />
    </>
  );
}
