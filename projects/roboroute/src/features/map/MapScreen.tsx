// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// The museum floor plan: two exhibition wings drawn as plan rooms, mission
// plaques hung along the corridor. All missions stay open (a museum you can
// wander) — completion shows as a stamp, never as a lock.

import type { Level, LevelsFile } from '../../lib/types';
import type { Progress } from '../../lib/storage';

interface Props {
  data: LevelsFile;
  progress: Progress;
  onSelect: (id: string) => void;
  onOpenNotebook: () => void;
  onResetProgress: () => void;
}

export function MapScreen({ data, progress, onSelect, onOpenNotebook, onResetProgress }: Props) {
  const totalSparks = data.levels.reduce((n, l) => n + l.collectibles.length, 0);
  const wonSparks = data.levels.reduce((n, l) => n + (progress.sparks[l.id] ?? 0), 0);
  const done = data.levels.filter((l) => progress.completed.includes(l.id)).length;

  return (
    <div className="rr-map">
      <header className="rr-map-head">
        <div className="rr-titleblock">
          <div className="rr-titleblock-row">
            <span className="rr-tb-cell rr-tb-cell--brand">
              <span className="rr-logo-mark" aria-hidden="true" />
              ROBOROUTE
            </span>
            <span className="rr-tb-cell">The Museum of Ways</span>
            <span className="rr-tb-cell">
              Sheet 15 · {done}/{data.levels.length} missions · {wonSparks}/{totalSparks} sparks
            </span>
          </div>
          <p className="rr-map-sub">
            Lay command tiles — forward, turn, repeat — then step through the run and debug the route.
          </p>
        </div>
        <div className="rr-map-tools">
          <button type="button" className="rr-btn rr-btn--ghost" onClick={onOpenNotebook}>
            Concept notebook
          </button>
          <button type="button" className="rr-btn rr-btn--ghost" onClick={onResetProgress}>
            Start fresh
          </button>
        </div>
      </header>

      <main className="rr-map-corridor">
        {data.wings.map((wing) => {
          const levels = data.levels.filter((l: Level) => l.wing === wing.id);
          return (
            <section key={wing.id} className="rr-wing" aria-label={wing.title}>
              <div className="rr-wing-head">
                <h2>{wing.title}</h2>
                <p>{wing.subtitle}</p>
              </div>
              <ul className="rr-plaques">
                {levels.map((l, i) => {
                  const isDone = progress.completed.includes(l.id);
                  const sparks = l.collectibles.length;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        className={`rr-plaque${isDone ? ' is-done' : ''}`}
                        onClick={() => onSelect(l.id)}
                        aria-label={`Mission ${i + 1}: ${l.title}.${isDone ? ' Completed.' : ''} ${
                          sparks > 0 ? `${sparks} spark${sparks > 1 ? 's' : ''}.` : ''
                        }`}
                      >
                        <span className="rr-plaque-no" aria-hidden="true">
                          {String(data.levels.findIndex((x) => x.id === l.id) + 1).padStart(2, '0')}
                        </span>
                        <span className="rr-plaque-title">{l.title}</span>
                        <span className="rr-plaque-meta">
                          {sparks > 0 ? (
                            <span className="rr-plaque-sparks">
                              {Array.from({ length: sparks }, (_, k) => (
                                <svg
                                  key={k}
                                  className={`rr-pip${(progress.sparks[l.id] ?? 0) > k ? ' is-lit' : ''}`}
                                  viewBox="0 0 12 16"
                                  aria-hidden="true"
                                  focusable="false"
                                >
                                  <path d="M8 0 2.2 7.4h3.4L3 16l7.4-9.2H6.6L9.2 0Z" />
                                </svg>
                              ))}
                              <span className="rr-sr-only">
                                {(progress.sparks[l.id] ?? 0) > 0
                                  ? `${progress.sparks[l.id]} of ${sparks} sparks lit`
                                  : `${sparks} spark${sparks > 1 ? 's' : ''} to collect`}
                              </span>
                            </span>
                          ) : (
                            <span className="rr-plaque-note">dock run</span>
                          )}
                          {isDone ? (
                            <span className="rr-mini-stamp" aria-hidden="true">
                              ✓ done
                            </span>
                          ) : (
                            <span className="rr-plaque-note rr-plaque-note--open">open</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </main>

      <footer className="rr-map-foot">
        <p>Pick a mission → place tiles → run the robot. A bump is a clue, not a mistake.</p>
      </footer>
    </div>
  );
}
