# GeoTrail

> Shiplo Showcase #16 — A stylized vector atlas of locate-compare-clue trails where every stop asks a geographic question.

**Live demo:** _the verified Shiplo deployment URL is recorded in `showcase/deployment.json`_
**Category:** education-geography · **License:** Apache-2.0 (original work)

GeoTrail is a cartographic-editorial learning atlas for ages 8–14. Four
hand-drawn vector plates (Southeast Asia, the Nile & East Africa, Andes &
Amazon, Europe & the Alps) carry four six-stop trails. Every stop is a real
question, not a click:

- **Locate** — find the country on the plate by dragging its label onto the
  map, tapping the map shape, or using the keyboard chip list.
- **Compare** — two fact sheets with real area, population, highest-point and
  climate data; the engine grades against the same JSON, so numbers can never
  contradict the answer.
- **Clue** — spatial clues ("it borders…", "it lies north of…") reveal one at
  a time and are drawn on the map as relation outlines and direction arrows.
  Every clue is a structured predicate validated against the place data at
  load time.

Correct answers earn travel stamps in a passport; nothing is timed, nothing
is scored against the child, and wrong picks only add hints. Progress is
anonymous `localStorage` with a visible reset.

All maps are original low-poly SVG (equirectangular projection with a
per-plate latitude squash) authored in `public/data/*.json` — no map API, no
tiles, no runtime CDN. Boundaries are simplified for learning; the dataset is
educational only.

## Highlights

- One authored art direction: parchment pages, deep-ocean plates, terracotta
  route lines, engraved sea labels, roman-numeral plate frames.
- Zoom and pan between stops is a GSAP-tweened SVG viewBox (instant under
  `prefers-reduced-motion`); the clue relation layer draws outlines and
  arrows directly on the plate.
- Keyboard path for everything: roving arrow-key navigation across country
  hit targets, chips as real buttons, Escape leaves a trail, live-region
  feedback with name + relation copy.
- Every place, fact and clue lives in three JSON files; a runtime validator
  checks cross-references, neighbor symmetry and clue truth, degrading to a
  clear message instead of a white screen.

## Development

```bash
npm install
npm run dev
npm run build      # vue-tsc type check + vite build → dist/
npm run preview    # serve the built artifact locally
```

## Project structure

```text
geotrail/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed
├── src/
│   ├── features/trail/engine.ts   # pure grading/clue engine (no Vue)
│   ├── lib/                       # data loader + validator, geo projection, gsap wrapper, storage
│   ├── components/                # plate map, world index, mission panel, activities, stamps
│   ├── screens/                   # atlas spread, trail, passport
│   └── styles/                    # tokens / base / motion
├── public/
│   └── data/                      # plates.json · places.json · trails.json — all content
├── scripts/                       # screenshot capture + layout probes (dev tooling)
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

This project is art-directed and maintained by Shiplo HQ with AI-assisted
implementation.

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
