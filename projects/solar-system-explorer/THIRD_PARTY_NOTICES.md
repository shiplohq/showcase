# Third-Party Notices

Third-party material redistributed with Solar System Explorer. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

This file lists exactly what ships in the production build (`dist/`):
the runtime npm dependencies and the two bundled font families. Dev-only
tooling (vite, typescript, @vitejs/plugin-react, @types/*) is not bundled
into the artifact and has no row here. All illustration is original
project SVG/CSS — no third-party or AI-generated raster assets ship.

| Component / Asset | Version | Path (in build) | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| React | 18.3.1 | bundled in `assets/index-*.js` | MIT | https://react.dev · facebook/react | no | UI runtime |
| React DOM | 18.3.1 | bundled in `assets/index-*.js` | MIT | https://react.dev · facebook/react | no | UI runtime |
| GSAP | 3.15.0 | bundled in `assets/index-*.js` | GreenSock Standard "no charge" license | https://gsap.com · greensock/gsap | no | Purposeful motion only (view morphs, sheet slide, normalized day rings). No-charge Standard license permits bundling and redistribution in this showcase; club-only plugins are NOT used |
| Gentium Book Plus (font files + @fontsource CSS) | @fontsource/gentium-book-plus 5.3.0; font v1.1xx (SIL) | `assets/gentium-book-plus-*.woff2/.woff` | SIL Open Font License 1.1 (font); @fontsource packaging MIT | https://fonts.google.com/specimen/Gentium+Book+Plus · SIL International; packaged by fontsource | no | Subsets bundled: latin, latin-ext, vietnamese (400, 700, italics) |
| Space Mono (font files + @fontsource CSS) | @fontsource/space-mono 5.3.0; font 2016 (Space Mono Project) | `assets/space-mono-*.woff2/.woff` | SIL Open Font License 1.1 (font); @fontsource packaging MIT | https://fonts.google.com/specimen/Space+Mono · Space Mono Project Authors; packaged by fontsource | no | Subsets bundled: latin, latin-ext, vietnamese (400, 700) |

Planet measurements (radii, sidereal rotation, orbital periods, distances,
moon counts) are common astronomical values from the NASA Planetary Fact
Sheet — factual data, cited per planet in `public/data/planets.json`
(`sourceNote`); no NASA imagery or artwork is redistributed.

Rules honored:

- Upstream copyright and license notices are preserved in the packages; no
  Shiplo headers were added to third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
- No placeholder rows remain.
