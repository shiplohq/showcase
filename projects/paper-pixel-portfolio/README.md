# Paper & Pixel

> Shiplo Showcase #19 — A fictional small-studio portfolio built as an editorial index with numbering, cropped thumbnails and type-led transitions.

**Live demo:** https://paper-pixel-portfolio.shiplo.site
**Category:** portfolio · **License:** Apache-2.0 (original work)

Paper & Pixel is a two-person fictional studio "for printed indexes and the screens
that quote them". The site is their studio index: an ivory-paper page where works
are filed as numbered, ruled rows — № 01–03 — each carrying a cropped abstract SVG
plate. Hover or focus a row and its plate slides into a sticky lightbox; open the
case and the plate morphs (GSAP Flip) into the wide hero crop while the title
rises from its mask. Everything — works, sections, manifesto, people, contact —
comes from local JSON; there is no backend, no API and no database.

## Highlights

- **Editorial index, not a card grid** — numbered ruled rows, hairline rules,
  ivory paper with a procedural grain, ultramarine pen and salmon margin notes.
- **One plate, many crops** — each work has a single hand-drawn SVG composition
  mixing paper vocabulary (contour rings, ledger bars, torn edges) with pixel
  vocabulary (stepped blocks, dot matrix); the crop windows themselves are the
  thumbnail system.
- **Type-led transitions** — shared-element Flip (lightbox crop → case hero,
  480 ms) plus masked title rises; IntersectionObserver section reveals;
  everything collapses instantly under `prefers-reduced-motion` or the in-page
  motion toggle (persisted locally, resettable).
- **Content as data** — `public/data/projects.json` + `studio.json` validated at
  load time; a new work is a JSON entry plus one SVG plate, no layout edits.
- **Static by construction** — hash routing, local fonts (Fraunces variable +
  Archivo Narrow via Fontsource), no runtime CDN, degrades to a readable fault
  panel instead of a white screen.

## Demo path (2 minutes)

1. **Index** — tab through the three ruled rows; watch each plate file itself
   into the sticky lightbox. `Enter` opens a case.
2. **Case** — the lightbox crop morphs into the wide hero (GSAP Flip); scroll
   the sectioned flow (notes → plate → margin quote → specs); press `Esc` to
   return — focus lands back on the row you left.
3. **Studio / Contact** — manifesto, numbered principles, the two monogram
   cards; contact is a plain `mailto:` ledger, no form.
4. **Motion toggle** (masthead) — cycle system → off → on; transitions collapse
   instantly while the page stays fully usable. The OS-level
   `prefers-reduced-motion` setting is honoured the same way.

## Development

```bash
npm install
npm run dev     # local dev server
npm run build   # type-check (vue-tsc) + production build → dist/
npm run preview # serve the built artifact locally
```

The production artifact is `dist/` — deploy that folder to any static host.

### Deploying to Shiplo

Build, then publish the `dist/` folder as a static site (see the repository
deployment docs). The app uses relative asset URLs (`base: './'`), so the
artifact runs from any subpath. Provenance — URL, source commit, artifact
checksum — is recorded in `showcase/deployment.json`.

## Project structure

```text
paper-pixel-portfolio/
├── README.md
├── LICENSE / NOTICE / THIRD_PARTY_NOTICES.md
├── package.json + package-lock.json
├── index.html / vite.config.ts / tsconfig.json
├── design/DESIGN_DECISIONS.md        # internal design system notes (not shipped)
├── src/
│   ├── components/                   # PlateArt (SVG plate registry), masthead, colophon
│   ├── features/                     # index / case / studio / contact screens
│   ├── lib/                          # gsap wrapper (motion switch), data loader, hash router, reveal
│   └── styles/                       # tokens.css · base.css · motion.css
├── public/
│   ├── data/                         # projects.json · studio.json (all content)
│   └── assets/
├── showcase/
│   ├── cover.webp / desktop.webp / tablet.webp / mobile.webp
│   ├── metadata.json
│   └── deployment.json
└── dist/                             # generated, gitignored — the deploy artifact
```

## Open source

This project is part of the Shiplo Showcase and is distributed under the
Apache License 2.0. See `LICENSE` and `NOTICE`.

Shiplo names, logos and brand assets are handled separately from the
source-code license. See the repository `TRADEMARKS.md`.

Third-party material redistributed with this project is documented in
`THIRD_PARTY_NOTICES.md` (policy: repository `THIRD_PARTY_POLICY.md`).

## Security and production use

This project is a demonstration/reference implementation, not a security
audit or a production-readiness guarantee.

If you adapt it for production use, you are responsible for reviewing and
hardening the code for your own threat model, dependencies, privacy
requirements, compliance obligations, hosting configuration and user data.

See `SECURITY.md` in the repository for the reporting policy and the
production-use checklist.
