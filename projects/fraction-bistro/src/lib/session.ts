// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Interaction-state layer (spec §State model): per-order cutting-table state
// lives here for the whole session so leaving a ticket and coming back
// never destroys the learner's work (impeccable P1 fix). Memory-only by
// design; cleared with the shift reset.

import { reactive } from 'vue';
import { startStation, type Sign, type Station } from '../features/cut/engine';

export interface OrderSession {
  main: Station;
  right: Station;
  sign: Sign | null;
}

const sessions = reactive<Record<string, OrderSession>>({});

export function orderSession(orderId: string): OrderSession {
  if (!sessions[orderId]) {
    sessions[orderId] = { main: startStation(), right: startStation(), sign: null };
  }
  return sessions[orderId];
}

export function clearSessions(): void {
  for (const key of Object.keys(sessions)) {
    delete sessions[key];
  }
}
