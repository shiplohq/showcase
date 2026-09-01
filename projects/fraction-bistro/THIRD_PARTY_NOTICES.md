# Third-Party Notices

Third-party material redistributed with Fraction Bistro. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## Bundled npm dependencies (runtime, shipped in `dist/`)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| vue | 3.5.42 | bundled in `dist/assets/*.js` | MIT | https://github.com/vuejs/core | No | UI runtime (Composition API, SFC compiler output) |
| gsap | 3.15.0 | bundled in `dist/assets/*.js` (core only; no plugins imported) | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Purposeful motion runtime (cut-line draw, slice separation, drag ghost flight, stamp). Recorded correctly as GreenSock Standard No-Charge, NOT MIT (pilot #01 lesson) |

## Fonts (bundled as woff2/woff via @fontsource, subsets: latin + vietnamese)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Fraunces (typeface) | v3.000 (via @fontsource/fraunces 5.3.0) | bundled in `dist/assets/*.css` + woff2/woff files | SIL Open Font License 1.1 | Undercase Type (Phaedra Charles, Flavia Zimbardi) — https://fonts.google.com/specimen/Fraunces · https://undercase.type.com | No | Display/serif: masthead, dish names, fraction numerals |
| Source Sans 3 (typeface) | 3.052R (via @fontsource/source-sans-3 5.3.0) | bundled in `dist/assets/*.css` + woff2/woff files | SIL Open Font License 1.1 | Adobe (Paul D. Hunt) — https://fonts.google.com/specimen/Source+Sans+3 · https://github.com/adobe-fonts/source-sans | No | Body/UI sans |
| @fontsource/fraunces | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; every weight imports BOTH `latin-*` and `vietnamese-*` subsets (repo font policy) |
| @fontsource/source-sans-3 | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | Same dual-subset import policy |

OFL 1.1 fonts cannot be sold by themselves and must keep their name when
modified; embedding and redistribution in an app is permitted. The OFL text
ships inside the fontsource packages.

## Images / textures

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| paper-grain.svg | — | `src/assets/paper-grain.svg` → bundled in `dist/assets/` | Apache-2.0 (original work of this project) | Authored in this project (procedural SVG feTurbulence) | No | ~5% opacity paper grain overlay. No third-party rights. |

All other artwork — Pizza Margherita, Ricotta Berry Tart, Focaccia Romana,
slice wedges, toppings, icons (knife/spoon/book/stack/arrow/check), the
SERVITO stamp, tickets, plates — is **original SVG/CSS authored in this
project** (`src/components/*.vue`, `src/styles/*.css`) under Apache-2.0,
rendered from data in `public/data/dishes.json`. No raster assets, no
internet-sourced images, no AI-generated assets (spec: dishes must be
original SVG/CSS).

## Dev-only tooling (NOT bundled into `dist/`; listed for transparency)

vite 7.3.6 (MIT), @vitejs/plugin-vue 6.0.8 (MIT), typescript 5.9.3
(Apache-2.0), vue-tsc 3.3.11 (MIT, built on Volar).

---

Rules honored:

- Upstream copyright and license notices preserved (fonts keep OFL headers
  inside the fontsource packages; npm packages ship in full in
  `node_modules`, only their bundled output is redistributed here).
- No Shiplo headers were added to any third-party file.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
- No placeholder rows remain.
