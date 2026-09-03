# Human Body Lab

> Shiplo Showcase #12 — An atlas you can operate: a layer-by-layer vector body
> model where learners 9–14 toggle body systems, inspect organs, and route
> oxygen and food through the body.

**Live demo:** https://human-body-lab.shiplo.site
**Category:** education-science · **Audience:** 9–14 · **License:** Apache-2.0 (original work)

## Concept

A printed anatomical atlas plate, brought to life. The body is drawn as
simplified original line art — warm white paper, oxblood / blue-slate / sage
inks, mono specimen labels with leader-line callouts — and each body system
(skeletal, circulatory, respiratory, digestive, nervous) is a separate
transparent layer, like the vellum overlays of a classic anatomy atlas.

Three ways to operate the atlas:

- **Explore** — switch system layers on and off; tap any organ (on the plate
  or in the list) to open its specimen sheet: one clear job description plus
  three field-note facts.
- **Pathways** — route games: guide one breath of oxygen from nose to cell,
  one bite of food from plate to cell, and one drop of blood around its
  double loop. Wrong turns get a gentle re-grounding hint, never a penalty.
- **Quiz** — a 10-question review where every answer, right or wrong, comes
  with the why.

All content — 5 systems, 18 organs, 3 pathways, 10 questions — is authored
JSON under `public/data/`; adding an organ is data plus an SVG shape, not a
component rewrite. The body model is 100% original vector work; no
third-party anatomy art is used.

## Screenshots

| View | File | What it shows |
|---|---|---|
| Cover (1440×900) | [`showcase/cover.webp`](showcase/cover.webp) | Art-directed staged state of the Explore screen: skeletal and circulatory layers lifted together on the plate (bone tones under oxblood heart and vessels) with mono specimen callouts, and the Heart organ sheet open beside it |
| Desktop (1440×900) | [`showcase/desktop.webp`](showcase/desktop.webp) | Landing state: atlas hero with the ghosted body (three of five layers) and the three entry cards |
| Tablet (1024×768) | [`showcase/tablet.webp`](showcase/tablet.webp) | Honest tablet landing, fitting the viewport with no scrollbar: headline "An atlas you can operate.", the three entry cards, LAB RECORD 0/18 · 0/3, and the ghosted body plate |
| Mobile (390×844) | [`showcase/mobile.webp`](showcase/mobile.webp) | Stacked landing state on a phone-width viewport |

All captures are taken from the live Shiplo deployment (see
`showcase/metadata.json` for exact capture provenance). Viewport note: the
Overview (landing) and Quiz screens fit 1440×900 and 1024×768 without
scrolling; the Explore and Pathways screens scroll vertically **by design** —
the body figure is a tall portrait plate, and keeping its callout labels
readable was prioritized over shrinking it to the viewport.

## Interactions

- **Layer toggles** — aria-pressed chips (glyph + name + organ count; never
  color-only); multiple layers can be on at once with a gentle depth
  separation between them.
- **Organ inspection** — organs are focusable buttons both in the SVG plate
  and in a parallel text list; hover/focus highlights shape and label
  together; the side sheet traps focus and closes with `Esc`.
- **Routing** — choose the next stop in order; the confirmed segment draws
  itself along the plate; completion pulses the full route once.
- **Progress** — anonymous, optional, stored in `localStorage` (organs
  inspected, routes completed, best quiz round) with a two-step reset in the
  footer. No personal data, no accounts, no network.

## Stack

- **Vue 3** (Composition API, `<script setup>`) + **TypeScript**
- **Vite 7** — `base: './'`, single-page state navigation (no router)
- **GSAP 3.15** (core only, npm-bundled — never CDN) for purposeful motion
- **@fontsource** fonts bundled locally: Source Serif 4 · Work Sans · IBM Plex Mono (latin subsets)

## Static-first architecture

No database, no backend API, no auth, no SSR runtime. Content loads from
local JSON (`public/data/*.json`) with full shape validation at load time —
invalid data degrades to a clear retry card, never a white screen. The
production build is a folder of static files served by Shiplo static
hosting; there are zero runtime requests to CDNs or third-party hosts.

Pure interaction logic lives in framework-free engines covered by a
headless simulation:

- `src/features/explore/engine.ts` — layer state, organ↔pathway links, callout-spacing rule
- `src/features/pathways/engine.ts` — routing sequences, non-punitive wrong-pick handling
- `src/features/quiz/engine.ts` — answer checking and scoring
- `scripts/engine-sim.mjs` — 130 checks: every pathway walked correctly and
  via every wrong first pick, quiz full-pass and wrong-answer paths, label
  collision validation

## Development

```bash
npm install
npm run dev        # local dev server
npm run test:engine  # headless engine simulation (130 checks)
npm run build      # type-check (vue-tsc) + production build → dist/
npm run preview    # serve dist/ locally
```

Deploy = upload `dist/` to any static host (the live demo runs on Shiplo
static hosting).

## Project structure

```text
human-body-lab/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + package-lock.json
├── design/DESIGN_DECISIONS.md     # locked design system
├── src/
│   ├── App.vue                    # shell: data loading, screens, progress
│   ├── components/                # BodyPlate (layered SVG), OrganSheet, chips
│   ├── features/                  # overview / explore / pathways / quiz (+ pure engines)
│   ├── lib/                       # data loader + validation, gsap wrapper, storage
│   └── styles/                    # tokens.css, base.css, motion.css
├── public/data/                   # systems.json · pathways.json · quiz.json
├── scripts/                       # engine-sim.mjs, cdp-driver.mjs (verification)
├── showcase/                      # deployment.json, metadata.json, webp captures
└── dist/                          # generated, gitignored — the deploy artifact
```

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
audit or a production-readiness guarantee. It is general-audience anatomy
education content, not medical advice, and must not be presented as one.

If you adapt it to production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
