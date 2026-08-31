// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Home — lesson select as four garden beds (not a card grid). Each bed is a
// unit; stars earned persist anonymously in localStorage with a visible reset.

import { StarIcon, TreeArt } from '../../components/art';
import type { Lessons, PersonalState } from '../../lib/types';

export function HomeScreen({
  lessons,
  personal,
  onPick,
  onResetProgress,
}: {
  lessons: Lessons;
  personal: PersonalState;
  onPick: (unitIndex: number) => void;
  onResetProgress: () => void;
}): JSX.Element {
  return (
    <section className="app-screen home" aria-label="Chọn luống cây">
      <header className="home-hero">
        <h1>Khu vườn số học</h1>
        <p>Chọn một luống cây và bắt đầu gieo hạt nhé!</p>
      </header>

      <div className="beds" role="list">
        {lessons.units.map((unit, i) => {
          const stars = personal.stars[unit.id] ?? 0;
          return (
            <button
              key={unit.id}
              type="button"
              className="bed"
              role="listitem"
              onClick={() => onPick(i)}
              aria-label={`${unit.title}: ${unit.subtitle}. Đã đạt ${stars} trên ${unit.questions.length} ngôi sao.`}
            >
              <span className="bed-art" aria-hidden="true">
                <TreeArt variant={unit.emojiFreePlant} />
              </span>
              <span className="bed-body">
                <span className="bed-title">{unit.title}</span>
                <br />
                <span className="bed-sub">{unit.subtitle}</span>
                <span className="bed-meta">
                  <span className="bed-stars">
                    <StarIcon /> {stars}/{unit.questions.length}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <footer className="home-foot">
        <button type="button" className="foot-btn" onClick={onResetProgress}>
          Xoá tiến độ của tôi
        </button>
      </footer>
    </section>
  );
}
