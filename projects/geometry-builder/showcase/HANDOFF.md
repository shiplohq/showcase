# HANDOFF — Geometry Builder (Showcase #03)

**Project:** Geometry Builder (#03) — Xưởng hình học
**Spec:** `.showcase/03_geometry-builder.md`
**Status:** Lifecycle complete through live verification; root registry integration pending (orchestrator).

## Build: PASS
- `npm run build` (= `ng build && node scripts/flatten-dist.mjs`) — 0 warnings, 0 errors.
- `dist/` = 32 files, 682,580 bytes (0.65 MB); largest file `main-*.js` 314 KB — far under the 3 MB/file Shiplo cap.
- `npm run verify:static -- geometry-builder` → PASS (no runtime CDN, no internal-file leaks, all asset refs resolve).
- `npm run test:engine` → PASS, 317 checks (all 8 missions: authoring validation incl. no slot overlaps + tray budgets + authored mirror symmetry, solve/nudge/wrong-rotation/extra-piece paths, undo/redo/drag-snap sessions, outline area/angle invariants, perimeter walks, exact silhouette right-angle counts).
- `npm audit` → **0 vulnerabilities**.
- Angular 21.2.22 standalone, zoneless (no zone.js in the dependency tree), no component libraries, GSAP 3.15 bundled (never CDN).

## Shiplo deployment
- **URL:** https://geometry-builder.shiplo.site (returned by `platform_deploy_static`, used verbatim everywhere).
- Site id `8cf23c93-f924-477f-b577-aebd24058584`, release `368c02d2-2bfa-4d71-9c12-c84e009ff8ff`, deployment `2b086b64-972f-451e-990e-9fbcbf3ba0dd`, activated **2026-09-01T05:14:02Z**, 32 files / 682,580 bytes.
- `.shiplo/project.json` written into the project by the deployer — commit it (no secrets).

## Live verification: PASS
- Full CDP flow against the public URL at **1440×900** and **1024×768** (mouse drag from tray → keyboard arrows/R/E → undo/redo → gentle nudge check → 3-level hint ladder → solve house-01 → CHECKED + stamp → perimeter walk totals 24 u → touch return to lobby → all buttons ≥44px → prefers-reduced-motion usable): **zero console errors** at both viewports.
- Smoke at **390×844**: lobby renders 8 missions / 3 tracks, zero console errors.
- `npm run check:fonts -- https://geometry-builder.shiplo.site "Space Grotesk:400,500,700,IBM Plex Mono:400,500,600"` → all OK (latin+digits).
- HTTP 200. First Angular showcase in the repo — Angular 21 deploys to Shiplo as pure static output cleanly.

## Screenshots (all captured from the live URL, WebP via ffmpeg)
- `showcase/cover.webp` 1440×900 — art-directed staged REAL state (Mirror Bridge mid-build: deck + one support placed, triangle selected with spec sheet + crop marks, mirror line visible).
- `showcase/desktop.webp` 1440×900 — honest drawing index.
- `showcase/tablet.webp` 1024×768 — education hero, honest index at tablet size.
- `showcase/mobile.webp` 390×844 — honest; `mobileSupport: "limited"` declared with note (stacked layout works; drag precision reduced; tablet is the intended viewport).
- `showcase/metadata.json` filled (`capturedFrom` = the live URL).

## Codex-generated assets
**NONE.** All illustration is code-native SVG/CSS drawn from `public/data/shapes.json` coordinates; art direction is precision drafting, where raster adds nothing (decision recorded in `design/DESIGN_DECISIONS.md` §9/§15).

## Third-party assets (real licenses read from the lockfile — `THIRD_PARTY_NOTICES.md`)
- @angular/* 21.2.22 — MIT (runtime + build).
- rxjs 7.8.2 — Apache-2.0; tslib 2.8.1 — 0BSD.
- gsap 3.15.0 — **GreenSock Standard "No Charge" license** (not MIT).
- @fontsource/space-grotesk + @fontsource/ibm-plex-mono 5.3.0 — packaging MIT; fonts Space Grotesk (© 2020 The Space Grotesk Project Authors) and IBM Plex Mono (© 2017 IBM Corp.) — SIL OFL 1.1; latin + latin-ext subsets bundled (UI is English-only).

## License/provenance: PASS
- SPDX headers (`Copyright 2026 Shiplo HQ` / `SPDX-License-Identifier: Apache-2.0`) on every authored source file under `src/` and `scripts/` (verified by scan; `main.ts` was backfilled). None on JSON/third-party files.
- `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md` (no placeholder rows) present.
- `showcase/deployment.json`: status **verified**, url verbatim, buildCommand `npm run build`, artifactSha256 `c2a4725de67ed4464bd0270eb8d7b07e6a8d1591a9cb2f4584abcbc0aee22fd6` (`tar -czf - -C dist . | sha256sum`), deployedAt/verifiedAt from Shiplo's own timestamps.

## Security: PASS
- `npm audit` 0 vulnerabilities. No secrets, no eval/dynamic execution, no sensitive localStorage (anonymous completed/walked mission ids only, with reset). Production console clean on the live URL. `npm run check:repo` reports nothing for this project (its remaining warnings/errors belong to other leads' projects).

## Impeccable (critique → audit → harden → polish)
Manual equivalent passes (vision-model critique + CDP/DOM ground-truth verification + fixes + re-verification). Major findings, all FIXED:
1. **Content invisible in normal motion mode** — the GSAP reveal wrapper had inverted FROM/TO semantics and animated everything to opacity 0. Fixed (`gsap.from` + `clearProps`); CDP had passed because elements existed in the DOM — caught only by visual review.
2. **SVG pieces never painted** — custom `<app-shape>` elements inside SVG are `display:none` under the SVG UA stylesheet; polygons existed but never rendered. Fixed by making the component's host a real `<g>` (`selector: 'g[appShape]'`). Ground-truthed via computed styles + pixel review.
3. **Focus lost after placement** — `queueMicrotask` focus helpers ran before change detection rendered the new elements; replaced with post-render `setTimeout`.
4. Tablet (1024×768) fit: canvas now capped per breakpoint (aspect-ratio aware) — workbench overflow 0 px at 1440×900, 14 px harmless at 1024×768 (feedback strip bottom at 737 < 768).
5. Lobby density pass: stamped progress badge (8 pips + n/8), LVL chips, "OPEN →" cues, grid-backed previews, track sheet counts, aligned cards (removed the accidental-looking alternating indents); review screen verified rendering dimension chips + right-angle marks + parallel ticks (8.5/10 on the completed states).

## Remaining issues
NONE known. Notes (accepted, not defects): mobile is declared "limited" per spec (stacked layout, scrollable workbench — intended); hexagon/trapezoid edge lengths display 1-decimal values (irrational by nature, shown like a real drawing); `previewPolys` recomputes per lobby render (8 missions × ≤7 slots — negligible).

## Root integration required
- `showcase.json` (#03): `status: "live"`, `demo.url = "https://geometry-builder.shiplo.site"`, `demo.deployedAt = "2026-09-01T05:14:02Z"`, `screenshots.cover/desktop/tablet/mobile = "projects/geometry-builder/showcase/*.webp"`, `mobileSupport` note mirrored from metadata if the schema supports it.
- README gallery: via `npm run gallery`.
- `sourceCommitSha` finalization: **YES** — `showcase/deployment.json` has `sourceCommitSha: null` with a notes line explaining the orchestrator finalizes it to the integration commit after review.
