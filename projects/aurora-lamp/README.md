# Aurora Lamp

> Shiplo Showcase #18 — A fictional product-launch microsite for the Aurora
> desk lamp: typographic hero, exploded SVG anatomy and lighting modes.

**Live demo:** _deployed URL will be linked here after verification_
**Category:** marketing · **License:** Apache-2.0 (original work)

A one-page launch story for a lamp that does not exist: a typographic
hero, a scroll-driven exploded drawing of six honest parts, a dusk room
that answers a three-temperature mode switch, material swatches that find
themselves on the lamp, a dimensioned elevation, and a closing spec
sheet. Built as pure static files — no framework, no bundler, no backend,
no checkout — to show how far art-directed HTML/CSS/vanilla JS with local
GSAP and local JSON can carry a marketing story.

## Highlights

- **Exploded anatomy, scroll-scrubbed.** A pinned ScrollTrigger separates
  the lamp along its own axis while numbered engineering callouts fade
  in; Assembled/Exploded controls give the full keyboard and no-scroll
  path, and the exploded state is the no-JS default so the section always
  reads.
- **Three lighting modes in a room at dusk.** A real radio group (arrow
  keys included) retunes one CSS variable; the diffuser, halo and floor
  pool answer in ember 2700 K, focus 4000 K or studio 5000 K, with the
  temperature readout and copy changing with it — never color alone.
- **Dusk Atelier spec-sheet art direction.** Warm paper, graphite ink,
  hairline technical drawings with leader lines and dimension arrows,
  Fraunces + Instrument Sans + IBM Plex Mono, and exactly one amber glow.
- **Data-driven static.** Modes, materials, parts, dimensions and the
  whole spec sheet come from `data/product.json`; a new lamp variant is a
  JSON edit, not a markup rewrite.
- **Motion with a budget.** Feedback 120–220 ms, spatial 250–500 ms,
  reveals ≤ 900 ms; `prefers-reduced-motion` skips every ScrollTrigger
  and collapses tweens to ≤150 ms while every state stays readable.

## How to run it

Any static file server works (the page fetches its JSON at runtime, so
don't open `index.html` via `file://`):

```bash
cd projects/aurora-lamp
python -m http.server 8080        # or: npx --yes serve .
# → http://localhost:8080
```

## Development

```bash
cd projects/aurora-lamp
npm install          # fontsource sources (woff2 already committed) — node_modules is not shipped
npm run build        # assemble + gate dist/ (local refs only, JSON valid, size caps)
npm run verify       # re-check an existing dist/ without rebuilding
```

There is no bundler and no dev server requirement. The build copies
`index.html` + `css/` + `js/` + `data/` + `fonts/` + `vendor/` into
`dist/` and verifies the artifact is self-contained (no remote hosts, no
root-absolute paths, JSON parses, every file under the 3 MB static-host
cap). After a fresh clone, restore the vendored GSAP files:

```bash
# from the repository root
npm install
mkdir -p projects/aurora-lamp/vendor/gsap
cp node_modules/gsap/dist/gsap.min.js node_modules/gsap/dist/ScrollTrigger.min.js projects/aurora-lamp/vendor/gsap/
```

## Demo path checklist

1. Land on the hero — giant Fraunces "Aurora.", the lamp line drawing,
   amber glow, "Scroll — the lamp comes apart".
2. Scroll into **02 Anatomy** — the pinned panel separates the lamp;
   callouts 01–06 label every part; try the Assembled/Exploded controls
   by keyboard.
3. **03 Light** — arrow through Ember / Focus / Studio; watch the
   diffuser, halo, floor pool and readout retune; the change is
   announced to screen readers.
4. **04 Materials** — hover/focus/press a swatch; the matching pieces
   highlight on the drawing with a text caption.
5. **05 Dimensions** — dimensioned elevation; values come from the JSON.
6. **06 Closing** — "Replay the story" scrolls home; "View the spec
   sheet" expands the disclosure.
7. With `prefers-reduced-motion: reduce`, every section renders in its
   final readable state — no pin, no scrub, instant mode swaps.

## Project structure

```text
aurora-lamp/
├── index.html               # page + inline SVG part library & scenes
├── css/                     # tokens.css · base.css · motion.css
├── js/                      # motion.js (GSAP gate) · data.js · app.js
├── data/product.json        # all product content (modes, materials, specs)
├── fonts/                   # self-hosted woff2 + OFL texts
├── vendor/gsap/             # gsap + ScrollTrigger (local, no CDN; gitignored — see Development)
├── scripts/build.mjs        # assemble + gate dist/
├── design/DESIGN_DECISIONS.md  # internal, never shipped
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
└── showcase/                # metadata, deployment provenance, screenshots
```

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project (GSAP, three OFL
typefaces) is documented in `THIRD_PARTY_NOTICES.md` (policy:
repository `THIRD_PARTY_POLICY.md`).

Aurora is a fictional product by an imaginary studio; nothing here is for
sale and no price is real.

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
