# Third-Party Notices

Third-party material redistributed with Vocabulary Expedition. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Vue (runtime) | 3.5.42 | bundled (dist/assets) | MIT | https://github.com/vuejs/core | no | Runtime framework; license notice in bundled output |
| GSAP | 3.15.0 | bundled (dist/assets) | GreenSock Standard “No Charge” License | https://github.com/greensock/GSAP | no | Bundled from npm (not the vendored copy in repo `vendor/`); “no charge” license permits bundling in free projects — see https://gsap.com/standard-license/ |
| Andika (font) | 5.3.0 (@fontsource) | bundled woff2 subsets (latin, latin-ext, vietnamese) | SIL Open Font License 1.1 | SIL International, via https://www.npmjs.com/package/@fontsource/andika | no | Designed for beginning readers; OFL permits bundling & redistribution |
| Caveat (font) | 5.3.0 (@fontsource) | bundled woff2 subsets (latin) | SIL Open Font License 1.1 | Impallari Type, via https://www.npmjs.com/package/@fontsource/caveat | no | Journal headings layer (English-only strings — no vietnamese subset ships) |

Development-only dependencies (not redistributed in the build output):
TypeScript 5.9.3 (Apache-2.0), Vite 7.3.6 (MIT), @vitejs/plugin-vue 6.0.8 (MIT),
vue-tsc 3.3.11 (MIT-style, part of the Vue ecosystem).

## Original artwork

All illustration in this project — the six gouache scene plates (living room,
kitchen, classroom, market, farm, park), the expedition world map, the Pip
sparrow mascot, and all UI icons — are original hand-authored SVG drawn for
this project (see `src/features/scenes/`, `src/features/map/`,
`src/components/`). No stock artwork, no scraped images, no AI-generated
raster assets ship with this project (`design/generated-manifest.json`
records zero generated assets). The paper-grain texture is a procedural SVG
`feTurbulence` filter defined inline in `src/styles/base.css`.

## Audio

No audio files ship. The optional feedback sounds (off by default) are
synthesized at runtime with the WebAudio API in `src/lib/audio.ts`. No
text-to-speech service is used.

Rules honored:

- Upstream copyright and license notices preserved; no Shiplo headers added
  to third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
