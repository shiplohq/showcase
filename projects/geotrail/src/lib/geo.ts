// Copyright 2026 Shiplo HQ
// SPDX-License-Identifier: Apache-2.0
//
// Equirectangular projection with a per-plate latitude squash (standard
// parallel = plate mid-latitude). All authored geometry is [lon, lat];
// rendering projects to plate SVG units. Plates are square-ish per their
// true proportions (SEA ≈ square, South America tall, Europe portrait).

export interface PlateView {
  /** SVG viewBox width in plate units (fixed). */
  width: number;
  /** SVG viewBox height in plate units (derived from true proportions). */
  height: number;
  lonMin: number;
  latMin: number;
  lonSpan: number;
  latSpan: number;
  /** Units per degree of longitude (after the mid-latitude squash). */
  kx: number;
  /** Units per degree of latitude. */
  ky: number;
}

const BASE_WIDTH = 1000;

export function plateView(bounds: [number, number, number, number]): PlateView {
  const [lonMin, latMin, lonMax, latMax] = bounds;
  const lonSpan = lonMax - lonMin;
  const latSpan = latMax - latMin;
  const midLat = ((latMin + latMax) / 2) * (Math.PI / 180);
  const squash = Math.cos(midLat);
  // x = lon * cos(midLat), y = lat — true shape at the plate's parallel.
  const width = BASE_WIDTH;
  const kx = width / lonSpan;
  const ky = kx / squash;
  const height = Math.round(latSpan * ky);
  return { width, height, lonMin, latMin, lonSpan, latSpan, kx, ky };
}

/** [lon, lat] → [x, y] plate units (y grows down like SVG). */
export function project(view: PlateView, lon: number, lat: number): [number, number] {
  return [(lon - view.lonMin) * view.kx, (view.latMin + view.latSpan - lat) * view.ky];
}

export function polygonPoints(view: PlateView, ring: [number, number][]): string {
  return ring.map(([lon, lat]) => project(view, lon, lat).map((n) => n.toFixed(1)).join(',')).join(' ');
}
