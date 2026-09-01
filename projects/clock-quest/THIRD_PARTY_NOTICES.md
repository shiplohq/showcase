# Third-Party Notices

Third-party material redistributed with Clock Quest. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## Vendored runtimes (shipped as-is in `vendor/`, loaded locally — no CDN)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| jQuery | 3.7.1 | `vendor/jquery/jquery-3.7.1.min.js` | MIT | https://jquery.com/ · https://github.com/jquery/jquery (dist/jquery.min.js @3.7.1) | No | DOM/interaction layer, vendored because the stack is deliberately no-build |
| GSAP core | 3.15.0 | `vendor/gsap/gsap.min.js` | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Animation runtime |
| Draggable (GSAP plugin) | 3.15.0 | `vendor/gsap/Draggable.min.js` | GreenSock Standard "No Charge" License | https://github.com/greensock/GSAP | No | Rotary drag of the clock hands |
| MotionPathPlugin (GSAP plugin) | 3.15.0 | `vendor/gsap/MotionPathPlugin.min.js` | GreenSock Standard "No Charge" License | https://github.com/greensock/GSAP | No | Ferry token sailing the island route |

jQuery and GSAP keep their upstream copyright headers inside the vendored
files; no Shiplo headers were added to them.

## Fonts (self-hosted woff2, committed under `fonts/`)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Hepta Slab (typeface), weights 700/800 | fontsource latin woff2 file set (2018–) | `fonts/hepta-slab-latin-{700,800}-normal.woff2` | SIL Open Font License 1.1 | Mike LaGattuta — https://fonts.google.com/specimen/Hepta+Slab (files via @fontsource/hepta-slab) | No | Display/numerals face; the 500 weight was dropped after the impeccable pass (never referenced by the CSS); full license text in `fonts/OFL-HeptaSlab.txt` |
| Lexend (typeface), weights 400/600/700 | fontsource latin woff2 file set (2019–) | `fonts/lexend-latin-{400,600,700}-normal.woff2` | SIL Open Font License 1.1 | Bonny / Remote Asia / Thomas Jockin et al. — https://fonts.google.com/specimen/Lexend (files via @fontsource/lexend) | No | Body/UI face, designed for early readers; license text in `fonts/OFL-Lexend.txt` |

The UI ships English text only; the `latin` subsets cover everything rendered.
OFL 1.1 fonts cannot be sold by themselves and must keep their name when
modified; embedding and redistribution in an app is permitted. The two OFL
license texts ship alongside the woff2 files in `fonts/`.

## Artwork

All artwork — the island chart, contour bands, compass rose, ferry, buoys,
stop markers, station clock, departure board, postage stamps, timeline and
every icon — is **original SVG authored in this project** (`js/map.js`,
`js/clock.js`, `js/icons.js`, `css/base.css`) under Apache-2.0. No raster
assets, no third-party icon sets, no AI-generated images are used or shipped.

## Dev-only tooling (NOT bundled into `dist/`; listed for transparency)

None. The project has zero npm dependencies; `scripts/build.mjs` runs on
Node's standard library alone. (`package-lock.json` records an empty
dependency tree.)

---

Rules honored:

- Upstream copyright and license notices preserved (jQuery MIT header and
  GSAP license banner remain inside the vendored files; OFL texts ship in
  `fonts/`).
- No Shiplo headers were added to any third-party file.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
