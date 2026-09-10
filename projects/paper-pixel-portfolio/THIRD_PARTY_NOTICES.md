# Third-Party Notices

Third-party material redistributed with Paper & Pixel. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Vue (npm `vue`) | 3.5.x | `node_modules/vue` → bundled into `dist/assets/*.js` | MIT | https://github.com/vuejs/core | No | Runtime dependency, bundled by Vite. |
| GSAP (npm `gsap`, incl. `Flip` plugin) | 3.15.x | bundled into `dist/assets/*.js` | GreenSock Standard "No Charge" License | https://github.com/greensock/GSAP | No | "No charge" license permits bundling in free projects — see https://gsap.com/standard-license/ |
| Vite (npm `vite`), plugin-vue, TypeScript, vue-tsc | — | devDependencies, NOT bundled into `dist/` | BSD-3-Clause / MIT / Apache-2.0 | https://github.com/vitejs/vite | No | Build-time tooling only — no row needed for output; listed for completeness. |
| Fraunces variable font (npm `@fontsource-variable/fraunces`) | 5.x (font: Fraunces 4.2 by_undercase.io) | `dist/assets/fraunces-*-opsz-normal.woff2` | SIL OFL 1.1 (font); MIT (fontsource package) | https://github.com/google/fonts/tree/main/ofl/fraunces · https://fontsource.org/docs/getting-started/variable | No | Self-hosted via Fontsource; `opsz.css` entry; latin/latin-ext/vietnamese subsets by unicode-range (browser downloads only what the page uses). |
| Archivo Narrow font (npm `@fontsource/archivo-narrow`) | 5.x (font: Archivo Narrow 2.x, Omnibus-Type) | `dist/assets/archivo-narrow-latin-*.woff2/.woff` | SIL OFL 1.1 (font); MIT (fontsource package) | https://github.com/google/fonts/tree/main/ofl/archivonarrow · https://fontsource.org | No | Self-hosted via Fontsource; latin 400/500/700. |
| Paper-grain texture | — | inline `data:` URI in `src/styles/base.css` (SVG `feTurbulence`) | Original work — Shiplo HQ | procedural SVG, no external source | — | Not third-party; listed to state that no raster texture asset ships. |

Notes:

- All plate artwork on the site (contour/pixel compositions in
  `src/components/PlateArt.vue`) is original SVG drawn for this showcase — no
  stock artwork, no scraped imagery, no AI-generated raster assets.
- The studio, people, clients and works are fictional; no real person or
  studio is depicted.
- Upstream license texts are preserved inside `node_modules` packages; this
  project adds no Shiplo headers to third-party files.
