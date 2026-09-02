# Vocabulary Expedition

> Shiplo Showcase #07 — **Hành trình từ vựng**: an illustrated field journal where
> children 6–10 explore big gouache scenes, hunt objects from English clues,
> pin word labels onto pictures and build short sentences.

**Live demo:** <https://vocabulary-expedition.shiplo.site>
**Category:** education-language · **License:** Apache-2.0 (original work)

Vocabulary Expedition is a single-page learning game for Vietnamese children
starting English (CEFR Pre-A1/A1). Each of the six units — living room,
kitchen, classroom, market, farm, park — is one large hand-drawn gouache
plate. Children *look around* and tap objects to collect museum-style caption
plates (word + phonetic respelling + Vietnamese support), follow a **clue
hunt** ("It boils water for tea. Psssss!"), **drag word labels onto the
picture** where correct labels become permanent annotations, and finish by
**building three short sentences** from magnetic word chips. Every found word
lands as a sticker in the field scrapbook. No scores, no timers, no wrong-answer
punishment — the reward is the journal filling up.

## Highlights

- **Six code-native gouache scene plates** — every illustration is hand-authored
  SVG (`src/features/scenes/`) whose item groups sit exactly on the hotspots
  declared in the content JSON; crisp at any zoom, no raster assets, no
  provenance risk.
- **The museum-label interaction** — a correct word chip FLIP-animates from the
  tray and pins onto the scene as a permanent annotation (GSAP Flip), so the
  learning result lives *inside the picture*, not in a score.
- **Three-layer state** — JSON content (`public/data/units.json`), pure
  interaction engines (`features/*/engine.ts`, no Vue imports, simulated
  headless in `scripts/engine-sim.mjs`), and anonymous optional progress in
  `localStorage` (always resettable).
- **Kind by design** — gentle nudges, a warm glow hint after two misses, no
  timers, no red errors, sound off by default, and a Vietnamese help layer that
  can be toggled off entirely.
- **Full input coverage** — mouse drag, touch pick-and-place, and a complete
  keyboard path (Enter picks up a word, Tab walks the objects, Enter places,
  Esc returns it); verified headless at 1440, 1024 and 390 px with zero console
  errors, plus `prefers-reduced-motion` support throughout.

## Development

```bash
npm install
npm run dev        # vite dev server
npm run test:engine  # headless simulation of every activity (no browser)
npm run build      # vue-tsc typecheck + vite production build → dist/
npm run preview    # serve dist/ locally
```

Deploy: upload the contents of `dist/` to any static host (the app runs from
any subpath — all URLs are relative). The canonical deployment is the Shiplo
URL recorded in `showcase/deployment.json`.

## Project structure

```text
vocabulary-expedition/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed
├── design/                        # internal — DESIGN_DECISIONS, asset classification (never ships)
├── scripts/                       # engine-sim.mjs, cdp-driver.mjs (verification tooling)
├── src/
│   ├── lib/                       # data loader + validation, storage, audio, gsap wrapper, rng
│   ├── features/
│   │   ├── map/ scene/ clues/ match/ sentences/ scrapbook/
│   │   └── scenes/                # the six gouache plates (SVG Vue components)
│   ├── components/                # caption plate, chips, icons, Pip the mascot, header
│   └── styles/                    # tokens / base / motion
├── public/
│   ├── data/units.json            # all content — scenes, items, clues, sentences, distractors
│   └── assets/                    # (empty by design: zero raster assets ship)
├── showcase/
│   ├── cover.webp / desktop.webp / tablet.webp / mobile.webp
│   ├── metadata.json
│   └── deployment.json
└── dist/                          # generated, gitignored — the deploy artifact
```

**Adding a unit** = append one object to `units.json` (items with bbox
positions, clues, sentences) plus one scene SVG component registered in
`SceneArt.vue`. No screen logic changes — the loader validates the whole
contract at runtime and degrades to a friendly message, never a white screen.

## Screenshots

Captured from the live deployment ([vocabulary-expedition.shiplo.site](https://vocabulary-expedition.shiplo.site));
details in `showcase/metadata.json`.

| Shot | Viewport | What it shows |
|---|---|---|
| `showcase/cover.webp` | 1440×900 | Staged mid-lesson moment (art-directed): the Living Room plate during the word-label task — pinned word annotations, found-word check pins, the label tray below |
| `showcase/desktop.webp` | 1440×900 | Honest default landing: the expedition map with its six illustrated stations along the dotted footpath |
| `showcase/tablet.webp` | 1024×768 | Honest scene screen (hero education viewport): task-rail stamps, gouache plate, caption plate, activity dock |
| `showcase/mobile.webp` | 390×844 | Honest mobile landing: the stations as a vertical trail list with Pip at the start |

## Demo path (5 minutes)

1. On the expedition map, open **The Living Room**.
2. *Look around*: tap the clock — the caption plate shows **clock /klɒk/ ·
   “The clock says three.” · đồng hồ**.
3. **Clue hunt**: “It has two hands, but no arms!” → tap the clock. Miss twice
   anywhere and a warm glow marks the region.
4. **Word labels**: drag *picture* onto the framed artwork (or tap the word,
   then tap the picture) — it pins as an annotation. Finish all four.
5. **Sentences**: put *sofa* into “The ___ is warm. Grandpa sleeps on it.” and
   press Check. Three sentences later the scene is stamped; the scrapbook
   collects seven stickers.

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

It is art-directed and maintained by Shiplo HQ with AI-assisted implementation.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project (Vue, GSAP, the Andika
and Caveat fonts) is documented in `THIRD_PARTY_NOTICES.md` (policy:
repository `THIRD_PARTY_POLICY.md`).

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
