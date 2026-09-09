# Atom Forge

> Shiplo Showcase #14 — Drag protons, neutrons and electrons into nuclei and shells to forge elements mission by mission.

**Live demo:** _deployed URL will be linked here after verification_
**Category:** education-science · **License:** Apache-2.0 (original work)

## Concept

Atom Forge is a workshop bench for the first 20 elements, aimed at learners
aged 11–15 who are meeting protons, neutrons and electrons for the first time.
Every element is defined by one number — its proton count — and the forge makes
that idea physical: you drag particles onto a bench, watch the live identity
readout change with every proton, and forge each mission (a neutral atom, an
isotope, an ion) particle by particle. The shell model is explicitly taught as
a simplification (shells hold 2 · 8 · 8 · 2 here) and every screen says so.

The art direction is a **Swiss scientific poster**: warm off-white paper,
charcoal ink, ultramarine and safety orange, hairline rules, oversized
numerals, monospace instrument annotations, and flat vector particles that
carry their charge as a sign glyph (+ / − / neutral dot) so color is never the
only signal. It is a static build — JSON content, no server, no tracking.

## Highlights

- **Three first-class input paths**: pointer drag from the particle tray
  (mouse/touch/pen), one-tap placement (tap a tray token), and per-zone
  steppers (`+p −p +n −n`, `+e −e` per shell) that make the whole game
  playable by keyboard alone.
- **Live identity feedback**: the moment your proton count changes, the
  readout names the element you actually built — build the "wrong" thing and
  the forge teaches you what you made instead ("4 protons make Beryllium —
  this mission asks for Lithium"). Nothing is punished; everything is
  explained.
- **Concept-laddered missions**: 12 missions move from structure → shell
  capacity → isotopes (carbon-14) → ions (Na⁺, Cl⁻), each with an explicit
  target and a typographic reveal moment when the build matches.
- **Honest physics**: no animation pretends to be real physics — electrons sit
  on labeled rings with capacities (`SHELL 2 · 4/8`), the model is declared a
  simplification, and a periodic mini-strip of the first 20 elements anchors
  the reference frame.

## Screenshots

| View | File | Viewport | What it shows |
|---|---|---|---|
| Cover | `showcase/cover.webp` | 1440×900 | Art-directed staged state: the forge bench mid-mission with a partly built atom |
| Desktop | `showcase/desktop.webp` | 1440×900 | The mission ledger — poster index of 12 missions with the periodic strip |
| Tablet | `showcase/tablet.webp` | 1024×768 | The atom builder (hero viewport): canvas, tray, steppers, counters on one screen |
| Mobile | `showcase/mobile.webp` | 390×844 | Stacked mobile layout (limited support — see note) |

All captures come from the verified live deployment (see
`showcase/deployment.json` for the exact URL and provenance).

## Interactions

- **Drag** a proton/neutron onto the nucleus zone, or an electron onto any
  shell ring (forgiving drop bands, live zone highlight).
- **Tap** a tray token to place a particle with one tap (innermost free shell
  for electrons).
- **Keyboard**: every zone has real stepper buttons — tab to them and press
  Space/Enter; remove particles by clicking placed discs or the − steppers.
- **Brief disclosure**: on short viewports the mission brief clamps to one
  line so the whole bench fits — a "Brief ▾" toggle reads the full text.
- **Click a placed particle** to take it back out — everything is reversible,
  nothing is ever lost.
- **Auto-forge**: when your build exactly matches the mission target, the
  element name reveal takes the screen (GSAP typographic rise, ≤900 ms,
  instantly final under `prefers-reduced-motion`).
- **Periodic strip**: focus/tap any of the 20 element tiles to read a one-line
  note about it; forged elements get stamped.
- **Progress**: forged missions persist in anonymous `localStorage` with a
  reset button on the ledger — no accounts, no personal data.

## Stack

- React 18 + TypeScript + Vite (static build, `base: './'`)
- GSAP 3.15 (npm, bundled — never CDN) for placement flight, shell-full pulse
  and the reveal moment, all reduced-motion aware
- Content 100% JSON-driven: `public/data/elements.json` (first 20 elements,
  isotopes, shell models) + `public/data/missions.json` (12 missions)
- Pure interaction engine (`src/features/forge/engine.ts`, no React imports)
  simulated headless by `scripts/engine-sim.mjs` (257 checks: every mission
  solvable via steppers and drag, invalid builds teach, progression sound)

## Static-first architecture

No database, no backend API, no auth, no SSR runtime. The production build is
a folder of static files served as-is:

- **Content state** — fetched from local JSON at runtime, validated at
  dev-time, degrading to a clear message instead of a white screen.
- **Interaction state** — React state per screen, fully resettable.
- **Personal state** — anonymous forged-mission ids in `localStorage` with an
  explicit reset; nothing else is stored.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build → dist/
npm run preview    # serve the built dist/
npm run test:engine  # headless engine simulation (255 checks)
```

Deploy any static host by publishing `dist/` — the canonical deployment is
Shiplo (see `showcase/deployment.json`).

## Project structure

```text
atom-forge/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed (when the project has dependencies)
├── src/
│   ├── components/                # ParticleDisc, PeriodicStrip
│   ├── features/
│   │   ├── forge/                 # engine.ts (pure), ForgeScreen, AtomCanvas, ParticleTray
│   │   ├── ledger/LedgerScreen.tsx
│   │   └── reveal/RevealOverlay.tsx
│   ├── lib/                       # data loader, GSAP wrapper, storage, types
│   └── styles/                    # tokens / base / motion
├── public/
│   ├── data/                      # elements.json, missions.json — no API, no database
│   └── assets/
├── scripts/                       # engine-sim, CDP driver (dev-time only)
├── showcase/
│   ├── cover.webp / desktop.webp / tablet.webp / mobile.webp
│   ├── metadata.json
│   └── deployment.json
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
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
