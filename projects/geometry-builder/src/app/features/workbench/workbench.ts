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
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ShapeView } from '../../shared/shape-view';
import { fx, gsap } from '../../lib/gsap';
import { PROPERTY_LABELS } from '../../lib/data';
import {
  addPiece,
  bumpHint,
  canRedo,
  canUndo,
  computeOutline,
  createSession,
  dragPieceTo,
  endDrag,
  feedbackFor,
  matchesSlot,
  nextHintSlot,
  normalizeRot,
  nudgePiece,
  pieceAtPoint,
  placeFromTray,
  redo,
  removePiece,
  rotatePieceBy,
  selectPiece,
  selectTrayShape,
  snap,
  undo,
  validate,
  worldPolygon,
  type Mission,
  type Piece,
  type Pt,
  type Session,
  type ShapeDef,
  type ShapeMap,
  type Slot,
  type Validation,
} from './engine';

interface DragState {
  uid: string | null;
  offset: Pt;
  pendingTrayShape: string | null;
  started: boolean;
  startX: number;
  startY: number;
}

@Component({
  selector: 'app-workbench',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShapeView],
  templateUrl: './workbench.html',
  styleUrl: './workbench.css',
})
export class Workbench implements AfterViewInit {
  readonly mission = input.required<Mission>();
  readonly shapes = input.required<ShapeMap>();

  readonly exit = output<void>();
  readonly nextMission = output<void>();
  readonly missionComplete = output<string>();
  readonly reviewRequest = output<{ missionId: string; solved: Piece[] }>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly svgEl = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');
  private readonly hostEl = viewChild.required<ElementRef<HTMLElement>>('wbRoot');

  protected readonly session = linkedSignal<Session>(() => createSession(this.mission()));

  private readonly drag: DragState = { uid: null, offset: { x: 0, y: 0 }, pendingTrayShape: null, started: false, startX: 0, startY: 0 };
  private readonly tweens: gsap.core.Tween[] = [];

  protected readonly propertyLabels = PROPERTY_LABELS;

  // ---- derived state ------------------------------------------------------

  protected readonly validation = computed<Validation>(() =>
    validate(this.mission(), this.shapes(), this.session().pieces),
  );

  protected readonly locked = computed(() => this.session().status === 'complete');

  protected readonly selectedPiece = computed<Piece | null>(
    () => this.session().pieces.find((p) => p.uid === this.session().selectedUid) ?? null,
  );

  protected readonly inspectedShapeId = computed<string | null>(
    () => this.selectedPiece()?.shapeId ?? this.session().selectedTrayShape ?? null,
  );

  protected readonly inspectedShape = computed(
    () => (this.inspectedShapeId() ? this.shapes().get(this.inspectedShapeId()!) ?? null : null),
  );

  protected readonly inspectedPieceMatchesSlot = computed(() => {
    const piece = this.selectedPiece();
    if (!piece) return false;
    return this.mission().slots.some((s) => s.buildable && matchesSlot(this.shapes(), piece, s));
  });

  protected readonly hintSlot = computed<Slot | null>(() => {
    const s = this.session();
    return s.hintLevel > 0 && s.status === 'building' ? nextHintSlot(this.mission(), this.validation()) : null;
  });

  protected readonly trayEntries = computed(() =>
    this.mission().tray.map((t) => ({
      ...t,
      left: this.session().tray[t.shapeId] ?? 0,
      shape: this.shapes().get(t.shapeId) ?? null,
    })),
  );

  protected readonly selectedBrackets = computed<string[]>(() => {
    const piece = this.selectedPiece();
    if (!piece) return [];
    const poly = worldPolygon(this.shapes().get(piece.shapeId)!, piece.x, piece.y, piece.rot);
    return cornerBrackets(poly, 0.9);
  });

  protected readonly mirrorX = computed(
    () => this.mission().constraints.mirrorLine ?? this.mission().canvas.w / 2,
  );

  protected readonly scalebar = computed(() => {
    const h = this.mission().canvas.h;
    return {
      main: `M1 ${h - 1} L5 ${h - 1}`,
      t1: `M1 ${h - 1.4} L1 ${h - 0.6}`,
      t2: `M5 ${h - 1.4} L5 ${h - 0.6}`,
      textY: h - 1.7,
    };
  });

  /** Path data of the finished structure's silhouette (completion flash). */
  protected readonly completeOutlineD = computed<string | null>(() => {
    if (this.session().status !== 'complete') return null;
    const printed = this.mission()
      .slots.filter((s) => !s.buildable)
      .map((s, i) => ({ uid: `pr-${i}`, shapeId: s.shapeId, x: s.x, y: s.y, rot: s.rot }));
    const outline = computeOutline(this.shapes(), [...this.session().pieces, ...printed]);
    return outline.outer ? outline.outer.map((p, i) => `${i === 0 ? 'M' : 'L'} ${round(p.x)} ${round(p.y)}`).join(' ') + ' Z' : null;
  });

  protected canUndoNow(): boolean {
    return canUndo(this.session());
  }

  protected canRedoNow(): boolean {
    return canRedo(this.session());
  }

  protected angleList(shape: ShapeDef): string {
    return shape.properties.angles.map((a) => `${Math.round(a * 10) / 10}°`).join(' · ');
  }

  // ---- lifecycle ----------------------------------------------------------

  ngAfterViewInit(): void {
    const host = this.hostEl().nativeElement;
    const tween = fx.reveal(
      host.querySelectorAll('.slot, .printed-piece'),
      { opacity: 0, duration: 0.3 },
    );
    this.tweens.push(tween);
    this.destroyRef.onDestroy(() => this.tweens.forEach((t) => t.kill()));
  }

  // ---- helpers ------------------------------------------------------------

  protected shapePts(shapeId: string): string {
    const shape = this.shapes().get(shapeId);
    if (!shape) return '';
    return shape.pts.map((p) => `${round(p.x)},${round(p.y)}`).join(' ');
  }

  protected toWorld(clientX: number, clientY: number): Pt {
    const svg = this.svgEl().nativeElement;
    const rect = svg.getBoundingClientRect();
    const m = this.mission();
    return {
      x: ((clientX - rect.left) / Math.max(rect.width, 1)) * m.canvas.w,
      y: ((clientY - rect.top) / Math.max(rect.height, 1)) * m.canvas.h,
    };
  }

  private clampToWorld(p: Pt): Pt {
    const { w, h } = this.mission().canvas;
    return { x: Math.min(Math.max(p.x, 0), w), y: Math.min(Math.max(p.y, 0), h) };
  }

  protected pieceAria(p: Piece): string {
    const shape = this.shapes().get(p.shapeId);
    const onSlot = this.validation().unmatchedPieces.includes(p.uid) ? 'not on its outline yet' : 'locked on its outline';
    return `${shape?.label ?? p.shapeId}, column ${p.x}, row ${p.y}, rotation ${normalizeRot(p.rot)} degrees, ${onSlot}. Arrow keys move, R and E rotate, Delete returns it to the bin.`;
  }

  protected slotMatched(slot: Slot): boolean {
    return this.validation().slotMatch[slot.id] != null;
  }

  // ---- pointer interaction (drag is the mouse/touch path) ------------------

  protected onCanvasPointerDown(event: PointerEvent): void {
    if (this.locked()) return;
    const target = event.target as Element;
    const pieceG = target.closest?.('g.piece');
    const world = this.toWorld(event.clientX, event.clientY);
    if (pieceG) {
      const uid = pieceG.getAttribute('data-uid')!;
      const piece = this.session().pieces.find((p) => p.uid === uid);
      if (!piece) return;
      this.drag.uid = uid;
      this.drag.pendingTrayShape = null;
      this.drag.offset = { x: world.x - piece.x, y: world.y - piece.y };
      this.drag.started = true;
      (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
      this.session.update((s) => selectPiece(s, uid));
      return;
    }
    // Canvas background: select a piece under the point, or clear.
    const hit = pieceAtPoint(this.shapes(), this.session().pieces, world);
    this.session.update((s) => selectPiece(s, hit?.uid ?? null));
  }

  protected onCanvasPointerMove(event: PointerEvent): void {
    if (!this.drag.uid) return;
    const world = this.toWorld(event.clientX, event.clientY);
    const pos = this.clampToWorld({ x: world.x - this.drag.offset.x, y: world.y - this.drag.offset.y });
    this.session.update((s) => dragPieceTo(s, this.drag.uid!, pos.x, pos.y));
  }

  protected onCanvasPointerUp(event: PointerEvent): void {
    if (!this.drag.uid) return;
    const uid = this.drag.uid;
    this.drag.uid = null;
    const overTray = this.hostEl().nativeElement
      .querySelector('.tray')
      ?.contains(document.elementFromPoint(event.clientX, event.clientY));
    this.session.update((s) => endDrag(s, uid, !!overTray, this.shapes()));
    if (!overTray) this.settle(uid);
    else this.announceReturn(uid);
  }

  /** pointerdown on a tray piece: arm a drag-from-tray; a plain tap selects. */
  protected onTrayPointerDown(event: PointerEvent, shapeId: string): void {
    if (this.locked()) return;
    if ((this.session().tray[shapeId] ?? 0) <= 0) return;
    event.preventDefault();
    this.drag.pendingTrayShape = shapeId;
    this.drag.uid = null;
    this.drag.started = false;
    this.drag.startX = event.clientX;
    this.drag.startY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onTrayPointerMove(event: PointerEvent): void {
    const shapeId = this.drag.pendingTrayShape;
    if (!shapeId || this.drag.uid) return;
    if (Math.hypot(event.clientX - this.drag.startX, event.clientY - this.drag.startY) < 6) return;
    // Create the piece under the pointer and continue dragging it.
    const world = this.clampToWorld(this.toWorld(event.clientX, event.clientY));
    this.session.update((s) =>
      addPiece(s, this.shapes(), shapeId, snap(world.x), snap(world.y), 0),
    );
    const created = this.session().pieces[this.session().pieces.length - 1];
    this.drag.uid = created.uid;
    this.drag.offset = { x: 0, y: 0 };
    this.drag.started = true;
  }

  protected onTrayPointerUp(): void {
    const shapeId = this.drag.pendingTrayShape;
    this.drag.pendingTrayShape = null;
    if (this.drag.uid) {
      const uid = this.drag.uid;
      this.drag.uid = null;
      this.session.update((s) => endDrag(s, uid, false, this.shapes()));
      this.settle(uid);
      return;
    }
    if (shapeId) this.session.update((s) => selectTrayShape(s, shapeId));
  }

  protected onTrayKeyActivate(event: Event, shapeId: string): void {
    // Enter/Space on the tray button — the no-drag placement path.
    if (this.locked()) return;
    event.preventDefault();
    this.session.update((s) => placeFromTray(s, this.mission(), this.shapes(), shapeId));
    const created = this.session().pieces[this.session().pieces.length - 1];
    this.focusPiece(created?.uid);
  }

  // ---- keyboard on placed pieces ------------------------------------------

  protected onPieceKeydown(event: KeyboardEvent, uid: string): void {
    if (this.locked()) return;
    const step = event.shiftKey ? 4 : 1;
    const m = this.mission();
    switch (event.key) {
      case 'ArrowLeft':
        this.session.update((s) => nudgePiece(s, uid, -step, 0, m));
        break;
      case 'ArrowRight':
        this.session.update((s) => nudgePiece(s, uid, step, 0, m));
        break;
      case 'ArrowUp':
        this.session.update((s) => nudgePiece(s, uid, 0, -step, m));
        break;
      case 'ArrowDown':
        this.session.update((s) => nudgePiece(s, uid, 0, step, m));
        break;
      case 'r':
      case 'R':
        this.session.update((s) => rotatePieceBy(s, uid, 15));
        break;
      case 'e':
      case 'E':
        this.session.update((s) => rotatePieceBy(s, uid, -15));
        break;
      case 'Delete':
      case 'Backspace':
        this.session.update((s) => removePiece(s, uid, this.shapes()));
        break;
      default:
        return; // let everything else bubble (Tab etc.)
    }
    event.preventDefault();
  }

  // ---- inspector controls (single-pointer alternatives to dragging) --------

  protected moveSelected(dx: number, dy: number): void {
    const uid = this.session().selectedUid;
    if (!uid || this.locked()) return;
    this.session.update((s) => nudgePiece(s, uid, dx, dy, this.mission()));
  }

  protected rotateSelected(delta: number): void {
    const uid = this.session().selectedUid;
    if (!uid || this.locked()) return;
    this.session.update((s) => rotatePieceBy(s, uid, delta));
  }

  protected binSelected(): void {
    const uid = this.session().selectedUid;
    if (!uid || this.locked()) return;
    this.session.update((s) => removePiece(s, uid, this.shapes()));
  }

  protected placeInspected(): void {
    const shapeId = this.session().selectedTrayShape;
    if (!shapeId || this.locked()) return;
    this.session.update((s) => placeFromTray(s, this.mission(), this.shapes(), shapeId));
    const created = this.session().pieces[this.session().pieces.length - 1];
    this.focusPiece(created?.uid);
  }

  private focusPiece(uid: string | undefined): void {
    if (!uid) return;
    // setTimeout (not queueMicrotask): the piece element only exists after
    // change detection renders it, and microtasks run before that.
    setTimeout(() => {
      const el = this.hostEl().nativeElement.querySelector(`g.piece[data-uid="${uid}"]`) as SVGElement | null;
      el?.focus?.();
    }, 0);
  }

  // ---- toolbar ------------------------------------------------------------

  protected doUndo(): void {
    this.session.update((s) => undo(s));
  }

  protected doRedo(): void {
    this.session.update((s) => redo(s));
  }

  protected doHint(): void {
    this.session.update((s) => bumpHint(s));
    const s = this.session();
    if (s.hintLevel > 0) {
      const hint = this.mission().hints[s.hintLevel - 1] ?? '';
      this.session.update((st) => ({ ...st, feedback: { kind: 'info', text: `Hint ${s.hintLevel} of 3 — ${hint}` } }));
    }
  }

  protected doCheck(): void {
    const v = this.validation();
    if (v.complete) {
      this.session.update((s) => ({
        ...s,
        status: 'complete',
        selectedUid: null,
        selectedTrayShape: null,
        hintLevel: 0,
        feedback: feedbackFor(v, this.mission()),
      }));
      this.missionComplete.emit(this.mission().id);
      this.playCompletion();
      setTimeout(() => {
        this.hostEl().nativeElement.querySelector<HTMLButtonElement>('.cta-measure')?.focus();
      }, 0);
    } else {
      this.session.update((s) => ({ ...s, feedback: feedbackFor(v, this.mission()) }));
    }
  }

  protected buildAgain(): void {
    this.session.set(createSession(this.mission()));
  }

  protected goMeasure(): void {
    this.reviewRequest.emit({
      missionId: this.mission().id,
      solved: this.session().pieces.map((p) => ({ ...p })),
    });
  }

  // ---- motion (design §11) -------------------------------------------------

  private settle(uid: string): void {
    const el = this.hostEl().nativeElement.querySelector(`g.piece[data-uid="${uid}"] .shape-body`);
    if (!el) return;
    this.tweens.push(
      fx.to(el, { scale: 1.05, duration: 0.07, ease: 'power2.out' }, { scale: 1 }),
    );
    this.tweens.push(
      fx.to(el, { scale: 1, duration: 0.12, ease: 'power2.in' }, { scale: 1 }),
    );
  }

  private announceReturn(_uid: string): void {
    // feedback text is already set by endDrag — nothing visual needed here
  }

  private playCompletion(): void {
    const host = this.hostEl().nativeElement;
    const stamp = host.querySelector('.stamp');
    if (stamp) {
      if (!fx.prefersReducedMotion()) {
        this.tweens.push(
          gsap.fromTo(
            stamp,
            { scale: 1.7, rotate: 6, opacity: 0 },
            { scale: 1, rotate: -6, opacity: 1, duration: 0.7, ease: 'back.out(1.6)' },
          ),
        );
      } else {
        gsap.set(stamp, { scale: 1, rotate: -6, opacity: 1 });
      }
    }
    const outline = host.querySelector('.complete-outline');
    if (outline) {
      const path = outline as SVGPathElement;
      const len = path.getTotalLength?.() ?? 0;
      if (len > 0 && !fx.prefersReducedMotion()) {
        this.tweens.push(
          gsap.fromTo(
            path,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' },
          ),
        );
      }
    }
  }
}

// ---- pure helpers -----------------------------------------------------------

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Crop-mark bracket paths at the four corners of a polygon's bbox. */
function cornerBrackets(poly: Pt[], len: number): string[] {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const o = 0.35; // gap between bracket and bbox
  const L = len;
  return [
    bracket(minX - o, minY - o, 1, 1, L),
    bracket(maxX + o, minY - o, -1, 1, L),
    bracket(maxX + o, maxY + o, -1, -1, L),
    bracket(minX - o, maxY + o, 1, -1, L),
  ];
}

function bracket(x: number, y: number, sx: number, sy: number, len: number): string {
  return `M ${round(x + sx * len)} ${round(y)} L ${round(x)} ${round(y)} L ${round(x)} ${round(y + sy * len)}`;
}
