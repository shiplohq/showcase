# Phonics Forest

> Shiplo Showcase #08 — a Nordic storybook forest where every tree keeps one sound. Pre-A1 children match graphemes to sounds and sort word creatures home.

**Live demo:** <https://phonics-forest.shiplo.site>
**Category:** education-language · **License:** Apache-2.0 (original work)

Phonics Forest teaches phoneme–grapheme correspondence to children just
starting English. Five conifer trees stand on a fogged hillside — one per
sound (`sh /ʃ/`, `ch /tʃ/`, `ng /ŋ/`, `ee /iː/`, `oo /uː/`). Tapping a tree
opens its clearing: a carved sound stone speaks a word, and grapheme leaves
wait to be picked. Minimal-pair rounds (`ship`/`chip`, `sheep`/`ship`,
`wing`/`win`, `boot`/`book`) train close listening. In the **Creature
Roundup**, word creatures are sorted back to the tree that keeps their
sound. Every wrong answer only nudges — replay the sound, look again —
never a red flash, never a lockout.

## Highlights

- **Art direction with a POV** — Nordic storybook woodcut: warm ivory paper,
  moss/pine/fog-blue flats with carved hatch shading instead of shadows,
  thick uniform ink outlines, berry-red accent. Every asset is original
  SVG authored in this project; the artifact ships zero raster images.
- **Typography chosen for early readers** — graphemes and IPA captions are
  set in [Andika](https://software.sil.org/andika/) (SIL's beginning-reader
  font, single-story letterforms, full IPA coverage); the storybook voice is
  Fraunces. Both bundled locally — no runtime font CDN.
- **Sound with a visible twin** — words are spoken by the browser's
  `speechSynthesis`; chimes are synthesized with the Web Audio API. Zero
  audio files, zero third-party audio rights — and every audio cue has a
  text path (pair rounds hide words behind a deliberate "Read it" toggle
  that reveals them, deaf-friendly by design).
- **Three equivalent input paths** (WCAG 2.2 dragging): pointer drag with
  forgiving snap, tap-tap (pick up creature → tap tree), and keyboard carry
  (Enter lifts, Enter drops, Esc returns). The whole loop is playable by
  mouse, touch, or keyboard alone.
- **Purposeful motion only** — a firefly flies from the sound stone to the
  grapheme it spells (sound made visible); creatures Flip into their nests;
  mastered trees wake with a sway. All of it collapses under
  `prefers-reduced-motion`.

## Screens

1. **Grove** — the forest map and the progress map in one: five sound trees,
   staggered on a hillside; fireflies on each sign show mastery (3 per tree).
2. **Clearing (Listen & pick)** — six rounds per tree: hear a word and pick
   its letters, plus minimal-pair discrimination rounds. Wrong picks nudge
   ("Almost — listen once more"), then hint by breathing the right leaf.
3. **Creature Roundup (word sorting)** — eight word creatures, five sound
   nests; drag, tap-tap, or keyboard-carry them home.

## Static-first architecture

Vanilla **TypeScript + Vite** (no framework — this showcase is the "pure TS"
entry of the framework-diversity set). All content lives in
[`public/data/phonics.json`](public/data/phonics.json) following the spec's
JSON contract (`phoneme`, `graphemes[]`, `audio`, `examples[{word,image,
audio}]`, `minimalPairs[]`); adding sounds or words is a data change, not a
code change. Audio URIs use a `speech:` scheme resolved at runtime by
`speechSynthesis` — no audio assets exist.

Interaction logic is a **pure engine, DOM-free**
([`src/engine/listen.ts`](src/engine/listen.ts),
[`src/engine/sort.ts`](src/engine/sort.ts)) and is exercised headless by
`npm run test:engine` — every round of every tree, nudge/hint paths,
wrong drops, full sorts. Screens are plain TS modules
(`src/screens/*`) that build DOM and delegate rules to the engine.
Anonymous progress (fireflies, mute) lives in `localStorage` with a
"Start over" reset; nothing personal is stored. GSAP (Flip +
MotionPathPlugin) is registered once through `src/lib/gsap.ts`, which also
gates every tween behind `prefers-reduced-motion`.

## Development

```bash
npm install
npm run dev        # vite dev server
npm run test:engine  # headless simulation of every activity (pure engine)
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production artifact locally
```

Deploy: upload `dist/` to any static host (the Shiplo platform deploys it
via `npm run build` + `dist/`). Relative base (`./`) — runs from any
subpath.

## Project structure

```text
phonics-forest/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + lockfile        # committed
├── design/DESIGN_DECISIONS.md     # locked design system (internal, not shipped)
├── src/
│   ├── app.ts                     # shell: HUD, stage, caption band, routing
│   ├── main.ts                    # bootstrap + graceful failure state
│   ├── engine/                    # pure logic: listen rounds, word sorting
│   ├── screens/                   # grove / clearing / roundup (DOM modules)
│   ├── components/art.ts          # all original woodcut SVG (trees, creatures, stone, icons)
│   ├── lib/                       # gsap wrapper, audio synth+speech, data, storage, dom
│   └── styles/                    # tokens.css · base.css · motion.css
├── public/
│   └── data/phonics.json          # all lesson content (JSON contract)
├── scripts/                       # engine-sim, CDP full-flow driver, cover capture, overflow check
├── showcase/
│   ├── cover.webp / desktop.webp / tablet.webp / mobile.webp
│   ├── metadata.json
│   └── deployment.json
└── dist/                          # generated, gitignored — the deploy artifact
```

## Screenshots

| View | Image |
|---|---|
| Cover (art-directed, staged mastery) | `showcase/cover.webp` |
| Desktop 1440×900 | `showcase/desktop.webp` |
| Tablet 1024×768 | `showcase/tablet.webp` |
| Mobile 390×844 | `showcase/mobile.webp` |

All captures are taken from the live Shiplo deployment (see
`showcase/metadata.json` for exact provenance).

## Accessibility

Semantic HTML first; every control is a real `<button>`. Full keyboard path
for every activity (roving arrows in the grove, `R` replays the current
word, Enter/Escape for carry and back). `aria-live="polite"` caption
feedback, visible focus rings, ≥48px touch targets, no color-only meaning,
no time pressure, non-punitive error copy. Audio has a mute control and a
text alternative everywhere (`Read it` reveals hidden words; grapheme
rounds always show the word).

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`) —
GSAP (GreenSock Standard No-Charge license) and the OFL-1.1 fonts Andika
and Fraunces bundled via @fontsource.

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
