// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell — three-layer state model (spec):
//   content state  ← public/data/*.json via loadContent()
//   session state  ← per-screen React state inside features
//   personal state ← anonymous localStorage (resolved case ids) + reset

import { useEffect, useState } from 'react';
import { BoardScreen } from './features/board/BoardScreen';
import { CaseScreen } from './features/case/CaseScreen';
import { findCase } from './features/investigation/engine';
import { loadPersonal, resetPersonal, savePersonal } from './lib/storage';
import { ContentError, loadContent } from './lib/data';
import type { BureauContent, PersonalState } from './lib/types';
import { BureauSeal } from './components/art';

type Route = { name: 'board' } | { name: 'case'; caseId: string };

export function App() {
  const [content, setContent] = useState<BureauContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personal, setPersonal] = useState<PersonalState>({ resolved: [] });
  const [route, setRoute] = useState<Route>({ name: 'board' });

  useEffect(() => {
    let alive = true;
    loadContent()
      .then((c) => {
        if (alive) setContent(c);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(
          e instanceof ContentError
            ? e.message
            : 'The case files could not be opened. Please reload the page.',
        );
      });
    setPersonal(loadPersonal());
    return () => {
      alive = false;
    };
  }, []);

  // Personal state is written through: mutate + persist in one place.
  function markResolved(caseId: string) {
    setPersonal((prev) => {
      if (prev.resolved.includes(caseId)) return prev;
      const next = { resolved: [...prev.resolved, caseId] };
      savePersonal(next);
      return next;
    });
  }

  function resetProgress() {
    setPersonal(resetPersonal());
  }

  if (error) {
    return (
      <div className="app-frame">
        <header className="masthead">
          <span className="masthead__seal">
            <BureauSeal />
          </span>
          <div>
            <h1 className="masthead__title">
              Grammar <em>Detective</em>
            </h1>
            <p className="masthead__sub">Case Files Bureau</p>
          </div>
        </header>
        <main>
          <section className="error-memo" role="alert">
            <h2>The case files are stuck</h2>
            <p>{error}</p>
            <p>
              The evidence lives in <code>data/cases.json</code> next to the app.
              Check the file, then reload this page.
            </p>
          </section>
        </main>
        <footer className="footline">Shiplo Showcase #09 · Grammar Detective</footer>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="app-frame">
        <p className="meta-tag" role="status">
          Opening the case files…
        </p>
      </div>
    );
  }

  if (route.name === 'case') {
    const found = findCase(content.dossiers, route.caseId);
    if (found) {
      const nextId = nextCaseId(content, found.case.id);
      return (
        <CaseScreen
          key={found.case.id}
          dossier={found.dossier}
          caseFile={found.case}
          caseNumber={caseNo(content, found.case.id)}
          resolved={personal.resolved.includes(found.case.id)}
          onResolved={markResolved}
          onBack={() => setRoute({ name: 'board' })}
          onNext={() => {
            if (nextId) setRoute({ name: 'case', caseId: nextId });
            else setRoute({ name: 'board' });
          }}
          hasNext={nextId !== null}
        />
      );
    }
    // Unknown id — fall through to the board rather than a white screen.
  }

  return (
    <BoardScreen
      dossiers={content.dossiers}
      resolved={personal.resolved}
      onSelect={(caseId) => setRoute({ name: 'case', caseId })}
      onReset={resetProgress}
    />
  );
}

function flatCases(content: BureauContent) {
  return content.dossiers.flatMap((d) => d.cases.map((c) => ({ c })));
}

function caseNo(content: BureauContent, caseId: string): number {
  const idx = flatCases(content).findIndex(({ c }) => c.id === caseId);
  return idx >= 0 ? idx + 1 : 0;
}

function nextCaseId(content: BureauContent, caseId: string): string | null {
  const flat = flatCases(content);
  const idx = flat.findIndex(({ c }) => c.id === caseId);
  return idx >= 0 && idx < flat.length - 1 ? flat[idx + 1].c.id : null;
}
