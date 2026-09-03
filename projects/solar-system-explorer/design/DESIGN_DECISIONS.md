# DESIGN_DECISIONS — Solar System Explorer (Showcase #11)

> Design system lock for showcase #11. Source: spec
> `.showcase/11_solar-system-explorer.md` (scientific atlas + museum exhibit
> thesis is LOCKED) cross-checked against UI UX Pro Max
> (queries: `science museum exhibit data atlas education children`,
> `comparative data visualization scale size education`, `dark mode contrast data dashboard readability`,
> `serif display technical mono data font pairing`, `horizontal scroll gallery museum exhibition navigation`,
> `gsap horizontal scroll section motion path orbit`, `toggle switch segmented control mode view accessibility`,
> `children touch target size forgiving error feedback`, `drag and drop reorder keyboard accessible alternative`,
> `editorial serif display font elegant museum book`, `education science students 8-13 learning interactive`).
> Brief beats recommendations: every skill suggestion that contradicts the
> museum-exhibit atlas thesis is dropped (logged in §15).

## 1. Visual thesis

**A mineralogical exhibition hall of the Solar System.** The app is a museum
gallery you *walk* rather than a chart you *read*: a horizontal corridor on a
near-black navy ground, one long horizontal datum line (the ecliptic) carrying
eight planet **specimen stations** like pedestals along a wall. Each planet is
a dimensional **gradient sphere** rendered as original SVG — a mineral
specimen lit from one side, with thin latitude bands where the real planet has
them — sitting on a **parchment label plate** typeset like a museum wall label:
planet name in book serif, catalogue number (orbital order) and instrument
readouts in mono. The Sun is not a station; it is the lit doorway at the left
end of the hall that the corridor begins at.

The three view modes are three *ways the curator hangs the same collection*:
**Distance** spaces the stations along a log-scaled AU axis; **Size** re-hangs
them at equal spacing with radii on a compressed scale; **Day & Year** replaces
distance with time — each specimen gets normalized day/year ring gauges. The
app never pretends to absolute scale: every mode carries its honesty note
(spec acceptance: scale disclaimer).

Keywords: exhibition corridor · near-black navy · parchment specimen labels ·
mineral pigments · gradient spheres · catalogue numerals · datum line with
AU ticks · museum wall text · calm, lit, walkable.

**Deliberate divergence from Showcase #04** (also a space atlas — vintage
silk-print star chart, Space Grotesk, flat halftone discs, centered radial
chart, hairline graticule): #11 is a *linear gallery*, not a radial chart;
*dimensional gradient spheres*, not flat two-tone discs; *book serif + mono*
wall-label typography, not grotesk poster type; *substantial parchment plates*
as the label material, not cream hairline rules; *specimen-column data
density* (aligned measurement bars with numeric readouts), not a single
playable array. Ground is near-black (navy-cast) where #04 is navy-ink silk.

## 2. Target age

8–13 years (grades 3–8): confident readers, building proportional reasoning —
relative size, relative distance, day/year as time scales. Consequences:

- Reading is fine but scannable: labels ≤ 8 words, facts ≤ 18 words, numbers
  always shown in mono readouts next to any visual scale.
- The unit of engagement is *one planet specimen*; comparison is the core
  cognitive act, so compare mode is a first-class screen, not a tooltip.
- Scale honesty is content, not fine print: the caveat panel is reachable from
  the header and re-stated inline per view ("distances here are compressed —
  at true scale Neptune sits ~30× farther than Earth").
- Motivation is curatorial: an "expedition log" of visited planets fills in;
  quiz feedback names the fact ("Jupiter spins once in only 9.9 hours"), not a
  score. No timer, no lives, no streak pressure.
- Errors are invitations: "Not yet — look at the day lengths again" with the
  relevant column highlighted.

**UI language: English** (spec's JSON contract and fact examples are English;
lead direction: English UI, consistent). Fonts still bundle `vietnamese`
subsets alongside `latin`/`latin-ext` so both families pass the repo font
gate for any future localization.

## 3. Learning interaction principles

1. **Walk the corridor** — orbital order is *space you traverse*: horizontal
   scroll/touch from the Sun outwards, arrow buttons and per-planet focus
   always available; order is learned by walking it (spec: horizontal orbit
   navigation with wheel/touch + arrow controls).
2. **One collection, three hangs** — size / distance / day-year are the same
   eight specimens re-arranged; switching modes *morphs* the corridor (spatial
   continuity), so children see that "which planet is biggest" and "which is
   farthest" are different questions on the same data.
3. **Numbers ride with the picture** — every visual scale (sphere radius,
   station offset, ring gauge) is paired with a mono numeric readout; nothing
   is communicated by size or color alone (a11y + dataviz guidance).
4. **Compare is aligned columns** — pick 2–3 specimens and their measurements
   line up in shared rows (radius, day, year, moons, distance) as horizontal
   bars with values — never generic card grid (spec: aligned specimen columns).
5. **Honest scales** — log/compressed scales are labelled as such, with a
   "Reading this atlas" panel explaining why absolute scale cannot fit a
   screen; spec acceptance item #1.
6. **Time is normalized, never physical** — day/year ring animations run at
   readable normalized speeds (fastest ring ≈ 6 s/turn, ratios preserved
   perceptually); spec acceptance: no unusable real-speed animation.
7. **Quiz by handling specimens** — drag medallions into orbital order, or
   match a property to its planet; keyboard path (select + move buttons) is
   first-class per WCAG 2.2 dragging-movements guidance.
8. **Non-punitive always** — wrong answers keep work in place, highlight what
   to re-check, never flash red/shake/count down.

## 4. Color tokens

Mineral-pigment palette on near-black navy, parchment labels. Flat fills with
one directional light on spheres (SVG radial gradients); no glow, no neon, no
decorative gradients outside sphere shading.

### Ground (hall)

| Token | Hex | Role |
|---|---|---|
| `--hall` | `#0B0E16` | Main ground — near-black navy |
| `--hall-raised` | `#121724` | Raised strips (header, footer, sheet) |
| `--hall-deep` | `#070910` | Recessed wells (quiz dock, compare picker) |
| `--line` | `#2A3143` | Hairlines, datum line, tick marks |
| `--line-soft` | `#1C2232` | Secondary rules, column separators |
| `--parchment` | `#EDE2C8` | Specimen label plates, wall plaques |
| `--parchment-deep` | `#E0D2AF` | Plate edge / pressed state |
| `--plate-ink` | `#2B2416` | Text on parchment (contrast ~11.5:1) |
| `--plate-ink-soft` | `#5C5138` | Secondary text on parchment (≥4.5:1 at 14px+) |
| `--text` | `#E9E3D2` | Primary text on hall (contrast ~13:1) |
| `--text-soft` | `#B4AF9E` | Secondary text on hall (~7.6:1) |

### Mineral pigments (planet identities — also drive sphere gradients)

| Token | Hex | Planet |
|---|---|---|
| `--min-mercury` | `#9A938B` | graphite |
| `--min-venus` | `#E2C26D` | sulfur |
| `--min-earth` | `#4C8FC4` | azurite (landmasses `--min-earth-green #4E9E6B` malachite) |
| `--min-mars` | `#C25B33` | hematite |
| `--min-jupiter` | `#C89B5E` | ochre (bands `#A87A44` / `#E2BE8C`) |
| `--min-saturn` | `#D8BE80` | pale gold (rings `#B8A267`) |
| `--min-uranus` | `#6FB8AC` | verdigris |
| `--min-neptune` | `#5A79C4` | lapis |

### Interactive / status (never color-only)

| Token | Hex | Role |
|---|---|---|
| `--brass` | `#D5A85C` | Museum brass — links, selection edge, focus halo on dark |
| `--brass-deep` | `#B98F45` | Pressed brass |
| `--ok` | `#79B98D` | Correct — always with check glyph + text |
| `--retry` | `#D9A441` | Try-again — always with arrow glyph + text |
| `--focus` | `#F2E7CD` | Focus ring (2px + 2px hall gap), visible on parchment and hall |

Sphere gradients use `colorStops` from `planets.json` (three stops: lit →
mid → shadow); tokens above document the same values. The Sun is a brass
radial glow rendered as SVG gradient disc, cropped by the hall edge — light
source of the whole exhibit.

## 5. Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display / planet names / wall text | **Gentium Book Plus** (SIL OFL) | 400, 700 (+400i for Latin binomials like *Mars*) | Book face = museum wall label; subsets `latin`, `latin-ext`, `vietnamese` |
| Data / measurements / UI controls / ticks | **Space Mono** (OFL, Colophon/Google) | 400, 700 | Typewriter catalogue-card numerals; `font-variant-numeric: tabular-nums`; subsets `latin`, `latin-ext`, `vietnamese` |

- Self-hosted via `@fontsource/gentium-book-plus` + `@fontsource/space-mono`
  (bundled — no runtime Google Fonts, repo font policy).
- No sans anywhere: serif wall text + mono instruments is the whole system —
  a deliberate divergence from every shipped showcase (#01 rounded, #02/#16
  Fraunces, #03/#04 grotesk).
- Scale (tablet-first): exhibit title `clamp(30px, 4vw, 44px)/1.1` Gentium 700 ·
  planet names 22–30 Gentium 700 · section labels 13–14 Space Mono 700
  uppercase `letter-spacing: 0.14em` · body/facts 16–18/1.55 Gentium 400 ·
  big readouts 20–36 Space Mono 700 (tabular) · microcopy ≥ 14px.
- Colour of type on parchment = `--plate-ink`; on hall = `--text`.
- **Type floor (post-impeccable clarification, 2026-09-02):** reading text is
  ≥ 13px (serif body 14+, mono readouts 12.5px+ on plates, mono captions 13px);
  *duplicated decorative numerals* — the AU ticks under the datum line and the
  catalogue "no." line — may go down to 10.5px because every value they carry
  is repeated at reading size on the same plate, in the specimen sheet and in
  the disclosed data table. The original blanket "microcopy ≥ 14px" proved
  unworkable inside 124–270px plates without abandoning the plate system;
  the honest floor is "nothing readable ONLY below 13px".

## 6. Spacing system

Base 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`.
Corridor gutters: 16 (mobile) / 24 (tablet) / 32 (desktop).
Station pitch (equal-spacing modes): ≥ 96px tablet, ≥ 128px desktop — set by
engine from viewport, never below min touch pitch. Touch spacing between
adjacent controls ≥ 8px (skill guidance).

## 7. Layout / grid

- App shell: full-viewport exhibit. Rows: `[header plaque · corridor · footer rail]`.
  Header: exhibit title (left), view-mode switch (center, three `aria-pressed`
  buttons), actions (Compare / Quiz / Reading this atlas) (right; wrap to a
  second row < 900px). Footer: expedition log pips + data source note + reset.
- **Corridor** = the hero surface: one horizontal scroll region (`overflow-x:
  auto` inside the app, body never scrolls horizontally), scroll-snap to
  stations. Left end: Sun anchor disc (half-cropped). Datum line runs the full
  scroll width at a fixed vertical position; per-station tick lines carry AU
  labels (distance view) or order numerals.
- **Focus sheet** (planet detail): desktop ≥ 1024px = right-side sheet 400–480px
  over a hall scrim; tablet portrait / mobile = bottom sheet (max-height 80vh,
  scrollable internally).
- **Compare screen**: replaced corridor content; top picker row (planet chips,
  max 3 active), below it aligned specimen columns sharing one label column of
  measurement rows — bars + mono values. Desktop fits 3 columns; tablet 2 +
  scroll; mobile 1 column stacked with shared row labels.
- **Quiz screen**: same shell; dock of medallions + order slots (sort mode) or
  question plate + choice medallions (match mode); mode toggle at top.
- Content max-width for reading text (facts, caveats): 68ch.
- Tablet 1024×768 and 1440×900 must fit the shell height without body scroll
  (the corridor is the only scroller, horizontally); longer content scrolls
  inside its own region (sheet, quiz deck).

## 8. Touch-target rules

- View-mode buttons, arrows, actions: **≥ 48×48px** hit area.
- Planet stations: sphere + plate is large, but the *button* is the whole
  station (min 112px wide × 96px tall hit).
- Quiz medallions: ≥ 64px disc with ≥ 48px effective hit; spacing ≥ 8px.
- Move buttons (keyboard drag alternative): ≥ 48×48px, adjacent spacing ≥ 8px.
- No hover-dependent interaction; hover only enhances desktop (plate lifts 1px).

## 9. Illustration language

- **All illustration is code-native SVG/CSS** — no raster generation needed
  (the exhibit is geometric: spheres, rings, ticks, plates). No Codex assets.
- **Sphere**: `<svg>` circle + radial gradient (`colorStops` from JSON:
  highlight offset toward the Sun-side = left), thin equatorial bands for
  gas giants (clipped rects), terminator shadow stop; Saturn gets an ellipse
  ring (two strokes, back half drawn behind the sphere). Flat mineral
  identity, no glow, no texture noise.
- **Datum line / ticks**: 1px `--line` horizontal rule; station ticks drop
  12px with mono labels; AU ruler labels only in distance view.
- **Parchment plate**: rounded-2px rectangle `--parchment`, 1px edge
  `--parchment-deep`, solid offset shadow `0 2px 0 rgba(0,0,0,0.35)` — a
  physical plate, not a floating card.
- **Starfield**: procedural, deterministic (seeded PRNG in the engine), ~140
  1–1.6px circles at 8–38% parchment opacity on the hall ground; no nebula
  gradients, no parallax under reduced motion.
- Icons (arrows, check, info, close, moon, reset) are original inline SVG
  strokes 2px, currentColor — no icon font, no emoji.
- Sun anchor: layered radial-gradient disc (brass → deep ember), cropped at
  the hall's left edge, with a thin mono caption "SOL · G2V".

## 10. Feedback states

| State | Presentation |
|---|---|
| Press | plate shadow collapses + translate 1px, 120ms |
| Hover (desktop) | plate lifts 1px + brass underline on name, 160ms |
| Focus-visible | 2px `--focus` ring + 2px ground gap — on hall, parchment, and dark plates alike; never removed |
| Station selected | parchment plate gets brass 2px edge + corridor auto-scrolls station into view |
| View morph | stations tween to new layout 320–420ms `power3.inOut` (spatial continuity; reduced-motion: instant) |
| Quiz correct | `--ok` edge + check glyph + fact sentence in live region, 180ms fade |
| Quiz retry | `--retry` edge + return-arrow glyph + "Not yet — <hint>"; arrangement kept, 180ms |
| Compare add | station plate flashes brass edge 160ms; compare chip appears with planet pigment dot |
| Data loading | hall shows mono "calibrating instruments…" line; data error → full-page parchment error plaque with recovery copy (no white screen) |
| Visited planet | expedition-log pip fills with planet pigment; counted in footer |

Live region `aria-live="polite"` for quiz feedback, view-mode changes and
focus-sheet opens. All feedback copy in English, specific, non-punitive.

## 11. Motion budget

Locked by spec: feedback 120–220ms · spatial 250–500ms · delight ≤ 900ms ·
no intro that blocks input · natural easing (`power2.out`, `power3.inOut`),
no bounce/elastic.

GSAP assignments (registered once in `src/lib/gsap.ts`):
- **View morph (the signature motion)**: on mode switch, each station's sphere
  `r` and station `x` tween to the new layout, 380ms `power3.inOut`, staggered
  18ms along orbital order — the same specimens visibly re-hang (comprehension:
  scale systems are transforms of one another).
- **Corridor arrows / focus**: `scrollTo` with gsap tween 420ms `power2.out`
  (native scroll, not hijacked; keyboard focus jumps are instant + 120ms fade).
- **Focus sheet**: slide-in 320ms `power3.out`; scrim fade 180ms.
- **Day/year rings**: gsap rotation loops — angular speed ∝ normalized ratio
  (Earth-day = 12 s/turn; Jupiter ≈ 4.9 s; Venus ≈ 46 s, still readable),
  year arcs as static sweep fills (proportional arcs, not spinning). Rings run
  only in Day & Year view and pause off-view.
- **Quiz feedback**: edge flash + glyph 180ms; medallion settle 220ms.
- `prefers-reduced-motion`: wrapper kills all tweens → final states render
  instantly; rings render as static arcs with labels; only ≤ 150ms opacity
  changes remain; orbit travel/parallax fully absent (spec + skill High severity).

## 12. Responsive strategy

- **Tablet 768–1199 = hero viewport** (spec). Corridor height fits 768px
  without body scroll; stations ≥ 96px pitch; all controls ≥ 48px. Designed
  tablet-first.
- **Desktop ≥ 1200**: more air — wider station pitch, focus sheet becomes a
  side sheet, starfield density up slightly; reading line length capped 68ch.
- **Mobile 360–479**: `limited` — corridor works (it is natively horizontal
  touch), focus sheet becomes bottom sheet, compare collapses to one column,
  quiz medallions wrap; drag-to-reorder replaced by tap-select + move buttons
  (steppers remain everywhere). Verified at 390×844 before deciding the mobile
  screenshot; declared `limited` with note (drag precision lower, no hover).
- Breakpoints `480 / 768 / 1024 / 1200`; no horizontal body scroll at any width
  (the corridor is the only horizontal scroller and it is intentional,
  keyboard-operable and arrow-controlled).
- 200% zoom: corridor and sheets reflow (station pitch computed from rem
  sizes); verified in checklist.

## 13. Accessibility constraints

- Semantic HTML first: `<header> <main> <nav> <footer>`, stations are
  `<button>`s in a `<ul>` list, view switch is a group of `aria-pressed`
  buttons, sheet is `role="dialog"` `aria-modal` with labelled title and ESC.
- Keyboard path for every task:
  1. View switch: Tab + Enter (radio-like `aria-pressed` buttons).
  2. Corridor: stations are tabbable buttons; Arrow Left/Right move focus
     between stations and auto-scroll them into view; Home/End jump to
     Sun/Neptune.
  3. Focus sheet: opens focused on heading, Tab cycles inside, ESC closes and
     returns focus to the station.
  4. Compare: chips add/remove with Enter; columns readable as a table
     (`<table>` semantics via row/cell roles or a real table under the bars).
  5. Quiz sort: Tab to medallion, Enter to lift, arrows to move, Enter to
     drop — plus on-screen move buttons (single-pointer alternative, WCAG 2.2).
  6. Quiz match: Tab + Enter on choice medallions.
- **Text alternatives for every visualization**: planet list/table equivalent
  under the corridor (visually-hidden or disclosed "data table" toggle) with
  all readouts in mono text; ring gauges carry `aria-label` like
  "Jupiter: day 9.9 hours, year 4,331 Earth days"; bars carry values as text.
- No color-only meaning (pigment dots always paired with names; status always
  glyph + text). No hover-only. No time pressure. Errors non-punitive.
- No audio in this project (silent exhibit) — moot mute requirement.
- localStorage: anonymous expedition log (visited planet ids + quiz best
  rounds) only, with a visible Reset button; no personal data.

## 14. Anti-patterns (banned)

1. Neon/space-app glow, lens flare, purple-blue AI gradient, nebula backdrop.
2. Glassmorphism, thick shadows, 3D perspective, glass cards.
3. Card-inside-card soup; compare as generic card grid (spec bans); fake
  dashboard UI.
4. Emoji as visual icons; raster-generated UI icons.
5. Real-speed orbit animation (unusable); scroll-hijacking the whole page.
6. Punitive feedback: red flash, shake, lives, countdown.
7. Hover-only interactions; targets < 48px; text < 14px.
8. Absolute-scale pretension (showing "to scale" without caveat).
9. Runtime CDN (fonts, GSAP, images) — everything bundled.
10. Grotesk poster typography / cream hairline graticule — that is #04's
    language; this exhibit is serif wall labels + mono instruments + parchment.

## 15. UI UX Pro Max cross-check → keep / drop

| Skill recommendation | Decision |
|---|---|
| Kids/education → Claymorphism, bright candy palette, parent dashboard | **DROP** — contradicts museum exhibit thesis (§14.3, spec graphic rules) |
| Dark mode: text contrast ≥ 4.5:1 (aim higher), visible focus, no white bg | **KEEP** — all pairs ≥ 7:1, focus ring token (§4) |
| Touch targets ≥ 44pt/48dp; web WCAG 2.5.8; spacing ≥ 8px | **KEEP, tightened to ≥ 48px** everywhere (child audience) |
| Error feedback near the problem, non-punitive, with recovery copy | **KEEP** — quiz hints + data-error plaque (§10) |
| WCAG 2.2 dragging movements: single-pointer + keyboard alternatives to drag | **KEEP** — move buttons + Enter-lift keyboard path (§13.5) |
| Interactive chips = real buttons with `aria-pressed`, accessible names | **KEEP** — view switch + compare chips (§13) |
| Auto-rotating content needs stop control / no auto-advance | **KEEP** — rings animate only as data display in an active view; no auto-advancing slides |
| Motion sensitivity: honor `prefers-reduced-motion`, no parallax/scroll-jack | **KEEP** — reduced wrapper, native scroll + buttons (§11) |
| Horizontal scrolling = anti-pattern (High severity) | **RESOLVE, not adopt blindly** — spec *requires* horizontal orbit walk; implemented as a contained, snapped, arrow- + keyboard-operable corridor with progress rail; page body never scrolls sideways (§7, §12) |
| "Avoid horizontal scroll" generic rule | Same resolution as above — documented deviation, by spec |
| Dashboard Data pairing (Fira Code + Fira Sans) | **DROP pairing, keep intent** — data in mono (Space Mono), body stays serif per thesis |
| Gentium Book Plus surfaced for museum/book serif | **KEEP** — display + body (§5) |
| Smooth-scroll anchor navigation | **KEEP** for corridor arrows/focus jumps (gsap-driven, reduced-motion aware) |

## 16. Asset classification (phase C record)

- **A. HTML/CSS**: shell layout, plates, bars, focus sheet, quiz dock — all CSS.
- **B. SVG (chosen for everything visual)**: spheres + gradients, rings, datum
  line, ticks, starfield, sun anchor, icons — original, generated from
  `planets.json` data.
- **C. Codex raster**: **none** — the exhibit is geometric; SVG is materially
  better (data-driven, crisp, tiny). No `IMAGE_BRIEF.md`, no generated assets.
- **D. Third-party**: only npm deps (React, Vite, TS, GSAP, @fontsource
  fonts) — all recorded in THIRD_PARTY_NOTICES.md with real licenses.
  No NASA imagery is embedded; facts are common astronomical values cited in
  `sourceNote` per planet (data, not assets).
