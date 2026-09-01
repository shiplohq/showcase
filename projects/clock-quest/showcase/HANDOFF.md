# HANDOFF — Clock Quest (Shiplo Showcase #05)

```
Project: Clock Quest (#05)
Spec: .showcase/05_clock-quest.md
Status: build + quality gates + Shiplo deployment + live verification + screenshots + provenance complete; awaiting orchestrator review for registry `live`
Build: PASS — `npm run build` (scripts/build.mjs, no deps, assemble+verify) · dist 25 files / 433 KB · repo verify:static PASS
Shiplo deployment: URL: https://clock-quest.shiplo.site (verbatim from deploy response)
  · site 5439614b-e5b0-4d37-93d6-10728ed71e7b · deployment b0da411c-e626-421d-b2ff-f75534ba2e53
  · release b7e35cfb-9f88-4d8b-99b2-93cc620183bf · activated 2026-09-01T15:44:09.193Z · 25 files / 442,899 bytes
  · .shiplo/project.json written (kept)
Live verification: PASS —
  · repo cdp:smoke @1440x900 clean;
  · full quest flow re-driven on the public URL at 1440x900 / 1024x768 / 390x844
    (mouse pointer-drag of the minute hand incl. hour-carry across 12, keyboard
    steppers via Space, board reads incl. wrong-pick nudge + no-lockout assert,
    day-recap pick-up→pin + retry loop, finale, sail-again reset,
    prefers-reduced-motion) — zero console errors at all three viewports;
  · touch-target audit includes real buttons AND role=button map markers (≥44px);
  · npm run check:fonts on the live URL — Hepta Slab 700/800 + Lexend 400/600/700
    OK over latin+digits and Vietnamese samples;
  · layout audit: no horizontal overflow at 1440/1024/390/720, fonts applied,
    markers inside chart.
Screenshots: showcase/cover.webp (1440x900, art-directed staged state — mission
  mid-lesson with the amber measuring arc; staging proven via PSNR 10.9 dB vs the
  honest desktop shot) · desktop.webp (1440x900) · tablet.webp (1024x768, hero)
  · mobile.webp (390x844) — all captured from the live deployment, ffmpeg webp,
  30–62 KB each · metadata.json filled (capturedFrom = live URL)
Codex-generated assets: NONE — all artwork is original inline SVG (map, clock,
  board, stamps, icons); no raster assets, no textures
Third-party assets:
  · jQuery 3.7.1 (MIT) — vendor/jquery/jquery-3.7.1.min.js
  · GSAP 3.15.0 core + Draggable + MotionPathPlugin (GreenSock Standard
    "No Charge") — vendor/gsap/*.min.js
  · Hepta Slab 700/800 + Lexend 400/600/700 woff2 (SIL OFL 1.1) — fonts/ with
    both OFL license texts shipped
  All recorded in THIRD_PARTY_NOTICES.md (no placeholder rows).
License/provenance: PASS — Apache-2.0 LICENSE + NOTICE + THIRD_PARTY_NOTICES;
  SPDX headers on all 16 original source files (index.html + 3 css + 7 js + 5
  scripts; none on vendored/JSON);
  package.json private:true, zero deps, lockfile committed; deployment.json
  status "verified", URL verbatim, artifactSha256
  58b31c3c00a3d034ae42554868026efbf23462037fc5d1c07dc2ca2bebfcbf80
  (tar -czf - -C dist . | sha256sum)
Security: PASS — npm audit 0 vulnerabilities; no secrets; no eval; localStorage
  anonymous progress only (missions/stamps/recap pins) with visible Start-over;
  no runtime CDN (fonts + jQuery + GSAP vendored); production console clean
Impeccable: dual-agent critique scored 32/40 (Good). Major findings, all FIXED:
  · nudge path ran the success-decorate callback → one wrong answer disabled
    the board/clock (lockout — caught by the CDP driver's nudge loop)
  · SVG stop markers 28–39px at 390px → 140-unit invisible hit rects + audit
    widened to role=button
  · tablet-landscape journal panel below fold (measured y=837) → chart height
    capped 46vh at ≤1199
  · width-transition layout thrash → transform scaleX
  · --ink-soft 4.44:1 on --paper-deep → token darkened (5.07:1); contrast gate
    added as npm run check:contrast (12/12)
  · board mode had no clock → read-only mini clock at target time + AM/PM +
    per-board icons; specific nudge copy replacing the generic hint
  · microcopy <15px bumped; focus continuity after solve/continue; recap pins
    survive refresh (serialize + validated restore, sim-tested); press-and-hold
    stepper repeat; done-stop toast instead of flash-open; quest intro rendered;
    progress speaks in stops ("2 of 5 stops"); amber blink (not shake) per §10
  · engine caught pre-deploy: snap-grid-inconsistent start pose (10:45 now),
    hour-carry across 12 added to match a real clock
  Detector warnings side-tab/border-accent/cream-palette accepted by brief
  (locked travel-journal thesis); snapshot persisted under .impeccable/critique/.
Remaining issues: NONE known. Known trade-offs (documented in
  design/DESIGN_DECISIONS.md): recap interaction is pick-up→pin (tap) rather
  than drag — deliberate for ages 6–9 + keyboard parity; 6 recap cards exceed
  the 4-item chunk band — accepted as intrinsic task load with short labels.
Root integration required:
  · showcase.json: #05 clock-quest → status "live", demo.url
    "https://clock-quest.shiplo.site", demo.deployedAt "2026-09-01T15:44:09.193Z",
    screenshots {cover,desktop,tablet: showcase/*.webp paths, mobile} per
    showcase/metadata.json
  · README gallery: via npm run gallery
  · sourceCommitSha finalization: YES
```

## Rebuild/redeploy quick reference

```bash
cd projects/clock-quest
npm run test:engine   # 15 missions + recap-refresh resume, headless
npm run check:contrast
npm run build         # dist/ 25 files, self-contained
# repo root: npm run verify:static -- clock-quest
# deploy (from repo root):
SHIPLO_MCP_CWD="D:\\Shiplo\\showcase\\projects\\clock-quest" npm run shiplo -- \
  call platform_deploy_static '{"site_id":"5439614b-e5b0-4d37-93d6-10728ed71e7b","build_command":"npm run build","output_dir":"dist"}'
```

Windows note: never keep a shell/serving process inside `dist/` while building
or deploying — the remote `npm run build` rmSync hits EPERM on a pinned cwd
(build.mjs now falls back to emptying the directory in place).
