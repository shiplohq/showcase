# Fraction Bistro

> Shiplo Showcase #02 — a modern Italian-style bistro where learners cut pizza, tarts and focaccia into equal parts to serve exact fraction orders.

**Live demo:** <https://fraction-bistro.shiplo.site>
**Category:** education-math · **Audience:** 7–10 · **License:** Apache-2.0 (original work)

Fraction Bistro turns fractions into kitchen work. Every order is a paper
ticket: *“Table 4 asks for five eighths of the margherita.”* The learner cuts
the dish into equal parts (2/3/4/6/8 — the denominator as a physical act),
plates slices by dragging, tapping or arrow-keys (the numerator as a
countable act), and serves. Three order modes cover the core fraction
curriculum:

- **Build** — cut and plate an exact fraction (`5/8`),
- **Same amount** — cover the chef’s portion with different cuts to discover
  equivalences (`1/2 = 4/8`, recorded in the recipe book),
- **Compare** — build both plates, then choose `<`, `=`, `>` (with a dish
  overlay that makes matching areas visibly coincide).

Wrong serves never punish: the nudge says exactly what is off (the cut or the
count), and the learner’s work stays on the plate. Completed orders get a red
**SERVITO** stamp on the ticket — no confetti, no scores, no timers.

## Highlights

- **Editorial Italian art direction** — tomato red / olive / flour cream /
  ink black, Fraunces + Source Sans 3, menu hairlines and dotted leaders,
  paper tickets with rubber stamps; deliberately not an arcade look.
- **Original SVG dishes** — Margherita, berry tart and a *rectangular*
  focaccia (grid cuts: fractions of a non-circular whole), all drawn
  code-native from `dishes.json` vector parameters. No raster assets at all.
- **Full input triangle** — drag with a following slice ghost, tap-to-place
  (WCAG 2.2 single-pointer path), and a complete keyboard path (arrows roam
  slices, Enter plates, plate slices return).
- **Pure, headless-testable engine** — `src/features/cut/engine.ts` has zero
  Vue/DOM imports; `npm run test:engine` simulates all 16 orders (correct
  paths + every instructive wrong path) without a browser.
- **Purposeful GSAP motion** — cut-line draw, slice separation, ghost
  flight, stamp landing; all wrapped in one reduced-motion-aware module.

## Screens

| Viewport | Screenshot |
|---|---|
| Desktop 1440×900 (staged serve moment) | `showcase/cover.webp` |
| Desktop landing | `showcase/desktop.webp` |
| Tablet 1024×768 — the hero viewport for this learning tool | `showcase/tablet.webp` |
| Mobile 390×844 | `showcase/mobile.webp` |

## Stack

Vue 3 (Composition API, SFC) · Vite 7 · TypeScript · GSAP 3.15 (bundled, no
CDN) · self-hosted fonts via `@fontsource` (Fraunces, Source Sans 3 — latin +
vietnamese subsets). No router — a single-page state machine
(`board → cut | compare → board · book`).

## Static-first architecture

No database, no backend API, no auth, no SSR runtime. All content lives in
local JSON (`public/data/orders.json`, `dishes.json`) fetched from the static
bundle and validated at load time — a broken file degrades to a clear
message, never a white screen. The only optional persistence is an anonymous
“orders served” list in `localStorage`, resettable with **New shift**.
The production build runs entirely from static hosting.

## Development

```bash
npm install
npm run dev          # vite dev server
npm run build        # type-check (vue-tsc) + production build → dist/
npm run preview      # serve dist/ locally
npm run test:engine  # headless simulation of every order through the engine
```

Verify + deploy notes for maintainers: `npm run verify:static -- fraction-bistro`
from the repository root checks the artifact is fully self-contained; deploy
`dist/` to static hosting (the live demo runs on Shiplo).

## Project structure

```text
fraction-bistro/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + package-lock.json
├── index.html / vite.config.ts / tsconfig*.json
├── design/DESIGN_DECISIONS.md      # locked design system (internal, not shipped)
├── src/
│   ├── components/                 # DishSvg, StationPanel, TicketCard, …
│   ├── features/
│   │   ├── cut/engine.ts           # pure fraction engine (no Vue)
│   │   ├── board/ · compare/ · book/
│   ├── lib/                        # data loader, storage, gsap wrapper, geometry
│   └── styles/                     # tokens / base / motion
├── scripts/
│   ├── engine-sim.mjs              # headless order-book simulation
│   ├── cdp-driver.mjs              # full-flow browser verification driver
│   └── capture-cover.mjs           # staged cover capture from the live URL
├── public/
│   └── data/                       # orders.json + dishes.json (all content)
├── showcase/                       # screenshots, metadata, deployment provenance
└── dist/                           # generated, gitignored — the deploy artifact
```

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`).
Development provenance: art-directed and maintained by Shiplo HQ with
AI-assisted implementation.

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
