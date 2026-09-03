// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// App shell — single-page state (spec: no routing dependency), three screens
// (atlas / compare / quiz), overlays (specimen sheet, reading-this-atlas),
// expedition log (anonymous localStorage + reset). Content, session and
// personal state stay in three separate layers per the spec's state model.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlanetData } from './lib/types';
import { loadAtlas, type AtlasBundle } from './lib/data';
import type { ViewMode } from './features/atlas/engine';
import { VIEW_MODES } from './features/atlas/engine';
import { AtlasScreen } from './features/atlas/AtlasScreen';
import { FocusSheet } from './features/focus/FocusSheet';
import { CompareScreen } from './features/compare/CompareScreen';
import { QuizScreen } from './features/quiz/QuizScreen';
import { CaveatPanel } from './features/caveat/CaveatPanel';
import { IconColumns, IconInfo, IconMedallion, IconReset } from './components/Icons';
import { loadLog, resetLog, saveLog, type ExpeditionLog } from './lib/storage';

type Screen = 'atlas' | 'compare' | 'quiz';

export default function App() {
  const [bundle, setBundle] = useState<AtlasBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('atlas');
  const [mode, setMode] = useState<ViewMode>('distance');
  const [selected, setSelected] = useState<PlanetData | null>(null);
  const [caveatOpen, setCaveatOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [log, setLog] = useState<ExpeditionLog>(() => loadLog());
  const restoreFocusRef = useRef<HTMLButtonElement | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    loadAtlas().then((res) => {
      if (res.ok) setBundle(res.bundle);
      else setLoadError(`${res.error}${res.issues.length ? ` (${res.issues.slice(0, 3).map((i) => `${i.field}:${i.message}`).join('; ')})` : ''}`);
    });
  }, []);

  const visitedIds = useMemo(() => new Set(log.visited), [log.visited]);

  const openSheet = useCallback((planet: PlanetData, button: HTMLButtonElement) => {
    restoreFocusRef.current = button;
    setSelected(planet);
    setLog((prev) => {
      if (prev.visited.includes(planet.id)) return prev;
      const next = { ...prev, visited: [...prev.visited, planet.id] };
      saveLog(next);
      return next;
    });
  }, []);

  const closeSheet = useCallback(() => {
    setSelected(null);
    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
  }, []);

  const toggleCompare = useCallback((planet: PlanetData) => {
    setCompareIds((prev) => {
      if (prev.includes(planet.id)) return prev.filter((id) => id !== planet.id);
      if (prev.length >= 3) return prev;
      return [...prev, planet.id];
    });
  }, []);

  const onMatchSolved = useCallback(
    (solved: number) => {
      setLog((prev) => {
        if (solved <= prev.bestMatch) return prev;
        const next = { ...prev, bestMatch: solved };
        saveLog(next);
        return next;
      });
    },
    [],
  );

  const doResetLog = useCallback(() => {
    setLog(resetLog());
    setConfirmReset(false);
  }, []);

  if (loadError || !bundle) {
    return (
      <div className="error-plaque">
        <div className="panel-card" role="alert">
          <h2>{loadError ? 'The exhibit could not open' : 'Solar System Explorer'}</h2>
          <p>
            {loadError ??
              'calibrating instruments… — the exhibit data is still arriving from local JSON.'}
          </p>
          {loadError && (
            <button type="button" className="primary-btn" onClick={() => window.location.reload()}>
              Reload the exhibit
            </button>
          )}
        </div>
      </div>
    );
  }

  const { planets, copy } = bundle;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>{copy.exhibit.title}</h1>
          <p className="subtitle">{copy.exhibit.subtitle}</p>
        </div>
        <div className="header-controls">
          {screen === 'atlas' && (
            <div className="view-switch" role="group" aria-label="View mode">
              {VIEW_MODES.map((m) => {
                const v = copy.views.find((x) => x.id === m);
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => {
                      setMode(m);
                      if (liveRef.current) liveRef.current.textContent = `${v?.label ?? m}: ${v?.shortLabel ?? ''}`;
                    }}
                  >
                    {v?.label ?? m}
                  </button>
                );
              })}
            </div>
          )}
          <button type="button" className="action-btn" onClick={() => setScreen('compare')}>
            <IconColumns />
            {copy.compare.title}
          </button>
          <button type="button" className="action-btn" onClick={() => setScreen('quiz')}>
            <IconMedallion />
            {copy.quiz.title}
          </button>
          <button type="button" className="action-btn" onClick={() => setCaveatOpen(true)}>
            <IconInfo />
            {copy.caveatPanel.open}
          </button>
        </div>
      </header>

      <main className="app-main" id="main">
        {screen === 'atlas' && (
          <AtlasScreen
            planets={planets}
            copy={copy}
            mode={mode}
            selectedId={selected?.id ?? null}
            visitedIds={visitedIds}
            compareIds={compareIds}
            onOpen={openSheet}
          />
        )}
        {screen === 'compare' && (
          <CompareScreen
            planets={planets}
            copy={copy}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onBack={() => setScreen('atlas')}
          />
        )}
        {screen === 'quiz' && (
          <QuizScreen
            planets={planets}
            copy={copy}
            bestMatch={log.bestMatch}
            onMatchSolved={onMatchSolved}
            onBack={() => setScreen('atlas')}
          />
        )}

        {selected && (
          <FocusSheet
            planet={selected}
            copy={copy}
            inCompare={compareIds.includes(selected.id)}
            compareFull={compareIds.length >= 3}
            onClose={closeSheet}
            onToggleCompare={(p) => toggleCompare(p)}
          />
        )}
        {caveatOpen && <CaveatPanel copy={copy} onClose={() => setCaveatOpen(false)} />}
      </main>

      <footer className="app-footer">
        <span className="label-mono" style={{ color: 'var(--text-soft)' }}>
          {copy.expedition.label}
        </span>
        <div className="log-pips" aria-hidden="true">
          {planets.map((p) => (
            <span
              key={p.id}
              className={`pip${visitedIds.has(p.id) ? ' on' : ''}`}
              style={visitedIds.has(p.id) ? { background: p.pigment } : undefined}
            />
          ))}
        </div>
        <span>{copy.expedition.visited.replace('{count}', String(log.visited.length)).replace('{total}', String(planets.length))}</span>
        <div className="footer-actions">
          <span title={copy.expedition.storageNote}>{copy.footer.sourceNote}</span>
          {confirmReset ? (
            <span className="reset-confirm" role="group" aria-label={copy.expedition.reset}>
              <span>{copy.expedition.resetConfirm}</span>
              <button type="button" className="link-btn" onClick={doResetLog} style={{ minHeight: 44 }}>
                {copy.expedition.reset}
              </button>
              <button type="button" className="link-btn" onClick={() => setConfirmReset(false)} style={{ minHeight: 44 }}>
                Keep it
              </button>
            </span>
          ) : (
            <button type="button" className="link-btn" onClick={() => setConfirmReset(true)} style={{ minHeight: 44 }}>
              <IconReset />
              {copy.expedition.reset}
            </button>
          )}
        </div>
      </footer>
      <div ref={liveRef} className="sr-only" role="status" aria-live="polite" />
    </div>
  );
}
