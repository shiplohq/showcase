# Third-Party Notices

Third-party material redistributed with Number Garden. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

## Bundled npm dependencies (runtime, shipped in `dist/`)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| react | 18.3.1 | bundled in `dist/assets/*.js` | MIT | https://github.com/facebook/react | No | UI runtime |
| react-dom | 18.3.1 | bundled in `dist/assets/*.js` | MIT | https://github.com/facebook/react | No | DOM renderer |
| gsap | 3.15.0 | bundled in `dist/assets/*.js` (incl. Flip plugin) | GreenSock Standard "No Charge" License — free for commercial use; bundling/redistribution as part of a larger work permitted | https://github.com/greensock/GSAP · https://gsap.com/standard-license/ | No | Animation runtime; Flip plugin is part of the public package since GSAP 3.13 |

## Fonts (bundled as woff2 via @fontsource, subsets: vietnamese + latin)

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Baloo 2 (typeface) | v20.200 (via @fontsource/baloo-2 5.3.0) | bundled in `dist/assets/*.css` / woff2 | SIL Open Font License 1.1 | Ek Type — https://fonts.google.com/specimen/Baloo+2 · https://github.com/ektype | No | Display/numerals font |
| Nunito (typeface) | v22.100 (via @fontsource/nunito 5.3.0) | bundled in `dist/assets/*.css` / woff2 | SIL Open Font License 1.1 | Vernon Adams, Cyreal, Jacques Le Bailly — https://fonts.google.com/specimen/Nunito | No | Body/UI font |
| @fontsource/baloo-2 | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |
| @fontsource/nunito | 5.3.0 | build-time dependency (self-hosts the font files) | MIT (package), OFL-1.1 (font files) | https://github.com/fontsource/fontsource | No | No runtime CDN; files are bundled |

OFL 1.1 fonts cannot be sold by themselves and must keep their name when
modified; embedding and redistribution in an app is permitted. The OFL text
ships with the fontsource packages.

## Images / textures

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| paper-texture.png | 1024×1024 | `public/assets/generated/paper-texture.png` → `dist/assets/generated/` | AI-generated asset (OpenAI Codex `imagegen` / GPT Image, 2026-09-01, brief IMG-01-001). OpenAI output terms at generation time permit commercial use and redistribution of generated images; Shiplo does not assert exclusive copyright over AI-generated output (see repo `design/codex-image-producer.md`). | Generated from a written brief; no third-party reference image used | Yes — made seamlessly tileable (4-quadrant mirror) and palette-quantized after generation | Paper-grain overlay at ~4% opacity; internal provenance record in `design/generated-manifest.json` |

All other artwork (seeds, sprouts, flowers, trees, fence, watering can,
ten-frame, bond tree, icons) is **original SVG authored in this project**
(`src/components/art.tsx`) under Apache-2.0 — no third-party rights involved.

## Dev-only tooling (NOT bundled into `dist/`; listed for transparency)

vite 7.3.6 (MIT), @vitejs/plugin-react 5.2.0 (MIT), typescript 5.9.3
(Apache-2.0), @types/react 18.x / @types/react-dom 18.x (MIT).

---

Rules honored:

- Upstream copyright and license notices preserved (fonts keep OFL headers
  inside the fontsource packages; npm packages ship in full in `node_modules`,
  only their bundled output is redistributed here).
- No Shiplo headers were added to any third-party file.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
