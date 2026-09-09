# Third-Party Notices

Third-party material redistributed with EcoBalance. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

This file lists **exactly what ships in the built artifact (`dist/`)**.
Dev-only tooling (TypeScript, Vite) is compiled out or used at build time
only and is not redistributed here.

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| GSAP (GreenSock Animation Platform) | 3.15.0 | bundled into `assets/index-*.js` | GreenSock Standard "No Charge" License | https://greensock.com/standard-license (npm `gsap`) | No | Core module only; no plugins. Permits free use in commercial and non-commercial works; the license is NOT MIT — see the linked terms. |
| IBM Plex Serif (fonts: 600, 700 — latin, latin-ext, vietnamese; woff2 + woff) | 5.2.5 (`@fontsource/ibm-plex-serif`) | `assets/ibm-plex-serif-*.woff2` / `.woff` | SIL Open Font License 1.1 | https://github.com/IBM/Type (npm `@fontsource/ibm-plex-serif`) | No | Typeface by Mike Abbink, IBM & Bold Monday, licensed OFL; fontsource packages the web fonts. |
| IBM Plex Sans (fonts: 400, 600, 700 — latin, latin-ext, vietnamese; woff2 + woff) | 5.2.5 (`@fontsource/ibm-plex-sans`) | `assets/ibm-plex-sans-*.woff2` / `.woff` | SIL Open Font License 1.1 | https://github.com/IBM/Type (npm `@fontsource/ibm-plex-sans`) | No | Same family as above. |
| IBM Plex Mono (fonts: 400, 500, 600 — latin, latin-ext, vietnamese; woff2 + woff) | 5.2.5 (`@fontsource/ibm-plex-mono`) | `assets/ibm-plex-mono-*.woff2` / `.woff` | SIL Open Font License 1.1 | https://github.com/IBM/Type (npm `@fontsource/ibm-plex-mono`) | No | Same family as above. |

All original source code, the diorama illustration system (SVG generated in
`src/components/art.ts`), the JSON content in `public/data/`, and the UI copy
are original work of Shiplo HQ (see `LICENSE`, `NOTICE`). No raster images,
audio, external icons, or CDN-loaded assets ship with this project.

Rules honored:

- Upstream copyright and license notices preserved; no Shiplo headers added
  to third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
- No placeholder rows remain.
