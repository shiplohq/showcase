# Third-Party Notices

Third-party material redistributed with Money Market Junior. Policy:
`THIRD_PARTY_POLICY.md` in the repository root. Unknown or unclear
licensing blocks publication.

Runtime dependencies bundled into the build output:

| Component / Asset | Version | Path | License | Source / Origin | Modified | Notes |
|---|---|---|---|---|---|---|
| Angular (`@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/platform-browser`) | 21.2.22 | npm → bundled JS | MIT | https://angular.dev — Angular packages | No | Framework runtime, compiled into `dist/main-*.js` |
| RxJS | 7.8.2 | npm → bundled JS | Apache-2.0 | https://rxjs.dev | No | Angular peer dependency |
| tslib | 2.8.1 | npm → bundled JS | 0BSD | https://github.com/microsoft/tslib | No | TypeScript runtime helpers |
| GSAP | 3.15.0 | npm → bundled JS | GreenSock Standard "No Charge" License | https://gsap.com/standard-license/ | No | Motion runtime (core only, no plugins). Standard license permits bundling in free-licensed showcase apps |
| Bricolage Grotesque (via `@fontsource/bricolage-grotesque`) | 5.3.0 (font v1.1) | npm → bundled woff/woff2 | SIL OFL 1.1 (font) · MIT (package) | Font: https://github.com/ateliertriay/bricolage · Package: fontsource | No | Display/numerals. Latin + latin-ext subsets bundled |
| Figtree (via `@fontsource/figtree`) | 5.3.0 | npm → bundled woff/woff2 | SIL OFL 1.1 (font) · MIT (package) | Font: https://github.com/erikdkennedy/figtree · Package: fontsource | No | Body/UI. Latin + latin-ext subsets bundled |

Dev-only tooling (not redistributed in the artifact, listed for completeness):
`@angular/cli`, `@angular/build`, `@angular/compiler-cli` (MIT), `typescript`
(Apache-2.0) — all MIT/Apache-licensed.

All illustrations (produce, coins, notes, basket, awning, price tag, receipt,
stamp, favicon) are original inline SVG authored for this project — no
third-party or AI-generated raster assets are used. No audio, textures, or
external images ship with this showcase.

Rules honored:

- Upstream copyright and license notices preserved; no Shiplo headers added to
  third-party files.
- No material with unknown, missing, non-commercial or no-derivatives
  licensing is shipped.
