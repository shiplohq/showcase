# Grammar Detective

> Shiplo Showcase #09 — investigate broken "case file" sentences with a
> highlighter pen, word cards and readable verdicts.

**Live demo:** <https://grammar-detective.shiplo.site>
**Category:** education-language · **License:** Apache-2.0 (original work)

## Concept

Grammar Detective is a paper-dossier bureau for young English learners
(A1/A2, ages 9–13). Every case file holds one broken sentence. Children
open the file, mark the evidence — nouns, verbs, adjectives — with a
highlighter pen, drag word cards to rebuild broken word order, then read
the detective's verdict, which explains the rule in plain language. A case
is only stamped **RESOLVED** after its explanation has been read, not the
moment the answer is right.

The art direction is *modern detective editorial, not scary noir*: manila
folders with tabs, a warm paper desk, cobalt ink, one fluorescent
highlighter yellow and a red pencil for gentle corrections. Monospace
appears only on metadata (case numbers, clues counter, stamps), the way a
real dossier would. All artwork is original SVG/CSS authored in this
project.

## Highlights

- **Two evidence tasks, one pure engine.** MARK EVIDENCE cases mark parts
  of speech with category pens (wash + underline pattern + label — never
  color alone); REBUILD ORDER cases reassemble shuffled word cards. All
  verdict logic (marking rules, multi-answer sentence checking,
  deterministic shuffling, clue gating, progression) lives in a pure,
  React-free engine (`src/features/investigation/engine.ts`) that is
  simulated headless across every case (`scripts/engine-sim.mjs`,
  271 checks).
- **A verdict that teaches.** Wrong answers get a gentle "Not yet" with
  counted guidance ("2 evidence words still need the right pen"), a
  3-level clue envelope that unlocks gradually, and — on success — a
  resolution memo that explains the rule and shows the mended sentence.
- **Print-like, not dashboard-like.** No card grids, no glassmorphism, no
  gradients; paper-offset shadows, hairline rules, one yellow.
- **Input parity.** Mouse, touch and keyboard are first-class: words are
  buttons (Tab + Enter/Space), pens switch with 1/2/3, word cards move
  with ◀ ▶ buttons or arrow keys — drag is never required.
- **Static-first.** Content lives in `public/data/cases.json`; progress is
  anonymous `localStorage` with a reset; no API, no backend, no runtime
  CDN.

## Screenshots

| View | File | Viewport | What it shows |
|---|---|---|---|
| Cover (art-directed) | [`showcase/cover.webp`](showcase/cover.webp) | 1440×900 | Staged real moment: case file mid-investigation — words marked with the NOUN highlighter pen, verdict strip open |
| Desktop (honest landing) | [`showcase/desktop.webp`](showcase/desktop.webp) | 1440×900 | The case board: masthead, three manila dossier folders, twelve case index cards |
| Tablet (hero) | [`showcase/tablet.webp`](showcase/tablet.webp) | 1024×768 | Evidence screen: the sentence under investigation, pen tray, clue docket and "File verdict" — fits the viewport with no scrolling |
| Mobile | [`showcase/mobile.webp`](showcase/mobile.webp) | 390×844 | The case board stacked vertically at phone width |

All captures are taken from the live Shiplo deployment (see provenance
below), never from localhost.

## Interactions

- **Case board** — open any case file; resolved cases carry a rotated
  green RESOLVED stamp; anonymous progress persists with a two-tap reset.
- **Mark evidence** — pick a pen (NOUN / VERB / ADJ.), tap words to ink
  them, tap again to lift the mark; the highlighter stroke draws on in
  160 ms (`prefers-reduced-motion`: instant).
- **Rebuild order** — move word cards with ◀ ▶ buttons, arrow keys, or
  desktop drag; GSAP Flip keeps spatial continuity on every move.
- **Clues** — three levels unlock one at a time; opening a clue never
  penalises.
- **Verdict** — "File verdict" checks the case; correct answers open the
  explanation memo and stamp the file RESOLVED.

## Stack

- React 18 + Vite 7 + TypeScript (static SPA, `base: './'`, hash-free
  single-page state)
- GSAP 3.15 (npm, bundled — Flip plugin; never CDN)
- `@fontsource` self-hosted fonts: Fraunces (display), Atkinson
  Hyperlegible (body — designed for low-vision readers), IBM Plex Mono
  (metadata only), latin + latin-ext subsets
- Content: `public/data/cases.json` (3 dossiers × 4 cases; validated at
  dev-time by `src/lib/data.ts`)

## Static-first architecture

```text
browser ── fetch ──> data/cases.json        (content state, static)
        └─ React session state              (marks, card order, clues)
        └─ localStorage 'grammar-detective:v1' (resolved ids, anonymous)
```

- No database, no backend API, no auth, no SSR runtime, no runtime CDN.
- Dev-time JSON validation degrades to a readable error memo, never a
  white screen.
- Pure engine + `npm run test:engine` simulate every case (including
  wrong-path verdicts) without a browser.

## Development

```bash
cd projects/grammar-detective
npm install
npm run dev        # local dev server
npm run test:engine  # headless engine simulation (all 12 cases)
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve dist/ locally
```

Deploy: upload `dist/` to any static host. The canonical live deployment
is on Shiplo (URL above).

## Project structure

```text
grammar-detective/
├── README.md · LICENSE · NOTICE · THIRD_PARTY_NOTICES.md
├── index.html · vite.config.ts · tsconfig*.json · package.json (+ lockfile)
├── design/DESIGN_DECISIONS.md      # locked art direction (internal)
├── scripts/
│   ├── engine-sim.mjs              # headless full-loop simulation
│   └── cdp-driver.mjs              # CDP flow verification + captures
├── public/
│   ├── data/cases.json             # all content (3 dossiers, 12 cases)
│   └── favicon.svg
├── src/
│   ├── main.tsx · App.tsx
│   ├── components/art.tsx          # original SVG icon set
│   ├── features/
│   │   ├── investigation/engine.ts # pure rules engine (no React)
│   │   ├── board/BoardScreen.tsx
│   │   └── case/                   # evidence, reorder, clues, verdict,
│   │                               # resolution memo
│   ├── lib/                        # gsap wrapper, data loader, storage, types
│   └── styles/                     # tokens / base / motion (reduced-motion)
├── showcase/                       # screenshots + metadata + deployment.json
└── dist/                           # generated, gitignored — deploy artifact
```

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`).

This showcase is art-directed and maintained by Shiplo HQ with
AI-assisted implementation.

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.

## Provenance

The production build is deployed to Shiplo and verified live; the exact
URL, artifact SHA-256, build command and verification timestamps are
recorded in `showcase/deployment.json`. Screenshots in `showcase/` are
captured from the live deployment only.
