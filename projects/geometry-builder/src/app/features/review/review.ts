// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ShapeView } from '../../shared/shape-view';
import { fx, gsap, MotionPathPlugin } from '../../lib/gsap';
import {
  computeOutline,
  formatLength,
  initialWalk,
  interiorAngleAt,
  isRightAngle,
  measureEdge,
  walkEdges,
  worldPolygon,
  type Mission,
  type Piece,
  type Pt,
  type ShapeMap,
} from '../workbench/engine';

interface EdgeView {
  index: number;
  a: Pt;
  b: Pt;
  length: number;
  mid: Pt;
  labelX: number;
  labelY: number;
  angleDeg: number;
  ticks: number; // parallel-group tick marks (0 = ungrouped)
}

@Component({
  selector: 'app-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShapeView],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review implements AfterViewInit {
  readonly mission = input.required<Mission>();
  readonly shapes = input.required<ShapeMap>();
  readonly solved = input.required<Piece[]>();

  readonly exit = output<void>();
  readonly nextMission = output<void>();
  readonly walked = output<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly svgEl = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');
  private readonly hostEl = viewChild.required<ElementRef<HTMLElement>>('rvRoot');
  private readonly tweens: gsap.core.Tween[] = [];

  /** The finished structure: solved pieces + printed pieces. */
  protected readonly structure = computed<Piece[]>(() => {
    const printed = this.mission()
      .slots.filter((s) => !s.buildable)
      .map((s, i) => ({ uid: `pr-${i}`, shapeId: s.shapeId, x: s.x, y: s.y, rot: s.rot }));
    return [...this.solved(), ...printed];
  });

  private readonly outline = computed(() => computeOutline(this.shapes(), this.structure()));

  protected readonly edges = computed<EdgeView[]>(() => {
    const outer = this.outline().outer;
    if (!outer) return [];
    const walk = walkEdges(outer);
    const groups = parallelGroups(walk.edges.map((e) => ({ dx: e.b.x - e.a.x, dy: e.b.y - e.a.y })));
    return walk.edges.map((e, i) => {
      const len = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
      // label sits outside the shape, offset along the outward normal
      const nx = (e.b.y - e.a.y) / len;
      const ny = -(e.b.x - e.a.x) / len;
      const m = { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2 };
      const centroid = polyCentroid(outer);
      const out = (m.x - centroid.x) * nx + (m.y - centroid.y) * ny >= 0 ? 1 : -1;
      return {
        index: i,
        a: e.a,
        b: e.b,
        length: e.length,
        mid: m,
        labelX: m.x + nx * out * 1.1,
        labelY: m.y + ny * out * 1.1,
        angleDeg: r3((Math.atan2(e.b.y - e.a.y, e.b.x - e.a.x) * 180) / Math.PI),
        ticks: groups[i] ?? 0,
      };
    });
  });

  protected readonly walk = computed(() => {
    const w = this.walkState();
    const edges = this.edges();
    const total = w.measured.reduce((sum, i) => sum + (edges[i]?.length ?? 0), 0);
    return { measured: w.measured, total, complete: edges.length > 0 && w.measured.length === edges.length };
  });
  private readonly walkState = signal(initialWalk(0));

  protected readonly perimeterTotal = computed(() =>
    this.edges().reduce((s, e) => s + e.length, 0),
  );

  /** Right-angle marks at 90° corners of the silhouette. */
  protected readonly rightAngleMarks = computed(() => {
    const outer = this.outline().outer;
    if (!outer) return [];
    const marks: { path: string; x: number; y: number }[] = [];
    for (let i = 0; i < outer.length; i++) {
      if (!isRightAngle(interiorAngleAt(outer, i))) continue;
      const prev = outer[(i - 1 + outer.length) % outer.length];
      const v = outer[i];
      const next = outer[(i + 1) % outer.length];
      const u = unit({ x: prev.x - v.x, y: prev.y - v.y });
      const w = unit({ x: next.x - v.x, y: next.y - v.y });
      const k = 0.55;
      const p1 = { x: v.x + u.x * k, y: v.y + u.y * k };
      const p2 = { x: v.x + (u.x + w.x) * k, y: v.y + (u.y + w.y) * k };
      const p3 = { x: v.x + w.x * k, y: v.y + w.y * k };
      marks.push({
        path: `M ${r3(p1.x)} ${r3(p1.y)} L ${r3(p2.x)} ${r3(p2.y)} L ${r3(p3.x)} ${r3(p3.y)}`,
        x: v.x,
        y: v.y,
      });
    }
    return marks;
  });

  protected readonly angleSummary = computed(() => {
    const outer = this.outline().outer;
    if (!outer) return '';
    const right = outer.filter((_, i) => isRightAngle(interiorAngleAt(outer, i))).length;
    const total = outer.length;
    return `${total} sides · ${right} right angles · interior angles sum ${(total - 2) * 180}°`;
  });

  ngAfterViewInit(): void {
    const host = this.hostEl().nativeElement;
    this.tweens.push(
      fx.reveal(
        host.querySelectorAll('.rv-edge-btn'),
        { opacity: 0, y: 6, duration: 0.25 },
      ),
    );
    this.destroyRef.onDestroy(() => this.tweens.forEach((t) => t.kill()));
  }

  protected shapePts(shapeId: string): string {
    const shape = this.shapes().get(shapeId);
    if (!shape) return '';
    return shape.pts.map((p) => `${r3(p.x)},${r3(p.y)}`).join(' ');
  }

  protected isMeasured(index: number): boolean {
    return this.walkState().measured.includes(index);
  }

  protected measure(index: number): void {
    if (this.isMeasured(index)) return;
    const edges = this.edges();
    const prev = this.walkState();
    const next = measureEdge({ measured: prev.measured, total: 0, complete: false }, index, edges);
    this.walkState.set(next);
    this.tracer(index);
    if (next.measured.length === edges.length) {
      this.walked.emit(this.mission().id);
      setTimeout(() => {
        this.hostEl().nativeElement.querySelector<HTMLButtonElement>('.cta-next')?.focus();
      }, 0);
    }
  }

  /** Measuring-tape marker travels the freshly measured edge (design §11). */
  private tracer(index: number): void {
    const edge = this.edges()[index];
    const marker = this.svgEl().nativeElement.querySelector('.walk-marker');
    if (!marker || !edge || fx.prefersReducedMotion()) return;
    gsap.set(marker, { opacity: 1 });
    this.tweens.push(
      gsap.to(marker, {
        motionPath: {
          path: [
            { x: edge.a.x, y: edge.a.y },
            { x: edge.b.x, y: edge.b.y },
          ],
        },
        duration: 0.28,
        ease: 'power1.inOut',
        onComplete: () => gsap.set(marker, { opacity: 0 }),
      }),
    );
  }

  protected resetWalk(): void {
    this.walkState.set({ measured: [], total: 0, complete: false });
  }

  protected tickArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  protected formatLength(len: number): string {
    return formatLength(len);
  }

  /** One crossing stroke of a parallel-pair tick mark (edge-local coords). */
  protected tickPath(i: number, count: number): string {
    const x = (i - (count - 1) / 2) * 0.55;
    return `M ${r3(x)} -0.5 L ${r3(x)} 0.5`;
  }
}

// ---- helpers ------------------------------------------------------------------

function r3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function unit(v: Pt): Pt {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
}

function polyCentroid(poly: Pt[]): Pt {
  const sum = poly.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / poly.length, y: sum.y / poly.length };
}

/** Assign tick-mark counts to edges that belong to a parallel group (≥2). */
function parallelGroups(dirs: { dx: number; dy: number }[]): Record<number, number> {
  const result: Record<number, number> = {};
  const buckets = new Map<string, number[]>();
  dirs.forEach((d, i) => {
    const ang = Math.atan2(d.dy, d.dx);
    // same direction modulo 180°
    const key = Math.round(((ang % Math.PI) + Math.PI) % Math.PI * 10) / 10 + '';
    const list = buckets.get(key) ?? [];
    list.push(i);
    buckets.set(key, list);
  });
  let tick = 0;
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    tick += 1;
    for (const i of list) result[i] = tick;
  }
  return result;
}
