// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0

/** Content shapes shared by the engine, data loader and UI. Pure types only. */

export interface PlanetData {
  id: string;
  name: string;
  order: number;
  radiusKm: number;
  /** sidereal rotation period in hours */
  dayHours: number;
  /** orbital period in Earth days */
  yearDays: number;
  moons: number;
  distanceAu: number;
  /** [lit, mid, shadow] — drives the SVG sphere gradient */
  colorStops: [string, string, string];
  pigment: string;
  bands: boolean;
  hasRings: boolean;
  retrograde: boolean;
  facts: string[];
  sourceNote: string;
}

export interface PlanetsFile {
  schemaNote?: string;
  sourceNote?: string;
  planets: PlanetData[];
}

export interface ViewCopy {
  id: string;
  label: string;
  shortLabel: string;
  caveat: string;
}

export interface AtlasCopy {
  exhibit: {
    title: string;
    subtitle: string;
    intro: string;
    loading: string;
    errorTitle: string;
    errorCopy: string;
    reload: string;
  };
  views: ViewCopy[];
  stations: Record<string, string>;
  focus: {
    close: string;
    addCompare: string;
    inCompare: string;
    catalogue: string;
    measurementsTitle: string;
    rows: Record<string, string>;
    factsTitle: string;
    sourceTitle: string;
  };
  compare: {
    title: string;
    intro: string;
    pick: string;
    pickNone: string;
    remove: string;
    maxNote: string;
    rows: Record<string, string>;
    logNote: string;
    back: string;
  };
  quiz: {
    title: string;
    intro: string;
    modeOrder: string;
    modeMatch: string;
    sortIntro: string;
    sortSlot: string;
    sortPool: string;
    lift: string;
    drop: string;
    moveLeft: string;
    moveRight: string;
    place: string;
    check: string;
    reset: string;
    correct: string;
    incorrect: string;
    allPlacedHint: string;
    matchIntro: string;
    matchCheck: string;
    matchCorrect: string;
    matchIncorrect: string;
    solved: string;
    progress: string;
    bestNote: string;
    back: string;
  };
  caveatPanel: {
    open: string;
    title: string;
    body: string[];
    close: string;
  };
  expedition: {
    label: string;
    visited: string;
    reset: string;
    resetConfirm: string;
    storageNote: string;
  };
  footer: { sourceNote: string; creditsNote: string };
  dataTable: {
    toggle: string;
    hide: string;
    caption: string;
    headName: string;
    headOrder: string;
    headRadius: string;
    headDay: string;
    headYear: string;
    headMoons: string;
    headDistance: string;
  };
}
