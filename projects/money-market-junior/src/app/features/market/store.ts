// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Session state (interaction state layer, spec §state model). Content comes
// from JSON via lib/data; every rule (totals, gates, change) is computed by
// the pure engine — this service only wires signals to it. Anonymous mission
// progress lives in localStorage and is always resettable.

import { Injectable, computed, signal } from '@angular/core';
import {
  type Basket,
  type BasketLine,
  type BudgetState,
  type Catalog,
  type Challenges,
  type Mission,
  type PayPhase,
  type PayState,
  type RequirementStatus,
  addToBasket,
  allRequirementsMet,
  basketLines,
  basketTotal,
  budgetState,
  canCheckout,
  changeBuildState,
  payState,
  placeToken,
  removeFromBasket,
  requirementStatuses,
  takeTokenBack,
  breakdown,
} from './engine';
import { loadContent } from '../../lib/data';
import { clearCompleted, loadCompleted, saveCompleted } from '../../lib/storage';

export type Screen = 'market' | 'checkout' | 'receipt';

export interface ReceiptData {
  lines: BasketLine[];
  total: number;
  paid: number;
  change: number;
  changeCoins: number[];
  mission: Mission;
  exact: boolean;
}

@Injectable({ providedIn: 'root' })
export class MarketStore {
  // ---- content state -----------------------------------------------------
  private readonly catalogSig = signal<Catalog | null>(null);
  private readonly challengesSig = signal<Challenges | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // ---- session state -----------------------------------------------------
  readonly missionId = signal('');
  /** one basket per mission — switching tabs never destroys work (design §3.6) */
  readonly baskets = signal<Record<string, Basket>>({});
  readonly basket = computed<Basket>(() => this.baskets()[this.missionId()] ?? {});
  readonly screen = signal<Screen>('market');
  readonly walletLeft = signal<number[]>([]);
  readonly tray = signal<number[]>([]);
  readonly changeBuilt = signal<number[]>([]);
  readonly payPhase = signal<PayPhase>('paying');
  readonly completed = signal<Record<string, true>>({});

  // ---- content views -----------------------------------------------------
  readonly catalog = computed(() => this.catalogSig());
  readonly products = computed(() => this.catalogSig()?.products ?? []);
  readonly stalls = computed(() => this.catalogSig()?.stalls ?? []);
  readonly categories = computed(() => this.catalogSig()?.categories ?? []);
  readonly currency = computed(() => this.catalogSig()?.currency ?? null);
  readonly missions = computed(() => this.challengesSig()?.missions ?? []);
  readonly mission = computed<Mission | null>(() => {
    const all = this.missions();
    return all.find((m) => m.id === this.missionId()) ?? all[0] ?? null;
  });

  // ---- derived game state (pure engine) ----------------------------------
  readonly lines = computed<BasketLine[]>(() => basketLines(this.basket(), this.products()));
  readonly itemCount = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));
  readonly total = computed(() => basketTotal(this.basket(), this.products()));
  readonly reqStatuses = computed<RequirementStatus[]>(() => {
    const m = this.mission();
    return m ? requirementStatuses(m, this.basket(), this.products()) : [];
  });
  readonly reqMet = computed(() => allRequirementsMet(this.reqStatuses()));
  readonly budget = computed<BudgetState>(() => {
    const m = this.mission();
    return m ? budgetState(m, this.total()) : { total: 0, budget: 0, remaining: 0, overBy: 0, exact: false };
  });
  readonly gate = computed(() => {
    const m = this.mission();
    return m ? canCheckout(m, this.basket(), this.products()) : { ok: false as const, reason: 'empty' as const };
  });
  readonly pay = computed<PayState>(() => payState(this.total(), this.tray()));
  readonly changeTarget = computed(() => (this.payPhase() === 'change' ? this.pay().change : 0));
  readonly changeBuild = computed(() => changeBuildState(this.changeTarget(), this.changeBuilt()));
  readonly walletGrouped = computed(() => groupTokens(this.walletLeft()));
  readonly trayGrouped = computed(() => groupTokens(this.tray()));
  readonly receipt = computed<ReceiptData | null>(() => {
    const m = this.mission();
    if (!m || this.screen() !== 'receipt') return null;
    const pay = this.pay();
    return {
      lines: this.lines(),
      total: pay.total,
      paid: pay.paid,
      change: pay.change,
      changeCoins: breakdown(pay.change, [...(this.currency()?.coins ?? []), ...(this.currency()?.notes ?? [])]),
      mission: m,
      exact: pay.exact,
    };
  });

  // ---- lifecycle ---------------------------------------------------------
  async init(): Promise<void> {
    try {
      const { catalog, challenges } = await loadContent();
      this.catalogSig.set(catalog);
      this.challengesSig.set(challenges);
      this.completed.set(loadCompleted());
      const fromHash = readMissionFromHash();
      const exists = challenges.missions.some((m) => m.id === fromHash);
      const first = challenges.missions[0]?.id ?? '';
      this.startMission(exists ? fromHash : first, { updateHash: exists });
      this.loading.set(false);
    } catch (err) {
      this.loadError.set(err instanceof Error ? err.message : 'The market could not open.');
      this.loading.set(false);
    }
  }

  retryLoad(): void {
    this.loading.set(true);
    this.loadError.set(null);
    void this.init();
  }

  // ---- missions ----------------------------------------------------------
  selectMission(id: string): void {
    if (id === this.missionId()) return;
    this.startMission(id, { updateHash: true });
  }

  private startMission(id: string, opts: { updateHash: boolean }): void {
    this.missionId.set(id);
    this.screen.set('market');
    this.resetCashier();
    if (opts.updateHash) writeMissionHash(id);
  }

  private resetCashier(): void {
    this.walletLeft.set([]);
    this.tray.set([]);
    this.changeBuilt.set([]);
    this.payPhase.set('paying');
  }

  // ---- basket ------------------------------------------------------------
  add(productId: string): void {
    const id = this.missionId();
    this.baskets.set({
      ...this.baskets(),
      [id]: addToBasket(this.baskets()[id] ?? {}, productId),
    });
  }

  remove(productId: string): void {
    const id = this.missionId();
    this.baskets.set({
      ...this.baskets(),
      [id]: removeFromBasket(this.baskets()[id] ?? {}, productId),
    });
  }

  clearBasket(): void {
    const id = this.missionId();
    const next = { ...this.baskets() };
    delete next[id];
    this.baskets.set(next);
  }

  // ---- screens -----------------------------------------------------------
  goCheckout(): void {
    if (!this.gate().ok) return;
    const m = this.mission();
    if (!m) return;
    this.walletLeft.set([...m.wallet]);
    this.tray.set([]);
    this.changeBuilt.set([]);
    this.payPhase.set('paying');
    this.screen.set('checkout');
  }

  backToMarket(): void {
    this.screen.set('market');
  }

  // ---- cashier -----------------------------------------------------------
  place(denomination: number): void {
    const next = placeToken(this.walletLeft(), denomination);
    if (next === null) return;
    this.walletLeft.set(next);
    this.tray.set([...this.tray(), denomination]);
  }

  takeBack(denomination: number): void {
    const trayNext = takeTokenBack(this.tray(), denomination);
    if (trayNext === null) return;
    this.tray.set(trayNext);
    this.walletLeft.set([...this.walletLeft(), denomination]);
  }

  /** Confirm payment. Change missions enter the build-change phase. */
  confirmPay(): void {
    const pay = this.pay();
    const m = this.mission();
    if (!pay.canPay || !m) return;
    if (m.mode === 'change' && pay.change > 0) {
      this.payPhase.set('change');
      return;
    }
    this.finish();
  }

  addChangeCoin(denomination: number): void {
    if (this.changeBuilt().length >= 24) return; // keep the tray sane
    this.changeBuilt.set([...this.changeBuilt(), denomination]);
  }

  removeChangeCoin(index: number): void {
    this.changeBuilt.set(this.changeBuilt().toSpliced(index, 1));
  }

  clearChangeCoins(): void {
    this.changeBuilt.set([]);
  }

  confirmChange(): void {
    if (!this.changeBuild().ok) return;
    this.finish();
  }

  private finish(): void {
    this.payPhase.set('done');
    const m = this.mission();
    if (m) {
      const next: Record<string, true> = { ...this.completed(), [m.id]: true };
      this.completed.set(next);
      saveCompleted(next);
    }
    this.screen.set('receipt');
  }

  /** Receipt → back to a fresh basket on the same mission. */
  shopAgain(): void {
    this.clearBasket();
    this.resetCashier();
    this.screen.set('market');
  }

  resetProgress(): void {
    clearCompleted();
    this.completed.set({});
  }
}

// ---------------------------------------------------------------------------

function groupTokens(tokens: number[]): { denomination: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([denomination, count]) => ({ denomination, count }));
}

function readMissionFromHash(): string {
  try {
    const m = /^#m=([a-z0-9-]+)$/i.exec(location.hash);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

function writeMissionHash(id: string): void {
  try {
    if (readMissionFromHash() !== id) history.replaceState(null, '', `#m=${id}`);
  } catch {
    /* hash is a convenience only */
  }
}
