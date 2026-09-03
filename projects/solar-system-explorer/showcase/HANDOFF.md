# HANDOFF — Solar System Explorer (#11)

Project: Solar System Explorer (#11)
Spec: .showcase/11_solar-system-explorer.md
Status: deploy 2 live + verified (independent-review fixes batched); screenshots + provenance + README complete — awaiting orchestrator integration (registry → live, sourceCommitSha, gallery)

## Deploy 2 — independent-review fixes (2026-09-03)

All four findings fixed and batched into ONE release (fd4fbf8c-74f8-4bef-acdf-e0c26352eb6f · deployment 81e86131-cc0a-4304-a00b-6d87f0da093e · activated 2026-09-03T17:36:22.420Z · 27 files / 967,497 bytes · deterministic artifactSha256 949fb456…b9488e):
1. P2 desktop alt — rewritten to ground truth: Mercury/Venus/Earth at ticks "0.39, 0.72, 1.0 AU" (Earth renders "1.0 AU"), "Mars just entering at the right edge" (was wrongly "Jupiter entering").
2. P3 tablet alt — now states three fully-visible plates + a Mars sliver, and "Reading this atlas" wrapping to its own row at 1024px.
3. P3 quiz aria-labels — `c.moveLeft`/`c.moveRight` were used raw in the lifted-slot label and the move-controls group label; now interpolated. DOM-verified live: "Move Jupiter left / Move Jupiter right" (group + buttons + slot label). Same-class bonus: empty-slot copy no longer carries a "Place {name}" placeholder ("tap to place a planet here").
4. P3 data accuracy — yearDays corrected to NASA Planetary Fact Sheet means: Saturn 10747→10759, Uranus 30589→30687, Neptune 59800→60190; engine-sim expectation updated (Neptune formats "60,190 d (165 yr)"), 279/279 still green; live /data/planets.json serves the corrected values.

Deploy-2 verification: rebuild → verify:static PASS → redeploy same site → live flow 30/30, zero console errors at 1440x900 + 1024x768; fonts.check OK (both families); aria-label ground truth above. Screenshots NOT re-captured, with evidence: at scroll 0 the visible plates are Mercury/Venus/Earth (+ ~40px Mars sliver) showing year readouts 88/225/365/687 d — none of the corrected values (Saturn/Uranus/Neptune years) render in any captured frame; the cover (Size view) plates show radius/×Earth readouts only. Existing webp images remain pixel-accurate for this release; capturedFrom/capturedAt unchanged accordingly.

Build: PASS — `npm run build` (tsc -b && vite build); dist = 27 files, 967,497 bytes (0.92 MB, no .gitkeep leakage); `npm run verify:static -- solar-system-explorer` PASS; engine simulation 279/279 checks (`npm run test:engine`).

Shiplo deployment: URL: https://solar-system-explorer.shiplo.site
(current release fd4fbf8c — see Deploy 2 above; release history and byte-explanations in deployment.json notes)

Live verification: PASS — full atlas flow driven headless against the public URL: view morphs (distance → size → day&year), corridor arrow walk + keyboard station focus, specimen sheet open/ESC/focus-restore, scale-honesty panel open/close, compare (3-column cap, bars, no clipped content), quiz sort (tap-lift, place, check feedback) + match (choice feedback, progress), data table disclosure, reduced-motion emulation. 30/30 checks, zero console errors at every run: 1440x900, 1024x768, 768x1024, 390x844 (initial release) and 1440x900 + 1024x768 (deploy 2). Document has no horizontal overflow at any tested width; main screens fit viewport height at 1440x900 and 1024x768 (data-table/compare scroll inside their own regions). `check:fonts` on the live URL: Gentium Book Plus 400/700 and Space Mono 400/700 — latin+digits OK and vietnamese OK. 200%-zoom reflow probe (720x450): 0 horizontal overflow on atlas/compare/quiz.

Screenshots: showcase/cover.webp (1440x900, staged Size-hang on Jupiter+Saturn — real UI state, no mockup), showcase/desktop.webp (1440x900 honest default: Distance view, Sun + inner planets at AU ticks), showcase/tablet.webp (1024x768 honest), showcase/mobile.webp (390x844 honest). All re-captured from the FINAL release (c45bc3e8…, 2026-09-02T20:13Z), capturedFrom in metadata.json = deployment URL, webp via ffmpeg, 32–56 KB each. Alts written against pixel-verified content; vision-review claims about the footer visited-count were refuted by DOM ground truth (fresh profile = "0 of 8") and excluded from alts.

Codex-generated assets: NONE — all illustration is original data-driven SVG (gradient spheres, Saturn ring, gauges, starfield, icons). No IMAGE_BRIEF.md, no generated-manifest.json needed.

Third-party assets: exactly what ships — react 18.3.1 (MIT), react-dom 18.3.1 (MIT), gsap 3.15.0 (GreenSock Standard "no charge" license — no club plugins), @fontsource/gentium-book-plus 5.3.0 + @fontsource/space-mono 5.3.0 (fonts SIL OFL 1.1; packaging MIT). Full table in THIRD_PARTY_NOTICES.md. Planet figures are NASA Planetary Fact Sheet values cited per-planet in planets.json sourceNote — no NASA imagery.

License/provenance: PASS — Apache-2.0 LICENSE + NOTICE from scaffold; THIRD_PARTY_NOTICES.md lists exactly the 5 bundled components (verified against node_modules licenses); SPDX headers on all authored source files (src/** 14 files, scripts/** 4 files, vite.config.ts, index.html, favicon.svg; JSON/data files correctly headerless); deployment.json status "verified", URL verbatim, artifactSha256 = deterministic tar hash (3a1e35ad…33010) with method noted, sourceCommitSha null pending orchestrator finalization.

Security: PASS — `npm audit`: 0 vulnerabilities; no secrets/API keys (repo check-repo scan clean); no eval/dynamic execution; no runtime network beyond the two local JSON fetches (verify:static confirms no CDN); localStorage holds only anonymous expedition-log data (visited ids + best quiz count) with a visible two-step reset; production console clean on live.

Impeccable: 31/40 (Good) dual-agent critique — snapshot at repo-root .impeccable/critique/2026-09-02T19-58-55Z__projects-solar-system-explorer.md. Major findings and fixes:
- P1 honesty caveat was CSS-truncated mid-sentence in all three modes → corridor-note now wraps at 13px (96ch), JSON caveats shortened.
- P1 sub-14px reading text (plates/notes/medallions) → raised; type-floor amendment recorded in DESIGN_DECISIONS §5 (decorative duplicated numerals exempt, everything readable ≥13px).
- P1 "1 moons" on Earth's plate + 3 different zero-moon phrasings → singular/plural fixed, unified "no moons".
- P2 CaveatPanel had no focus trap (aria-modal leaked Tab) → same trap as the specimen sheet.
- P2 compare mobile overflow → aligned columns scroll inside their own region (390px flow green).
- Detector (Assessment B): scroll-linked width transition on the progress fill → scaleX transform.
- Also fixed: sheet opens focused on its heading, sun caption now JSON-driven, data-table summary toggles label, window.confirm reset → inline two-step exhibit-language confirm, visible corridor progress %, match question hangs on a parchment plaque + "choose first" hint, intro no longer duplicates the subtitle, "hang" defined for the young end of 8-13.

Remaining issues:
- Quiz `placeIntoSlot`/pointer-drop call setPool inside a setPlaced updater. Harmless today (updater runs once in production React 18 and no StrictMode is mounted) but it would double-fire if StrictMode is ever added — refactor to compute both states together before adopting StrictMode.
- Impeccable detector ran in regex-fallback mode (its HTML parser deps aren't installed), so its contrast checks were not exercised; contrast pairs are documented and were spot-verified manually (all text pairs ≥ 4.5:1, most ≥ 7:1).
- Design-hook advisories: none outstanding (hook reported no deterministic issues on every scanned file; a few files reached the per-session hint cap — cosmetic only).
- No planet jump-index in the corridor (walking it is the pedagogy; accepted in critique).

Root integration required:
- showcase.json (#11 entry): status building → live; demo.url = "https://solar-system-explorer.shiplo.site"; demo.deployedAt = "2026-09-03T17:36:22.420Z" (deploy 2); screenshots → projects/solar-system-explorer/showcase/{cover,desktop,tablet,mobile}.webp (mobile included; mobileSupport "supported" per metadata.json).
- README gallery: via npm run gallery (after status live).
- sourceCommitSha finalization: YES — commit the project, then set deployment.json sourceCommitSha to the full 40-char SHA (currently null by design; note in deployment.json explains).
