# HANDOFF — Human Body Lab (Shiplo Showcase #12)

Project: Human Body Lab (#12)
Spec: .showcase/12_human-body-lab.md
Status: COMPLETE — deployed, live-verified, screenshots + provenance + README done; awaiting orchestrator integration (registry → gallery → sourceCommitSha).
Build: PASS — `npm run build` (vue-tsc -b && vite build); dist = 20 files, 483,510 bytes (0.46 MB); `npm run verify:static -- human-body-lab` PASS; engine-sim 130/130 checks PASS; npm audit 0 vulnerabilities.
Shiplo deployment: URL: https://human-body-lab.shiplo.site (verbatim from platform_deploy_static; site_id ef7be5b6-30dd-4cc8-a140-71fab84a7265; final deployment id e9a0e333-5c3c-4764-8c30-bfe26330f21a, activated 2026-09-02T20:25:39.586Z; 3 earlier same-URL releases superseded during the impeccable fix loop — see deployment.json notes).
Live verification: PASS — full project CDP flow (scripts/cdp-driver.mjs) at 1440×900, 1024×768, 390×844 on the final deploy: zero console errors; mouse + touch + keyboard paths (organ list buttons AND SVG organ hit-targets via Enter, Esc closes the sheet and restores focus, arrow-key nav across tabs); wrong-path feedback asserted gentle + non-punitive; oxygen route completed (4 segments, recap, localStorage progress); quiz 10/10 with explanations; all visible buttons ≥ 44px on every screen incl. activity screens; no horizontal scroll anywhere; prefers-reduced-motion emulated with content intact. Landing (Overview) and Quiz fit the viewport exactly at 1440×900 AND 1024×768 (scrollHeight === innerHeight asserted on live); Explore/Pathways scroll vertically BY DESIGN (portrait 560×780 body figure; documented in DESIGN_DECISIONS §12 + screenshot alts).
Screenshots (all captured from the live URL of the final deployment, webp via ffmpeg):
- showcase/cover.webp — 1440×900, art-directed staged state (skeletal + circulatory lifted, Heart sheet open), 64 KB
- showcase/desktop.webp — 1440×900 honest landing, 48 KB
- showcase/tablet.webp — 1024×768 honest landing (education hero; exact fit, no scrollbar), 43 KB
- showcase/mobile.webp — 390×844 honest landing (mobile supported), 31 KB
- showcase/metadata.json — capturedFrom = live URL, alts written against verified pixel content.
Codex-generated assets: NONE (body model is 100% original layered SVG authored in-project; no raster generation needed — design/generate-manifest.json intentionally absent).
Third-party assets (exactly what ships, per THIRD_PARTY_NOTICES.md):
- vue 3.5.42 (MIT) — bundled runtime
- gsap 3.15.0 (GreenSock Standard "No Charge" license; core only, npm-bundled, never CDN)
- Source Serif 4 600 latin (OFL-1.1 via @fontsource 5.3.0)
- Work Sans 400/500/600 latin (OFL-1.1 via @fontsource 5.3.0)
- IBM Plex Mono 400/500 latin (OFL-1.1 via @fontsource 5.3.0)
- Dev-only (not shipped): vite 7.3.6, @vitejs/plugin-vue 6.0.8, typescript 5.9.3, vue-tsc 3.3.11.
License/provenance: PASS — LICENSE (Apache-2.0), NOTICE, THIRD_PARTY_NOTICES.md rows match on-disk dist files exactly (6 faces × woff/woff2 = 12 font files + css + js); SPDX headers on all 34 original source files (23 src + 3 scripts + vite.config + index.html + tsconfigs checked; none on JSON/lockfile/third-party); .shiplo/project.json kept (no secrets); deterministic artifactSha256 recorded with method note.
Security: PASS — npm audit 0 vulnerabilities; no secrets (check:repo scan clean over 775 tracked files); no eval/dynamic execution; localStorage holds only anonymous progress (explored organs, completed pathways, quiz best) with a two-step reset; no runtime network beyond the site's own static files (verify:static CDN check + live console clean).
Fonts gate: PASS — check:fonts on live (final deploy): Source Serif 4:600, Work Sans:400/500/600, IBM Plex Mono:400/500 all "latin+digits: OK · vietnamese: OK". Lesson applied: two initially-imported faces (Source Serif 400/400-italic) were never rendered by visible UI, so they never loaded in the static build and tripped document.fonts.check — removed; every shipped face is used and verified.
Impeccable (dual-agent critique + detector, then fix batch, all verified):
- Assessment A (design review) 29/40 with 5 priority findings — ALL FIXED:
  1. organ sheet occluded the organ it described → sheet moved to grid level over the panel column; backdrop now transparent (plate + lit organ stay visible; verified in staged capture)
  2. skeletal system glyph rendered invisible (stroke-width 0 + fill none) → filled lobes + stroked shaft (verified in captures)
  3. blood-loop badges overprinted (heart = stops 1/3/5 at one node) → per-visit 24px badge stagger + deduped recap buttons (verified: 5 distinct badges, 3 inspect buttons)
  4. multi-layer callout label collisions (data-verified pairs) → 30px lane packing in the callout computed (verified with skeletal+circulatory staged capture: no overlaps)
  5. wrong-feedback ink --warn #9A6A2F ≈ 3.9:1 on tint → darkened to #7A4F1D (≥ 4.5:1)
- Assessment B (detector): 1 REAL finding `border-accent-on-rounded` (3px ink top-rule on rounded panel) → removed (pathway ink now carried by section heading + progress dots; picker underline echoes nav tabs) — dist/assets rescan clean.
- Additional fixes from the same pass: tab order now matches DESIGN_DECISIONS §13 (DOM panel-first, CSS order plate-first), Esc restores focus to the sheet trigger, arrow-key roving nav on the section tabs, "№" → "NO." (glyph not in latin subsets), quiz summary centered, duplicate LAB RECORD removed (single overview line with totals), diaphragm given visual mass (second arc + ticks), overview ghost teaser reduced to 3 legible layers, body-cells stop moved from mid-thigh to the arm periphery, route-segment bow clamped inside the torso, recap duplicate v-for keys fixed, tablet landing made scrollbar-free at 1024×768, mobile masthead fits all 4 tabs (44px min-width), 2 unused font faces dropped.
Remaining issues: NONE blocking. Known non-blocking notes: (a) OrganSheet uses a light focus trap (Tab cycles inside the panel) without full aria-modal background containment — SR virtual cursor can leave the dialog; (b) route segments have no direction arrowheads (arrival is conveyed by draw-on + numbered badges); (c) Explore/Pathways scroll by design at ≤900px-height viewports (documented).

Accepted review notes (recorded explicitly, no action):
- **dist .gitkeep ×2 (P3, accepted)**: `dist/assets/.gitkeep` and `dist/data/.gitkeep` are scaffold placeholder files copied verbatim from `public/` by the Vite build; they ship in the deployed artifact (part of the 20-file / 483,510-byte provenance). Harmless; removing them would change the artifact hash for zero functional gain.
- **ARIA-tabs focus deviation (P3, accepted)**: the section tabs are plain buttons with `aria-current="page"` plus left/right arrow-key handling, not the full WAI-ARIA Tabs pattern (no managed roving tabindex / `aria-selected` / `role="tablist"`). Keyboard operation and announcement were verified in the CDP flow; the pattern deviation is deliberate simplicity for a 4-tab static showcase.
- **Cover capturedAt ambiguity (P3)**: `metadata.json` records cover `capturedAt = 2026-09-02T20:28:30Z` (lead estimate at handoff time). The original capture logs were deleted with the `.shots/` scratch before review; the independent reviewer observed the source PNG mtime as 20:27:53Z (~37s earlier). The recording was left as-is per the "do not guess" rule; relative ordering versus the other three captures (all earlier) is unaffected either way.
Root integration required:
- showcase.json: human-body-lab entry → status "live"; demo.url = "https://human-body-lab.shiplo.site"; demo.deployedAt = "2026-09-02T20:25:37.616Z" (mirror of deployment.json); screenshots paths → projects/human-body-lab/showcase/{cover,desktop,tablet,mobile}.webp; audience "9-14" already set.
- README gallery: via npm run gallery (after status live).
- sourceCommitSha finalization: YES — set deployment.json sourceCommitSha (currently null with note) to the integration commit SHA, then npm run validate.
