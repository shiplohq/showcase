// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { fx } from '../../lib/gsap';
import type { Mission, ShapeMap, TrackId } from '../workbench/engine';
import type { Progress } from '../../lib/storage';

const TRACK_ORDER: TrackId[] = ['houses', 'bridges', 'robots'];

@Component({
  selector: 'app-lobby',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby implements AfterViewInit {
  readonly missions = input.required<Mission[]>();
  readonly shapes = input.required<ShapeMap>();
  readonly progress = input.required<Progress>();

  readonly startMission = output<string>();
  readonly openReview = output<string>();
  readonly resetProgress = output<void>();

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('lobbyRoot');
  protected readonly resetArmed = signal(false);

  ngAfterViewInit(): void {
    this.animateIn(this.root().nativeElement);
  }

  protected readonly trackLabels: Record<TrackId, string> = {
    houses: 'Houses',
    bridges: 'Bridges',
    robots: 'Robots',
  };

  protected readonly tracks = computed(() =>
    TRACK_ORDER.map((track) => ({
      track,
      missions: this.missions().filter((m) => m.track === track),
    })).filter((t) => t.missions.length > 0),
  );

  /** Slot polygons (world coords) for a mission's mini blueprint preview. */
  protected previewPolys(mission: Mission): { points: string; fill: string; printed: boolean }[] {
    return mission.slots.map((slot) => {
      const shape = this.shapes().get(slot.shapeId);
      if (!shape) return { points: '', fill: 'var(--fill-cobalt)', printed: false };
      const pts = shape.pts
        .map((p) => {
          const t = (slot.rot * Math.PI) / 180;
          const rx = p.x * Math.cos(t) - p.y * Math.sin(t);
          const ry = p.x * Math.sin(t) + p.y * Math.cos(t);
          return `${Math.round((rx + slot.x) * 100) / 100},${Math.round((ry + slot.y) * 100) / 100}`;
        })
        .join(' ');
      return { points: pts, fill: `var(--fill-${shape.fill})`, printed: !slot.buildable };
    });
  }

  protected isDone(missionId: string): boolean {
    return this.progress().completed.includes(missionId);
  }

  protected isWalked(missionId: string): boolean {
    return this.progress().walked.includes(missionId);
  }

  protected doneCount(): number {
    return this.progress().completed.length;
  }

  protected onReset(): void {
    if (this.resetArmed()) {
      this.resetProgress.emit();
      this.resetArmed.set(false);
    } else {
      this.resetArmed.set(true);
      // Disarm if the user walks away (no confirmation dialog for kids).
      setTimeout(() => this.resetArmed.set(false), 4000);
    }
  }

  /** Entrance stagger for the sheet tabs (skipped under reduced motion). */
  protected animateIn(el: HTMLElement): void {
    fx.reveal(el.querySelectorAll('.mission-tab'), { opacity: 0, y: 8, duration: 0.28 });
  }
}
