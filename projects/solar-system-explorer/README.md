# Solar System Explorer

> Shiplo Showcase #11 — a museum-style space atlas: walk an orbital corridor from the Sun outwards and re-hang the collection in three comparative views (size, distance, day/year).

**Live demo:** https://solar-system-explorer.shiplo.site
**Category:** education-science · **Audience:** 8–13 · **License:** Apache-2.0 (original work)

A planetary exhibition hall for children building proportional reasoning. The
app is one horizontal corridor on a near-black navy ground: the Sun anchors
the lit doorway at the left, eight planets hang as specimen stations along a
single datum line (the ecliptic), each with a parchment museum label carrying
real measurements in mono instrument type. Three curation modes re-hang the
same collection — a logarithmic AU ruler, a compressed size parade, and
day/year ring gauges at normalized speeds — and every visual scale stands
next to its exact number. A compare screen lines up to three specimens in
aligned measurement columns, and a curator's quiz asks the child to order
the medallions or match records to their holders, non-punitively.

## Highlights

- **Three hangs of one collection** — switch Distance / Size / Day & Year and the
  same eight stations morph between scale systems (GSAP, spatial continuity),
  each mode honest about its compression in plain words plus a
  "Reading this atlas" panel.
- **Museum-exhibit art direction, not a space-app template** — parchment
  specimen plates, book-serif wall text (Gentium Book Plus) + typewriter
  catalogue numerals (Space Mono), mineral pigment identities per planet,
  gradient spheres rendered as original data-driven SVG (Saturn gets its ring,
  gas giants their bands). No stock NASA imagery, no runtime CDN, no neon.
- **Walkable, accessible corridor** — horizontal scroll/touch plus arrow
  buttons, arrow-key/Home/End station navigation, focus scroll-into-view, and
  a full text alternative (disclosed data table) for every visual scale.
- **Compare as aligned specimen columns** — pick up to three planets; radius,
  day, year, moons and distance line up row-by-row with log-scaled bars and
  exact values.
- **Curator's challenge** — drag medallions into orbital order (with tap-lift
  and move-button keyboard paths per WCAG 2.2) or match records; feedback
  names the fact, never a red flash, no timers.

## Interactions

| Area | What you can do |
|---|---|
| Corridor | Scroll/touch horizontally, use the arrows, focus stations with Tab + arrow keys (Home/End jump to Sun-side/Neptune), click any station for its specimen sheet |
| View switch | Distance · Size · Day & Year (`aria-pressed` buttons; the corridor re-hangs with a 380 ms morph; day rings spin at normalized, log-compressed speeds) |
| Specimen sheet | Full measurements, field notes and data source per planet; add to compare; ESC closes and returns focus |
| Compare | Toggle planet chips (max 3); aligned columns with log-scaled bars + exact values; hidden `<table>` equivalent for screen readers |
| Quiz | Sort mode: drag/tap-lift/arrow-move medallions into order, check for gentle per-position feedback · Match mode: pick the record holder, read the fact |
| Expedition log | Anonymous, browser-local record of visited specimens and best quiz visit, with a visible reset |

## Screenshots

| View | File | What it shows |
|---|---|---|
| Cover (1440×900) | `showcase/cover.webp` | Staged Size-hang moment: Jupiter's banded sphere and ringed Saturn centred on the datum line, parchment plates below |
| Desktop (1440×900) | `showcase/desktop.webp` | Honest default landing: Sun anchor and the inner planets on the log AU ruler, view switch and corridor controls |
| Tablet (1024×768) | `showcase/tablet.webp` | Hero education viewport: the corridor walk with stations, plates and the day/year caveat line |
| Mobile (390×844) | `showcase/mobile.webp` | Narrow-screen corridor: stations walk horizontally, controls and footer stack compactly (compare scrolls in its own region) |

All captures are from the live Shiplo deployment (see `showcase/deployment.json`).

## Stack

- React 18 + Vite 7 + TypeScript (static SPA, `base: './'`, no routing dependency)
- GSAP 3.15 (bundled; purposeful motion only — view morphs, sheet slide,
  normalized ring loops; `prefers-reduced-motion` collapses everything to
  instant final states)
- Content 100% JSON-driven: `public/data/planets.json` (NASA Planetary Fact
  Sheet mean values; moons as of 2025) + `public/data/atlas.json` (all
  visitor-facing copy)
- Fonts bundled via `@fontsource` (Gentium Book Plus, Space Mono — latin,
  latin-ext and vietnamese subsets; no runtime font CDN)
- Zero runtime APIs, zero backend, zero database; anonymous `localStorage`
  for the expedition log only, always resettable

## Static-first architecture

```text
src/
├─ components/         Sphere (data-driven SVG specimens), Icons
├─ features/
│  ├─ atlas/           engine.ts (pure: scales, layout, quiz, validation)
│  │                   Corridor, Station, AtlasScreen (+ data-table alternative)
│  ├─ focus/           specimen sheet dialog
│  ├─ compare/         aligned specimen columns
│  ├─ quiz/            sort + match modes
│  └─ caveat/          "Reading this atlas" scale-honesty panel
├─ lib/                data loader (fetch + dev-time validation), gsap wrapper,
│                      anonymous storage
└─ styles/             tokens / base / motion
public/data/           planets.json · atlas.json  (the whole content layer)
scripts/               engine-sim.mjs (279 headless checks) · cdp-driver.mjs
                       (full live flow) · capture-cover.mjs · capture-honest.mjs
```

The scale mathematics (log AU ruler, sqrt-compressed radii, log10-compressed
day-ring speeds, year arcs, log bars) lives in a pure engine with no React
imports, verified headless by `npm run test:engine`.

## Development

```bash
npm install
npm run dev          # local dev server
npm run test:engine  # headless engine + data verification (279 checks)
npm run build        # tsc -b && vite build → dist/
npm run preview      # serve the built artifact locally
```

Deploy: upload the contents of `dist/` to any static host. The live demo is
served by Shiplo from exactly this build (provenance in
`showcase/deployment.json`, including a deterministic artifact hash).

## Keyboard & accessibility notes

- Every control is a real button; the view switch and chips expose
  `aria-pressed`; the sheet and caveat panel are `role="dialog"` with ESC and
  focus return.
- Corridor: Tab reaches stations; Arrow Left/Right walk between them,
  Home/End jump to the ends; arrows next to the progress rail scroll by page.
- Quiz drag has keyboard (Enter to lift, arrows to move) and single-pointer
  (tap-lift, then tap a slot) alternatives — dragging is never the only way.
- Status is never color-only (glyph + text everywhere); all contrast pairs
  meet WCAG AA; touch targets ≥ 44–48 px; `prefers-reduced-motion` renders
  static final states.

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`).
This showcase is art-directed and maintained by Shiplo HQ with AI-assisted
implementation.

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
