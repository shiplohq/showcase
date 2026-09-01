# Third-Party Notices

Third-party material redistributed with Geometry Builder. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

Licenses below were read from each package's manifest in the committed
lockfile (`package-lock.json`), not from memory or registry metadata.

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| @angular/core, -common, -compiler, -forms, -platform-browser, -router | 21.2.22 | bundled npm deps | MIT | https://angular.dev · https://github.com/angular/angular | No | Runtime framework; compiled into `dist/main-*.js` |
| rxjs | 7.8.2 | bundled npm dep | Apache-2.0 | https://github.com/ReactiveX/rxjs | No | Angular peer dependency |
| tslib | 2.8.1 | bundled npm dep | 0BSD | https://github.com/microsoft/tslib | No | TypeScript runtime helpers |
| gsap | 3.15.0 | bundled npm dep | GreenSock Standard "No Charge" License — https://gsap.com/standard-license/ | https://github.com/greensock/GSAP | No | **Not MIT.** Standard No-Charge license permits bundling in free, non-commercial-killing products; commercial resale of GSAP itself requires a Club license. Motion runtime (core + Flip + MotionPath plugins). |
| @angular/cli, @angular/build, @angular/compiler-cli | 21.2.22 | devDependencies | MIT | https://github.com/angular/angular-cli | No | Build-time only — not present in `dist/` |
| typescript | 5.9.3 | devDependency | Apache-2.0 | https://github.com/microsoft/TypeScript | No | Build-time only |
| prettier | 3.9.6 | devDependency | MIT | https://github.com/prettier/prettier | No | Dev formatting only |
| @fontsource/space-grotesk (packaging) | 5.3.0 | bundled npm dep | MIT | https://github.com/fontsource/fontsource | No | Font packaging; the font itself is OFL (below) |
| Space Grotesk (font) | v22 (upstream font version) | `dist/media/space-grotesk-*.woff2` | SIL Open Font License 1.1 | © 2020 The Space Grotesk Project Authors · https://github.com/floriankarsten/space-grotesk | No | Latin + latin-ext subsets (400/500/700) |
| @fontsource/ibm-plex-mono (packaging) | 5.3.0 | bundled npm dep | MIT | https://github.com/fontsource/fontsource | No | Font packaging; the font itself is OFL (below) |
| IBM Plex Mono (font) | — (see upstream repo) | `dist/media/ibm-plex-mono-*.woff2` | SIL Open Font License 1.1 | © 2017 IBM Corp. · https://github.com/IBM/plex | No | Latin + latin-ext subsets (400/500/600) |

No raster assets, icons, audio, textures, externally sourced SVGs, or
AI-generated images are redistributed with this project — all illustration
is original SVG/CSS drawn from `public/data/shapes.json` coordinates.

Rules honored:

- Upstream copyright and license notices preserved; no Shiplo headers added
  to third-party files, none removed.
- No material with unknown, missing, non-commercial-only or
  no-derivatives-only licensing is shipped.
- No placeholder rows remain.
