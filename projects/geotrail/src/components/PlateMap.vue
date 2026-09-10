<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The trail plate: ocean, graticule, low-poly places, rivers/ranges, the
// terracotta route with numbered stop markers, the clue-relation layer and —
// in locate stops — real button hit targets with roving arrow-key focus.
// Zoom/pan is a GSAP-tweened viewBox (no map API), and every size that must
// stay readable on screen (labels, hit circles, marker numbers) is derived
// from the live viewBox so it never shrinks below usable.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Clue, Place, Plate } from '../lib/types';
import { plateView, polygonPoints, project } from '../lib/geo';
import { drawOn, tweenValue } from '../lib/gsap';

export interface RouteStop {
  n: number;
  placeId: string;
  done: boolean;
  current: boolean;
}

const props = defineProps<{
  plate: Plate;
  places: Place[];
  route: RouteStop[];
  interactive: boolean;
  highlightIds: string[];
  relations: Clue[];
  correctId: string | null;
  wrongId: string | null;
  focusPlaceId: string | null;
}>();

const emit = defineEmits<{ pick: [placeId: string] }>();

const stageEl = ref<HTMLElement | null>(null);
const svgEl = ref<SVGSVGElement | null>(null);
const routeEl = ref<SVGPolylineElement | null>(null);
const focusedId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);

const view = computed(() => plateView(props.plate.bounds));
const byId = computed(() => new Map(props.places.map((p) => [p.id, p] as const)));

const LAND_TINTS = ['var(--land-cream)', 'var(--land-sand)', 'var(--land-khaki)', 'var(--land-sage)'];
function tintOf(i: number): string {
  return LAND_TINTS[i % LAND_TINTS.length];
}

// ---- viewBox (zoom/pan) ----------------------------------------------------

const vb = reactiveVb();
function reactiveVb() {
  const v = view.value;
  return ref({ x: 0, y: 0, w: v.width, h: v.height });
}

const vbStr = computed(() => `${vb.value.x} ${vb.value.y} ${vb.value.w} ${vb.value.h}`);

const containerW = ref(800);
const containerH = ref(600);
let ro: ResizeObserver | null = null;

onMounted(() => {
  if (stageEl.value) {
    ro = new ResizeObserver(() => measure());
    ro.observe(stageEl.value);
    measure();
    // Opening move: glide from the full plate into the first stop (spatial,
    // 350–450ms; instant under reduced motion via tweenValue).
    const target = focusVb(props.focusPlaceId);
    Object.assign(vb.value, fullVb());
    requestAnimationFrame(() => {
      tweenValue(vb.value as unknown as Record<string, number>, target, 0.42, 'power3.inOut', () => {});
    });
    nextTick(() => drawRouteOn());
  }
});

onBeforeUnmount(() => ro?.disconnect());

function measure() {
  if (!stageEl.value) return;
  containerW.value = stageEl.value.clientWidth || 800;
  containerH.value = stageEl.value.clientHeight || 600;
}

/** Screen-constant sizes: px → plate units at the current zoom. */
const px = computed(() => Math.max(vb.value.w / containerW.value, vb.value.h / containerH.value, 0.0001));
const labelFs = computed(() => 13 * px.value);
const smallLabelFs = computed(() => 11.5 * px.value);
const markerFs = computed(() => 12 * px.value);
const hitR = computed(() => Math.min(Math.max(22 * px.value, 24), 170));
const seaFs = computed(() => 14 * px.value);

function fullVb() {
  return { x: 0, y: 0, w: view.value.width, h: view.value.height };
}

function focusVb(placeId: string | null) {
  const v = view.value;
  if (!placeId) return fullVb();
  const place = byId.value.get(placeId);
  if (!place) return fullVb();
  const [cx, cy] = project(v, place.centroid[0], place.centroid[1]);
  // Match the container aspect so the window fills the stage (no letterbox).
  const aspect = containerW.value / Math.max(containerH.value, 1);
  let w = v.width * 0.46;
  let h = w / aspect;
  if (h > v.height * 0.72) {
    h = v.height * 0.72;
    w = h * aspect;
  }
  const x = Math.min(Math.max(cx - w / 2, 0), v.width - w);
  const y = Math.min(Math.max(cy - h / 2, 0), v.height - h);
  return { x, y, w, h };
}

watch(
  () => props.focusPlaceId,
  (id) => {
    const target = focusVb(id);
    tweenValue(vb.value as unknown as Record<string, number>, target, id ? 0.42 : 0.38, 'power2.inOut', () => {});
  },
);

function drawRouteOn() {
  if (!routeEl.value) return;
  const len = routeEl.value.getTotalLength?.() ?? 0;
  if (len > 0) drawOn(routeEl.value, len, 0.5);
}

// ---- geometry --------------------------------------------------------------

const contextPolys = computed(() =>
  props.plate.context.flatMap((c) =>
    c.polys.map((ring) => polygonPoints(view.value, ring)),
  ),
);

const landPolys = computed(() =>
  props.places.map((p, i) => ({
    id: p.id,
    tint: tintOf(i),
    rings: p.polys.map((ring) => polygonPoints(view.value, ring)),
  })),
);

const labels = computed(() =>
  props.places.map((p) => {
    const [x, y] = project(view.value, p.centroid[0], p.centroid[1]);
    const shift = p.labelShift ?? [0, 0];
    const kx = view.value.kx;
    const ky = view.value.ky;
    return {
      id: p.id,
      name: p.name,
      x: x + shift[0] * kx * 0.5,
      y: y - 20 * px.value + shift[1] * ky * 0.5,
      small: p.facts.areaKm2 < 5000,
    };
  }),
);

const routePoints = computed(() =>
  props.route
    .map((s) => {
      const p = byId.value.get(s.placeId);
      if (!p) return null;
      const [x, y] = project(view.value, p.centroid[0], p.centroid[1]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter((s): s is string => !!s)
    .join(' '),
);

const routeMarkers = computed(() =>
  props.route.flatMap((s) => {
    const p = byId.value.get(s.placeId);
    if (!p) return [];
    const [x, y] = project(view.value, p.centroid[0], p.centroid[1]);
    return [{ ...s, x, y }];
  }),
);

const graticule = computed(() => {
  const v = view.value;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const lonStart = Math.ceil(v.lonMin / 10) * 10;
  for (let lon = lonStart; lon <= v.lonMin + v.lonSpan; lon += 10) {
    const [x1, y1] = project(v, lon, v.latMin + v.latSpan);
    const [x2, y2] = project(v, lon, v.latMin);
    lines.push({ x1, y1, x2, y2 });
  }
  const latStart = Math.ceil(v.latMin / 10) * 10;
  for (let lat = latStart; lat <= v.latMin + v.latSpan; lat += 10) {
    const [x1, y1] = project(v, v.lonMin, lat);
    const [x2, y2] = project(v, v.lonMin + v.lonSpan, lat);
    lines.push({ x1, y1, x2, y2 });
  }
  return lines;
});

const riverPaths = computed(() =>
  props.plate.rivers.map((r) => ({
    id: r.id,
    name: r.name,
    d:
      r.line
        .map(([lon, lat], i) => {
          const [x, y] = project(view.value, lon, lat);
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ') + '',
  })),
);

const rangePaths = computed(() =>
  props.plate.ranges.map((r) => ({
    id: r.id,
    d: r.line
      .map(([lon, lat], i) => {
        const [x, y] = project(view.value, lon, lat);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' '),
  })),
);

const seaLabels = computed(() =>
  props.plate.seas.map((s) => {
    const [x, y] = project(view.value, s.at[0], s.at[1]);
    return { name: s.name, x, y };
  }),
);

/** Relation layer for revealed clue predicates: outline the referenced
 *  place, draw a direction arrow for n/s/e/w-of (never toward the answer). */
const relationMarks = computed(() => {
  const v = view.value;
  const marks: {
    id: string;
    kind: string;
    outlinePts: string[];
    arrow: { x1: number; y1: number; x2: number; y2: number; hx: number; hy: number } | null;
    label: string;
    lx: number;
    ly: number;
  }[] = [];
  const DIRS: Record<string, [number, number]> = {
    'north-of': [0, -1],
    'south-of': [0, 1],
    'east-of': [1, 0],
    'west-of': [-1, 0],
  };
  for (const clue of props.relations) {
    if (clue.kind === 'coast' || clue.kind === 'landlocked' || clue.kind === 'feature' ||
        clue.kind === 'climate' || clue.kind === 'area-under' || clue.kind === 'area-over' ||
        clue.kind === 'peak-over' || clue.kind === 'peak-under') continue;
    const ref = byId.value.get(clue.place);
    if (!ref) continue;
    const [x, y] = project(v, ref.centroid[0], ref.centroid[1]);
    const outline = ref.polys.map((ring) => polygonPoints(v, ring));
    let arrow: { x1: number; y1: number; x2: number; y2: number; hx: number; hy: number } | null = null;
    let label = '';
    if (clue.kind === 'borders') {
      label = `borders ${ref.name}`;
    } else {
      const [dx, dy] = DIRS[clue.kind] ?? [0, 0];
      const len = 0.09 * v.width;
      const x2 = x + dx * len;
      const y2 = y + dy * len;
      // arrowhead
      const hl = 0.018 * v.width;
      const hx = x2 - dx * hl * 0.8;
      const hy = y2 - dy * hl * 0.8;
      const perpX = dy;
      const perpY = dx;
      arrow = {
        x1: x + dx * 0.02 * v.width,
        y1: y + dy * 0.02 * v.width,
        x2,
        y2,
        hx: hx + perpX * hl * 0.5,
        hy: hy + perpY * hl * 0.5,
      };
      label = `${clue.kind.replace('-of', '')} of ${ref.name}`;
    }
    marks.push({
      id: `${clue.kind}-${clue.place}`,
      kind: clue.kind,
      outlinePts: outline,
      arrow,
      label,
      lx: x,
      ly: y - 26 * px.value,
    });
  }
  return marks;
});

// ---- keyboard roving -------------------------------------------------------

const order = computed(() =>
  [...props.places]
    .map((p) => {
      const [x, y] = project(view.value, p.centroid[0], p.centroid[1]);
      return { id: p.id, x, y };
    })
    .sort((a, b) => (Math.abs(a.y - b.y) < 40 ? a.x - b.x : a.y - b.y)),
);

function onKeydown(ev: KeyboardEvent) {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
  const ids = order.value.map((o) => o.id);
  const idx = ids.indexOf(focusedId.value ?? '');
  if (idx < 0) return;
  ev.preventDefault();
  const cur = order.value[idx];
  let best = -1;
  let bestDist = Infinity;
  const dirY = ev.key === 'ArrowUp' ? -1 : ev.key === 'ArrowDown' ? 1 : 0;
  const dirX = ev.key === 'ArrowLeft' ? -1 : ev.key === 'ArrowRight' ? 1 : 0;
  order.value.forEach((o, i) => {
    if (i === idx) return;
    const dy = o.y - cur.y;
    const dx = o.x - cur.x;
    if (dirY !== 0 && Math.sign(dy) !== dirY) return;
    if (dirX !== 0 && Math.sign(dx) !== dirX) return;
    const dist = dirY !== 0 ? Math.abs(dx) * 2 + Math.abs(dy) : Math.abs(dy) * 2 + Math.abs(dx);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  if (best >= 0) focusPlace(ids[best]);
}

function focusPlace(id: string) {
  const el = svgEl.value?.querySelector<SVGElement>(`[data-place="${id}"]`);
  el?.focus();
}

function placeLabel(id: string): string {
  const p = byId.value.get(id);
  if (!p) return id;
  const kind = p.features.includes('landlocked') ? 'landlocked country' : 'country';
  return `${p.name} — ${kind} in ${plateRegion.value}`;
}

const plateRegion = computed(() => props.plate.name);

// ---- drag hit-testing (exposed for LocateActivity) -------------------------

function clientToSvg(clientX: number, clientY: number): [number, number] | null {
  const svg = svgEl.value;
  if (!svg) return null;
  const pt = new DOMPoint(clientX, clientY);
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const local = pt.matrixTransform(ctm.inverse());
  return [local.x, local.y];
}

function placeAtPoint(clientX: number, clientY: number): { id: string; name: string } | null {
  const local = clientToSvg(clientX, clientY);
  if (!local) return null;
  let best: { id: string; d: number } | null = null;
  for (const p of props.places) {
    const [x, y] = project(view.value, p.centroid[0], p.centroid[1]);
    const d = Math.hypot(x - local[0], y - local[1]);
    if (!best || d < best.d) best = { id: p.id, d };
  }
  if (!best) return null;
  const snapUnits = 64 * px.value; // forgiving snap (DD §8)
  if (best.d > snapUnits) return null;
  return { id: best.id, name: byId.value.get(best.id)?.name ?? best.id };
}

function setDragOver(id: string | null) {
  dragOverId.value = id;
}

defineExpose({ placeAtPoint, setDragOver });

function tryPick(id: string) {
  if (props.interactive) emit('pick', id);
}

const v = view.value;
</script>

<template>
  <div ref="stageEl" class="plate-stage" :class="{ interactive }">
    <div class="plate-tag"><span class="rn">PLATE {{ plate.numeral }}</span><span>{{ plate.name }}</span></div>
    <div class="plate-note">Boundaries simplified for learning · educational dataset only</div>
    <svg
      ref="svgEl"
      :viewBox="vbStr"
      preserveAspectRatio="xMidYMid meet"
      class="plate-svg"
      @keydown="onKeydown"
    >
      <clipPath id="plate-clip">
        <rect x="0" y="0" :width="v.width" :height="v.height" />
      </clipPath>
      <g :clip-path="'url(#plate-clip)'">
        <!-- ocean -->
        <rect x="0" y="0" :width="v.width" :height="v.height" fill="var(--ocean)" />

        <!-- graticule -->
        <line
          v-for="(g, i) in graticule"
          :key="'g' + i"
          class="map-graticule"
          :x1="g.x1" :y1="g.y1" :x2="g.x2" :y2="g.y2"
        />

        <!-- context landmass (muted, not playable) -->
        <polygon
          v-for="(pts, i) in contextPolys"
          :key="'c' + i"
          class="map-context"
          :points="pts"
        />

        <!-- rivers & ranges -->
        <path
          v-for="r in riverPaths"
          :key="r.id"
          class="map-river"
          :d="r.d"
        />
        <path
          v-for="r in rangePaths"
          :key="r.id"
          class="map-range"
          :d="r.d"
        />

        <!-- sea labels -->
        <text
          v-for="s in seaLabels"
          :key="s.name"
          class="map-sea-label"
          text-anchor="middle"
          :x="s.x" :y="s.y"
          :font-size="seaFs"
        >{{ s.name }}</text>

        <!-- playable places -->
        <g v-for="land in landPolys" :key="land.id" class="map-place">
          <polygon
            v-for="(ring, ri) in land.rings"
            :key="ri"
            class="map-land"
            :points="ring"
            :fill="land.id === correctId ? 'var(--forest)' : land.tint"
            :stroke="land.id === correctId ? 'var(--forest-deep)' : undefined"
            :stroke-width="land.id === correctId ? 1.5 : undefined"
            :class="{
              'is-hl': highlightIds.includes(land.id),
              'is-wrong': land.id === wrongId,
              'is-dragover': land.id === dragOverId,
            }"
            @click="tryPick(land.id)"
          />
        </g>

        <!-- route -->
        <g v-if="route.length > 1" class="map-route">
          <polyline
            ref="routeEl"
            class="route-line"
            :points="routePoints"
            fill="none"
            stroke="var(--terra)"
            :stroke-width="2.4"
            stroke-dasharray="7 6"
            stroke-linecap="round"
          />
          <g v-for="m in routeMarkers" :key="'m' + m.n" class="route-marker">
            <circle
              :cx="m.x" :cy="m.y"
              :r="Math.max(13 * px, 10)"
              :fill="m.done ? 'var(--forest)' : m.current ? 'var(--terra)' : 'var(--parchment)'"
              :stroke="m.done ? 'var(--forest-deep)' : m.current ? 'var(--terra-deep)' : 'var(--line-strong)'"
              stroke-width="2"
              :class="{ 'gt-current-marker': m.current }"
            />
            <text
              :x="m.x" :y="m.y + markerFs * 0.36"
              text-anchor="middle"
              class="marker-n"
              :font-size="markerFs"
              :fill="m.done || m.current ? 'var(--on-terra)' : 'var(--ink)'"
            >{{ m.n }}</text>
          </g>
        </g>

        <!-- clue relation layer -->
        <g v-for="rel in relationMarks" :key="rel.id" class="map-relation">
          <polygon
            v-for="(pts, i) in rel.outlinePts"
            :key="i"
            class="relation-outline"
            :points="pts"
          />
          <line v-if="rel.arrow" :x1="rel.arrow.x1" :y1="rel.arrow.y1" :x2="rel.arrow.x2" :y2="rel.arrow.y2" class="relation-arrow" />
          <polyline
            v-if="rel.arrow"
            :points="`${rel.arrow.x2},${rel.arrow.y2} ${rel.arrow.hx},${rel.arrow.hy}`"
            class="relation-arrow"
          />
          <text :x="rel.lx" :y="rel.ly" text-anchor="middle" class="relation-label" :font-size="smallLabelFs">
            {{ rel.label }}
          </text>
        </g>

        <!-- labels -->
        <text
          v-for="l in labels"
          :key="l.id"
          class="map-place-label"
          :class="{ small: l.small }"
          text-anchor="middle"
          :x="l.x" :y="l.y"
          :font-size="l.small ? smallLabelFs : labelFs"
        >{{ l.name }}</text>

        <!-- hit targets (locate mode): real buttons, ≥44px, roving arrows -->
        <g v-if="interactive" class="map-hits">
          <g
            v-for="l in labels"
            :key="'h' + l.id"
            :data-place="l.id"
            role="button"
            tabindex="0"
            :aria-label="placeLabel(l.id)"
            @click="tryPick(l.id)"
            @keydown.enter.prevent="tryPick(l.id)"
            @keydown.space.prevent="tryPick(l.id)"
            @focus="focusedId = l.id"
            @blur="focusedId = focusedId === l.id ? null : focusedId"
          >
            <circle
              :cx="l.x" :cy="l.y + 6 * px"
              :r="hitR"
              fill="transparent"
            />
            <circle
              v-if="focusedId === l.id"
              :cx="l.x" :cy="l.y + 6 * px"
              :r="hitR"
              fill="none"
              stroke="var(--ink)"
              stroke-width="2.5"
              class="hit-focus-ring"
            />
          </g>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.plate-stage {
  aspect-ratio: auto;
  height: 100%;
  min-height: 320px;
}

.plate-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.map-land {
  cursor: inherit;
  transition: fill 160ms ease;
}

.plate-stage.interactive .map-land {
  cursor: pointer;
}

.map-land.is-hl {
  stroke: var(--terra-deep);
  stroke-width: 2;
}

.map-land.is-wrong {
  stroke: var(--terra);
  stroke-width: 2;
  stroke-dasharray: 6 4;
}

.map-land.is-dragover {
  stroke: var(--terra-deep);
  stroke-width: 2.5;
  fill: var(--land-sand);
}

.marker-n {
  font-family: var(--font-body);
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(244, 234, 213, 0.6);
  stroke-width: 2px;
  pointer-events: none;
}

.relation-outline {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.8;
  stroke-dasharray: 5 4;
  opacity: 0.85;
  pointer-events: none;
}

.relation-arrow {
  stroke: var(--ink);
  stroke-width: 1.8;
  opacity: 0.85;
  pointer-events: none;
}

.relation-label {
  fill: var(--ink);
  font-family: var(--font-body);
  font-weight: 600;
  letter-spacing: 0.04em;
  paint-order: stroke;
  stroke: rgba(244, 234, 213, 0.85);
  stroke-width: 3px;
  pointer-events: none;
  opacity: 0.95;
}

.hit-focus-ring {
  pointer-events: none;
}

.map-hits [role='button'] {
  cursor: pointer;
}
</style>
