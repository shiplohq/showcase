// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Clue docket — three clue levels that open gradually (level n unlocks after
// n-1). Opening a clue never punishes; the count is shown in mono metadata.

import { ClueIcon } from '../../components/art';
import { clueVisible } from '../investigation/engine';

interface Props {
  clues: string[];
  mask: number;
  onOpen: (level: 1 | 2 | 3) => void;
}

const LEVELS: Array<1 | 2 | 3> = [1, 2, 3];

export function ClueDocket({ clues, mask, onOpen }: Props) {
  return (
    <div>
      <div className="clue-docket" role="group" aria-label="Clue envelope — three levels, opened one at a time">
        {LEVELS.map((level) => {
          const open = clueVisible(mask, level);
          const locked = level > 1 && !clueVisible(mask, (level - 1) as 1 | 2);
          return (
            <button
              type="button"
              key={level}
              className="clue-btn"
              disabled={locked}
              aria-expanded={open}
              onClick={() => {
                if (!open) onOpen(level);
              }}
            >
              <ClueIcon width={16} height={16} />
              {open
                ? `Clue ${level} of 3 — open`
                : locked
                  ? `Clue ${level} of 3 — locked`
                  : `Open clue ${level} of 3`}
              {locked ? (
                <span className="visually-hidden">— unlocks after clue {level - 1} is opened</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {LEVELS.filter((l) => clueVisible(mask, l)).map((level) => (
          <div className="clue-strip" key={level}>
            <ClueIcon width={20} height={20} />
            <div>
              <span className="meta-tag">Clue {level} of 3</span>
              <p>{clues[level - 1]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
