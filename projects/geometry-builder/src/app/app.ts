// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Lobby } from './features/lobby/lobby';
import { Workbench } from './features/workbench/workbench';
import { Review } from './features/review/review';
import { ContentStore } from './lib/data';
import { ProgressStore } from './lib/storage';
import type { Mission, Piece } from './features/workbench/engine';

type Screen =
  | { name: 'lobby' }
  | { name: 'workbench'; missionId: string }
  | { name: 'review'; missionId: string; solved: Piece[] };

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Lobby, Workbench, Review],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly contentStore = new ContentStore();
  private readonly progressStore = new ProgressStore();

  protected readonly content = this.contentStore.state;
  protected readonly screen = signal<Screen>({ name: 'lobby' });
  protected readonly progressView = signal(this.progressStore.snapshot);

  constructor() {
    void this.contentStore.init();
  }

  protected get data() {
    return this.content().data;
  }

  protected startMission(missionId: string): void {
    this.screen.set({ name: 'workbench', missionId });
  }

  protected onMissionComplete(missionId: string): void {
    this.progressStore.complete(missionId);
    this.progressView.set(this.progressStore.snapshot);
  }

  protected onReviewRequest(payload: { missionId: string; solved: Piece[] }): void {
    this.progressStore.complete(payload.missionId);
    this.progressView.set(this.progressStore.snapshot);
    this.screen.set({ name: 'review', missionId: payload.missionId, solved: payload.solved });
  }

  protected onWalked(missionId: string): void {
    this.progressStore.markWalked(missionId);
    this.progressView.set(this.progressStore.snapshot);
  }

  /** Reopen measurement review for an already-completed mission. */
  protected reopenReview(missionId: string): void {
    const mission = this.data?.missions.find((m) => m.id === missionId);
    if (!mission) return;
    const solved = mission.slots
      .filter((s) => s.buildable)
      .map((s, i) => ({ uid: `solved-${i}`, shapeId: s.shapeId, x: s.x, y: s.y, rot: s.rot }));
    this.screen.set({ name: 'review', missionId, solved });
  }

  protected backToLobby(): void {
    this.screen.set({ name: 'lobby' });
  }

  protected nextBlueprint(): void {
    const missions = this.data?.missions ?? [];
    const s = this.screen();
    const current = s.name === 'review' || s.name === 'workbench' ? s.missionId : '';
    const idx = missions.findIndex((m) => m.id === current);
    const next = missions[(idx + 1) % Math.max(missions.length, 1)];
    if (next) this.screen.set({ name: 'workbench', missionId: next.id });
    else this.screen.set({ name: 'lobby' });
  }

  protected resetProgress(): void {
    this.progressStore.reset();
    this.progressView.set(this.progressStore.snapshot);
  }

  /** Narrowed helpers for the template (unions are not narrowed by @switch). */
  protected wbMission(): Mission | null {
    const s = this.screen();
    if (s.name !== 'workbench') return null;
    return this.data?.missions.find((m) => m.id === s.missionId) ?? null;
  }

  protected rvMission(): Mission | null {
    const s = this.screen();
    if (s.name !== 'review') return null;
    return this.data?.missions.find((m) => m.id === s.missionId) ?? null;
  }

  protected rvSolved(): Piece[] {
    const s = this.screen();
    return s.name === 'review' ? s.solved : [];
  }
}
