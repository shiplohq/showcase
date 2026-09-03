<!--
Copyright 2026 Shiplo HQ
SPDX-License-Identifier: Apache-2.0
-->
<script setup lang="ts">
// The layered body model — original simplified vector anatomy, one <g> per
// system layer (the spec's core mechanic). Organs are focusable buttons whose
// ids match pathId in systems.json. A pathway overlay draws confirmed route
// segments. Callout labels (leader lines + mono specimen labels) are authored
// per organ in the JSON so layout is data, not code.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { LabData, OrganDef, StopDef, SystemId } from '../lib/types';
import { gsap, drawOn, prefersReducedMotion, routePulse } from '../lib/gsap';

const props = defineProps<{
  data: LabData;
  /** Which system layers are on. */
  layers: ReadonlySet<SystemId>;
  /** In overview mode: which systems to ghost (default: all). */
  ghostLayers?: ReadonlySet<SystemId>;
  /** 'explore' = organs interactive; 'pathway' = route overlay; 'overview' = ghost preview. */
  mode: 'overview' | 'explore' | 'pathway';
  /** Organ pathId highlighted (hover/focus/open in the side panel). */
  highlightPathId?: string | null;
  /** Confirmed route stops (with the start freebie first) — pathway mode only. */
  routeStops?: StopDef[];
  /** Route ink css color token value, pathway mode only. */
  routeInk?: string;
  /** Just-completed route (pulse once), pathway mode only. */
  routeFinished?: boolean;
  /** Organ ids the learner has already inspected (SEEN mark in callout). */
  explored?: ReadonlySet<string>;
}>();

const emit = defineEmits<{
  (e: 'inspect', organPathId: string): void;
  (e: 'organFocus', organPathId: string | null): void;
}>();

const ORDER: SystemId[] = ['skeletal', 'circulatory', 'respiratory', 'digestive', 'nervous'];

/** A layer renders when toggled on; in overview mode the ghost set decides. */
const layerOn = (id: SystemId) =>
  props.mode === 'overview' ? (props.ghostLayers ? props.ghostLayers.has(id) : true) : props.layers.has(id);

const SILHOUETTE =
  'M 210.0 18.0 C 221.3 18.0,235.7 20.3,244.0 26.0 C 252.3 31.7,257.2 43.0,260.0 52.0 C 262.8 61.0,263.3 71.0,261.0 80.0 C 258.7 89.0,251.8 98.7,246.0 106.0 C 240.2 113.3,229.3 118.3,226.0 124.0 C 222.7 129.7,222.3 135.3,226.0 140.0 C 229.7 144.7,239.7 148.3,248.0 152.0 C 256.3 155.7,268.7 158.3,276.0 162.0 C 283.3 165.7,287.3 168.0,292.0 174.0 C 296.7 180.0,300.5 187.0,304.0 198.0 C 307.5 209.0,310.7 224.7,313.0 240.0 C 315.3 255.3,317.3 273.7,318.0 290.0 C 318.7 306.3,316.8 324.3,317.0 338.0 C 317.2 351.7,317.8 362.0,319.0 372.0 C 320.2 382.0,324.8 390.0,324.0 398.0 C 323.2 406.0,318.3 415.0,314.0 420.0 C 309.7 425.0,301.8 430.0,298.0 428.0 C 294.2 426.0,291.8 418.0,291.0 408.0 C 290.2 398.0,293.2 382.7,293.0 368.0 C 292.8 353.3,291.8 336.0,290.0 320.0 C 288.2 304.0,285.7 286.7,282.0 272.0 C 278.3 257.3,272.0 241.7,268.0 232.0 C 264.0 222.3,261.0 211.7,258.0 214.0 C 255.0 216.3,253.0 234.0,250.0 246.0 C 247.0 258.0,242.0 274.0,240.0 286.0 C 238.0 298.0,237.0 306.3,238.0 318.0 C 239.0 329.7,243.5 343.7,246.0 356.0 C 248.5 368.3,252.0 378.7,253.0 392.0 C 254.0 405.3,253.2 420.3,252.0 436.0 C 250.8 451.7,247.8 470.0,246.0 486.0 C 244.2 502.0,242.2 517.7,241.0 532.0 C 239.8 546.3,239.8 557.7,239.0 572.0 C 238.2 586.3,236.8 603.3,236.0 618.0 C 235.2 632.7,234.3 648.3,234.0 660.0 C 233.7 671.7,233.0 681.0,234.0 688.0 C 235.0 695.0,236.3 697.3,240.0 702.0 C 243.7 706.7,251.3 710.7,256.0 716.0 C 260.7 721.3,267.0 728.7,268.0 734.0 C 269.0 739.3,266.7 745.0,262.0 748.0 C 257.3 751.0,246.2 752.7,240.0 752.0 C 233.8 751.3,228.2 749.7,225.0 744.0 C 221.8 738.3,221.2 730.0,221.0 718.0 C 220.8 706.0,223.2 687.7,224.0 672.0 C 224.8 656.3,226.0 640.0,226.0 624.0 C 226.0 608.0,225.2 592.7,224.0 576.0 C 222.8 559.3,220.7 538.7,219.0 524.0 C 217.3 509.3,215.5 497.0,214.0 488.0 C 212.5 479.0,211.3 470.0,210.0 470.0 C 208.7 470.0,207.5 479.0,206.0 488.0 C 204.5 497.0,202.7 509.3,201.0 524.0 C 199.3 538.7,197.2 559.3,196.0 576.0 C 194.8 592.7,194.0 608.0,194.0 624.0 C 194.0 640.0,195.2 656.3,196.0 672.0 C 196.8 687.7,199.2 706.0,199.0 718.0 C 198.8 730.0,198.2 738.3,195.0 744.0 C 191.8 749.7,186.2 751.3,180.0 752.0 C 173.8 752.7,162.7 751.0,158.0 748.0 C 153.3 745.0,151.0 739.3,152.0 734.0 C 153.0 728.7,159.3 721.3,164.0 716.0 C 168.7 710.7,176.3 706.7,180.0 702.0 C 183.7 697.3,185.0 695.0,186.0 688.0 C 187.0 681.0,186.3 671.7,186.0 660.0 C 185.7 648.3,184.8 632.7,184.0 618.0 C 183.2 603.3,181.8 586.3,181.0 572.0 C 180.2 557.7,180.2 546.3,179.0 532.0 C 177.8 517.7,175.8 502.0,174.0 486.0 C 172.2 470.0,169.2 451.7,168.0 436.0 C 166.8 420.3,166.0 405.3,167.0 392.0 C 168.0 378.7,171.5 368.3,174.0 356.0 C 176.5 343.7,181.0 329.7,182.0 318.0 C 183.0 306.3,182.0 298.0,180.0 286.0 C 178.0 274.0,173.0 258.0,170.0 246.0 C 167.0 234.0,165.0 216.3,162.0 214.0 C 159.0 211.7,156.0 222.3,152.0 232.0 C 148.0 241.7,141.7 257.3,138.0 272.0 C 134.3 286.7,131.8 304.0,130.0 320.0 C 128.2 336.0,127.2 353.3,127.0 368.0 C 126.8 382.7,129.8 398.0,129.0 408.0 C 128.2 418.0,125.8 426.0,122.0 428.0 C 118.2 430.0,110.3 425.0,106.0 420.0 C 101.7 415.0,96.8 406.0,96.0 398.0 C 95.2 390.0,99.8 382.0,101.0 372.0 C 102.2 362.0,102.8 351.7,103.0 338.0 C 103.2 324.3,101.3 306.3,102.0 290.0 C 102.7 273.7,104.7 255.3,107.0 240.0 C 109.3 224.7,112.5 209.0,116.0 198.0 C 119.5 187.0,123.3 180.0,128.0 174.0 C 132.7 168.0,136.7 165.7,144.0 162.0 C 151.3 158.3,163.7 155.7,172.0 152.0 C 180.3 148.3,190.3 144.7,194.0 140.0 C 197.7 135.3,197.3 129.7,194.0 124.0 C 190.7 118.3,179.8 113.3,174.0 106.0 C 168.2 98.7,161.3 89.0,159.0 80.0 C 156.7 71.0,157.2 61.0,160.0 52.0 C 162.8 43.0,167.7 31.7,176.0 26.0 C 184.3 20.3,198.7 18.0,210.0 18.0 Z';

const vertebrae = Array.from({ length: 21 }, (_, i) => 118 + i * 16);
const nerveRoots = [140, 172, 204, 236, 268, 300, 332, 364, 396, 424];
const tracheaTicks = [128, 136, 144, 152, 160];

const organAria = (pathId: string) => {
  for (const sys of props.data.systems) {
    const organ = sys.organs.find((o) => o.pathId === pathId);
    if (organ) return `${organ.name}, ${sys.name.toLowerCase()} system. Activate to inspect.`;
  }
  return pathId;
};

/**
 * Callout rows for visible layers, split per margin, sorted by y, then
 * lane-packed: a label block is ~30px tall, so when two systems are on at
 * once and authored ys land closer than MIN_BLOCK, later labels are pushed
 * down (never above their authored y, clamped to the plate). Leader lines
 * use the packed y; anchors stay on the organ.
 */
const CALLOUT_BLOCK = 30;
interface CalloutRow {
  organ: OrganDef;
  systemId: SystemId;
  figure: string;
  packedY: number;
}
function packRows(
  rows: { organ: OrganDef; systemId: SystemId; figure: string }[],
): CalloutRow[] {
  const sorted = [...rows].sort((a, b) => a.organ.label.y - b.organ.label.y);
  const out: CalloutRow[] = [];
  let prevBottom = -Infinity;
  for (const row of sorted) {
    const packedY = Math.max(Math.min(row.organ.label.y, 750), 44);
    const y = Math.max(packedY, prevBottom + CALLOUT_BLOCK);
    out.push({ ...row, packedY: Math.min(y, 750) });
    prevBottom = Math.min(y, 750);
  }
  return out;
}
const callouts = computed(() => {
  const rows: { organ: OrganDef; systemId: SystemId; figure: string }[] = [];
  for (const sys of props.data.systems) {
    if (!props.layers.has(sys.id)) continue;
    sys.organs.forEach((organ, i) => {
      rows.push({ organ, systemId: sys.id, figure: `ORGAN ${String(i + 1).padStart(2, '0')}` });
    });
  }
  return {
    left: packRows(rows.filter((r) => r.organ.label.side === 'left')),
    right: packRows(rows.filter((r) => r.organ.label.side === 'right')),
  };
});

const leaderD = (side: 'left' | 'right', y: number, ax: number, ay: number) => {
  const x0 = side === 'left' ? 156 : 404;
  return `M ${x0} ${y} L ${ax} ${ay}`;
};

/** Route geometry: curved segments between consecutive confirmed stops. */
interface Seg {
  id: number;
  d: string;
  len: number;
}
function segmentD(a: [number, number], b: [number, number]): { d: string; len: number } {
  // quadratic bow: slight perpendicular offset, control point clamped to the
  // torso band so the route never bulges outside the body outline
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const k = 0.08;
  const cx = Math.min(238, Math.max(182, mx - dy * k));
  const cy = my + dx * k;
  const d = `M ${a[0]} ${a[1]} Q ${cx} ${cy} ${b[0]} ${b[1]}`;
  const len = Math.hypot(dx, dy) * 1.1;
  return { d, len };
}
const routeSegments = computed<Seg[]>(() => {
  const stops = plateRoute.value;
  const segs: Seg[] = [];
  for (let i = 1; i < stops.length; i++) {
    const { d, len } = segmentD(stops[i - 1].node, stops[i].node);
    segs.push({ id: i, d, len });
  }
  return segs;
});

/**
 * Route stops with effective node positions: when one stop is visited
 * several times (the blood loop passes the heart 3×), each visit's badge is
 * offset horizontally so the numbers never overprint; segments connect the
 * offset badges, keeping the route readable.
 */
interface PlateStop {
  id: string;
  name: string;
  node: [number, number];
}
const plateRoute = computed<PlateStop[]>(() => {
  const stops = props.routeStops ?? [];
  const counts = new Map<string, number>();
  for (const s of stops) counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
  const seen = new Map<string, number>();
  return stops.map((s) => {
    const occ = seen.get(s.id) ?? 0;
    seen.set(s.id, occ + 1);
    const total = counts.get(s.id) ?? 1;
    const offset = total > 1 ? (occ - (total - 1) / 2) * 24 : 0;
    return { id: s.id, name: s.name, node: [s.node[0] + offset, s.node[1]] as [number, number] };
  });
});

// ---- layer motion: fade+rise on enable, gentle vertical separation when
// multiple layers are on (spatial depth cue, DESIGN_DECISIONS §11) ----
const root = ref<SVGSVGElement | null>(null);
const layerEls: Partial<Record<SystemId, SVGGElement | null>> = {};
const setLayerRef = (id: SystemId) => (el: unknown) => {
  layerEls[id] = (el as SVGGElement) ?? null;
};

let prevLayers = new Set<SystemId>();

watch(
  () => props.layers,
  async (layers) => {
    await nextTick();
    const onCount = ORDER.filter((id) => layers.has(id)).length;
    for (const id of ORDER) {
      const el = layerEls[id];
      if (!el) continue;
      const nowOn = layers.has(id);
      const wasOn = prevLayers.has(id);
      if (nowOn && !wasOn) {
        // v-show just turned it on — fade/rise in
        if (prefersReducedMotion()) {
          gsap.set(el, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            el,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'transform' },
          );
        }
      }
      // separation: stack layers slightly when several are on
      const offset = onCount >= 2 ? -(ORDER.indexOf(id) * 5) : 0;
      if (prefersReducedMotion()) gsap.set(el, { y: offset });
      else gsap.to(el, { y: offset, duration: 0.32, ease: 'power2.out' });
    }
    prevLayers = new Set(layers);
  },
  { deep: true },
);

// Draw-on the newest route segment as stops are confirmed.
watch(
  () => routeSegments.value.length,
  async (len, prev) => {
    if (len <= prev) return;
    await nextTick();
    const seg = routeSegments.value[len - 1];
    const el = root.value?.querySelector(`#route-seg-${seg.id}`) as SVGPathElement | null;
    if (el) drawOn(el, seg.len);
  },
  { immediate: false },
);

// Completion pulse — one beat, ≤900ms budget.
watch(
  () => props.routeFinished,
  (done) => {
    if (!done || !root.value) return;
    const segs = root.value.querySelectorAll('.route-seg');
    routePulse(Array.from(segs));
  },
);

onBeforeUnmount(() => {
  gsap.killTweensOf(Object.values(layerEls).filter(Boolean));
});
</script>

<template>
  <figure class="plate" :class="{ 'plate-pathway': mode === 'pathway' }">
    <figcaption class="plate-caption">
      <span>PLATE I — THE HUMAN BODY</span>
      <span>FIG. 1 · ANTERIOR VIEW</span>
    </figcaption>
    <div class="plate-mat">
      <svg
        ref="root"
        class="plate-svg"
        viewBox="0 0 560 780"
        :role="mode === 'explore' ? 'group' : 'img'"
        :aria-label="
          mode === 'explore'
            ? 'Body plate with inspectable organs. Organ buttons are also listed beside the plate.'
            : 'Simplified anatomical body plate.'
        "
      >
        <!-- ======= body (local coords 0..420, translated into the plate) ======= -->
        <g class="body" transform="translate(70,0)">
          <!-- silhouette: the always-there base layer -->
          <path class="silhouette" :d="SILHOUETTE" />

          <!-- ======= SKELETAL ======= -->
          <g
            v-show="layerOn('skeletal')"
            :ref="setLayerRef('skeletal')"
            class="layer sys-skeletal"
            :class="{ ghost: mode === 'overview' }"
          >
            <g class="organ bones-decor" aria-hidden="true">
              <!-- limb bones + joints (decorative; organs are separate hit targets) -->
              <path d="M 286 190 L 308 254" />
              <path d="M 300 262 L 314 366" />
              <path d="M 307 262 L 321 370" />
              <path d="M 134 190 L 112 254" />
              <path d="M 120 262 L 106 366" />
              <path d="M 113 262 L 99 370" />
              <circle cx="304" cy="258" r="5" />
              <circle cx="116" cy="258" r="5" />
              <circle cx="274" cy="182" r="5" />
              <circle cx="146" cy="182" r="5" />
              <path d="M 240 462 L 236 560" />
              <path d="M 236 580 L 233 688" />
              <path d="M 229 580 L 227 686" />
              <path d="M 180 462 L 184 560" />
              <path d="M 184 580 L 187 688" />
              <path d="M 191 580 L 193 686" />
              <circle cx="237" cy="570" r="5.5" />
              <circle cx="183" cy="570" r="5.5" />
            </g>
            <g
              class="organ"
              id="organ-spine"
              :class="{ lit: highlightPathId === 'organ-spine' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-spine')"
              @click="mode === 'explore' && emit('inspect', 'organ-spine')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-spine')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-spine')"
              @focus="emit('organFocus', 'organ-spine')"
              @blur="emit('organFocus', null)"
            >
              <rect v-for="y in vertebrae" :key="y" class="shape" x="203" :y="y" width="14" height="11" rx="3.5" />
            </g>
            <g
              class="organ"
              id="organ-ribcage"
              :class="{ lit: highlightPathId === 'organ-ribcage' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-ribcage')"
              @click="mode === 'explore' && emit('inspect', 'organ-ribcage')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-ribcage')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-ribcage')"
              @focus="emit('organFocus', 'organ-ribcage')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape" d="M 210 160 L 210 252" stroke-width="5" />
              <path
                v-for="r in [
                  'M 212 168 C 232 166 248 176 252 190',
                  'M 212 190 C 234 188 252 198 256 214',
                  'M 212 212 C 236 210 256 220 258 238',
                  'M 212 234 C 234 232 250 242 250 258',
                  'M 212 254 C 228 252 240 260 240 272',
                  'M 208 168 C 188 166 172 176 168 190',
                  'M 208 190 C 186 188 168 198 164 214',
                  'M 208 212 C 184 210 164 220 162 238',
                  'M 208 234 C 186 232 170 242 170 258',
                  'M 208 254 C 192 252 180 260 180 272',
                ]"
                :key="r"
                class="shape"
                :d="r"
              />
            </g>
            <g
              class="organ"
              id="organ-skull"
              :class="{ lit: highlightPathId === 'organ-skull' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-skull')"
              @click="mode === 'explore' && emit('inspect', 'organ-skull')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-skull')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-skull')"
              @focus="emit('organFocus', 'organ-skull')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape"
                d="M 176 62 C 176 34 191 22 210 22 C 229 22 244 34 244 62 C 244 82 238 95 227 101 C 221 104 215 106 210 106 C 205 106 199 104 193 101 C 182 95 176 82 176 62 Z"
              />
              <path class="detail" d="M 187 98 C 192 112 203 117 210 117 C 217 117 228 112 233 98" />
              <path class="detail" d="M 186 56 C 196 50 224 50 234 56" />
              <circle class="socket" cx="197" cy="64" r="4.5" />
              <circle class="socket" cx="223" cy="64" r="4.5" />
              <path class="socket" d="M 210 74 L 205 84 L 215 84 Z" />
            </g>
            <g
              class="organ"
              id="organ-pelvis"
              :class="{ lit: highlightPathId === 'organ-pelvis' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-pelvis')"
              @click="mode === 'explore' && emit('inspect', 'organ-pelvis')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-pelvis')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-pelvis')"
              @focus="emit('organFocus', 'organ-pelvis')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape"
                d="M 174 424 C 174 406 190 398 210 400 C 230 398 246 406 246 424 C 246 444 236 456 222 460 C 234 472 234 490 222 496 C 214 500 206 500 198 496 C 186 490 186 472 198 460 C 184 456 174 444 174 424 Z"
              />
              <path class="detail" d="M 202 434 L 218 434 L 212 470 Z" />
            </g>
          </g>

          <!-- ======= CIRCULATORY ======= -->
          <g
            v-show="layerOn('circulatory')"
            :ref="setLayerRef('circulatory')"
            class="layer sys-circulatory"
            :class="{ ghost: mode === 'overview' }"
          >
            <g
              class="organ"
              id="organ-arteries"
              :class="{ lit: highlightPathId === 'organ-arteries' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-arteries')"
              @click="mode === 'explore' && emit('inspect', 'organ-arteries')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-arteries')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-arteries')"
              @focus="emit('organFocus', 'organ-arteries')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape vessel" d="M 224 196 C 224 182 232 172 242 172 C 250 172 254 180 252 190 C 250 236 248 298 246 352 C 245 372 242 388 238 402" />
              <path class="shape vessel thin" d="M 224 176 C 222 160 220 146 218 124" />
              <path class="shape vessel thin" d="M 232 176 C 234 160 236 146 238 124" />
              <path class="shape vessel thin" d="M 230 194 C 256 202 278 222 292 250 C 304 274 310 302 313 334 C 314 356 314 376 312 394" />
              <path class="shape vessel thin" d="M 186 192 C 160 200 140 220 126 248 C 114 272 108 300 105 332 C 104 354 104 374 106 392" />
              <path class="shape vessel thin" d="M 214 428 C 224 456 232 494 236 534 C 238 574 236 622 234 662" />
              <path class="shape vessel thin" d="M 208 428 C 198 456 190 494 186 534 C 184 574 186 622 188 662" />
              <path class="shape vessel thin" d="M 244 340 C 240 352 236 362 230 370" />
            </g>
            <g
              class="organ"
              id="organ-veins"
              :class="{ lit: highlightPathId === 'organ-veins' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-veins')"
              @click="mode === 'explore' && emit('inspect', 'organ-veins')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-veins')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-veins')"
              @focus="emit('organFocus', 'organ-veins')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape vein" d="M 196 208 C 194 240 196 300 200 352 C 202 376 206 392 210 404" />
              <path class="shape vein" d="M 202 160 C 200 146 198 132 196 122" />
              <path class="shape vein" d="M 210 160 C 208 146 206 132 204 122" />
              <path class="shape vein" d="M 204 432 C 194 460 186 498 182 538 C 180 578 182 626 184 664" />
              <path class="shape vein" d="M 220 432 C 230 460 238 498 242 538 C 244 578 242 626 240 664" />
            </g>
            <g
              class="organ"
              id="organ-heart"
              :class="{ lit: highlightPathId === 'organ-heart' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-heart')"
              @click="mode === 'explore' && emit('inspect', 'organ-heart')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-heart')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-heart')"
              @focus="emit('organFocus', 'organ-heart')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape fillable"
                d="M 226 246 C 208 232 196 218 198 202 C 200 186 214 182 222 192 C 230 182 244 186 246 202 C 248 218 242 232 226 246 Z"
              />
              <path class="detail" d="M 208 206 C 216 204 230 208 236 216" />
              <path class="detail" d="M 218 206 C 208 202 196 210 186 216" />
              <path class="detail" d="M 234 206 C 244 202 252 210 258 218" />
            </g>
          </g>

          <!-- ======= RESPIRATORY ======= -->
          <g
            v-show="layerOn('respiratory')"
            :ref="setLayerRef('respiratory')"
            class="layer sys-respiratory"
            :class="{ ghost: mode === 'overview' }"
          >
            <g
              class="organ"
              id="organ-lungs"
              :class="{ lit: highlightPathId === 'organ-lungs' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-lungs')"
              @click="mode === 'explore' && emit('inspect', 'organ-lungs')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-lungs')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-lungs')"
              @focus="emit('organFocus', 'organ-lungs')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape fillable"
                d="M 194 184 C 176 184 163 199 158 224 C 154 248 158 272 168 285 C 178 296 191 293 195 281 C 199 268 199 240 199 214 C 199 197 199 184 194 184 Z"
              />
              <path
                class="shape fillable"
                d="M 234 190 C 248 186 260 200 264 224 C 268 248 264 272 254 285 C 245 294 235 291 233 280 C 231 268 232 240 233 216 C 233 202 234 196 234 190 Z"
              />
              <path class="detail" d="M 188 192 C 184 212 182 240 184 262" />
              <path class="detail" d="M 248 194 C 252 214 254 240 252 262" />
            </g>
            <g
              class="organ"
              id="organ-trachea"
              :class="{ lit: highlightPathId === 'organ-trachea' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-trachea')"
              @click="mode === 'explore' && emit('inspect', 'organ-trachea')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-trachea')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-trachea')"
              @focus="emit('organFocus', 'organ-trachea')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape" d="M 210 124 L 210 168" stroke-width="7" />
              <path
                v-for="y in tracheaTicks"
                :key="y"
                class="detail"
                :d="`M 206 ${y} L 214 ${y}`"
              />
              <path class="shape" d="M 210 168 C 205 178 197 184 188 188" stroke-width="5" />
              <path class="shape" d="M 210 168 C 215 178 223 184 232 188" stroke-width="5" />
            </g>
            <g
              class="organ"
              id="organ-diaphragm"
              :class="{ lit: highlightPathId === 'organ-diaphragm' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-diaphragm')"
              @click="mode === 'explore' && emit('inspect', 'organ-diaphragm')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-diaphragm')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-diaphragm')"
              @focus="emit('organFocus', 'organ-diaphragm')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape" d="M 158 296 C 172 280 192 272 210 278 C 228 272 248 280 262 296" stroke-width="4" />
              <path
                v-for="t in [
                  'M 174 288 L 170 297',
                  'M 190 282 L 187 291',
                  'M 230 282 L 233 291',
                  'M 246 288 L 250 297',
                  'M 162 295 L 160 302',
                  'M 258 295 L 260 302',
                ]"
                :key="t"
                class="detail"
                :d="t"
              />
            <path class="detail" d="M 166 308 C 180 294 194 288 210 292 C 226 288 240 294 254 308" />
            </g>
          </g>

          <!-- ======= DIGESTIVE ======= -->
          <g
            v-show="layerOn('digestive')"
            :ref="setLayerRef('digestive')"
            class="layer sys-digestive"
            :class="{ ghost: mode === 'overview' }"
          >
            <g
              class="organ"
              id="organ-esophagus"
              :class="{ lit: highlightPathId === 'organ-esophagus' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-esophagus')"
              @click="mode === 'explore' && emit('inspect', 'organ-esophagus')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-esophagus')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-esophagus')"
              @focus="emit('organFocus', 'organ-esophagus')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape" d="M 209 126 C 208 156 207 186 205 214 C 204 228 203 240 203 250" stroke-width="4" />
            </g>
            <g
              class="organ"
              id="organ-stomach"
              :class="{ lit: highlightPathId === 'organ-stomach' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-stomach')"
              @click="mode === 'explore' && emit('inspect', 'organ-stomach')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-stomach')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-stomach')"
              @focus="emit('organFocus', 'organ-stomach')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape fillable"
                d="M 204 250 C 184 248 170 262 170 284 C 170 306 186 320 206 317 C 216 315 222 308 223 300 L 236 306 C 242 303 242 294 235 291 L 223 292 C 226 276 220 252 204 250 Z"
              />
              <path class="detail" d="M 182 268 C 192 266 200 270 206 276" />
              <path class="detail" d="M 178 286 C 188 284 198 288 204 294" />
            </g>
            <g
              class="organ"
              id="organ-liver"
              :class="{ lit: highlightPathId === 'organ-liver' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-liver')"
              @click="mode === 'explore' && emit('inspect', 'organ-liver')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-liver')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-liver')"
              @focus="emit('organFocus', 'organ-liver')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape fillable"
                d="M 158 246 C 174 236 196 236 206 244 C 212 248 212 276 204 284 C 192 292 170 290 160 280 C 152 270 152 252 158 246 Z"
              />
              <ellipse class="detail" cx="176" cy="288" rx="6" ry="4" />
            </g>
            <g
              class="organ"
              id="organ-large-intestine"
              :class="{ lit: highlightPathId === 'organ-large-intestine' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-large-intestine')"
              @click="mode === 'explore' && emit('inspect', 'organ-large-intestine')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-large-intestine')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-large-intestine')"
              @focus="emit('organFocus', 'organ-large-intestine')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape bowel"
                d="M 186 400 C 178 392 176 350 180 318 C 184 308 200 302 216 302 C 228 302 238 308 242 316 C 248 340 248 368 242 390 C 238 404 226 410 216 412 C 213 416 212 424 212 434"
              />
            </g>
            <g
              class="organ"
              id="organ-small-intestine"
              :class="{ lit: highlightPathId === 'organ-small-intestine' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-small-intestine')"
              @click="mode === 'explore' && emit('inspect', 'organ-small-intestine')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-small-intestine')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-small-intestine')"
              @focus="emit('organFocus', 'organ-small-intestine')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape coil"
                d="M 226 318 C 234 330 216 340 198 338 C 180 336 172 348 186 358 C 200 368 226 364 236 374 C 244 382 236 392 216 392 C 196 392 184 384 178 392 C 172 400 184 408 192 408"
              />
            </g>
          </g>

          <!-- ======= NERVOUS ======= -->
          <g
            v-show="layerOn('nervous')"
            :ref="setLayerRef('nervous')"
            class="layer sys-nervous"
            :class="{ ghost: mode === 'overview' }"
          >
            <g
              class="organ"
              id="organ-nerves"
              :class="{ lit: highlightPathId === 'organ-nerves' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-nerves')"
              @click="mode === 'explore' && emit('inspect', 'organ-nerves')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-nerves')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-nerves')"
              @focus="emit('organFocus', 'organ-nerves')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape" d="M 208 160 C 190 178 168 204 148 236 C 136 254 128 276 122 300" />
              <path class="shape" d="M 212 160 C 230 178 252 204 272 236 C 284 254 292 276 298 300" />
              <path class="shape" d="M 210 200 C 196 208 182 220 172 236" />
              <path class="shape" d="M 210 200 C 224 208 238 220 248 236" />
              <path class="shape" d="M 210 260 C 198 268 188 280 182 294" />
              <path class="shape" d="M 210 260 C 222 268 232 280 238 294" />
              <path class="shape" d="M 209 448 C 202 480 197 520 194 560 C 192 606 194 650 195 680" />
              <path class="shape" d="M 211 448 C 218 480 223 520 226 560 C 228 606 226 650 225 680" />
              <path class="shape" d="M 210 240 C 206 260 204 280 205 300" />
            </g>
            <g
              class="organ"
              id="organ-spinal-cord"
              :class="{ lit: highlightPathId === 'organ-spinal-cord' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-spinal-cord')"
              @click="mode === 'explore' && emit('inspect', 'organ-spinal-cord')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-spinal-cord')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-spinal-cord')"
              @focus="emit('organFocus', 'organ-spinal-cord')"
              @blur="emit('organFocus', null)"
            >
              <path class="shape" d="M 210 100 L 210 440" stroke-width="4" />
              <path
                v-for="y in nerveRoots"
                :key="y"
                class="detail"
                :d="`M 210 ${y} C 206 ${y + 4} 202 ${y + 8} 198 ${y + 12}`"
              />
              <path
                v-for="y in nerveRoots"
                :key="y + 'r'"
                class="detail"
                :d="`M 210 ${y} C 214 ${y + 4} 218 ${y + 8} 222 ${y + 12}`"
              />
            </g>
            <g
              class="organ"
              id="organ-brain"
              :class="{ lit: highlightPathId === 'organ-brain' }"
              role="button"
              :tabindex="mode === 'explore' ? 0 : -1"
              :aria-label="organAria('organ-brain')"
              @click="mode === 'explore' && emit('inspect', 'organ-brain')"
              @keydown.enter.prevent="mode === 'explore' && emit('inspect', 'organ-brain')"
              @keydown.space.prevent="mode === 'explore' && emit('inspect', 'organ-brain')"
              @focus="emit('organFocus', 'organ-brain')"
              @blur="emit('organFocus', null)"
            >
              <path
                class="shape fillable"
                d="M 179 68 C 177 44 192 30 210 30 C 228 30 243 44 241 68 C 240 82 234 93 224 97 C 216 100 204 100 196 97 C 186 93 180 82 179 68 Z"
              />
              <path class="detail" d="M 190 58 C 198 50 206 58 214 50 C 222 42 232 50 234 60" />
              <path class="detail" d="M 188 76 C 200 70 208 80 220 74" />
              <path class="detail" d="M 198 40 C 206 36 216 38 224 44" />
            </g>
          </g>

          <!-- ======= pathway overlay ======= -->
          <g v-if="mode === 'pathway'" class="route" :style="{ '--route-ink': routeInk ?? 'var(--slate)' }" aria-hidden="true">
            <path
              v-for="seg in routeSegments"
              :id="`route-seg-${seg.id}`"
              :key="seg.id"
              class="route-seg"
              :d="seg.d"
              :stroke-dasharray="seg.len"
              :stroke-dashoffset="0"
            />
            <g v-for="(stop, i) in plateRoute" :key="i" class="route-stop">
              <circle class="route-dot" :cx="stop.node[0]" :cy="stop.node[1]" r="13" />
              <text class="route-num" :x="stop.node[0]" :y="stop.node[1] + 4" text-anchor="middle">
                {{ i + 1 }}
              </text>
            </g>
          </g>
        </g>

        <!-- ======= callout labels (plate coordinates) ======= -->
        <g v-if="mode === 'explore'" class="callouts" aria-hidden="true">
          <template v-for="row in callouts.left" :key="row.organ.id">
            <path
              class="leader"
              :d="leaderD('left', row.packedY, row.organ.label.anchor[0], row.organ.label.anchor[1])"
              :class="{ dim: highlightPathId && highlightPathId !== row.organ.pathId }"
            />
            <circle
              class="leader-dot"
              :cx="row.organ.label.anchor[0]"
              :cy="row.organ.label.anchor[1]"
              r="2.5"
            />
            <text class="callout-figure" x="150" :y="row.packedY - 8" text-anchor="end">
              {{ row.figure }}{{ explored?.has(row.organ.id) ? ' · SEEN' : '' }}
            </text>
            <text class="callout-name" x="150" :y="row.packedY + 4" text-anchor="end">
              {{ row.organ.name.toUpperCase() }}
            </text>
          </template>
          <template v-for="row in callouts.right" :key="row.organ.id">
            <path
              class="leader"
              :d="leaderD('right', row.packedY, row.organ.label.anchor[0], row.organ.label.anchor[1])"
              :class="{ dim: highlightPathId && highlightPathId !== row.organ.pathId }"
            />
            <circle
              class="leader-dot"
              :cx="row.organ.label.anchor[0]"
              :cy="row.organ.label.anchor[1]"
              r="2.5"
            />
            <text class="callout-figure" x="410" :y="row.packedY - 8">
              {{ row.figure }}{{ explored?.has(row.organ.id) ? ' · SEEN' : '' }}
            </text>
            <text class="callout-name" x="410" :y="row.packedY + 4">
              {{ row.organ.name.toUpperCase() }}
            </text>
          </template>
        </g>
      </svg>
    </div>
  </figure>
</template>

<style scoped>
.plate {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.plate-caption {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
}

.plate-mat {
  background: var(--paper-raised);
  border: var(--hairline);
  border-radius: 4px;
  padding: 8px 6px;
  /* ruler ticks along the top mat edge */
  background-image: repeating-linear-gradient(
    to right,
    var(--line) 0,
    var(--line) 1px,
    transparent 1px,
    transparent 12px
  );
  background-size: 100% 6px;
  background-repeat: no-repeat;
}

.plate-svg {
  display: block;
  width: 100%;
  height: auto;
}

/* ---- silhouette ---- */
.silhouette {
  fill: #f6efe2;
  stroke: var(--ink);
  stroke-width: 2;
}

/* ---- layers ---- */
.layer {
  transition: opacity 0.2s var(--ease);
}
.layer.ghost {
  opacity: 0.16;
}

.layer .shape,
.layer .detail,
.layer .vessel,
.layer .vein,
.layer .coil,
.layer .bowel {
  fill: none;
  stroke: var(--sys-ink);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.layer .shape {
  stroke-width: 2.4;
}
.layer .detail {
  stroke-width: 1.4;
  opacity: 0.85;
}
.layer .vessel {
  stroke-width: 3;
}
.layer .vessel.thin {
  stroke-width: 2.4;
}
.layer .vein {
  stroke-width: 2.6;
  opacity: 0.7;
  stroke-dasharray: 7 3;
}
.layer .coil {
  stroke-width: 7.5;
}
.layer .bowel {
  stroke-width: 10;
}

/* bones: filled vertebrae/sockets */
.layer.sys-skeletal .shape,
.layer.sys-skeletal .detail {
  fill: none;
}
.layer.sys-skeletal rect.shape {
  fill: var(--bone);
  stroke: var(--bone-edge);
  stroke-width: 1.6;
}
.layer.sys-skeletal .socket {
  fill: var(--paper-deep);
  stroke: var(--bone-edge);
  stroke-width: 1.6;
}
.layer.sys-skeletal .bones-decor path,
.layer.sys-skeletal .bones-decor circle {
  fill: none;
  stroke: var(--bone-edge);
  stroke-width: 3.4;
  opacity: 0.9;
}
.layer.sys-skeletal .bones-decor circle {
  fill: var(--bone);
  stroke-width: 1.6;
}

/* organ fills: low-opacity system wash on the solid organs */
.layer .fillable {
  fill: var(--sys-fill);
  fill-opacity: 0.85;
}

/* ---- organs: hit targets + focus/hover states ---- */
.organ {
  cursor: pointer;
  pointer-events: bounding-box;
}
.plate-pathway .organ,
.layer.ghost .organ {
  cursor: default;
  pointer-events: none;
}
.organ:hover .shape,
.organ:hover .fillable,
.organ:hover .coil,
.organ:hover .bowel,
.organ:hover .vessel,
.organ:hover .vein {
  stroke-width: 4;
  stroke: var(--sys-ink-deep);
}
.organ:focus-visible {
  outline: none;
}
.organ:focus-visible .shape,
.organ:focus-visible .fillable,
.organ:focus-visible .coil,
.organ:focus-visible .bowel,
.organ:focus-visible .vessel,
.organ:focus-visible .vein {
  stroke: var(--ink);
  stroke-width: 4.2;
}
.organ.lit .shape,
.organ.lit .fillable,
.organ.lit .coil,
.organ.lit .bowel,
.organ.lit .vessel,
.organ.lit .vein {
  stroke: var(--ink);
  stroke-width: 4;
}

/* ---- route overlay ---- */
.route-seg {
  fill: none;
  stroke: var(--route-ink, var(--slate));
  stroke-width: 3.4;
  stroke-linecap: round;
  opacity: 0.9;
}
.route-dot {
  fill: var(--paper-raised);
  stroke: var(--route-ink, var(--slate));
  stroke-width: 2.6;
}
.route-num {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  fill: var(--ink);
}

/* ---- callouts ---- */
.leader {
  stroke: var(--ink-soft);
  stroke-width: 1;
  fill: none;
  opacity: 0.7;
  transition: opacity 0.16s var(--ease);
}
.leader.dim {
  opacity: 0.22;
}
.leader-dot {
  fill: var(--ink-soft);
}
.callout-figure {
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  fill: var(--ink-soft);
}
.callout-name {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  fill: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  .layer {
    transition: none;
  }
}
</style>
