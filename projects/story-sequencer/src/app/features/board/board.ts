// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FrameScene } from '../../shared/frame-scene';
import { Flip, fx, prefersReducedMotion } from '../../lib/gsap';
import { ProgressStore } from '../../lib/storage';
import {
  evaluate,
  isLinkCanonical,
  panelById,
  shuffleOrder,
  type Link,
  type PanelDef,
  type Story,
  type Verdict,
} from './engine';

export type Step = 'order' | 'link' | 'title' | 'check';

interface Connector {
  key: string;
  d: string;
  halo: string;
  midX: number;
  midY: number;
  from: string;
  to: string;
  fresh: boolean;
}

interface FlashPath {
  d: string;
  halo: string;
}

const STEP_ORDER: Step[] = ['order', 'link', 'title', 'check'];

@Component({
  selector: 'app-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FrameScene],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board implements AfterViewInit, OnDestroy {
  readonly story = input.required<Story>();
  readonly nextStory = input<Story | null>(null);
  readonly openStory = output<string>();
  readonly exit = output<void>();
  readonly storyCompleted = output<void>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly injector = inject(Injector);
  private readonly progress = new ProgressStore();

  private readonly gridRef = viewChild<ElementRef<HTMLElement>>('grid');

  // --- session state ------------------------------------------------------
  readonly step = signal<Step>('order');
  readonly order = signal<string[]>([]);
  readonly links = signal<Link[]>([]);
  readonly cause = signal<string | null>(null);
  readonly titleId = signal<string | null>(null);
  readonly hint = signal(false);
  readonly verdict = signal<Verdict | null>(null);
  readonly celebrate = signal(false);
  readonly reflectionChoice = signal<string | null>(null);
  readonly announceText = signal('');
  readonly wrongFlash = signal<FlashPath | null>(null);
  readonly wrongMsg = signal<string | null>(null);
  readonly draggingId = signal<string | null>(null);
  readonly dropTarget = signal<string | null>(null);
  readonly connectors = signal<Connector[]>([]);

  private resizeObserver: ResizeObserver | null = null;
  private windowListeners: Array<[string, EventListener]> = [];
  private celebrateFired = false;
  private lastAddedLink: string | null = null;
  private announceTimer: ReturnType<typeof setTimeout> | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private msgTimer: ReturnType<typeof setTimeout> | null = null;

  // --- derived ------------------------------------------------------------
  readonly panelMap = computed(() => {
    const m = new Map<string, PanelDef>();
    for (const p of this.story().panels) m.set(p.id, p);
    return m;
  });
  readonly orderedPanels = computed(() =>
    this.order()
      .map((id) => this.panelMap().get(id))
      .filter((p): p is PanelDef => !!p),
  );
  readonly stepIndex = computed(() => STEP_ORDER.indexOf(this.step()));
  readonly linkCount = computed(() => this.links().length);
  readonly linkTotal = computed(() => this.story().causalLinks.length);
  readonly chosenTitle = computed(() => this.story().titles.find((t) => t.id === this.titleId()) ?? null);
  readonly chosenReflection = computed(
    () => this.story().reflection.options.find((o) => o.id === this.reflectionChoice()) ?? null,
  );

  private currentStoryId: string | null = null;

  constructor() {
    // Session follows the story input: navigating to another issue (hash
    // change reuses this component instance) must reset the whole session.
    effect(() => {
      const story = this.story();
      if (this.currentStoryId === story.id) return;
      this.currentStoryId = story.id;
      this.resetSession(story);
    });
    // Recompute connector geometry whenever the inputs to it change.
    effect(() => {
      void this.links();
      void this.step();
      void this.order();
      void this.wrongFlash();
      const link = this.lastAddedLink;
      afterNextRender(
        () => {
          this.measureConnectors(link);
          this.lastAddedLink = null;
        },
        { injector: this.injector },
      );
    });
  }

  private resetSession(story: Story): void {
    this.step.set('order');
    this.order.set(shuffleOrder(story));
    this.links.set([]);
    this.cause.set(null);
    this.titleId.set(null);
    this.hint.set(false);
    this.verdict.set(null);
    this.celebrate.set(false);
    this.reflectionChoice.set(null);
    this.celebrateFired = false;
    this.lastAddedLink = null;
    this.announce(`Issue ${story.issueNo} opened. ${story.panels.length} panels to put in order.`);
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') return;
    const grid = this.gridRef()?.nativeElement;
    if (grid) {
      this.resizeObserver = new ResizeObserver(() => this.measureConnectors(null));
      this.resizeObserver.observe(grid);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.detachWindowListeners();
    if (this.announceTimer) clearTimeout(this.announceTimer);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    if (this.msgTimer) clearTimeout(this.msgTimer);
  }

  // -----------------------------------------------------------------------
  // Announcements (aria-live)
  // -----------------------------------------------------------------------

  announce(text: string): void {
    // Small debounce so consecutive moves read as one update.
    if (this.announceTimer) clearTimeout(this.announceTimer);
    this.announceTimer = setTimeout(() => this.announceText.set(text), 80);
  }

  private shortCaption(id: string): string {
    const cap = this.panelMap().get(id)?.caption ?? '';
    return cap.length > 42 ? `${cap.slice(0, 42)}…` : cap;
  }

  // -----------------------------------------------------------------------
  // Order step
  // -----------------------------------------------------------------------

  captionBody(panel: PanelDef): SafeHtml {
    // Highlight the temporal clue words only when hint mode is on (spec:
    // the hint emphasises temporal clues in the text and nothing else).
    if (!this.hint() || panel.timeClues.length === 0) {
      return this.sanitizer.bypassSecurityTrustHtml(escapeHtml(panel.caption));
    }
    let html = escapeHtml(panel.caption);
    for (const clue of panel.timeClues) {
      if (!clue) continue;
      const needle = escapeHtml(clue).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(needle, 'g'), (m) => `<mark class="clue">${m}</mark>`);
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private flipAfter(mutate: () => void): void {
    const grid = this.gridRef()?.nativeElement;
    const state =
      grid && !prefersReducedMotion() ? Flip.getState(grid.querySelectorAll('.panel')) : null;
    mutate();
    if (state) {
      afterNextRender(
        () => {
          Flip.from(state, {
            targets: state.targets,
            duration: 0.28,
            ease: 'power2.out',
            absolute: true,
          });
        },
        { injector: this.injector },
      );
    }
  }

  movePanelAt(index: number, delta: number): void {
    const order = this.order();
    const to = index + delta;
    if (to < 0 || to >= order.length) return;
    const id = order[index];
    this.flipAfter(() => {
      const next = order.slice();
      next.splice(index, 1);
      next.splice(to, 0, id);
      this.order.set(next);
    });
    this.announce(`Panel ${to + 1} of ${order.length}. ${this.shortCaption(id)}`);
  }

  movePanel(id: string, delta: number): void {
    this.movePanelAt(this.order().indexOf(id), delta);
  }

  onPanelKey(event: KeyboardEvent, index: number, id: string): void {
    const step = this.step();
    if (step === 'order') {
      const order = this.order();
      let handled = true;
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          this.movePanelAt(index, -1);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          this.movePanelAt(index, 1);
          break;
        case 'Home':
          this.movePanelAt(index, -index);
          break;
        case 'End':
          this.movePanelAt(index, order.length - 1 - index);
          break;
        default:
          handled = false;
      }
      if (handled) event.preventDefault();
      return;
    }
    if (step === 'link' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.onPanelActivate(id);
    }
  }

  // --- pointer drag (from the panel handle strip; buttons stay clickable) ---

  onHandlePointerDown(event: PointerEvent, id: string): void {
    if (this.step() !== 'order') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture?.(event.pointerId);
    this.draggingId.set(id);
    this.announce(`Lifting panel. ${this.shortCaption(id)}`);

    const onMove = (ev: PointerEvent) => {
      this.dropTarget.set(this.panelUnderPoint(ev.clientX, ev.clientY, id));
    };
    const onUp = (ev: PointerEvent) => {
      this.detachWindowListeners();
      const targetId = this.panelUnderPoint(ev.clientX, ev.clientY, id);
      this.draggingId.set(null);
      this.dropTarget.set(null);
      if (targetId && targetId !== id) {
        const from = this.order().indexOf(id);
        const to = this.order().indexOf(targetId);
        // splice-based move: removing first shifts the target by one when
        // moving down, so a raw delta lands the panel exactly on the target.
        this.movePanelAt(from, to - from);
      }
    };
    const onCancel = () => {
      this.detachWindowListeners();
      this.draggingId.set(null);
      this.dropTarget.set(null);
    };
    this.attachWindowListeners(onMove, onUp, onCancel, event.pointerId, handle);
  }

  private panelUnderPoint(x: number, y: number, excludeId: string): string | null {
    const grid = this.gridRef()?.nativeElement;
    if (!grid) return null;
    const dragged = grid.querySelector(`[data-panel-id="${excludeId}"]`);
    dragged?.classList.add('ss-point-none');
    const el = document.elementFromPoint(x, y)?.closest('[data-panel-id]');
    dragged?.classList.remove('ss-point-none');
    const id = el?.getAttribute('data-panel-id');
    return id && id !== excludeId ? id : null;
  }

  private attachWindowListeners(
    onMove: (ev: PointerEvent) => void,
    onUp: (ev: PointerEvent) => void,
    onCancel: () => void,
    pointerId: number,
    handle: HTMLElement,
  ): void {
    const move = (ev: Event) => onMove(ev as PointerEvent);
    const up = (ev: Event) => onUp(ev as PointerEvent);
    const cancel = () => onCancel();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    // pointer capture on the handle routes pointerup there — also observe it.
    handle.addEventListener('pointerup', up);
    this.windowListeners = [
      ['pointermove', move],
      ['pointerup', up],
      ['pointercancel', cancel],
    ];
    this.capturedHandle = { el: handle, pointerId, up };
  }

  private capturedHandle: { el: HTMLElement; pointerId: number; up: EventListener } | null = null;

  private detachWindowListeners(): void {
    for (const [name, fn] of this.windowListeners) {
      window.removeEventListener(name, fn);
    }
    this.windowListeners = [];
    if (this.capturedHandle) {
      this.capturedHandle.el.removeEventListener('pointerup', this.capturedHandle.up);
      this.capturedHandle = null;
    }
  }

  toggleHint(): void {
    this.hint.set(!this.hint());
    this.announce(
      this.hint()
        ? 'Time clues underlined in each panel.'
        : 'Time clues hidden again.',
    );
  }

  // -----------------------------------------------------------------------
  // Link step
  // -----------------------------------------------------------------------

  onPanelActivate(id: string): void {
    if (this.step() !== 'link') return;
    if (this.cause() === null) {
      this.cause.set(id);
      this.announce(`Cause chosen. ${this.shortCaption(id)} Now choose what it makes happen.`);
      return;
    }
    if (this.cause() === id) {
      this.cause.set(null);
      this.announce('Cause unselected.');
      return;
    }
    const from = this.cause();
    if (from !== null) this.attemptLink(from, id);
  }

  private attemptLink(from: string, to: string): void {
    if (isLinkCanonical(this.story(), from, to)) {
      this.lastAddedLink = `${from}→${to}`;
      this.links.update((l) => [...l, { from, to }]);
      this.cause.set(null);
      this.wrongMsg.set(null);
      this.announce(`Cause and effect connected. ${this.links().length} of ${this.linkTotal()} done.`);
    } else {
      // Non-punitive: the pencil line wobbles and lifts away again — and the
      // reason is VISIBLE copy, never motion-only (DESIGN §9/§12).
      this.wrongFlash.set(this.temporaryPath(from, to) ?? { d: '', halo: '' });
      this.cause.set(null);
      this.wrongMsg.set('That pair does not match. Think: what made it happen?');
      this.announce('That pair does not match. Think: what made it happen?');
      if (this.flashTimer) clearTimeout(this.flashTimer);
      this.flashTimer = setTimeout(() => this.wrongFlash.set(null), 700);
      if (this.msgTimer) clearTimeout(this.msgTimer);
      this.msgTimer = setTimeout(() => this.wrongMsg.set(null), 2600);
    }
  }

  private temporaryPath(from: string, to: string): { d: string; halo: string } | null {
    const grid = this.gridRef()?.nativeElement;
    if (!grid) return null;
    const a = grid.querySelector(`[data-panel-id="${from}"]`);
    const b = grid.querySelector(`[data-panel-id="${to}"]`);
    if (!a || !b) return null;
    const ports = portsBetween(a as HTMLElement, b as HTMLElement, grid);
    if (!ports) return null;
    return { d: curveBetween(ports.from, ports.to), halo: curveBetween(ports.from, ports.to) };
  }

  removeLinkByKey(from: string, to: string): void {
    this.links.update((l) => l.filter((x) => !(x.from === from && x.to === to)));
    this.announce('Connection removed.');
  }

  /** Links a panel takes part in — rendered as removable chips in its bar. */
  linksFor(id: string): Array<{ from: string; to: string; role: 'cause' | 'effect' }> {
    return this.links()
      .filter((l) => l.from === id || l.to === id)
      .map((l) => ({ from: l.from, to: l.to, role: l.from === id ? ('cause' as const) : ('effect' as const) }));
  }

  isEndpoint(id: string): 'cause' | 'effect' | 'both' | null {
    let cause = false;
    let effect = false;
    for (const l of this.links()) {
      if (l.from === id) cause = true;
      if (l.to === id) effect = true;
    }
    return cause && effect ? 'both' : cause ? 'cause' : effect ? 'effect' : null;
  }

  // --- connector geometry ---------------------------------------------------

  private measureConnectors(freshKey: string | null): void {
    const grid = this.gridRef()?.nativeElement;
    if (!grid) {
      this.connectors.set([]);
      return;
    }
    const conns: Connector[] = this.links().map((l) => {
      const a = grid.querySelector(`[data-panel-id="${l.from}"]`);
      const b = grid.querySelector(`[data-panel-id="${l.to}"]`);
      if (!a || !b) {
        return { key: `${l.from}→${l.to}`, d: '', halo: '', midX: 0, midY: 0, from: l.from, to: l.to, fresh: false };
      }
      const p1 = portsBetween(a as HTMLElement, b as HTMLElement, grid);
      if (!p1) {
        return { key: `${l.from}→${l.to}`, d: '', halo: '', midX: 0, midY: 0, from: l.from, to: l.to, fresh: false };
      }
      const { from, to } = p1;
      return {
        key: `${l.from}→${l.to}`,
        d: curveBetween(from, to),
        halo: curveBetween(from, to),
        midX: (from.x + to.x) / 2,
        midY: (from.y + to.y) / 2,
        from: l.from,
        to: l.to,
        fresh: freshKey === `${l.from}→${l.to}`,
      };
    });
    this.connectors.set(conns);
    const fresh = conns.filter((c) => c.fresh);
    if (fresh.length > 0 && this.step() === 'link') {
      afterNextRender(
        () => {
          const grid2 = this.gridRef()?.nativeElement;
          if (!grid2) return;
          const paths = grid2.querySelectorAll<SVGPathElement>('.connector__path.connector--fresh');
          fx.drawPath(paths, 0.35);
          paths.forEach((p) => p.classList.remove('connector--fresh'));
        },
        { injector: this.injector },
      );
    }
  }

  // -----------------------------------------------------------------------
  // Title step
  // -----------------------------------------------------------------------

  chooseTitle(id: string): void {
    this.titleId.set(id);
    const t = this.story().titles.find((x) => x.id === id);
    this.announce(`Title chosen: ${t?.text ?? ''}`);
  }

  onTitleKeydown(event: KeyboardEvent): void {
    const options = this.story().titles;
    const current = this.titleId();
    const idx = options.findIndex((t) => t.id === current);
    let next = -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (idx + 1 + options.length) % options.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (idx - 1 + options.length) % options.length;
    else return;
    event.preventDefault();
    this.chooseTitle(options[next].id);
    afterNextRender(
      () => {
        document.querySelector<HTMLButtonElement>(`[data-title-id="${options[next].id}"]`)?.focus();
      },
      { injector: this.injector },
    );
  }

  // -----------------------------------------------------------------------
  // Check / verdict / reflection
  // -----------------------------------------------------------------------

  check(): void {
    this.verdict.set(evaluate(this.story(), this.order(), this.links(), this.titleId()));
    this.step.set('check');
    const v = this.verdict();
    if (v?.allOk) {
      if (!this.celebrateFired) {
        this.celebrateFired = true;
        this.progress.complete(this.story().id);
        this.storyCompleted.emit();
      }
      this.celebrate.set(true);
      this.announce('Sequenced! Order, links and title all check out.');
    } else {
      this.announce('Checked. Some parts still want another look.');
    }
    // Timeline explanation (spec): the ink line runs through the stops in the
    // chosen order, then the numbered stops pop in sequence. Reduced motion:
    // CSS shows the final state directly.
    afterNextRender(
      () => {
        const board = document.querySelector('.board');
        if (!board) return;
        const line = board.querySelector('.timeline__line');
        if (line) fx.to(line, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, { scaleX: 1 });
        const stops = board.querySelectorAll('.stop__chip');
        if (stops.length > 0) fx.reveal(stops, { scale: 0.4, transformOrigin: 'center' });
        const stars = board.querySelectorAll('.celebrate__star');
        if (stars.length > 0) {
          fx.reveal(stars, { scale: 0, rotation: -30, transformOrigin: 'center' });
        }
        const stamp = board.querySelector('.celebrate__stamp');
        if (stamp) fx.to(stamp, { scale: 1, duration: 0.34, ease: 'back.out(2)' }, { scale: 1 });
      },
      { injector: this.injector },
    );
    this.focusHeading();
  }

  fixOrder(): void {
    this.step.set('order');
    this.verdict.set(null);
    this.focusHeading();
  }

  fixLinks(): void {
    this.step.set('link');
    this.verdict.set(null);
    this.focusHeading();
  }

  fixTitle(): void {
    this.step.set('title');
    this.verdict.set(null);
    this.focusHeading();
  }

  gotoStep(step: Step): void {
    const target = STEP_ORDER.indexOf(step);
    if (target > this.stepIndex()) return; // forward only through the CTAs
    this.step.set(step);
    if (step !== 'check') this.verdict.set(null);
    this.focusHeading();
  }

  /** Forward navigation from the step CTAs (order → link → title → check). */
  advance(step: Step): void {
    this.step.set(step);
    if (step !== 'check') this.verdict.set(null);
    this.focusHeading();
  }

  readonly stepChips: Array<{ id: Step; label: string }> = [
    { id: 'order', label: 'Order' },
    { id: 'link', label: 'Link' },
    { id: 'title', label: 'Title' },
    { id: 'check', label: 'Check' },
  ];

  private focusHeading(): void {
    afterNextRender(
      () => {
        document.querySelector<HTMLElement>('[data-step-heading]')?.focus();
      },
      { injector: this.injector },
    );
  }

  chooseReflection(id: string): void {
    this.reflectionChoice.set(id);
    const opt = this.story().reflection.options.find((o) => o.id === id);
    this.announce(opt ? `${opt.text}. ${opt.explanation}` : 'Reflection chosen.');
  }

  onReflectionKeydown(event: KeyboardEvent): void {
    const options = this.story().reflection.options;
    const idx = options.findIndex((o) => o.id === this.reflectionChoice());
    let next = -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (idx + 1) % options.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (idx - 1 + options.length) % options.length;
    else return;
    event.preventDefault();
    this.chooseReflection(options[next].id);
    afterNextRender(
      () => {
        document.querySelector<HTMLButtonElement>(`[data-reflection-id="${options[next].id}"]`)?.focus();
      },
      { injector: this.injector },
    );
  }

  nextIssue(): void {
    const n = this.nextStory();
    if (n) this.openStory.emit(n.id);
    else this.exit.emit();
  }

  panelSummary(id: string): string {
    return this.shortCaption(id);
  }

  /**
   * Timeline stop label — the temporal clue is the recap we want kids to
   * re-read (the full caption lives on the panel itself). Panels without a
   * clue get a short word-boundary snippet; nothing ever truncates mid-word.
   */
  timelineLabel(panel: PanelDef): string {
    const clue = panel.timeClues[0];
    if (clue) return clue;
    const words = panel.caption.split(' ');
    const out: string[] = [];
    for (const w of words) {
      if ((out.join(' ') + ' ' + w).trim().length > 24) break;
      out.push(w);
    }
    return out.join(' ');
  }

  positionOf(id: string): number {
    return this.order().indexOf(id) + 1;
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function centerOf(el: HTMLElement, container: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
}

interface Pt {
  x: number;
  y: number;
}

interface RelRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Connector ports: where the center-to-center line exits the cause panel's
 * border and enters the effect panel's border (plus a small outward offset).
 * Connectors therefore start/end at panel EDGES — they never spear the art or
 * captions (impeccable Assessment A, P1).
 */
function portsBetween(
  a: HTMLElement,
  b: HTMLElement,
  container: HTMLElement,
): { from: Pt; to: Pt } | null {
  const ac = centerOf(a, container);
  const bc = centerOf(b, container);
  const off = (el: HTMLElement): RelRect => {
    const r = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    return { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top };
  };
  const ra = off(a);
  const rb = off(b);
  const ab = { x: bc.x - ac.x, y: bc.y - ac.y };
  const ba = { x: ac.x - bc.x, y: ac.y - bc.y };
  const pA = borderPoint(ac, ab, ra);
  const pB = borderPoint(bc, ba, rb);
  if (!pA || !pB) return null;
  const GAP = 6;
  const norm = (d: Pt): Pt => {
    const len = Math.hypot(d.x, d.y) || 1;
    return { x: d.x / len, y: d.y / len };
  };
  const na = norm(ab);
  const nb = norm(ba);
  return {
    from: { x: pA.x + na.x * GAP, y: pA.y + na.y * GAP },
    to: { x: pB.x + nb.x * (GAP + 4), y: pB.y + nb.y * (GAP + 4) },
  };
}

function borderPoint(center: Pt, dir: Pt, rect: RelRect): Pt | null {
  let t = Infinity;
  if (dir.x > 0.0001) t = Math.min(t, (rect.right - center.x) / dir.x);
  if (dir.x < -0.0001) t = Math.min(t, (rect.left - center.x) / dir.x);
  if (dir.y > 0.0001) t = Math.min(t, (rect.bottom - center.y) / dir.y);
  if (dir.y < -0.0001) t = Math.min(t, (rect.top - center.y) / dir.y);
  if (!Number.isFinite(t) || t <= 0) return null;
  return { x: center.x + dir.x * t, y: center.y + dir.y * t };
}

function curveBetween(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const lift = 26;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + lift}, ${b.x} ${b.y - lift}, ${b.x} ${b.y}`;
}
