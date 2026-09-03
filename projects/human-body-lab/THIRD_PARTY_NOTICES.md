# Third-Party Notices

Third-party material redistributed with Human Body Lab. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

This table lists **exactly what ships in the build artifact (`dist/`)** —
runtime-bundled npm packages and font files referenced by the bundle.
Dev-only tooling (vite, @vitejs/plugin-vue, typescript, vue-tsc) is not
redistributed in the artifact and has no row.

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Vue (runtime) | 3.5.42 | bundled into `dist/assets/index-*.js` | MIT | https://github.com/vuejs/core | No | Runtime bundled by Vite |
| GSAP (core, no plugins) | 3.15.0 | bundled into `dist/assets/index-*.js` | GreenSock Standard "No Charge" License — https://gsap.com/standard-license | https://github.com/greensock/GSAP | No | Copyright (c) 2008-2026, GreenSock. All rights reserved. Only `gsap` core imported (`src/lib/gsap.ts`) |
| Source Serif 4 (font files) | 5.3.0 | `dist/assets/source-serif-4-latin-*.{woff,woff2}` | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Source+Serif+4 via `@fontsource/source-serif-4` (package MIT; font files OFL-1.1, "Copyright Google Inc.") | No | Weight shipped: 600 — latin subset |
| Work Sans (font files) | 5.3.0 | `dist/assets/work-sans-latin-*.{woff,woff2}` | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Work+Sans via `@fontsource/work-sans` (package MIT; font files OFL-1.1, "Copyright Google Inc.") | No | Weights shipped: 400, 500, 600 — latin subset |
| IBM Plex Mono (font files) | 5.3.0 | `dist/assets/ibm-plex-mono-latin-*.{woff,woff2}` | SIL Open Font License 1.1 | https://fonts.google.com/specimen/IBM+Plex+Mono via `@fontsource/ibm-plex-mono` (package MIT; font files OFL-1.1, "Copyright Google Inc.") | No | Weights shipped: 400, 500 — latin subset |

What is **not** shipped and therefore not listed: no icon libraries, no
external images/audio/textures, no vendored JS/CSS, no copied snippets, no
AI-generated raster assets. All illustration (body model, system glyphs,
favicon) is original vector work authored in this project (Apache-2.0, see
`LICENSE`). All content (systems, organs, pathways, quiz) is authored JSON
in `public/data/`.

Rules honored:

- Upstream copyright and license notices are preserved (font license texts
  travel inside each `@fontsource/*` package; GSAP's notice is quoted above).
- No Shiplo headers were added to third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is redistributed.
