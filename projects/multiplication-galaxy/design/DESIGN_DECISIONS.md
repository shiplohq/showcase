# DESIGN_DECISIONS — Multiplication Galaxy (Showcase #04)

> Design system lock for showcase #04. Source: spec `.showcase/04_multiplication-galaxy.md`
> (retro-future science book thesis is LOCKED) cross-checked against UI UX Pro Max
> (queries: `kids education math game elementary learning`, `space retro futurism editorial book flat illustration`,
> `grotesk display sans geometric technical`, `fraunces retro serif display book`, `work sans humanist grotesque body UI`,
> `children feedback error non-punitive retry learning`, `gsap orbital motion path travel spatial`).
> Brief beats recommendations: every skill suggestion that contradicts the science-book
> star-chart thesis is dropped (logged in §15).

## 1. Visual thesis

**A retro-future astronomy atlas, silk-printed.** The app is a working star chart
from a 1970s science book that suddenly became playable: a deep navy-ink ground
like ink pressed on dark silk, hairline cream chart lines (declination arcs,
graticule ticks, registration crosses), planets printed as flat two-tone halftone
discs with crisp ring marks — no glow, no neon, no 3D. Multiplication is drawn
the way an atlas would draw it: **a × b = a concentric orbit rings, each carrying
b satellites**. Numbers are set big like poster astronomy — display numerals on
the chart itself, the way an atlas labels a planet's distance in the margin.

Keywords: silk-print star chart · ink navy · hairline cream rules · halftone
two-tone planets · registration marks · atlas margin labels · instrument type ·
calm precision, never arcade.

This is deliberately NOT "space app neon": no purple/blue gradient nebula, no
glow bloom, no lens flare, no dark-glass panels. The distinctness comes from
print language: hairlines, ticks, crosses, dotted orbital paths, generous
margins, cream-on-ink contrast.

## 2. Target age

7–10 years (grades 2–4): moving from skip counting to fluent facts, needing
**groups/arrays meaning** before recall. Consequences:

- Reading is assumed but short: instruction sentences ≤ 12 words, question
  headlines are numerals-first (`4 × 6`), unit of engagement is one fact.
- Skip-count scaffolding is always one interaction away (count-by-rings), never
  forced — the child chooses to count.
- Motivation is cartographic: every correct fact **locks an orbit** on the
  galaxy map; the chart fills in like an expedition log. No score, no lives,
  no leaderboard, no timer.
- Errors are instrument readings, not failures: "signal drifted" copy with a
  course hint, never red alarms, never buzzers.

**UI language: English.** The spec's JSON contract and interaction copy examples
are English ("4 groups of 6 make 24."), and its acceptance list is
language-neutral — English UI, consistent everywhere, numerals always rendered
in the display face. (Fonts still bundle `vietnamese` subsets — see §5.)

## 3. Learning interaction principles

1. **The array IS the orbit system** — a × b is drawn as a rings × satellites
   structure before any symbol appears; the fact `4 × 6` is a caption the child
   attaches to a picture they can already read.
2. **Repeated addition is visible on demand** — hover/touch any ring (or press
   "Count by rings") and rings light up one at a time with a running skip-count
   label (6 · 12 · 18 · 24). Rows are groups; this is the spec's core loop.
3. **Missing factor = missing structure** — the chart draws a torn/faded ring
   set; the child infers the missing dimension from the visible total, keeping
   division and multiplication one picture.
4. **Answering happens on the chart** — answers are four "orbital nodes"
   (small satellite dials) placed around the array, not a button card row.
5. **Correct = stability** — right answer morphs the messy, drifting ellipse
   into a locked circular orbit + registration cross ticks: the fact becomes
   permanent knowledge, shown as a stable chart.
6. **Drift, don't punish** — wrong answer: the orbit wobbles, copy names what
   to re-check ("Count the rings — each carries 6"), the child retries; nothing
   is taken away. No time pressure anywhere (acceptance item).
7. **Progress is the map** — streak pips exist ("signal strength") but decay
   silently, unlock nothing, and hide after 3 to stay out of the way.

## 4. Color tokens

Ink-and-cream chart palette from the spec thesis (navy tint, mineral teal,
star orange, cream). Flat fills, hairlines, no gradients.

### Ground (ink)

| Token | Hex | Role |
|---|---|---|
| `--void` | `#11141F` | Page ground — navy-ink print base |
| `--chart` | `#171C2C` | Chart panel ground (map, mission stage) |
| `--chart-raised` | `#1E2438` | Raised instrument strip, node wells |
| `--rule` | `#39415C` | Hairline rules, inactive graticule (visible on void) |
| `--rule-dim` | `#2A3047` | Faint graticule, inactive orbit paths |

### Ink on paper (text)

| Token | Hex | Role |
|---|---|---|
| `--cream` | `#F1E8D2` | Primary text / active chart lines (≈13:1 on void) |
| `--cream-dim` | `#B9B09A` | Secondary text, caption labels (only ≥16px) |
| `--paper` | `#F5EEDC` | Answer-node dial face, highlight plate |

### Accents

| Token | Hex | Role |
|---|---|---|
| `--mineral` | `#4E9B97` | Mineral teal — locked orbits, correct state, active planet |
| `--mineral-deep` | `#37716E` | Teal pressed/edge |
| `--mineral-bright` | `#7CC4BF` | Teal for text-size usage on void |
| `--saffron` | `#E89A3C` | Star orange — primary CTA, probe flame, focus complement |
| `--saffron-deep` | `#C47A1F` | Pressed CTA |
| `--ember` | `#C9702E` | Drift/nudge accent (warm amber — never alarm red) |
| `--lilac-ink` | `#8E8AA6` | Muted lavender-grey — nebula margin notes, "atlas" flavor only |

### State mapping (never color-only — always icon + text, §10)

- **Locked / correct** = `--mineral` + check-ring icon + "Orbit locked" text.
- **Drift / retry** = `--ember` + drift-arrow icon + guidance text.
- **Focus-visible** = 2px `--saffron` ring + 2px void gap — reads on every
  surface including the paper dial face (saffron-deep there).
- No pure red anywhere in the palette. No state is expressed by hue alone.

## 5. Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display / facts / numerals / headings | **Space Grotesk** (OFL, Florian Karsten) | 500–700 | Technical grotesk with distinctive numerals — instrument-panel lineage; subsets `latin` `latin-ext` `vietnamese` ✓ |
| Body / UI / microcopy | **Work Sans** (OFL, Wei Huang) | 400–600 | Neutral warm grotesk, high x-height for young readers; subsets `latin` `latin-ext` `vietnamese` ✓ |

- Self-hosted via `@fontsource/space-grotesk` + `@fontsource/work-sans`, importing
  **both `latin-*` AND `vietnamese-*` subset css per weight** (pilot #01 rule —
  language-only subsets leave base letters and every numeral on system fallback).
  No runtime Google Fonts.
- Scale (tablet-first): fact display `clamp(34px, 5vw, 56px)/1` Grotesk 700 with
  `font-variant-numeric: tabular-nums` · section 22–26 Grotesk 600 · body 16–18/1.5
  Work Sans 400–500 · microcopy ≥13 desktop / ≥15 tablet · skip-count labels
  20–28 Grotesk 600.
- Atlas margin style: small-caps-like uppercase letter-spaced labels
  (`0.14em`, Work Sans 600, 12–13px) for chart furniture ("SECTOR 4 · RING COUNT").

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64 · 96`. Screen gutters
16 (mobile) / 24 (tablet) / 40 (desktop). Chart margins are generous by design
(atlas plates breathe): ≥32px between stage edge and any hairline rule.
Gap between two touch targets ≥ 8px.

## 7. Layout / grid

- One full-viewport "atlas plate" per screen; CSS grid rows
  `[chart-header · stage · instrument-dock]`; the stage owns ~65–70%.
- Content max-width **1240px** on desktop; tablet landscape/portrait is the hero.
- **Galaxy map = a chart, not a card grid**: the 11 tables (2–12) sit as
  constellation groups along a gently arcing path across the plate — each group
  is its actual orbit miniature (rings × satellites at a glance) with a margin
  label. Locked tables print in mineral teal; unexplored ones as dotted outlines.
  Positions come from `galaxies.json` `constellationLayout` (percent coordinates),
  so the map is data-driven, never a uniform grid.
- **Mission stage**: left/center orbit array (the a×b system), right column
  instrument strip (fact readout, orbital answer nodes, count-by control).
  Mobile stacks them (stage above, instruments below).
- **Mission log**: a true mastery matrix — 11 rows × 6 fact-columns of small
  orbit glyph cells (locked/drifted/unvisited), plus a margin summary; this is a
  chart, allowed to be tabular, but cells are orbit marks, not cards.
- Overlays (chapter intro, galaxy complete) are full-plate silk layers with
  their own margin frame; ESC/Back closes.

## 8. Touch-target rules

- Primary CTA (`Lock orbit` moment = tapping an answer node): node dial
  **≥64×64px** visual, hit area padded to ≥72px.
- Standard controls (count-by, map nav, reset): **≥48×48px**.
- Orbit ring/satellite hover regions: rings are ≥18px stroke hit band; on touch
  the whole ring annulus is tappable. Nothing requires hover — hover only
  pre-lights on desktop.
- Spacing ≥ 8px between nodes; the 4 answer nodes sit on a wide arc, never a
  cramped row.

## 9. Illustration language

- **Code-native SVG is the default and the main medium** (spec: original SVG
  illustration): planets are flat two-tone halftone discs (base fill + 2–3
  arc bands + tiny crater dots) built from shared primitives; the probe is a
  small geometric craft with an orange flame tick; orbit paths are dotted
  hairlines; registration crosses (+) and graticule ticks are the chart
  furniture. One `planetStyle` param set per galaxy (hue pair from the locked
  accent list) keeps 11 constellations distinct without new art.
- **Starfield is procedural** — canvas or SVG star field generated at mount
  (deterministic seed), cream points at 3 opacities, a few 4-point diffraction
  crosses; count capped (≤140 elements, no per-star animation loops — spec's
  60fps/DOM-star warning). Twinkle, if any, is a single slow CSS opacity cycle
  on 2–3 grouped layers, not per-star.
- Print texture: a **procedural SVG `feTurbulence` grain at 3–4% opacity**
  fixed overlay — no raster asset needed (Codex not invoked; a silk-print read
  is achievable in CSS, see `design/` note in README).
- Shadows: none to speak of — print layers overlap with 1px offset duplicates
  (like misregistered print), never soft drop shadows.
- No emoji as visual language; icons are inline SVG strokes matched to the
  chart furniture weight (1.5px, cream).

## 10. Feedback states

| State | Expression |
|---|---|
| Hover (desktop only) | ring pre-light (rule → cream), node dial lifts 1px, 140ms |
| Focus-visible | 2px saffron ring + void gap — always visible, never removed |
| Press | dial scale 0.97, chart line brightens, 120ms |
| **Correct** | ellipse morphs to circle 320ms + cross-ticks draw in + satellites pulse once (stagger 30ms) + live region "Orbit locked. 4 × 6 is 24." |
| **Drift (wrong)** | orbit wobbles 2 gentle sways ≤360ms, ember drift-arrow icon + copy "Signal drifted. Each ring carries 6 — count the rings."; the picked node dims; retry immediately, unlimited |
| Skip-count | each ring lights in sequence 260ms apart with running label `6 · 12 · 18 · 24` (Grotesk 600, cream); cancelable |
| Streak | up to 3 signal pips in header margin; decay to zero silently; never blocks |
| Map lock | constellation path solidifies dotted→solid 500ms once, on first return to map after completing a galaxy |

All feedback announced via `aria-live="polite"`; copy states what happened and
what to look at, in reading-age English.

## 11. Motion budget

From spec (locked): feedback 120–220ms · spatial 250–500ms · delight ≤900ms ·
no intro that blocks input · natural easing (`power2.out`, `power3.out`;
`back.out(1.2)` reserved for the single lock confirmation) · no decorative
bounce/elastic · no infinite ambient loops except the capped star layer (which
reduced-motion removes).

GSAP assignments (all through `src/lib/gsap.ts` wrapper):

- **Probe travel** (map → mission entry): probe dot eases along a dotted
  transfer arc 380–460ms, `power3.inOut` — spatial continuity between screens.
- **Array build-up** (comprehension, spec-named): rings scale in from the
  center outward, 240ms each, stagger 90ms; satellites pop last (stagger 24ms).
  Plays on mission entry and on "Show the array" replay.
- **Orbit lock**: ellipse → circle morph + tick draw, 320ms `back.out(1.2)`.
- **Drift wobble**: rotation/ry skew ±1.5°, two sways, ≤360ms, `sine.inOut`.
- **Skip-count sequence**: ring highlight steps 260ms cadence.
- All tweens killed on unmount; reduced motion → final states applied
  instantly (wrapper), starfield static, probe jumps.

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (education showcase): stage left /
  instruments right in landscape; portrait stacks stage-over-instruments with
  the dock pinned bottom. Touch-first sizing throughout.
- **Desktop ≥1200**: wider margins, map constellation path spans more plate,
  reading column capped ~68ch; no gratuitous scale-up.
- **Mobile 360–479**: `supported` target — single column, array stage scales
  (satellite size floors at 12px, arrays above 8×9 switch to a compact
  "sector grid" rendering that keeps ring grouping readable), answer nodes in
  a 2×2 dial grid, dock becomes bottom sheet. If honest testing at 390×844
  shows the array unreadable, downgrade to `mobileSupport: "limited"` with a
  note — never ship a squeezed layout silently.
- Breakpoints: `360 / 480 / 768 / 1024 / 1200`. No horizontal scroll at any;
  200% zoom reflows (flex/grid wrap, no fixed-width stages).

## 13. Accessibility constraints

- Semantic HTML first: `header/main`, real `<button>`s, question as `<h1/h2>`,
  landmarks labeled; `lang="en"`.
- **Text equivalent of every visual question** (spec acceptance): the array has
  an sr-only description ("Chart shows 4 rings; each ring carries 6 satellites");
  skip-count labels are real text; numerals are text.
- **Full keyboard path (definition of done)**:
  1. Tab reaches the 4 answer nodes (roving `radiogroup` semantics, arrows
     move between nodes, Enter/Space selects — matches the orbital metaphor).
  2. Tab reaches "Count by rings" (Enter runs the sequential highlight with
     live-region narration of the running count).
  3. Tab reaches map constellations (arrows navigate the chart path, Enter
     opens); Mission Log reachable and readable as a table.
  4. ESC closes overlays; focus returns to the opener.
- Focus always visible; no traps; no hover-only; no color-only meaning.
- No forced timers anywhere; streak is cosmetic.
- `localStorage` holds only anonymous progress (locked facts, streak decay
  stamp, reduced-motion-independent prefs) + an explicit Reset in Mission Log.
- Audio: none in this project (WebAudio clicks add little to a print atlas and
  the spec does not require sound) — all information visual+text.

## 14. Anti-patterns (forbidden)

1. Neon cyberpunk / synthwave / CRT scanline / glow text-shadow — the skill's
   default "retro-futurism" is **banned** here (spec: no neon cyberpunk).
2. Purple→blue gradient nebula, or any decorative gradient — silk print is flat.
3. Glassmorphism, thick shadows, 3D planets, lens flare, heavy blur.
4. Card-inside-card soup; uniform card grids; dashboard chrome; fake analytics.
5. Emoji as visuals; raster-generated UI icons; text baked into images.
6. Score, lives, leaderboard, countdown, punitive red/shake errors.
7. Decorative bounce/elastic because GSAP exists; infinite loops; intro locks.
8. Hover-dependent interaction; targets <48px; body text <16px on tablet.
9. Runtime CDN of any asset (fonts, GSAP, images) — everything bundled.
10. Number Garden's visual language (paper-cut warm cream garden, Baloo 2) —
    this is a different showcase; shared *workflow*, not shared *art*.

## 15. UI UX Pro Max cross-check — keep / drop

| Skill recommendation | Decision |
|---|---|
| Kids learning → Claymorphism + vibrant block-based, pastel candy palette | **DROP** — soft-3D plastic contradicts flat silk-print chart (§14) |
| Style DB "retro-futurism" = neon blue/pink, CRT scanlines, glitch | **DROP** — spec explicitly bans neon cyberpunk; keep only the "vintage sci-fi print" spirit, re-derived as ink/cream/teal/saffron |
| Micro-interactions: 50–100ms hovers, clear success/error states | **KEEP** (within spec budget §11) |
| Touch targets ≥44px, spacing ≥8px | **KEEP + tighten** to ≥48px (age 7–10 on tablet) |
| Error feedback near the problem + recovery path, non-punitive | **KEEP** — drift copy + retry (§10) |
| prefers-reduced-motion severity High, gsap.matchMedia, kill loops on unmount/hidden | **KEEP** (wrapper §11; star layer pauses when hidden) |
| Fraunces retro serif display (found in search) | **DROP** — bookish serif fights instrument numerals; Space Grotesk chosen from the same search results (rank 67, OFL, vietnamese ✓) |
| Swiss/minimalism styles | **PARTIAL** — grid discipline + generous margins adopted; monochrome austerity dropped for the atlas accents |
| Skeleton shimmer / loader loops | **N/A** — content is local JSON; mount states are instant, no loaders |
| Chart guidance: "do not rely on color alone; print values/symbols" | **KEEP** — mastery matrix cells carry glyph + text value labels (§7) |

**Speed mode** (spec: "a separate optional mode") — **out of scope for #04**:
the spec's IA (4 screens) and acceptance list (no forced countdown) define the
core; an optional timer mode adds risk surface without strengthening the
array-comprehension thesis. Recorded here so the cut is a decision, not an
omission.

## 16. Amendments from the impeccable pass (2026-09-01)

The critique (29/40 → fix batch, snapshot `.impeccable/critique/`) drove these
amendments — recorded here so this file stays the truth:

1. **§3.2 skip-count is auto** — "Count by rings" runs the sequence itself at
   the spec's 260ms cadence (cancelable via Reset); manual stepping ×11 to
   reach 144 was a flexibility failure, not calm.
2. **§3.3 missing-factor rendering** — the "torn ring set" is amended to:
   full array + a total badge ("42 satellites · ? rings") + the masked fact
   readout. Ghosting the objects would break the counting strategy the
   mission exists to teach.
3. **§7 map layout** — chart-arc layout only ≥1200px; the tablet band gets
   the expedition grid (the arc's constellation hit-areas physically
   overlapped at 1024). Arrow keys walk the chart path.
4. **§10 map lock payoff implemented** — a constellation that completed since
   the last map visit solidifies dotted→solid once (500ms).
5. **§12 dense systems (≥90 satellites)** — satellites alone cannot stay
   countable at 12×12 on all viewports: cumulative ring tally labels
   (12 · 24 · … · 144) render beside the rings, drift variance shrinks
   (squash ≥0.94, tilt ±4°), and satellite radius is clearance-guaranteed
   (`minSatelliteSeparation` asserted in the engine sim). Narrow viewports
   (≤959px) get a sticky instrument dock with inline feedback.
6. **§9 GSAP owns drift transforms** — JSX renders `.ring-drift` without a
   transform; GSAP sets/locks it. Lesson: `gsap.context().revert()` in React
   cleanups runs AFTER React commits fresh attributes and clobbers them —
   cleanups `kill()`, never `revert()`, when React re-renders the same DOM.
7. **Header** — one contextual nav control (screens own their back), and the
   child-facing margin label says "Orbital fact charts · tables 2–12" instead
   of showcase meta (meta lives in README/HANDOFF).
