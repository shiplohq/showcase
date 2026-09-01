// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/**
 * Anonymous local progress (layer 3 of the state model). Stores only which
 * missions were completed / measured — never any personal data — and always
 * offers a reset (spec + pre-publish checklist).
 */

const STORAGE_KEY = 'gb.progress.v1';

export interface Progress {
  completed: string[];
  walked: string[];
}

const EMPTY: Progress = { completed: [], walked: [] };

function read(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter((x) => typeof x === 'string') : [],
      walked: Array.isArray(parsed.walked) ? parsed.walked.filter((x) => typeof x === 'string') : [],
    };
  } catch {
    // Private mode / storage disabled — degrade to in-memory (still playable).
    return { ...EMPTY };
  }
}

function write(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore — the app stays fully usable without persistence.
  }
}

export class ProgressStore {
  private progress: Progress = read();

  get snapshot(): Progress {
    return { ...this.progress };
  }

  isCompleted(missionId: string): boolean {
    return this.progress.completed.includes(missionId);
  }

  isWalked(missionId: string): boolean {
    return this.progress.walked.includes(missionId);
  }

  complete(missionId: string): void {
    if (!this.isCompleted(missionId)) {
      this.progress = { ...this.progress, completed: [...this.progress.completed, missionId] };
      write(this.progress);
    }
  }

  markWalked(missionId: string): void {
    if (!this.isWalked(missionId)) {
      this.progress = { ...this.progress, walked: [...this.progress.walked, missionId] };
      write(this.progress);
    }
  }

  reset(): void {
    this.progress = { ...EMPTY };
    write(this.progress);
  }
}
